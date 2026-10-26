'use client';

import React from 'react';
import { BookOpen, ShieldAlert, Cpu, ArrowRight, Layers, FileText } from 'lucide-react';

export const ArchitectureDocTab: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Disclaimer */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed shadow-xl">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          Academic Reverse Engineering Project Specification
        </div>
        <p>
          This web application presents an educational reverse-engineered prototype inspired by{' '}
          <strong>CoSiCoSt</strong> (Composite Signal Control Strategy), developed by{' '}
          <strong>C-DAC (Centre for Development of Advanced Computing)</strong>. It models adaptive traffic signal
          transitions in Indian mixed traffic environments. This simulation does not claim to use proprietary C-DAC
          algorithms or internal source code, but proposes novel research extensions using vehicle classification,
          weighted traffic demand, and maximum-waiting-time starvation prevention.
        </p>
      </div>

      {/* System Architecture Flow Diagram */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2 mb-6">
          <Layers className="w-4 h-4 text-cyan-400" />
          End-to-End Modular System Architecture
        </h3>

        {/* Visual Pipeline Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">Stage 1</div>
              <div className="text-sm font-bold text-slate-100 mt-1">Traffic Ingestion & Generation</div>
              <p className="text-slate-400 mt-2 text-[11px] leading-relaxed">
                Deterministic PRNG generates heterogeneous Indian mixed vehicle fleets (Bikes, Autos, Cars, Buses,
                Trucks) across N, S, E, W corridors.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-slate-500 font-mono">Mulberry32 PRNG + Poisson</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">Stage 2</div>
              <div className="text-sm font-bold text-slate-100 mt-1">Weighted Demand & Starvation</div>
              <p className="text-slate-400 mt-2 text-[11px] leading-relaxed">
                Aggregates PCU-weighted vehicle queues and tracks individual vehicle waiting times to flag starvation
                breaches (T &gt; 60s).
              </p>
            </div>
            <div className="mt-3 text-[10px] text-slate-500 font-mono">PCU Matrix + Delay Factor</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">Stage 3</div>
              <div className="text-sm font-bold text-slate-100 mt-1">Adaptive Controller & AI</div>
              <p className="text-slate-400 mt-2 text-[11px] leading-relaxed">
                Chooses non-conflicting phase (NS vs EW) and computes optimal green window length via rule-based ML
                interface.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-slate-500 font-mono">Baseline vs AI-Enhanced</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">Stage 4</div>
              <div className="text-sm font-bold text-slate-100 mt-1">Safety State Machine</div>
              <p className="text-slate-400 mt-2 text-[11px] leading-relaxed">
                Strict state machine enforcing Yellow clearance (3s) and All-Red clearance (1s). Conflicting greens
                are physically prohibited.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-slate-500 font-mono">Deterministic State Machine</div>
          </div>
        </div>
      </div>

      {/* Mathematical Formulations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Baseline Formula */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            Baseline Controller Formulation (CoSiCoSt-Inspired)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The baseline controller allocates green duration linearly based on raw queue counts without distinguishing
            vehicle sizes or passenger capacities:
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300">
            G = clamp(G_min + round(0.85 × Q_phase), G_min, G_max)
          </div>
          <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
            <li>Q_phase = Total unserved vehicle count in active corridor (e.g. Q_N + Q_S)</li>
            <li>G_min = 10s, G_max = 45s</li>
            <li>Limitation: A single bus with 50 commuters is treated identically to one motorcycle.</li>
          </ul>
        </div>

        {/* Enhanced AI Formulation */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            AI-Enhanced Controller Formulation
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The enhanced controller incorporates Passenger Car Unit (PCU) weighting and an anti-starvation multiplier:
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300">
            W_phase = ∑ (w_v × count_v)
            <br />
            Score = W_phase × (1 + 0.03 × AvgWait)
            <br />
            G = clamp(G_min + round(0.5 × Score), G_min, G_max)
          </div>
          <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
            <li>Vehicle Weights: Motorcycle (1.0), Auto (2.0), Car (2.0), Bus (5.0), Truck (6.0)</li>
            <li>Anti-Starvation Threshold: If maxWait &gt; 60s on opposing phase, priority forces phase switch.</li>
          </ul>
        </div>
      </div>

      {/* Indian Mixed Traffic Justification Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            Indian Mixed Traffic Vehicle Classes & Parameter Matrix
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Vehicle Category</th>
                <th className="py-3 px-4">PCU Weight</th>
                <th className="py-3 px-4">Length</th>
                <th className="py-3 px-4">Max Speed</th>
                <th className="py-3 px-4">Indian Traffic Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              <tr>
                <td className="py-2.5 px-4 font-bold text-cyan-400">Two-Wheeler (Bike/Scooter)</td>
                <td className="py-2.5 px-4">1.0</td>
                <td className="py-2.5 px-4">2.0m</td>
                <td className="py-2.5 px-4">40 km/h</td>
                <td className="py-2.5 px-4 font-sans text-slate-400">High maneuverability, filtering ability in queues</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-yellow-400">Auto-Rickshaw</td>
                <td className="py-2.5 px-4">2.0</td>
                <td className="py-2.5 px-4">2.8m</td>
                <td className="py-2.5 px-4">32 km/h</td>
                <td className="py-2.5 px-4 font-sans text-slate-400">Intermediate intermediate transit footprint</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-blue-400">Passenger Car</td>
                <td className="py-2.5 px-4">2.0</td>
                <td className="py-2.5 px-4">4.5m</td>
                <td className="py-2.5 px-4">48 km/h</td>
                <td className="py-2.5 px-4 font-sans text-slate-400">Standard passenger vehicle footprint</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-pink-400">Public Bus</td>
                <td className="py-2.5 px-4">5.0</td>
                <td className="py-2.5 px-4">10.5m</td>
                <td className="py-2.5 px-4">30 km/h</td>
                <td className="py-2.5 px-4 font-sans text-slate-400">Mass transit carrying 40–60 passengers; high priority</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-orange-400">Heavy Truck</td>
                <td className="py-2.5 px-4">6.0</td>
                <td className="py-2.5 px-4">11.5m</td>
                <td className="py-2.5 px-4">28 km/h</td>
                <td className="py-2.5 px-4 font-sans text-slate-400">Slow startup acceleration; requires extended clearance</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
