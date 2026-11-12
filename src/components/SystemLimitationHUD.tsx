'use client';

import React, { useState } from 'react';
import { TrafficSimulationEngine } from '@/simulation/engine';
import {
  AlertTriangle,
  CheckCircle2,
  Users,
  Clock,
  Scale,
  Truck,
  Play,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface SystemLimitationHUDProps {
  engine: TrafficSimulationEngine;
  onStateChange: () => void;
}

export const SystemLimitationHUD: React.FC<SystemLimitationHUDProps> = ({ engine, onStateChange }) => {
  const [showGuide, setShowGuide] = useState(false);
  const snapshot = engine.getSnapshot();
  const isBaseline = snapshot.controllerType === 'baseline';

  const approachN = engine.getApproachMetrics('north');
  const approachS = engine.getApproachMetrics('south');
  const approachE = engine.getApproachMetrics('east');
  const approachW = engine.getApproachMetrics('west');

  const maxWaitCrossStreets = Math.max(approachE.maxWaitTime, approachW.maxWaitTime);
  const isStarving = maxWaitCrossStreets >= snapshot.controllerConfig.maxWaitThreshold;

  const commuterStats = engine.getCommuterMetrics();
  const liveFairness = engine.getLiveJainsFairnessIndex();

  const handleRunCurrentSystem = () => {
    engine.applyPreset('unequal');
    engine.setControllerType('baseline');
    engine.start();
    onStateChange();
  };

  const handleRunOurSolution = () => {
    engine.activateMySystemAndSolve();
    onStateChange();
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-sm overflow-hidden">
      {/* Top Controller Switcher & Direct Simulation Starters */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${
                  isBaseline
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    snapshot.isRunning
                      ? isBaseline
                        ? 'bg-rose-400 animate-pulse'
                        : 'bg-emerald-400 animate-pulse'
                      : 'bg-slate-500'
                  }`}
                />
                {isBaseline ? 'Conventional CoSiCoSt Mode' : 'Adaptive PCU Solution Mode'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {snapshot.isRunning ? 'Simulation Running' : 'Simulation Paused'}
              </span>
            </div>
            <h2 className="text-base font-semibold text-slate-100 tracking-tight">
              {isBaseline
                ? 'Current System Limitations: Arterial Volume Bias & Starvation'
                : 'Our Solution Active: Adaptive Passenger Weighting & Starvation Shield'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              {isBaseline
                ? 'Standard volume actuation counts raw vehicles equally. Arterial volume continuously wins green while cross-streets wait.'
                : 'Prioritizes passenger volume (PCU) and bounds maximum waiting time to 30s with automatic phase preemption.'}
            </p>
          </div>

          {/* TWO PRIMARY SIMULATION ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Button 1: Simulate Current System */}
            <button
              onClick={handleRunCurrentSystem}
              title="Loads peak asymmetric traffic, sets Baseline controller, and immediately starts simulation"
              className={`px-4 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 border transition cursor-pointer active:scale-95 ${
                isBaseline
                  ? 'bg-rose-900/40 text-rose-200 border-rose-500/60 ring-1 ring-rose-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
              <div className="text-left">
                <div className="font-semibold text-slate-100">Simulate Current System</div>
                <div className="text-[10px] text-slate-400">Show Limitations & Flaws</div>
              </div>
            </button>

            {/* Button 2: Simulate Our Solution */}
            <button
              onClick={handleRunOurSolution}
              title="Activates AI-Enhanced controller, enforces anti-starvation ceiling, and starts simulation"
              className={`px-4 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 border transition cursor-pointer active:scale-95 ${
                !isBaseline
                  ? 'bg-emerald-900/40 text-emerald-200 border-emerald-500/60 ring-1 ring-emerald-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold border-emerald-400 shadow-md'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current text-emerald-400" />
              <div className="text-left">
                <div className={`font-semibold ${!isBaseline ? 'text-slate-100' : 'text-slate-950'}`}>
                  Simulate Our Solution
                </div>
                <div className={`text-[10px] ${!isBaseline ? 'text-slate-400' : 'text-slate-900 font-medium'}`}>
                  Solve All 4 Limitations
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Clean Telemetry Metric Cards */}
      <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Cross-Street Starvation */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Cross-Street Wait
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isBaseline
                  ? isStarving
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 font-semibold'
                    : 'bg-slate-900 text-slate-400'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold'
              }`}
            >
              {isBaseline ? (isStarving ? 'Starved (>30s)' : 'Monitoring') : 'Protected'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-100">
              {maxWaitCrossStreets.toFixed(0)}
              <span className="text-xs font-normal text-slate-500 ml-1">sec</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Limit: {snapshot.controllerConfig.maxWaitThreshold}s
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2">
            {isBaseline
              ? 'Arterial North-South traffic claims continuous green; East-West vehicles wait indefinitely.'
              : 'Our controller enforces a strict 30s ceiling, overriding green to service cross-streets.'}
          </p>
        </div>

        {/* Metric 2: Bus Passenger Weighting */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-slate-400" /> Bus Commuter Priority
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isBaseline
                  ? 'bg-slate-900 text-slate-400'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold'
              }`}
            >
              {isBaseline ? '1.0x (Uniform)' : '5.0x PCU Active'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-100">
              {commuterStats.busCommuters}
              <span className="text-xs font-normal text-slate-500 ml-1">commuters</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              In Queue
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2">
            {isBaseline
              ? 'Traditional model treats 1 bus (50 passengers) identically to 1 solo scooter.'
              : 'Our solution applies PCU passenger weighting (Bus = 5.0x) to clear mass transit first.'}
          </p>
        </div>

        {/* Metric 3: Jain's Fairness Index */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Scale className="w-3.5 h-3.5 text-slate-400" /> Delay Fairness Index
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                liveFairness < 0.65
                  ? 'bg-amber-950 text-amber-300 border border-amber-800 font-semibold'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold'
              }`}
            >
              {liveFairness < 0.65 ? 'Unbalanced' : 'Equitable'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-100">
              {liveFairness.toFixed(2)}
              <span className="text-xs font-normal text-slate-500 ml-1">/ 1.00</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Jain&apos;s Metric
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2">
            {isBaseline
              ? 'Optimizing raw count alone yields extreme delay variance across competing corridors.'
              : 'Waiting time acceleration balances service distribution across all four approaches.'}
          </p>
        </div>

        {/* Metric 4: Heavy Commercial Clearance */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Truck className="w-3.5 h-3.5 text-slate-400" /> Heavy Fleet Clearance
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isBaseline
                  ? 'bg-slate-900 text-slate-400'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold'
              }`}
            >
              {isBaseline ? 'Fixed 3s' : '+4.5s Buffer'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-100">
              {isBaseline ? '3.0' : '7.5'}
              <span className="text-xs font-normal text-slate-500 ml-1">sec</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Clearance Window
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2">
            {isBaseline
              ? 'Fixed duration assumes fast cars; sluggish trucks (1.2m/s²) risk trapping during yellow.'
              : 'Predictor dynamically detects heavy commercial vehicles and extends clearance margins.'}
          </p>
        </div>
      </div>

      {/* Collapsible Presentation Notes */}
      <div className="px-5 py-2.5 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 hover:text-slate-200 transition font-medium"
        >
          <span>Presentation Walkthrough Script</span>
          {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <span className="text-[11px] text-slate-500 font-mono">
          Click either button above to switch and simulate live
        </span>
      </div>

      {showGuide && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-300 space-y-2">
          <div className="font-semibold text-slate-100">
            Suggested Demonstration Flow:
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
            <li>
              Click <strong className="text-slate-200">Simulate Current System</strong>: Watch South-North traffic stream while East-West queue waits past 30s. Point out how buses carrying 50 commuters are weighted identically to motorcycles.
            </li>
            <li>
              Click <strong className="text-emerald-300">Simulate Our Solution</strong>: Notice the immediate yellow transition, rescuing East-West, clearing the buses with 5x priority, and balancing the delay fairness index.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};
