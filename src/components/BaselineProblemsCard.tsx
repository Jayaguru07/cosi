'use client';

import React from 'react';
import { TrafficSimulationEngine } from '@/simulation/engine';
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Users,
  Clock,
  Scale,
  Truck,
  Sparkles,
} from 'lucide-react';

interface BaselineProblemsCardProps {
  engine: TrafficSimulationEngine;
}

export const BaselineProblemsCard: React.FC<BaselineProblemsCardProps> = ({ engine }) => {
  const snapshot = engine.getSnapshot();
  const summary = engine.getSummaryMetrics();
  const isBaseline = snapshot.controllerType === 'baseline';

  const isStarving = summary.maxWaitTime >= snapshot.controllerConfig.maxWaitThreshold;

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              Why Traditional CoSiCoSt Struggles in Indian Mixed Traffic
            </h3>
            <p className="text-xs text-slate-400">
              Analysis of limitations in raw-demand adaptive control vs our AI-Enhanced solutions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Current Mode:</span>
          <span
            className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold uppercase ${
              isBaseline
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
            }`}
          >
            {isBaseline ? 'Baseline Active (Exhibiting Vulnerabilities)' : 'AI-Enhanced Active (Protected)'}
          </span>
        </div>
      </div>

      {/* 4 Core Vulnerabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {/* Vulnerability 1 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase">
              <Users className="w-4 h-4 text-red-400 shrink-0" />
              <span>1. Equal Vehicle Weight Fallacy</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/60">
              Capacity Blind
            </span>
          </div>

          <div className="space-y-1 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-start gap-1.5 text-slate-400">
              <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-200">The Problem:</strong> Traditional CoSiCoSt treats a bus carrying 50+
                commuters identically to 1 solo motorcycle (1 vehicle = 1 unit of queue demand).
              </span>
            </div>
            <div className="flex items-start gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-100">Our AI Solution:</strong> PCU Passenger Weighting (Buses = 5.0,
                Trucks = 6.0, Autos = 2.0, Cars = 2.0, Bikes = 1.0) prioritizing collective commuter volume.
              </span>
            </div>
          </div>
        </div>

        {/* Vulnerability 2 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase">
              <Clock className="w-4 h-4 text-red-400 shrink-0" />
              <span>2. Side-Street Starvation Trap</span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isStarving && isBaseline
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse font-bold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {isStarving && isBaseline ? 'STARVATION OCCURRING' : 'Anti-Starvation Active'}
            </span>
          </div>

          <div className="space-y-1 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-start gap-1.5 text-slate-400">
              <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-200">The Problem:</strong> When North-South has continuous heavy traffic
                (35+ cars), its raw queue always outnumbers East-West (5–10 cars). East-West vehicles wait indefinitely
                (&gt;60–120s).
              </span>
            </div>
            <div className="flex items-start gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-100">Our AI Solution:</strong> Automated Anti-Starvation Ceiling (60s)
                that forcefully breaks arterial dominance and grants cross-streets guaranteed service.
              </span>
            </div>
          </div>
        </div>

        {/* Vulnerability 3 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase">
              <Scale className="w-4 h-4 text-red-400 shrink-0" />
              <span>3. Corridor Inequity & Low Fairness</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              Jain Index &lt; 0.65
            </span>
          </div>

          <div className="space-y-1 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-start gap-1.5 text-slate-400">
              <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-200">The Problem:</strong> Maximizing raw vehicle counts alone causes
                extreme variance in stopped delays, leading to high fuel wastage and driver frustration.
              </span>
            </div>
            <div className="flex items-start gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-100">Our AI Solution:</strong> Waiting time acceleration penalty
                balancing delay distribution, elevating Jain&apos;s Fairness Index to &gt; 0.85.
              </span>
            </div>
          </div>
        </div>

        {/* Vulnerability 4 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase">
              <Truck className="w-4 h-4 text-red-400 shrink-0" />
              <span>4. Sluggish Fleet Clearance Blindness</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              Startup Loss
            </span>
          </div>

          <div className="space-y-1 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-start gap-1.5 text-slate-400">
              <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-200">The Problem:</strong> Indian heavy trucks and buses take 2.5× longer
                to clear the stop line (1.2 m/s² startup vs 2.8 m/s² for two-wheelers).
              </span>
            </div>
            <div className="flex items-start gap-1.5 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-100">Our AI Solution:</strong> Fleet composition detection dynamically
                extends yellow clearance and green windows whenever heavy trucks are in queue.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Interactive CTA */}
      <div className="mt-5 p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-slate-300">
          Want to demonstrate these exact vulnerabilities to your professor?
        </div>
        <button
          onClick={() => {
            engine.setControllerType('baseline');
            engine.applyPreset('unequal');
            engine.start();
          }}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 transition active:scale-95 shadow-lg shadow-amber-500/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Trigger Baseline Starvation Demo (Preset D)
        </button>
      </div>
    </div>
  );
};
