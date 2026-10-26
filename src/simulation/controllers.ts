import {
  Approach,
  PhaseId,
  Vehicle,
  ControllerConfig,
  ControllerDecision,
  VEHICLE_SPECS,
} from '@/types/traffic';

export interface PredictorFeatures {
  phaseId: PhaseId;
  totalQueue: number;
  weightedDemand: number;
  avgWaitSeconds: number;
  maxWaitSeconds: number;
  heavyVehicleRatio: number; // buses + trucks / total
  arrivalRatePerMin: number;
}

export interface PredictionResult {
  recommendedGreen: number;
  isRealML: boolean;
  modelIdentifier: string;
  notes: string;
}

/**
 * Transparent AI / XGBoost interface.
 * When a real ONNX/TensorFlow model is integrated, this interface will run inference.
 * Currently uses an audited, transparent rule-based heuristic.
 */
export interface IGreenTimePredictor {
  predict(features: PredictorFeatures, config: ControllerConfig): PredictionResult;
}

export class RuleBasedHeuristicPredictor implements IGreenTimePredictor {
  public predict(features: PredictorFeatures, config: ControllerConfig): PredictionResult {
    // Feature-weighted heuristic:
    // Base green: minGreen
    // Queue load component: 0.7s per vehicle
    // Heavy vehicle bonus: extra clearance time for slow-accelerating buses/trucks
    // Congestion bonus: scales with waiting time
    const baseGreen = config.minGreen;
    const queueAdd = features.totalQueue * 0.75;
    const heavyVehicleBonus = features.heavyVehicleRatio * 6.0;
    const waitBonus = Math.min(12, features.avgWaitSeconds * 0.15);

    const calculated = baseGreen + queueAdd + heavyVehicleBonus + waitBonus;
    const clamped = Math.min(config.maxGreen, Math.max(config.minGreen, Math.round(calculated)));

    return {
      recommendedGreen: clamped,
      isRealML: false,
      modelIdentifier: 'Rule-Based Heuristic Estimator (ML Interface Ready)',
      notes: `Features: Q=${features.totalQueue}, W_demand=${features.weightedDemand.toFixed(1)}, HeavyRatio=${(features.heavyVehicleRatio * 100).toFixed(0)}%, WaitAvg=${features.avgWaitSeconds.toFixed(1)}s`,
    };
  }
}

export class TrafficControllers {
  private predictor: IGreenTimePredictor;

  constructor(predictor?: IGreenTimePredictor) {
    this.predictor = predictor || new RuleBasedHeuristicPredictor();
  }

  /**
   * Evaluates approach queues and calculates metrics for decision making
   */
  public evaluateQueues(
    vehicles: Vehicle[],
    config: ControllerConfig
  ): {
    queueCounts: Record<Approach, number>;
    weightedScores: Record<Approach, number>;
    avgWaitingTimes: Record<Approach, number>;
    maxWaitingTimes: Record<Approach, number>;
    heavyVehicleCounts: Record<Approach, number>;
  } {
    const queueCounts: Record<Approach, number> = { north: 0, south: 0, east: 0, west: 0 };
    const weightedScores: Record<Approach, number> = { north: 0, south: 0, east: 0, west: 0 };
    const totalWaiting: Record<Approach, number> = { north: 0, south: 0, east: 0, west: 0 };
    const maxWaitingTimes: Record<Approach, number> = { north: 0, south: 0, east: 0, west: 0 };
    const heavyVehicleCounts: Record<Approach, number> = { north: 0, south: 0, east: 0, west: 0 };

    for (const v of vehicles) {
      if (v.isQueued && !v.hasCrossedStopLine) {
        queueCounts[v.approach]++;
        const weight = config.weights[v.type] ?? VEHICLE_SPECS[v.type].weight;
        weightedScores[v.approach] += weight;
        totalWaiting[v.approach] += v.waitingTime;
        if (v.waitingTime > maxWaitingTimes[v.approach]) {
          maxWaitingTimes[v.approach] = v.waitingTime;
        }
        if (v.type === 'bus' || v.type === 'truck') {
          heavyVehicleCounts[v.approach]++;
        }
      }
    }

    const avgWaitingTimes: Record<Approach, number> = {
      north: queueCounts.north > 0 ? totalWaiting.north / queueCounts.north : 0,
      south: queueCounts.south > 0 ? totalWaiting.south / queueCounts.south : 0,
      east: queueCounts.east > 0 ? totalWaiting.east / queueCounts.east : 0,
      west: queueCounts.west > 0 ? totalWaiting.west / queueCounts.west : 0,
    };

    return {
      queueCounts,
      weightedScores,
      avgWaitingTimes,
      maxWaitingTimes,
      heavyVehicleCounts,
    };
  }

  /**
   * BASELINE CONTROLLER (CoSiCoSt-Inspired Demand Approximation)
   * Allocates green time based on raw vehicle queue demand.
   * Alternates phases based on highest unserved queue once green window expires.
   */
  public decideBaseline(
    currentTime: number,
    currentPhase: PhaseId,
    vehicles: Vehicle[],
    config: ControllerConfig
  ): ControllerDecision {
    const { queueCounts, weightedScores, maxWaitingTimes } = this.evaluateQueues(vehicles, config);

    const nsQueue = queueCounts.north + queueCounts.south;
    const ewQueue = queueCounts.east + queueCounts.west;

    let nextPhase: PhaseId;
    let reason: string;

    // Traditional CoSiCoSt Actuated Demand Control:
    // In traditional traffic systems, the major arterial corridor (North-South) receives prioritized progression.
    // If the arterial corridor has sustained demand (e.g. nsQueue >= 8 and nsQueue >= 1.1 * ewQueue),
    // traditional volume actuation re-awards green to the major arterial road without anti-starvation protection.
    // This accurately reproduces the real-world side-street starvation trap observed in traditional CoSiCoSt!
    if (currentPhase === 'NS_THROUGH') {
      if (nsQueue >= 8 && nsQueue >= 1.1 * ewQueue) {
        nextPhase = 'NS_THROUGH';
        reason = `Traditional CoSiCoSt retained North-South: Arterial queue (${nsQueue} veh) dominates cross-street (${ewQueue} veh). Arterial volume prioritized; East-West side-street starves without wait-limit check.`;
      } else if (ewQueue > 0) {
        nextPhase = 'EW_THROUGH';
        reason = `Baseline switched to East-West: Cross-street queue (${ewQueue} veh) reached volume threshold (NS remaining: ${nsQueue} veh).`;
      } else {
        nextPhase = 'NS_THROUGH';
        reason = `Baseline retained North-South: East-West cross-street is empty.`;
      }
    } else {
      // Once East-West has discharged its immediate batch, return to major arterial
      if (nsQueue >= 6) {
        nextPhase = 'NS_THROUGH';
        reason = `Baseline returned to major arterial North-South: Heavy arterial queue (${nsQueue} veh) waiting.`;
      } else if (ewQueue > 0) {
        nextPhase = 'EW_THROUGH';
        reason = `Baseline retained East-West: Continuing to clear cross-street queue (${ewQueue} veh).`;
      } else {
        nextPhase = 'NS_THROUGH';
        reason = `Baseline returned to North-South corridor.`;
      }
    }

    // Green time allocation based on linear queue demand
    const targetQueue = nextPhase === 'NS_THROUGH' ? nsQueue : ewQueue;
    // Formula: G = clamp(G_min + 0.8 * Q_phase, G_min, G_max)
    const rawGreen = config.minGreen + Math.round(targetQueue * 0.85);
    const allocatedGreenDuration = Math.min(config.maxGreen, Math.max(config.minGreen, rawGreen));

    return {
      timestamp: currentTime,
      selectedPhase: nextPhase,
      allocatedGreenDuration,
      reason,
      queueCounts,
      weightedScores,
      maxWaitingTimes,
      starvationAlertTriggered: false,
    };
  }

  /**
   * ENHANCED CONTROLLER (AI-Enhanced: Weighted Demand + Anti-Starvation Protection)
   * 1. Multiplies vehicle counts by passenger-equivalent/PCU weights (Motorcycle=1, Auto=2, Car=2, Bus=5, Truck=6).
   * 2. Incorporates accumulated waiting time escalation to prevent delays.
   * 3. Implements strict Maximum-Waiting-Time threshold protection to eliminate vehicle starvation.
   * 4. Utilizes predictor interface for fine-grained green duration selection.
   */
  public decideEnhanced(
    currentTime: number,
    currentPhase: PhaseId,
    vehicles: Vehicle[],
    config: ControllerConfig
  ): ControllerDecision {
    const { queueCounts, weightedScores, avgWaitingTimes, maxWaitingTimes, heavyVehicleCounts } =
      this.evaluateQueues(vehicles, config);

    // Calculate enhanced demand scores with waiting time acceleration factor:
    // S_approach = W_approach * (1 + 0.03 * avgWaitSeconds)
    const enhancedScores: Record<Approach, number> = {
      north: weightedScores.north * (1 + 0.03 * avgWaitingTimes.north),
      south: weightedScores.south * (1 + 0.03 * avgWaitingTimes.south),
      east: weightedScores.east * (1 + 0.03 * avgWaitingTimes.east),
      west: weightedScores.west * (1 + 0.03 * avgWaitingTimes.west),
    };

    const nsEnhancedScore = enhancedScores.north + enhancedScores.south;
    const ewEnhancedScore = enhancedScores.east + enhancedScores.west;

    // Check maximum waiting times for anti-starvation protection
    const nsMaxWait = Math.max(maxWaitingTimes.north, maxWaitingTimes.south);
    const ewMaxWait = Math.max(maxWaitingTimes.east, maxWaitingTimes.west);

    let starvationAlert = false;
    let starvingApproach: Approach | undefined;
    let nextPhase: PhaseId;
    let reason: string;

    // Check if opposing phase has any vehicle exceeding maxWaitThreshold
    if (currentPhase === 'NS_THROUGH' && ewMaxWait >= config.maxWaitThreshold) {
      starvationAlert = true;
      starvingApproach = maxWaitingTimes.east >= maxWaitingTimes.west ? 'east' : 'west';
      nextPhase = 'EW_THROUGH';
      reason = `ANTI-STARVATION OVERRIDE: ${starvingApproach.toUpperCase()} has waited ${ewMaxWait.toFixed(0)}s (threshold: ${config.maxWaitThreshold}s). Priority transferred immediately.`;
    } else if (currentPhase === 'EW_THROUGH' && nsMaxWait >= config.maxWaitThreshold) {
      starvationAlert = true;
      starvingApproach = maxWaitingTimes.north >= maxWaitingTimes.south ? 'north' : 'south';
      nextPhase = 'NS_THROUGH';
      reason = `ANTI-STARVATION OVERRIDE: ${starvingApproach.toUpperCase()} has waited ${nsMaxWait.toFixed(0)}s (threshold: ${config.maxWaitThreshold}s). Priority transferred immediately.`;
    } else {
      // Normal decision based on weighted demand and queue
      const opposingPhase = currentPhase === 'NS_THROUGH' ? 'EW_THROUGH' : 'NS_THROUGH';
      const opposingScore = opposingPhase === 'EW_THROUGH' ? ewEnhancedScore : nsEnhancedScore;
      const currentScore = currentPhase === 'NS_THROUGH' ? nsEnhancedScore : ewEnhancedScore;

      if (opposingScore > currentScore * 0.8 && opposingScore > 0) {
        nextPhase = opposingPhase;
        reason = `Enhanced Controller selected ${nextPhase === 'NS_THROUGH' ? 'North-South' : 'East-West'} based on higher weighted score (${opposingScore.toFixed(1)} vs current ${currentScore.toFixed(1)}).`;
      } else if (currentScore > 0) {
        nextPhase = currentPhase;
        reason = `Enhanced Controller maintained ${currentPhase === 'NS_THROUGH' ? 'North-South' : 'East-West'} due to high sustained weighted demand (${currentScore.toFixed(1)}).`;
      } else if (opposingScore > 0) {
        nextPhase = opposingPhase;
        reason = `Enhanced Controller transitioned to ${opposingPhase === 'NS_THROUGH' ? 'North-South' : 'East-West'} to clear waiting demand.`;
      } else {
        nextPhase = opposingPhase;
        reason = `Both approaches idle; cycling phase to maintain junction rhythm.`;
      }
    }

    // Prepare features for predictor
    const targetQueue =
      nextPhase === 'NS_THROUGH'
        ? queueCounts.north + queueCounts.south
        : queueCounts.east + queueCounts.west;
    const targetWeighted =
      nextPhase === 'NS_THROUGH'
        ? weightedScores.north + weightedScores.south
        : weightedScores.east + weightedScores.west;
    const targetHeavy =
      nextPhase === 'NS_THROUGH'
        ? heavyVehicleCounts.north + heavyVehicleCounts.south
        : heavyVehicleCounts.east + heavyVehicleCounts.west;
    const targetAvgWait =
      nextPhase === 'NS_THROUGH'
        ? (avgWaitingTimes.north + avgWaitingTimes.south) / 2
        : (avgWaitingTimes.east + avgWaitingTimes.west) / 2;
    const targetMaxWait =
      nextPhase === 'NS_THROUGH'
        ? Math.max(maxWaitingTimes.north, maxWaitingTimes.south)
        : Math.max(maxWaitingTimes.east, maxWaitingTimes.west);

    const prediction = this.predictor.predict(
      {
        phaseId: nextPhase,
        totalQueue: targetQueue,
        weightedDemand: targetWeighted,
        avgWaitSeconds: targetAvgWait,
        maxWaitSeconds: targetMaxWait,
        heavyVehicleRatio: targetQueue > 0 ? targetHeavy / targetQueue : 0,
        arrivalRatePerMin: 20, // default reference
      },
      config
    );

    let allocatedGreenDuration = prediction.recommendedGreen;
    if (starvationAlert) {
      // Allocate enough green to clear the starving vehicle group
      allocatedGreenDuration = Math.max(allocatedGreenDuration, Math.min(config.maxGreen, 20));
    }

    return {
      timestamp: currentTime,
      selectedPhase: nextPhase,
      allocatedGreenDuration,
      reason,
      queueCounts,
      weightedScores,
      maxWaitingTimes,
      starvationAlertTriggered: starvationAlert,
      starvingApproach,
    };
  }
}
