export type Approach = 'north' | 'south' | 'east' | 'west';

export type PhaseId = 'NS_THROUGH' | 'EW_THROUGH';

export type SignalColor = 'red' | 'yellow' | 'green';

export type SignalMachineState = 'GREEN' | 'YELLOW' | 'ALL_RED';

export type VehicleType = 'motorcycle' | 'auto' | 'car' | 'bus' | 'truck';

export interface VehicleComposition {
  motorcycle: number;
  auto: number;
  car: number;
  bus: number;
  truck: number;
}

export interface VehicleSpec {
  type: VehicleType;
  label: string;
  weight: number; // PCU / demand weight
  lengthMeters: number;
  widthMeters: number;
  color: string;
  accentColor: string;
  maxSpeedMps: number;
  accelerationMps2: number;
}

export const VEHICLE_SPECS: Record<VehicleType, VehicleSpec> = {
  motorcycle: {
    type: 'motorcycle',
    label: 'Two-Wheeler / Bike',
    weight: 1.0,
    lengthMeters: 2.0,
    widthMeters: 0.9,
    color: '#06b6d4', // cyan
    accentColor: '#22d3ee',
    maxSpeedMps: 11.0,
    accelerationMps2: 2.8,
  },
  auto: {
    type: 'auto',
    label: 'Auto-Rickshaw',
    weight: 2.0,
    lengthMeters: 2.8,
    widthMeters: 1.3,
    color: '#eab308', // yellow
    accentColor: '#16a34a', // green roof
    maxSpeedMps: 9.0,
    accelerationMps2: 2.0,
  },
  car: {
    type: 'car',
    label: 'Passenger Car',
    weight: 2.0,
    lengthMeters: 4.5,
    widthMeters: 1.8,
    color: '#3b82f6', // blue
    accentColor: '#60a5fa',
    maxSpeedMps: 13.0,
    accelerationMps2: 2.5,
  },
  bus: {
    type: 'bus',
    label: 'Public Bus',
    weight: 5.0,
    lengthMeters: 10.5,
    widthMeters: 2.6,
    color: '#ec4899', // pink/magenta
    accentColor: '#f472b6',
    maxSpeedMps: 8.5,
    accelerationMps2: 1.4,
  },
  truck: {
    type: 'truck',
    label: 'Heavy Truck',
    weight: 6.0,
    lengthMeters: 11.5,
    widthMeters: 2.5,
    color: '#f97316', // orange
    accentColor: '#fb923c',
    maxSpeedMps: 8.0,
    accelerationMps2: 1.2,
  },
};

export interface Vehicle {
  id: string;
  type: VehicleType;
  approach: Approach;
  lane: number; // 0 or 1 for multi-lane realism
  distanceToStopLine: number; // positive = before stop line, negative = past stop line
  speed: number;
  arrivalTime: number; // sim time when entered approach
  queueEntryTime?: number; // sim time when vehicle stopped in queue
  departureTime?: number; // sim time when crossed stop line
  exitTime?: number; // sim time when exited intersection
  waitingTime: number; // accumulated time spent waiting in queue
  isQueued: boolean;
  hasCrossedStopLine: boolean;
  hasExited: boolean;
}

export interface ApproachConfig {
  initialQueue: number;
  arrivalRatePerMin: number;
  composition: VehicleComposition;
}

export type PresetId = 'light' | 'peak' | 'indian_mixed' | 'unequal' | 'severe' | 'custom';

export interface PresetScenario {
  id: PresetId;
  name: string;
  badge: string;
  description: string;
  configs: Record<Approach, ApproachConfig>;
}

export type ControllerType = 'baseline' | 'enhanced';

export interface ControllerConfig {
  minGreen: number; // e.g., 10s
  maxGreen: number; // e.g., 45s
  yellowDuration: number; // e.g., 3s
  allRedDuration: number; // e.g., 1s
  maxWaitThreshold: number; // e.g., 60s or 120s
  weights: Record<VehicleType, number>;
}

export interface SignalState {
  activePhase: PhaseId;
  machineState: SignalMachineState;
  timeInCurrentState: number;
  targetDuration: number;
  reason: string;
  signals: Record<Approach, SignalColor>;
}

export interface ControllerDecision {
  timestamp: number;
  selectedPhase: PhaseId;
  allocatedGreenDuration: number;
  reason: string;
  queueCounts: Record<Approach, number>;
  weightedScores: Record<Approach, number>;
  maxWaitingTimes: Record<Approach, number>;
  starvationAlertTriggered: boolean;
  starvingApproach?: Approach;
}

export interface ManualAdjustmentEvent {
  id: string;
  timestamp: number;
  approach: Approach;
  previousCount: number;
  newCount: number;
  adjustmentType: 'add_1' | 'add_5' | 'add_10' | 'remove_1' | 'set_exact' | 'set_rate';
}

export interface SimulationSnapshot {
  timestamp: number;
  activePhase: PhaseId;
  machineState: SignalMachineState;
  queueNorth: number;
  queueSouth: number;
  queueEast: number;
  queueWest: number;
  totalQueue: number;
  avgWaitTime: number;
  maxWaitTime: number;
  weightedDemandNS: number;
  weightedDemandEW: number;
  vehiclesServedTotal: number;
  vehiclesServedNorth: number;
  vehiclesServedSouth: number;
  vehiclesServedEast: number;
  vehiclesServedWest: number;
  throughputPerMin: number;
}

export interface ApproachMetrics {
  approach: Approach;
  queued: number;
  arrivals: number;
  served: number;
  avgWaitTime: number;
  maxWaitTime: number;
  avgQueueLength: number;
  arrivalRate: number;
  weightedDemand: number;
  timesServed: number;
  lastGreenTime: number;
}

export interface BottleneckAnalysis {
  mostCongestedApproach: Approach;
  highestWaitApproach: Approach;
  longestMaxWaitApproach: Approach;
  phaseWithMostGreen: PhaseId;
  lowestServiceApproach: Approach;
  queueGrowthWarnings: Approach[];
  starvationApproaches: Approach[];
}

export interface ComparisonMetrics {
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
  };
  diff: {
    avgWaitTimeReductionPct: number;
    maxWaitTimeReductionPct: number;
    queueLengthReductionPct: number;
    servedIncreasePct: number;
    throughputIncreasePct: number;
    fairnessImprovementPct: number;
    starvationReductionPct: number;
  };
}

export interface SavedExperiment {
  id: string;
  name: string;
  createdAt: string;
  preset: PresetId;
  controller: ControllerType;
  duration: number;
  seed: number;
  totalServed: number;
  avgWaitTime: number;
  maxWaitTime: number;
  throughput: number;
  fairnessIndex: number;
}
