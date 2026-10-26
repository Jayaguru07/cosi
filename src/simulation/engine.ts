import {
  Approach,
  PhaseId,
  SignalColor,
  SignalMachineState,
  SignalState,
  Vehicle,
  VehicleType,
  VehicleComposition,
  ApproachConfig,
  ControllerType,
  ControllerConfig,
  ControllerDecision,
  ManualAdjustmentEvent,
  SimulationSnapshot,
  ApproachMetrics,
  BottleneckAnalysis,
  VEHICLE_SPECS,
} from '@/types/traffic';
import { PRNG } from './prng';
import { TrafficControllers } from './controllers';
import { PRESET_SCENARIOS } from './presets';

export interface SimulationEngineState {
  time: number;
  isRunning: boolean;
  speedMultiplier: number;
  controllerType: ControllerType;
  signalState: SignalState;
  vehicles: Vehicle[];
  approachConfigs: Record<Approach, ApproachConfig>;
  controllerConfig: ControllerConfig;
  activePresetId: string;
  seed: number;
  phaseChangeCount: number;
  totalGenerated: number;
  totalServed: number;
  snapshots: SimulationSnapshot[];
  decisionLog: ControllerDecision[];
  adjustmentLog: ManualAdjustmentEvent[];
}

export class TrafficSimulationEngine {
  private prng: PRNG;
  private controllers: TrafficControllers;
  private state: SimulationEngineState;

  // Track arrival fractional accumulators for Poisson/rate arrivals
  private arrivalAccumulators: Record<Approach, number> = {
    north: 0,
    south: 0,
    east: 0,
    west: 0,
  };

  private vehicleIdCounter = 1;
  private lastGreenTimes: Record<Approach, number> = {
    north: 0,
    south: 0,
    east: 0,
    west: 0,
  };
  private timesServedPerApproach: Record<Approach, number> = {
    north: 0,
    south: 0,
    east: 0,
    west: 0,
  };
  private servedVehiclesByApproach: Record<Approach, Vehicle[]> = {
    north: [],
    south: [],
    east: [],
    west: [],
  };

  // Queued length samples for calculating average queue length
  private queueSamples: { timestamp: number; counts: Record<Approach, number> }[] = [];
  private greenTimeAllocated: Record<PhaseId, number> = {
    NS_THROUGH: 0,
    EW_THROUGH: 0,
  };

  constructor(seed: number = 42, initialPresetId: string = 'unequal') {
    this.prng = new PRNG(seed);
    this.controllers = new TrafficControllers();

    const preset = PRESET_SCENARIOS[initialPresetId as keyof typeof PRESET_SCENARIOS] || PRESET_SCENARIOS.unequal;
    const initialConfigs: Record<Approach, ApproachConfig> = JSON.parse(JSON.stringify(preset.configs));

    const defaultControllerConfig: ControllerConfig = {
      minGreen: 10,
      maxGreen: 45,
      yellowDuration: 3,
      allRedDuration: 1,
      maxWaitThreshold: 30, // 30s so starvation and rescue can be easily observed in college demos
      weights: {
        motorcycle: 1,
        auto: 2,
        car: 2,
        bus: 5,
        truck: 6,
      },
    };

    const initialSignals: Record<Approach, SignalColor> = {
      north: 'green',
      south: 'green',
      east: 'red',
      west: 'red',
    };

    this.state = {
      time: 0,
      isRunning: false,
      speedMultiplier: 1,
      controllerType: 'enhanced',
      signalState: {
        activePhase: 'NS_THROUGH',
        machineState: 'GREEN',
        timeInCurrentState: 0,
        targetDuration: defaultControllerConfig.minGreen,
        reason: 'Initial phase: North-South Green.',
        signals: initialSignals,
      },
      vehicles: [],
      approachConfigs: initialConfigs,
      controllerConfig: defaultControllerConfig,
      activePresetId: preset.id,
      seed,
      phaseChangeCount: 0,
      totalGenerated: 0,
      totalServed: 0,
      snapshots: [],
      decisionLog: [],
      adjustmentLog: [],
    };

    // Populate initial vehicle queues
    this.initializeQueues();
    this.recordSnapshot();
  }

  public getSnapshot(): SimulationEngineState {
    return {
      ...this.state,
      signalState: {
        ...this.state.signalState,
        signals: { ...this.state.signalState.signals },
      },
      approachConfigs: {
        north: { ...this.state.approachConfigs.north, composition: { ...this.state.approachConfigs.north.composition } },
        south: { ...this.state.approachConfigs.south, composition: { ...this.state.approachConfigs.south.composition } },
        east: { ...this.state.approachConfigs.east, composition: { ...this.state.approachConfigs.east.composition } },
        west: { ...this.state.approachConfigs.west, composition: { ...this.state.approachConfigs.west.composition } },
      },
      vehicles: [...this.state.vehicles],
      snapshots: [...this.state.snapshots],
      decisionLog: [...this.state.decisionLog],
      adjustmentLog: [...this.state.adjustmentLog],
    };
  }

  public setSeed(seed: number): void {
    this.state.seed = seed;
    this.prng.setSeed(seed);
  }

  public setControllerType(type: ControllerType): void {
    this.state.controllerType = type;
  }

  public setSpeed(multiplier: number): void {
    this.state.speedMultiplier = multiplier;
  }

  public start(): void {
    this.state.isRunning = true;
  }

  public pause(): void {
    this.state.isRunning = false;
  }

  public reset(seed?: number): void {
    const s = seed !== undefined ? seed : this.state.seed;
    this.prng.setSeed(s);
    this.vehicleIdCounter = 1;
    this.arrivalAccumulators = { north: 0, south: 0, east: 0, west: 0 };
    this.lastGreenTimes = { north: 0, south: 0, east: 0, west: 0 };
    this.timesServedPerApproach = { north: 0, south: 0, east: 0, west: 0 };
    this.servedVehiclesByApproach = { north: [], south: [], east: [], west: [] };
    this.queueSamples = [];
    this.greenTimeAllocated = { NS_THROUGH: 0, EW_THROUGH: 0 };

    this.state.time = 0;
    this.state.isRunning = false;
    this.state.phaseChangeCount = 0;
    this.state.totalGenerated = 0;
    this.state.totalServed = 0;
    this.state.vehicles = [];
    this.state.snapshots = [];
    this.state.decisionLog = [];
    this.state.adjustmentLog = [];

    this.state.signalState = {
      activePhase: 'NS_THROUGH',
      machineState: 'GREEN',
      timeInCurrentState: 0,
      targetDuration: this.state.controllerConfig.minGreen,
      reason: 'Reset simulation: Initial North-South Phase.',
      signals: { north: 'green', south: 'green', east: 'red', west: 'red' },
    };

    this.initializeQueues();
    this.recordSnapshot();
  }

  public applyPreset(presetId: string): void {
    const preset = PRESET_SCENARIOS[presetId as keyof typeof PRESET_SCENARIOS];
    if (!preset) return;
    this.state.activePresetId = preset.id;
    this.state.approachConfigs = JSON.parse(JSON.stringify(preset.configs));
    this.reset();
  }

  /**
   * Safe per-approach vehicle count modification
   * Can be invoked while simulation is running without resetting!
   */
  public adjustVehicleCount(
    approach: Approach,
    action: 'add_1' | 'add_5' | 'add_10' | 'remove_1' | 'set_exact',
    targetValue?: number
  ): void {
    const currentQueue = this.getQueuedVehicles(approach);
    const prevCount = currentQueue.length;
    let newCount = prevCount;

    if (action === 'add_1') newCount = prevCount + 1;
    else if (action === 'add_5') newCount = prevCount + 5;
    else if (action === 'add_10') newCount = prevCount + 10;
    else if (action === 'remove_1') newCount = Math.max(0, prevCount - 1);
    else if (action === 'set_exact' && targetValue !== undefined) {
      newCount = Math.max(0, Math.min(200, Math.floor(targetValue)));
    }

    if (newCount > prevCount) {
      const toAdd = newCount - prevCount;
      for (let i = 0; i < toAdd; i++) {
        this.spawnVehicle(approach, true);
      }
    } else if (newCount < prevCount) {
      const toRemove = prevCount - newCount;
      // Remove from the TAIL of the queue (furthest from stop line), never removing vehicles in intersection
      const candidates = currentQueue
        .filter((v) => !v.hasCrossedStopLine)
        .sort((a, b) => b.distanceToStopLine - a.distanceToStopLine);

      const removeIds = new Set(candidates.slice(0, toRemove).map((v) => v.id));
      this.state.vehicles = this.state.vehicles.filter((v) => !removeIds.has(v.id));
    }

    // Update approach config initialQueue representation
    this.state.approachConfigs[approach].initialQueue = newCount;

    // Log the adjustment event
    const event: ManualAdjustmentEvent = {
      id: `adj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: this.state.time,
      approach,
      previousCount: prevCount,
      newCount,
      adjustmentType: action,
    };
    this.state.adjustmentLog = [event, ...this.state.adjustmentLog].slice(0, 50);
  }

  public setArrivalRate(approach: Approach, ratePerMin: number): void {
    const safeRate = Math.max(0, Math.min(120, ratePerMin));
    this.state.approachConfigs[approach].arrivalRatePerMin = safeRate;
  }

  public setComposition(approach: Approach, comp: VehicleComposition): void {
    this.state.approachConfigs[approach].composition = { ...comp };
  }

  public setControllerConfig(cfg: Partial<ControllerConfig>): void {
    this.state.controllerConfig = { ...this.state.controllerConfig, ...cfg };
  }

  /**
   * Initializes initial queues based on approach config
   */
  private initializeQueues(): void {
    const approaches: Approach[] = ['north', 'south', 'east', 'west'];
    for (const app of approaches) {
      const count = this.state.approachConfigs[app].initialQueue;
      for (let i = 0; i < count; i++) {
        this.spawnVehicle(app, true);
      }
    }
  }

  /**
   * Spawns a vehicle on a given approach
   */
  private spawnVehicle(approach: Approach, isInitialQueue: boolean = false): void {
    const config = this.state.approachConfigs[approach];
    const type = this.prng.sampleFromWeights<VehicleType>(config.composition);
    const spec = VEHICLE_SPECS[type];

    // Distribute vehicles between the 2 incoming lanes (lane 0 and lane 1)
    // For initial queues, balance lanes evenly; for arrivals, sample PRNG
    const lane0Count = this.state.vehicles.filter((v) => v.approach === approach && v.lane === 0 && !v.hasCrossedStopLine).length;
    const lane1Count = this.state.vehicles.filter((v) => v.approach === approach && v.lane === 1 && !v.hasCrossedStopLine).length;
    const lane = isInitialQueue ? (lane0Count <= lane1Count ? 0 : 1) : this.prng.nextFloat() > 0.5 ? 0 : 1;

    // Find the furthest vehicle currently in this specific lane
    const existingInLane = this.state.vehicles
      .filter((v) => v.approach === approach && v.lane === lane && !v.hasCrossedStopLine)
      .sort((a, b) => b.distanceToStopLine - a.distanceToStopLine);

    let startDistance: number;
    if (existingInLane.length === 0) {
      // First vehicle in this lane stops 1.2m before the stop line
      startDistance = isInitialQueue ? 1.2 : 140.0;
    } else {
      const lastVeh = existingInLane[0];
      const buffer = type === 'motorcycle' ? 1.5 : 2.5;
      startDistance = isInitialQueue
        ? lastVeh.distanceToStopLine + spec.lengthMeters + buffer
        : Math.max(140.0, lastVeh.distanceToStopLine + spec.lengthMeters + buffer);
    }

    const vehicle: Vehicle = {
      id: `v-${approach[0].toUpperCase()}-${this.vehicleIdCounter++}`,
      type,
      approach,
      lane,
      distanceToStopLine: startDistance,
      speed: isInitialQueue ? 0 : spec.maxSpeedMps * 0.7,
      arrivalTime: this.state.time,
      waitingTime: 0,
      isQueued: isInitialQueue,
      queueEntryTime: isInitialQueue ? this.state.time : undefined,
      hasCrossedStopLine: false,
      hasExited: false,
    };

    this.state.vehicles.push(vehicle);
    this.state.totalGenerated++;
  }

  /**
   * Advances the simulation by dt seconds (default 1.0 second)
   */
  public tick(dt: number = 1.0): void {
    this.state.time += dt;

    // 1. Advance Signal State Machine
    this.updateSignalStateMachine(dt);

    // 2. Spawn incoming vehicles based on arrival rates
    this.processVehicleArrivals(dt);

    // 3. Update vehicle physics, queuing, and movements
    this.updateVehiclePositions(dt);

    // 4. Sample metrics every 1 second
    this.queueSamples = [
      ...this.queueSamples,
      {
        timestamp: this.state.time,
        counts: {
          north: this.getQueuedVehicles('north').length,
          south: this.getQueuedVehicles('south').length,
          east: this.getQueuedVehicles('east').length,
          west: this.getQueuedVehicles('west').length,
        },
      },
    ].slice(-300);

    // 5. Record periodic snapshots for time-series charts (every 2 seconds)
    if (Math.floor(this.state.time) % 2 === 0) {
      this.recordSnapshot();
    }
  }

  /**
   * Signal Phase State Machine
   * GREEN -> YELLOW -> ALL_RED -> NEXT_PHASE_GREEN
   * Ensures safe clearance intervals and strictly prevents conflicting greens.
   */
  private updateSignalStateMachine(dt: number): void {
    const { signalState, controllerConfig, controllerType } = this.state;
    signalState.timeInCurrentState += dt;

    if (signalState.machineState === 'GREEN') {
      const activePhase = signalState.activePhase;
      this.greenTimeAllocated[activePhase] += dt;

      // Update last green times for approaches
      if (activePhase === 'NS_THROUGH') {
        this.lastGreenTimes.north = this.state.time;
        this.lastGreenTimes.south = this.state.time;
      } else {
        this.lastGreenTimes.east = this.state.time;
        this.lastGreenTimes.west = this.state.time;
      }

      // Check if green duration has expired OR early anti-starvation override
      const opposingPhase = activePhase === 'NS_THROUGH' ? 'EW_THROUGH' : 'NS_THROUGH';
      const opposingMaxWait =
        opposingPhase === 'EW_THROUGH'
          ? Math.max(this.getApproachMetrics('east').maxWaitTime, this.getApproachMetrics('west').maxWaitTime)
          : Math.max(this.getApproachMetrics('north').maxWaitTime, this.getApproachMetrics('south').maxWaitTime);

      const isStarving = opposingMaxWait >= controllerConfig.maxWaitThreshold;

      // In AI-Enhanced mode, if opposing phase has a starving vehicle and minimum green is met,
      // force an early transition to YELLOW so the starving corridor gets served without delay!
      const shouldEarlySwitchForStarvation =
        controllerType === 'enhanced' &&
        signalState.timeInCurrentState >= controllerConfig.minGreen &&
        isStarving;

      if (signalState.timeInCurrentState >= signalState.targetDuration || shouldEarlySwitchForStarvation) {
        // Transition to YELLOW
        signalState.machineState = 'YELLOW';
        signalState.timeInCurrentState = 0;
        signalState.targetDuration = controllerConfig.yellowDuration;
        signalState.reason = shouldEarlySwitchForStarvation
          ? `Anti-Starvation Early Trigger: Opposing approach waited ${opposingMaxWait.toFixed(0)}s (threshold: ${controllerConfig.maxWaitThreshold}s). Terminating phase early to rescue queue.`
          : `Phase ${activePhase} green completed (${signalState.targetDuration}s). Entering yellow transition.`;

        // Update signals: active approaches yellow, opposing red
        if (activePhase === 'NS_THROUGH') {
          signalState.signals = { north: 'yellow', south: 'yellow', east: 'red', west: 'red' };
        } else {
          signalState.signals = { north: 'red', south: 'red', east: 'yellow', west: 'yellow' };
        }
      }
    } else if (signalState.machineState === 'YELLOW') {
      if (signalState.timeInCurrentState >= signalState.targetDuration) {
        // Transition to ALL_RED
        signalState.machineState = 'ALL_RED';
        signalState.timeInCurrentState = 0;
        signalState.targetDuration = controllerConfig.allRedDuration;
        signalState.reason = 'All-red intersection clearance interval. Conflicting movements strictly blocked.';
        signalState.signals = { north: 'red', south: 'red', east: 'red', west: 'red' };
      }
    } else if (signalState.machineState === 'ALL_RED') {
      if (signalState.timeInCurrentState >= signalState.targetDuration) {
        // Clearance complete. Consult controller for next phase and green duration!
        let decision: ControllerDecision;

        if (controllerType === 'baseline') {
          decision = this.controllers.decideBaseline(
            this.state.time,
            signalState.activePhase,
            this.state.vehicles,
            controllerConfig
          );
        } else {
          decision = this.controllers.decideEnhanced(
            this.state.time,
            signalState.activePhase,
            this.state.vehicles,
            controllerConfig
          );
        }

        // Apply controller decision
        this.state.phaseChangeCount++;
        this.state.decisionLog = [decision, ...this.state.decisionLog].slice(0, 50);

        signalState.activePhase = decision.selectedPhase;
        signalState.machineState = 'GREEN';
        signalState.timeInCurrentState = 0;
        signalState.targetDuration = decision.allocatedGreenDuration;
        signalState.reason = decision.reason;

        if (decision.selectedPhase === 'NS_THROUGH') {
          signalState.signals = { north: 'green', south: 'green', east: 'red', west: 'red' };
          this.timesServedPerApproach.north++;
          this.timesServedPerApproach.south++;
        } else {
          signalState.signals = { north: 'red', south: 'red', east: 'green', west: 'green' };
          this.timesServedPerApproach.east++;
          this.timesServedPerApproach.west++;
        }
      }
    }
  }

  /**
   * Spawns vehicles continuously based on arrival rates (veh/min)
   */
  private processVehicleArrivals(dt: number): void {
    const approaches: Approach[] = ['north', 'south', 'east', 'west'];
    for (const app of approaches) {
      const rate = this.state.approachConfigs[app].arrivalRatePerMin;
      if (rate <= 0) continue;

      // Rate in vehicles per second = rate / 60
      const ratePerSec = rate / 60;
      this.arrivalAccumulators[app] += ratePerSec * dt;

      while (this.arrivalAccumulators[app] >= 1.0) {
        this.arrivalAccumulators[app] -= 1.0;
        // Cap max active vehicles per approach to prevent runaway memory
        const currentActive = this.state.vehicles.filter((v) => v.approach === app && !v.hasExited).length;
        if (currentActive < 120) {
          this.spawnVehicle(app, false);
        }
      }
    }
  }

  /**
   * Updates physical positions, headway following, queue status, and junction traversal
   */
  private updateVehiclePositions(dt: number): void {
    const approaches: Approach[] = ['north', 'south', 'east', 'west'];

    for (const app of approaches) {
      const appVehicles = this.state.vehicles
        .filter((v) => v.approach === app && !v.hasExited)
        .sort((a, b) => a.distanceToStopLine - b.distanceToStopLine); // closest to stop line first

      const signalColor = this.state.signalState.signals[app];
      const isGreen = signalColor === 'green';

      for (let i = 0; i < appVehicles.length; i++) {
        const v = appVehicles[i];
        const spec = VEHICLE_SPECS[v.type];
        // Leader is the vehicle immediately ahead IN THE SAME LANE
        const leader =
          appVehicles
            .slice(0, i)
            .reverse()
            .find((other) => other.lane === v.lane && !other.hasExited) || null;

        const minGap = v.type === 'motorcycle' ? 1.5 : 2.5;

        // Target stop line distance:
        // First vehicle stops 1.0m before stop line.
        // Subsequent vehicles stop behind leader.
        let targetStopDistance = 1.0;
        if (leader && leader.distanceToStopLine > 0) {
          targetStopDistance = leader.distanceToStopLine + spec.lengthMeters + minGap;
        }

        if (!v.hasCrossedStopLine) {
          // A vehicle before stop line can ONLY proceed if signal is strictly GREEN
          // and leader allows clearance! Red and Yellow strictly prohibit crossing.
          const leaderAllows =
            !leader || leader.distanceToStopLine < v.distanceToStopLine - (spec.lengthMeters + minGap * 0.7);
          const canProceed = isGreen && leaderAllows;

          if (canProceed) {
            // Accelerate through green
            v.speed = Math.min(spec.maxSpeedMps, v.speed + spec.accelerationMps2 * dt);
            v.distanceToStopLine -= v.speed * dt;

            // Check if vehicle has crossed the stop line
            if (v.distanceToStopLine <= 0) {
              v.hasCrossedStopLine = true;
              v.departureTime = this.state.time;
              v.isQueued = false;
            }
          } else {
            // Signal is RED/YELLOW or vehicle is blocked by leader:
            // MUST DECELERATE AND STOP at targetStopDistance
            const distToTarget = v.distanceToStopLine - targetStopDistance;
            if (distToTarget > 0.3 && v.speed > 0) {
              // Smooth deceleration towards targetStopDistance for arriving vehicle
              const safeDecel = Math.sqrt(2 * spec.accelerationMps2 * distToTarget);
              v.speed = Math.max(0, Math.min(v.speed, safeDecel));
              v.distanceToStopLine -= v.speed * dt;

              // Strictly clamp to prevent running red light
              if (v.distanceToStopLine <= targetStopDistance) {
                v.distanceToStopLine = targetStopDistance;
                v.speed = 0;
                if (!v.isQueued) {
                  v.isQueued = true;
                  v.queueEntryTime = this.state.time;
                }
              }
            } else {
              // Completely stopped in queue behind stop line
              v.speed = 0;
              v.distanceToStopLine = targetStopDistance;
              if (!v.isQueued) {
                v.isQueued = true;
                v.queueEntryTime = this.state.time;
              }
              v.waitingTime += dt;
            }
          }
        } else {
          // Vehicle has already crossed stop line into junction
          v.speed = Math.min(spec.maxSpeedMps, v.speed + spec.accelerationMps2 * dt);
          v.distanceToStopLine -= v.speed * dt;

          // Junction width clearance: 25 meters. Beyond -30 meters, vehicle has successfully exited
          if (v.distanceToStopLine <= -30) {
            v.hasExited = true;
            v.exitTime = this.state.time;
            this.state.totalServed++;
            this.servedVehiclesByApproach[app].push(v);
          }
        }
      }
    }

    // Clean up exited vehicles from active list to prevent memory bloat
    this.state.vehicles = this.state.vehicles.filter((v) => !v.hasExited);
  }

  public getQueuedVehicles(approach: Approach): Vehicle[] {
    return this.state.vehicles.filter((v) => v.approach === approach && v.isQueued && !v.hasCrossedStopLine);
  }

  public getApproachMetrics(approach: Approach): ApproachMetrics {
    const queued = this.getQueuedVehicles(approach);
    const served = this.servedVehiclesByApproach[approach];
    const config = this.state.approachConfigs[approach];

    let totalWait = 0;
    // Active maxWait is the maximum wait time among vehicles currently queued at the red light
    let maxWait = 0;
    for (const v of queued) {
      if (v.waitingTime > maxWait) maxWait = v.waitingTime;
    }
    // Cumulative total wait of served vehicles for historical averages
    for (const v of served) {
      totalWait += v.waitingTime;
    }

    const avgWaitTime = served.length > 0 ? totalWait / served.length : queued.length > 0 ? maxWait : 0;

    // Calculate average queue length from history samples
    let sumQueue = 0;
    for (const s of this.queueSamples) {
      sumQueue += s.counts[approach];
    }
    const avgQueueLength = this.queueSamples.length > 0 ? sumQueue / this.queueSamples.length : queued.length;

    // Weighted demand
    let weightedDemand = 0;
    for (const v of queued) {
      weightedDemand += this.state.controllerConfig.weights[v.type] ?? VEHICLE_SPECS[v.type].weight;
    }

    return {
      approach,
      queued: queued.length,
      arrivals: this.state.vehicles.filter((v) => v.approach === approach).length + served.length,
      served: served.length,
      avgWaitTime,
      maxWaitTime: maxWait,
      avgQueueLength,
      arrivalRate: config.arrivalRatePerMin,
      weightedDemand,
      timesServed: this.timesServedPerApproach[approach],
      lastGreenTime: this.lastGreenTimes[approach],
    };
  }

  public getSummaryMetrics(): {
    totalGenerated: number;
    totalServed: number;
    totalQueued: number;
    avgWaitTime: number;
    maxWaitTime: number;
    avgQueueLength: number;
    throughputPerMin: number;
    phaseChanges: number;
    greenUtilization: number;
    elapsedTime: number;
  } {
    const allServed: Vehicle[] = [
      ...this.servedVehiclesByApproach.north,
      ...this.servedVehiclesByApproach.south,
      ...this.servedVehiclesByApproach.east,
      ...this.servedVehiclesByApproach.west,
    ];

    let totalWait = 0;
    let maxWait = 0;
    for (const v of allServed) {
      totalWait += v.waitingTime;
      if (v.waitingTime > maxWait) maxWait = v.waitingTime;
    }

    const activeQueued = this.state.vehicles.filter((v) => v.isQueued && !v.hasCrossedStopLine);
    for (const v of activeQueued) {
      if (v.waitingTime > maxWait) maxWait = v.waitingTime;
    }

    const avgWaitTime = allServed.length > 0 ? totalWait / allServed.length : 0;

    let sumTotalQueues = 0;
    for (const s of this.queueSamples) {
      sumTotalQueues += s.counts.north + s.counts.south + s.counts.east + s.counts.west;
    }
    const avgQueueLength =
      this.queueSamples.length > 0 ? sumTotalQueues / this.queueSamples.length : activeQueued.length;

    const elapsedMinutes = this.state.time > 0 ? this.state.time / 60 : 1;
    const throughputPerMin = allServed.length / elapsedMinutes;

    // Green utilization: percentage of elapsed time spent in green serving vehicles
    const totalGreenTime = this.greenTimeAllocated.NS_THROUGH + this.greenTimeAllocated.EW_THROUGH;
    const greenUtilization = this.state.time > 0 ? (totalGreenTime / this.state.time) * 100 : 0;

    return {
      totalGenerated: this.state.totalGenerated,
      totalServed: allServed.length,
      totalQueued: activeQueued.length,
      avgWaitTime,
      maxWaitTime: maxWait,
      avgQueueLength,
      throughputPerMin,
      phaseChanges: this.state.phaseChangeCount,
      greenUtilization: Math.min(100, greenUtilization),
      elapsedTime: this.state.time,
    };
  }

  public getBottleneckAnalysis(): BottleneckAnalysis {
    const approaches: Approach[] = ['north', 'south', 'east', 'west'];
    const metrics = approaches.map((app) => this.getApproachMetrics(app));

    let mostCongested = metrics[0];
    let highestWait = metrics[0];
    let longestMaxWait = metrics[0];
    let lowestService = metrics[0];

    for (const m of metrics) {
      if (m.queued > mostCongested.queued) mostCongested = m;
      if (m.avgWaitTime > highestWait.avgWaitTime) highestWait = m;
      if (m.maxWaitTime > longestMaxWait.maxWaitTime) longestMaxWait = m;
      if (m.served < lowestService.served) lowestService = m;
    }

    const phaseWithMostGreen: PhaseId =
      this.greenTimeAllocated.NS_THROUGH >= this.greenTimeAllocated.EW_THROUGH ? 'NS_THROUGH' : 'EW_THROUGH';

    const queueGrowthWarnings: Approach[] = [];
    const starvationApproaches: Approach[] = [];

    for (const m of metrics) {
      // If arrival rate per minute > service capacity or queue growing
      if (m.queued > 25) queueGrowthWarnings.push(m.approach);
      if (m.maxWaitTime >= this.state.controllerConfig.maxWaitThreshold) {
        starvationApproaches.push(m.approach);
      }
    }

    return {
      mostCongestedApproach: mostCongested.approach,
      highestWaitApproach: highestWait.approach,
      longestMaxWaitApproach: longestMaxWait.approach,
      phaseWithMostGreen,
      lowestServiceApproach: lowestService.approach,
      queueGrowthWarnings,
      starvationApproaches,
    };
  }

  private recordSnapshot(): void {
    const summary = this.getSummaryMetrics();
    const qN = this.getQueuedVehicles('north').length;
    const qS = this.getQueuedVehicles('south').length;
    const qE = this.getQueuedVehicles('east').length;
    const qW = this.getQueuedVehicles('west').length;

    const wN = this.getApproachMetrics('north').weightedDemand;
    const wS = this.getApproachMetrics('south').weightedDemand;
    const wE = this.getApproachMetrics('east').weightedDemand;
    const wW = this.getApproachMetrics('west').weightedDemand;

    const snapshot: SimulationSnapshot = {
      timestamp: Math.round(this.state.time),
      activePhase: this.state.signalState.activePhase,
      machineState: this.state.signalState.machineState,
      queueNorth: qN,
      queueSouth: qS,
      queueEast: qE,
      queueWest: qW,
      totalQueue: qN + qS + qE + qW,
      avgWaitTime: Number(summary.avgWaitTime.toFixed(1)),
      maxWaitTime: Number(summary.maxWaitTime.toFixed(1)),
      weightedDemandNS: Number((wN + wS).toFixed(1)),
      weightedDemandEW: Number((wE + wW).toFixed(1)),
      vehiclesServedTotal: summary.totalServed,
      vehiclesServedNorth: this.servedVehiclesByApproach.north.length,
      vehiclesServedSouth: this.servedVehiclesByApproach.south.length,
      vehiclesServedEast: this.servedVehiclesByApproach.east.length,
      vehiclesServedWest: this.servedVehiclesByApproach.west.length,
      throughputPerMin: Number(summary.throughputPerMin.toFixed(1)),
    };

    this.state.snapshots = [...this.state.snapshots, snapshot].slice(-200);
  }
}
