import { PresetScenario, PresetId } from '@/types/traffic';

export const DEFAULT_COMPOSITION = {
  indian_mixed: {
    motorcycle: 40,
    auto: 20,
    car: 25,
    bus: 10,
    truck: 5,
  },
  mostly_two_wheelers: {
    motorcycle: 65,
    auto: 15,
    car: 15,
    bus: 3,
    truck: 2,
  },
  passenger_cars: {
    motorcycle: 20,
    auto: 10,
    car: 60,
    bus: 7,
    truck: 3,
  },
  heavy_vehicles: {
    motorcycle: 15,
    auto: 10,
    car: 25,
    bus: 25,
    truck: 25,
  },
};

export const PRESET_SCENARIOS: Record<PresetId, PresetScenario> = {
  light: {
    id: 'light',
    name: 'Preset A — Light Traffic',
    badge: 'Light Volume',
    description: 'Low volume and moderate arrival rates across all approaches. Minimal queuing and fast clearance.',
    configs: {
      north: { initialQueue: 4, arrivalRatePerMin: 6, composition: { ...DEFAULT_COMPOSITION.passenger_cars } },
      south: { initialQueue: 5, arrivalRatePerMin: 7, composition: { ...DEFAULT_COMPOSITION.passenger_cars } },
      east: { initialQueue: 3, arrivalRatePerMin: 5, composition: { ...DEFAULT_COMPOSITION.passenger_cars } },
      west: { initialQueue: 4, arrivalRatePerMin: 5, composition: { ...DEFAULT_COMPOSITION.passenger_cars } },
    },
  },
  peak: {
    id: 'peak',
    name: 'Preset B — Peak-Hour Traffic',
    badge: 'Peak Volume',
    description: 'Symmetric high-intensity peak traffic with dense queues and high arrival rates on all corridors.',
    configs: {
      north: { initialQueue: 24, arrivalRatePerMin: 22, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
      south: { initialQueue: 26, arrivalRatePerMin: 24, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
      east: { initialQueue: 20, arrivalRatePerMin: 18, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
      west: { initialQueue: 22, arrivalRatePerMin: 19, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
    },
  },
  indian_mixed: {
    id: 'indian_mixed',
    name: 'Preset C — Indian Mixed Traffic',
    badge: 'Mixed Heterogeneous',
    description: 'Realistic Indian urban intersection with 40% two-wheelers, 20% autos, 25% cars, and 15% heavy vehicles.',
    configs: {
      north: { initialQueue: 18, arrivalRatePerMin: 16, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
      south: { initialQueue: 22, arrivalRatePerMin: 18, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
      east: { initialQueue: 14, arrivalRatePerMin: 12, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
      west: { initialQueue: 12, arrivalRatePerMin: 10, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
    },
  },
  unequal: {
    id: 'unequal',
    name: 'Preset D — Unequal Traffic (College Demo)',
    badge: 'Asymmetric Demand',
    description: 'Heavily unbalanced demand: South (35) and North (20) arterial corridor vs minor East (10) and West (5) roads.',
    configs: {
      north: { initialQueue: 20, arrivalRatePerMin: 16, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
      south: { initialQueue: 35, arrivalRatePerMin: 28, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
      east: { initialQueue: 10, arrivalRatePerMin: 8, composition: { ...DEFAULT_COMPOSITION.mostly_two_wheelers } },
      west: { initialQueue: 5, arrivalRatePerMin: 5, composition: { ...DEFAULT_COMPOSITION.mostly_two_wheelers } },
    },
  },
  severe: {
    id: 'severe',
    name: 'Preset E — Severe Congestion',
    badge: 'Critical Bottleneck',
    description: 'Sustained saturation where queue arrival exceeds intersection discharge capacity; ideal for testing anti-starvation.',
    configs: {
      north: { initialQueue: 40, arrivalRatePerMin: 32, composition: { ...DEFAULT_COMPOSITION.heavy_vehicles } },
      south: { initialQueue: 45, arrivalRatePerMin: 35, composition: { ...DEFAULT_COMPOSITION.heavy_vehicles } },
      east: { initialQueue: 30, arrivalRatePerMin: 25, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
      west: { initialQueue: 28, arrivalRatePerMin: 22, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
    },
  },
  custom: {
    id: 'custom',
    name: 'Preset F — Custom Settings',
    badge: 'User Defined',
    description: 'Custom configuration defined manually through the approach vehicle sliders and composition controls.',
    configs: {
      north: { initialQueue: 15, arrivalRatePerMin: 12, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
      south: { initialQueue: 15, arrivalRatePerMin: 12, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
      east: { initialQueue: 10, arrivalRatePerMin: 8, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
      west: { initialQueue: 10, arrivalRatePerMin: 8, composition: { ...DEFAULT_COMPOSITION.indian_mixed } },
    },
  },
};
