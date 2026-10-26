import { describe, it, expect } from 'vitest';
import { TrafficSimulationEngine } from '../engine';
import { TrafficControllers } from '../controllers';
import { runFairControllerComparison, calculateJainsFairnessIndex } from '../comparison';
import { PRESET_SCENARIOS } from '../presets';

describe('Deterministic Simulation Engine & Controllers', () => {
  it('initializes queues safely without negative counts', () => {
    const engine = new TrafficSimulationEngine(123, 'unequal');
    const snapshot = engine.getSnapshot();

    expect(snapshot.time).toBe(0);
    expect(snapshot.vehicles.length).toBeGreaterThan(0);
    expect(engine.getQueuedVehicles('north').length).toBe(20);
    expect(engine.getQueuedVehicles('south').length).toBe(35);
    expect(engine.getQueuedVehicles('east').length).toBe(10);
    expect(engine.getQueuedVehicles('west').length).toBe(5);
  });

  it('adjusts vehicle counts dynamically without resetting or removing crossing vehicles', () => {
    const engine = new TrafficSimulationEngine(123, 'unequal');

    // Add 5 vehicles to East
    engine.adjustVehicleCount('east', 'add_5');
    expect(engine.getQueuedVehicles('east').length).toBe(15);

    // Remove 1 vehicle from East
    engine.adjustVehicleCount('east', 'remove_1');
    expect(engine.getQueuedVehicles('east').length).toBe(14);

    // Set exact count on West
    engine.adjustVehicleCount('west', 'set_exact', 25);
    expect(engine.getQueuedVehicles('west').length).toBe(25);

    // Check adjustment log
    expect(engine.getSnapshot().adjustmentLog.length).toBe(3);
  });

  it('prevents negative queues when removing vehicles from empty queue', () => {
    const engine = new TrafficSimulationEngine(123, 'light');
    engine.adjustVehicleCount('north', 'set_exact', 0);
    expect(engine.getQueuedVehicles('north').length).toBe(0);

    // Attempting to remove another vehicle
    engine.adjustVehicleCount('north', 'remove_1');
    expect(engine.getQueuedVehicles('north').length).toBe(0);
    expect(engine.getApproachMetrics('north').queued).toBe(0);
  });

  it('enforces safe non-conflicting signal phase state machine and clearance intervals', () => {
    const engine = new TrafficSimulationEngine(42, 'light');

    // Initial state: NS is GREEN, EW is RED
    expect(engine.getSnapshot().signalState.signals.north).toBe('green');
    expect(engine.getSnapshot().signalState.signals.south).toBe('green');
    expect(engine.getSnapshot().signalState.signals.east).toBe('red');
    expect(engine.getSnapshot().signalState.signals.west).toBe('red');

    // Advance 60 seconds and verify safety invariant at every second
    for (let t = 0; t < 60; t++) {
      engine.tick(1.0);
      const signals = engine.getSnapshot().signalState.signals;

      // SAFETY INVARIANT: NS and EW must NEVER be green simultaneously
      const nsGreen = signals.north === 'green' || signals.south === 'green';
      const ewGreen = signals.east === 'green' || signals.west === 'green';
      expect(nsGreen && ewGreen).toBe(false);
    }
  });

  it('calculates weighted demand correctly according to vehicle specifications', () => {
    const controllers = new TrafficControllers();
    const config = {
      minGreen: 10,
      maxGreen: 45,
      yellowDuration: 3,
      allRedDuration: 1,
      maxWaitThreshold: 60,
      weights: { motorcycle: 1, auto: 2, car: 2, bus: 5, truck: 6 },
    };

    const vehicles = [
      {
        id: 'v1',
        type: 'motorcycle' as const,
        approach: 'north' as const,
        lane: 0,
        distanceToStopLine: 5,
        speed: 0,
        arrivalTime: 0,
        waitingTime: 10,
        isQueued: true,
        hasCrossedStopLine: false,
        hasExited: false,
      },
      {
        id: 'v2',
        type: 'bus' as const,
        approach: 'north' as const,
        lane: 0,
        distanceToStopLine: 10,
        speed: 0,
        arrivalTime: 0,
        waitingTime: 10,
        isQueued: true,
        hasCrossedStopLine: false,
        hasExited: false,
      },
    ];

    const evalResult = controllers.evaluateQueues(vehicles, config);
    expect(evalResult.queueCounts.north).toBe(2);
    // Weight = 1 (motorcycle) + 5 (bus) = 6
    expect(evalResult.weightedScores.north).toBe(6);
  });

  it('triggers anti-starvation protection when waiting time threshold is breached', () => {
    const controllers = new TrafficControllers();
    const config = {
      minGreen: 10,
      maxGreen: 45,
      yellowDuration: 3,
      allRedDuration: 1,
      maxWaitThreshold: 50,
      weights: { motorcycle: 1, auto: 2, car: 2, bus: 5, truck: 6 },
    };

    // Starving car on East approach that has waited 65 seconds
    const vehicles = [
      {
        id: 'v-starve',
        type: 'car' as const,
        approach: 'east' as const,
        lane: 0,
        distanceToStopLine: 2,
        speed: 0,
        arrivalTime: 0,
        waitingTime: 65,
        isQueued: true,
        hasCrossedStopLine: false,
        hasExited: false,
      },
    ];

    // Current phase is NS_THROUGH
    const decision = controllers.decideEnhanced(100, 'NS_THROUGH', vehicles, config);
    expect(decision.starvationAlertTriggered).toBe(true);
    expect(decision.selectedPhase).toBe('EW_THROUGH');
    expect(decision.reason).toContain('ANTI-STARVATION OVERRIDE');
  });

  it('respects minimum and maximum green time bounds', () => {
    const controllers = new TrafficControllers();
    const config = {
      minGreen: 12,
      maxGreen: 40,
      yellowDuration: 3,
      allRedDuration: 1,
      maxWaitThreshold: 60,
      weights: { motorcycle: 1, auto: 2, car: 2, bus: 5, truck: 6 },
    };

    // Huge queue of 100 trucks
    const hugeVehicles = Array.from({ length: 100 }, (_, i) => ({
      id: `v-${i}`,
      type: 'truck' as const,
      approach: 'north' as const,
      lane: 0,
      distanceToStopLine: i * 5,
      speed: 0,
      arrivalTime: 0,
      waitingTime: 5,
      isQueued: true,
      hasCrossedStopLine: false,
      hasExited: false,
    }));

    const decision = controllers.decideBaseline(0, 'EW_THROUGH', hugeVehicles, config);
    expect(decision.allocatedGreenDuration).toBeLessThanOrEqual(config.maxGreen);
    expect(decision.allocatedGreenDuration).toBeGreaterThanOrEqual(config.minGreen);
  });

  it('verifies reproducible experiments using deterministic PRNG', () => {
    const run1 = runFairControllerComparison({
      presetId: 'unequal',
      durationSeconds: 90,
      seed: 777,
    });

    const run2 = runFairControllerComparison({
      presetId: 'unequal',
      durationSeconds: 90,
      seed: 777,
    });

    expect(run1.baseline.totalServed).toBe(run2.baseline.totalServed);
    expect(run1.enhanced.totalServed).toBe(run2.enhanced.totalServed);
    expect(run1.baseline.avgWaitTime).toBe(run2.baseline.avgWaitTime);
    expect(run1.enhanced.avgWaitTime).toBe(run2.enhanced.avgWaitTime);
  });

  it('calculates Jain fairness index accurately', () => {
    // 4 approaches with identical delays => perfect fairness (1.0)
    expect(calculateJainsFairnessIndex([15, 15, 15, 15])).toBe(1.0);

    // Unequal delays => fairness strictly less than 1.0
    const unequalFairness = calculateJainsFairnessIndex([5, 80, 10, 95]);
    expect(unequalFairness).toBeLessThan(1.0);
    expect(unequalFairness).toBeGreaterThan(0.0);
  });

  it('switches presets cleanly and resets state', () => {
    const engine = new TrafficSimulationEngine(123, 'light');
    expect(engine.getSnapshot().activePresetId).toBe('light');

    engine.applyPreset('severe');
    expect(engine.getSnapshot().activePresetId).toBe('severe');
    expect(engine.getSnapshot().time).toBe(0);
    expect(engine.getQueuedVehicles('south').length).toBe(
      PRESET_SCENARIOS.severe.configs.south.initialQueue
    );
  });
});
