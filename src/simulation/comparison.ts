import { Approach, ComparisonMetrics } from '@/types/traffic';
import { TrafficSimulationEngine } from './engine';
import { PRESET_SCENARIOS } from './presets';

export interface ComparisonRunOptions {
  presetId: string;
  durationSeconds: number; // e.g. 180s or 300s
  seed: number;
}

export interface ComparisonRunResult {
  presetName: string;
  durationSeconds: number;
  seed: number;
  baseline: {
    avgWaitTime: number;
    maxWaitTime: number;
    avgQueueLength: number;
    totalServed: number;
    remainingQueued: number;
    throughputPerMin: number;
    phaseChanges: number;
    fairnessIndex: number;
    starvationEvents: number;
    approachMetrics: Record<Approach, { served: number; avgWait: number; maxWait: number; queued: number }>;
  };
  enhanced: {
    avgWaitTime: number;
    maxWaitTime: number;
    avgQueueLength: number;
    totalServed: number;
    remainingQueued: number;
    throughputPerMin: number;
    phaseChanges: number;
    fairnessIndex: number;
    starvationEvents: number;
    approachMetrics: Record<Approach, { served: number; avgWait: number; maxWait: number; queued: number }>;
  };
  diff: ComparisonMetrics['diff'];
}

/**
 * Calculates Jain's Fairness Index for equitable service across the 4 approaches
 * J = (sum(x_i))^2 / (n * sum(x_i^2))
 * Higher is more equitable (1.0 = perfectly fair).
 */
export function calculateJainsFairnessIndex(values: number[]): number {
  if (values.length === 0) return 1.0;
  // If all values are 0, fairness is 1.0
  const allZero = values.every((v) => v === 0);
  if (allZero) return 1.0;

  const n = values.length;
  // Transform wait times: inverse wait time or service satisfaction
  const sum = values.reduce((acc, v) => acc + (v > 0 ? 1 / (v + 1) : 1), 0);
  const sumSq = values.reduce((acc, v) => acc + Math.pow(v > 0 ? 1 / (v + 1) : 1, 2), 0);

  if (sumSq === 0) return 1.0;
  const index = Math.pow(sum, 2) / (n * sumSq);
  return Number(Math.min(1.0, Math.max(0.0, index)).toFixed(3));
}

/**
 * Executes a deterministic headless benchmark running Baseline and Enhanced controllers
 * with identical random seeds and traffic generation.
 */
export function runFairControllerComparison(options: ComparisonRunOptions): ComparisonRunResult {
  const { presetId, durationSeconds, seed } = options;
  const preset = PRESET_SCENARIOS[presetId as keyof typeof PRESET_SCENARIOS] || PRESET_SCENARIOS.unequal;

  // 1. Run Baseline Engine
  const baselineEngine = new TrafficSimulationEngine(seed, preset.id);
  baselineEngine.setControllerType('baseline');

  const dt = 1.0;
  for (let t = 0; t < durationSeconds; t += dt) {
    baselineEngine.tick(dt);
  }

  const baselineSummary = baselineEngine.getSummaryMetrics();
  const baselineApproaches: Approach[] = ['north', 'south', 'east', 'west'];
  const baselineAppMetrics = baselineApproaches.reduce((acc, app) => {
    const m = baselineEngine.getApproachMetrics(app);
    acc[app] = { served: m.served, avgWait: m.avgWaitTime, maxWait: m.maxWaitTime, queued: m.queued };
    return acc;
  }, {} as Record<Approach, { served: number; avgWait: number; maxWait: number; queued: number }>);

  const baselineWaitTimes = baselineApproaches.map((app) => baselineAppMetrics[app].avgWait);
  const baselineFairness = calculateJainsFairnessIndex(baselineWaitTimes);
  const baselineStarvations = baselineApproaches.filter(
    (app) => baselineAppMetrics[app].maxWait >= baselineEngine.getSnapshot().controllerConfig.maxWaitThreshold
  ).length;

  // 2. Run Enhanced Engine with EXACT SAME SEED & PRESET
  const enhancedEngine = new TrafficSimulationEngine(seed, preset.id);
  enhancedEngine.setControllerType('enhanced');

  for (let t = 0; t < durationSeconds; t += dt) {
    enhancedEngine.tick(dt);
  }

  const enhancedSummary = enhancedEngine.getSummaryMetrics();
  const enhancedAppMetrics = baselineApproaches.reduce((acc, app) => {
    const m = enhancedEngine.getApproachMetrics(app);
    acc[app] = { served: m.served, avgWait: m.avgWaitTime, maxWait: m.maxWaitTime, queued: m.queued };
    return acc;
  }, {} as Record<Approach, { served: number; avgWait: number; maxWait: number; queued: number }>);

  const enhancedWaitTimes = baselineApproaches.map((app) => enhancedAppMetrics[app].avgWait);
  const enhancedFairness = calculateJainsFairnessIndex(enhancedWaitTimes);
  const enhancedStarvations = baselineApproaches.filter(
    (app) => enhancedAppMetrics[app].maxWait >= enhancedEngine.getSnapshot().controllerConfig.maxWaitThreshold
  ).length;

  // 3. Compute Differences
  // Waiting Time Reduction: ((Baseline - Enhanced) / Baseline) * 100
  const waitDiffPct =
    baselineSummary.avgWaitTime > 0
      ? ((baselineSummary.avgWaitTime - enhancedSummary.avgWaitTime) / baselineSummary.avgWaitTime) * 100
      : 0;

  const maxWaitDiffPct =
    baselineSummary.maxWaitTime > 0
      ? ((baselineSummary.maxWaitTime - enhancedSummary.maxWaitTime) / baselineSummary.maxWaitTime) * 100
      : 0;

  const queueDiffPct =
    baselineSummary.avgQueueLength > 0
      ? ((baselineSummary.avgQueueLength - enhancedSummary.avgQueueLength) / baselineSummary.avgQueueLength) * 100
      : 0;

  // Served & Throughput Increase: ((Enhanced - Baseline) / Baseline) * 100
  const servedIncreasePct =
    baselineSummary.totalServed > 0
      ? ((enhancedSummary.totalServed - baselineSummary.totalServed) / baselineSummary.totalServed) * 100
      : 0;

  const throughputIncreasePct =
    baselineSummary.throughputPerMin > 0
      ? ((enhancedSummary.throughputPerMin - baselineSummary.throughputPerMin) / baselineSummary.throughputPerMin) * 100
      : 0;

  const fairnessDiffPct =
    baselineFairness > 0 ? ((enhancedFairness - baselineFairness) / baselineFairness) * 100 : 0;

  const starvationDiffPct =
    baselineStarvations > 0 ? ((baselineStarvations - enhancedStarvations) / baselineStarvations) * 100 : 0;

  return {
    presetName: preset.name,
    durationSeconds,
    seed,
    baseline: {
      avgWaitTime: Number(baselineSummary.avgWaitTime.toFixed(1)),
      maxWaitTime: Number(baselineSummary.maxWaitTime.toFixed(1)),
      avgQueueLength: Number(baselineSummary.avgQueueLength.toFixed(1)),
      totalServed: baselineSummary.totalServed,
      remainingQueued: baselineSummary.totalQueued,
      throughputPerMin: Number(baselineSummary.throughputPerMin.toFixed(1)),
      phaseChanges: baselineSummary.phaseChanges,
      fairnessIndex: baselineFairness,
      starvationEvents: baselineStarvations,
      approachMetrics: baselineAppMetrics,
    },
    enhanced: {
      avgWaitTime: Number(enhancedSummary.avgWaitTime.toFixed(1)),
      maxWaitTime: Number(enhancedSummary.maxWaitTime.toFixed(1)),
      avgQueueLength: Number(enhancedSummary.avgQueueLength.toFixed(1)),
      totalServed: enhancedSummary.totalServed,
      remainingQueued: enhancedSummary.totalQueued,
      throughputPerMin: Number(enhancedSummary.throughputPerMin.toFixed(1)),
      phaseChanges: enhancedSummary.phaseChanges,
      fairnessIndex: enhancedFairness,
      starvationEvents: enhancedStarvations,
      approachMetrics: enhancedAppMetrics,
    },
    diff: {
      avgWaitTimeReductionPct: Number(waitDiffPct.toFixed(1)),
      maxWaitTimeReductionPct: Number(maxWaitDiffPct.toFixed(1)),
      queueLengthReductionPct: Number(queueDiffPct.toFixed(1)),
      servedIncreasePct: Number(servedIncreasePct.toFixed(1)),
      throughputIncreasePct: Number(throughputIncreasePct.toFixed(1)),
      fairnessImprovementPct: Number(fairnessDiffPct.toFixed(1)),
      starvationReductionPct: Number(starvationDiffPct.toFixed(1)),
    },
  };
}
