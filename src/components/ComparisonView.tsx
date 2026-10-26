'use client';

import React, { useState } from 'react';
import { runFairControllerComparison, ComparisonRunResult } from '@/simulation/comparison';
import { PRESET_SCENARIOS } from '@/simulation/presets';
import { ArrowUpRight, ArrowDownRight, Play, CheckCircle2, Award } from 'lucide-react';

interface ComparisonViewProps {
  currentPresetId: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ currentPresetId }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(currentPresetId);
  const [duration, setDuration] = useState<number>(180); // 3 simulated minutes
  const [seed, setSeed] = useState<number>(42);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<ComparisonRunResult | null>(() => {
    // Generate an initial benchmark run on mount
    return runFairControllerComparison({
      presetId: currentPresetId,
      durationSeconds: 180,
      seed: 42,
    });
  });

  const handleRunBenchmark = () => {
    setIsRunning(true);
    setTimeout(() => {
      const benchmarkResult = runFairControllerComparison({
        presetId: selectedPreset,
        durationSeconds: duration,
        seed,
      });
      setResult(benchmarkResult);
      setIsRunning(false);
    }, 100);
  };

  const presets = Object.values(PRESET_SCENARIOS);

  return (
    <div className="space-y-8">
      {/* Configuration Header */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              Rigorous Fair Controller Comparative Benchmark
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Executes two independent, 100% deterministic simulation instances (Baseline vs Enhanced) with
              identical pseudo-random seed, vehicle arrival streams, and physical constraints.
            </p>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            {isRunning ? 'Simulating Both Engines...' : 'Run Benchmark Experiment'}
          </button>
        </div>

        {/* Experiment Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div>
            <label className="text-slate-400 uppercase font-semibold text-[11px] block mb-1.5">
              Traffic Scenario Preset
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 uppercase font-semibold text-[11px] block mb-1.5">
              Simulation Duration
            </label>
            <div className="flex gap-2">
              {[90, 180, 300].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setDuration(dur)}
                  className={`flex-1 py-2 rounded-lg font-mono font-medium transition ${
                    duration === dur
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {dur}s ({dur / 60}m)
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 uppercase font-semibold text-[11px] block mb-1.5">
              Deterministic Seed
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => setSeed(Math.floor(Math.random() * 1000))}
                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100"
              >
                Randomize
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Results */}
      {result && (
        <div className="space-y-6">
          {/* Key Metric Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Average Waiting Time */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 uppercase font-medium">Avg Waiting Time</div>
              <div className="flex items-baseline justify-between mt-2">
                <div>
                  <div className="text-xs text-slate-500">Baseline</div>
                  <div className="text-xl font-bold font-mono text-slate-300">
                    {result.baseline.avgWaitTime}s
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-cyan-400 font-semibold">Enhanced</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {result.enhanced.avgWaitTime}s
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Improvement:</span>
                <span
                  className={`font-mono font-bold flex items-center gap-0.5 ${
                    result.diff.avgWaitTimeReductionPct >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {result.diff.avgWaitTimeReductionPct >= 0 ? (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(result.diff.avgWaitTimeReductionPct)}% delay reduction
                </span>
              </div>
            </div>

            {/* Metric 2: Maximum Waiting Time / Starvation */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 uppercase font-medium">Max Waiting Time</div>
              <div className="flex items-baseline justify-between mt-2">
                <div>
                  <div className="text-xs text-slate-500">Baseline</div>
                  <div className="text-xl font-bold font-mono text-red-400">
                    {result.baseline.maxWaitTime}s
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-cyan-400 font-semibold">Enhanced</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {result.enhanced.maxWaitTime}s
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Anti-Starvation:</span>
                <span
                  className={`font-mono font-bold flex items-center gap-0.5 ${
                    result.diff.maxWaitTimeReductionPct >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {result.diff.maxWaitTimeReductionPct >= 0 ? (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(result.diff.maxWaitTimeReductionPct)}% worst-case relief
                </span>
              </div>
            </div>

            {/* Metric 3: Total Vehicles Served */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 uppercase font-medium">Total Vehicles Served</div>
              <div className="flex items-baseline justify-between mt-2">
                <div>
                  <div className="text-xs text-slate-500">Baseline</div>
                  <div className="text-xl font-bold font-mono text-slate-300">
                    {result.baseline.totalServed}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-cyan-400 font-semibold">Enhanced</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {result.enhanced.totalServed}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Throughput Gain:</span>
                <span
                  className={`font-mono font-bold flex items-center gap-0.5 ${
                    result.diff.servedIncreasePct >= 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{result.diff.servedIncreasePct}% served
                </span>
              </div>
            </div>

            {/* Metric 4: Jain's Fairness Index */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 uppercase font-medium">Jain's Fairness Index</div>
              <div className="flex items-baseline justify-between mt-2">
                <div>
                  <div className="text-xs text-slate-500">Baseline</div>
                  <div className="text-xl font-bold font-mono text-slate-300">
                    {result.baseline.fairnessIndex}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-cyan-400 font-semibold">Enhanced</div>
                  <div className="text-xl font-bold font-mono text-cyan-400">
                    {result.enhanced.fairnessIndex}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Corridor Equity:</span>
                <span className="font-mono font-bold text-cyan-400">
                  {result.enhanced.fairnessIndex >= result.baseline.fairnessIndex ? 'More Equitable' : 'Comparable'}
                </span>
              </div>
            </div>
          </div>

          {/* Approach-by-Approach Comparative Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                Approach-Level Side-by-Side Comparison ({result.durationSeconds}s Duration)
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                Scenario: {result.presetName} | Seed: {result.seed}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Approach</th>
                    <th className="py-3 px-4">Served (Base vs Enh)</th>
                    <th className="py-3 px-4">Avg Wait (Base vs Enh)</th>
                    <th className="py-3 px-4">Max Wait (Base vs Enh)</th>
                    <th className="py-3 px-4">Starvation Mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {(['north', 'south', 'east', 'west'] as const).map((app) => {
                    const b = result.baseline.approachMetrics[app];
                    const e = result.enhanced.approachMetrics[app];
                    const waitDiff = b.avgWait > 0 ? ((b.avgWait - e.avgWait) / b.avgWait) * 100 : 0;

                    return (
                      <tr key={app} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-slate-100 uppercase">{app} Corridor</td>
                        <td className="py-3 px-4">
                          <span className="text-slate-400">{b.served}</span>
                          <span className="text-slate-600 mx-2">→</span>
                          <span className="text-emerald-400 font-bold">{e.served}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-400">{b.avgWait.toFixed(1)}s</span>
                          <span className="text-slate-600 mx-2">→</span>
                          <span className="text-cyan-400 font-bold">{e.avgWait.toFixed(1)}s</span>
                          <span className="text-[10px] text-emerald-400 ml-2">
                            ({waitDiff >= 0 ? `-${waitDiff.toFixed(0)}%` : `+${Math.abs(waitDiff).toFixed(0)}%`})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={b.maxWait > 60 ? 'text-red-400' : 'text-slate-400'}>
                            {b.maxWait.toFixed(0)}s
                          </span>
                          <span className="text-slate-600 mx-2">→</span>
                          <span className="text-emerald-400 font-bold">{e.maxWait.toFixed(0)}s</span>
                        </td>
                        <td className="py-3 px-4">
                          {b.maxWait > 60 && e.maxWait <= 60 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Starvation Eliminated
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Protected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
