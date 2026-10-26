'use client';

import React, { useState, useMemo } from 'react';
import { TrafficSimulationEngine } from '@/simulation/engine';
import { Approach } from '@/types/traffic';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Car,
  AlertTriangle,
  Zap,
  RotateCw,
  Search,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  engine: TrafficSimulationEngine;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ engine }) => {
  const [timeFilter, setTimeFilter] = useState<'all' | '30s' | '60s'>('all');
  const [selectedApproachFilter, setSelectedApproachFilter] = useState<Approach | 'all'>('all');
  const [auditSearch, setAuditSearch] = useState('');

  const snapshot = engine.getSnapshot();
  const summary = engine.getSummaryMetrics();
  const bottleneck = engine.getBottleneckAnalysis();

  const approaches: Approach[] = ['north', 'south', 'east', 'west'];
  const approachMetricsList = useMemo(
    () => approaches.map((app) => engine.getApproachMetrics(app)),
    [engine, snapshot.time]
  );

  // Filter snapshots based on selected time window
  const filteredSnapshots = useMemo(() => {
    const snaps = snapshot.snapshots;
    if (snaps.length === 0) return [];
    const maxTime = snaps[snaps.length - 1].timestamp;

    if (timeFilter === '30s') {
      return snaps.filter((s) => s.timestamp >= maxTime - 30);
    }
    if (timeFilter === '60s') {
      return snaps.filter((s) => s.timestamp >= maxTime - 60);
    }
    return snaps;
  }, [snapshot.snapshots, timeFilter]);

  // Chart data: Approach comparison
  const approachBarData = useMemo(() => {
    return approachMetricsList.map((m) => ({
      name: m.approach.toUpperCase(),
      served: m.served,
      queued: m.queued,
      avgWait: Number(m.avgWaitTime.toFixed(1)),
      maxWait: Number(m.maxWaitTime.toFixed(1)),
      weightedDemand: Number(m.weightedDemand.toFixed(1)),
    }));
  }, [approachMetricsList]);

  // Chart data: Fleet composition per approach
  const compositionData = useMemo(() => {
    return approaches.map((app) => {
      const comp = snapshot.approachConfigs[app].composition;
      return {
        approach: app.toUpperCase(),
        TwoWheelers: comp.motorcycle,
        AutoRickshaws: comp.auto,
        Cars: comp.car,
        Buses: comp.bus,
        Trucks: comp.truck,
      };
    });
  }, [snapshot.approachConfigs]);

  // Filtered Decision Log
  const filteredDecisions = useMemo(() => {
    if (!auditSearch) return snapshot.decisionLog;
    const q = auditSearch.toLowerCase();
    return snapshot.decisionLog.filter(
      (d) =>
        d.reason.toLowerCase().includes(q) ||
        d.selectedPhase.toLowerCase().includes(q) ||
        (d.starvingApproach && d.starvingApproach.toLowerCase().includes(q))
    );
  }, [snapshot.decisionLog, auditSearch]);

  return (
    <div className="space-y-8">
      {/* 1. TOP SUMMARY METRIC CARDS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Live Performance & System Metrics
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic real-time measurements across the four-way intersection.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <span className="text-slate-500 px-2">Time Window:</span>
            {(['all', '60s', '30s'] as const).map((w) => (
              <button
                key={w}
                onClick={() => setTimeFilter(w)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  timeFilter === w
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {w === 'all' ? 'Entire Run' : `Last ${w}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center justify-between">
              <span>Total Served</span>
              <Car className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {summary.totalServed}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              of {summary.totalGenerated} generated
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center justify-between">
              <span>Avg Waiting Time</span>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
              {summary.avgWaitTime.toFixed(1)}
              <span className="text-xs text-slate-500 ml-1">s</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">per served vehicle</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center justify-between">
              <span>Max Waiting Time</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${
                summary.maxWaitTime > 60 ? 'text-red-400' : 'text-amber-400'
              }`}
            >
              {summary.maxWaitTime.toFixed(0)}
              <span className="text-xs text-slate-500 ml-1">s</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">longest waiting vehicle</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center justify-between">
              <span>Current Queued</span>
              <Zap className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
              {summary.totalQueued}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Avg queue: {summary.avgQueueLength.toFixed(1)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center justify-between">
              <span>Throughput</span>
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-violet-400 mt-1">
              {summary.throughputPerMin.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">vehicles / min</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center justify-between">
              <span>Green Utilization</span>
              <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
              {summary.greenUtilization.toFixed(0)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {summary.phaseChanges} phase switches
            </div>
          </div>
        </div>
      </div>

      {/* 2. BOTTLENECK ANALYSIS SECTION */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Automated Bottleneck & Starvation Analysis
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400">Most Congested Corridor</div>
            <div className="text-sm font-bold text-red-400 uppercase mt-0.5">
              {bottleneck.mostCongestedApproach} Approach
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Exhibits the highest queue backlog relative to lane discharge capacity.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400">Highest Delay Corridor</div>
            <div className="text-sm font-bold text-amber-400 uppercase mt-0.5">
              {bottleneck.highestWaitApproach} Approach
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Longest average stopped delay per vehicle experienced on this approach.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400">Dominant Green Phase</div>
            <div className="text-sm font-bold text-emerald-400 uppercase mt-0.5">
              {bottleneck.phaseWithMostGreen === 'NS_THROUGH' ? 'North–South' : 'East–West'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Received the majority of effective green window allocations.
            </p>
          </div>
        </div>
      </div>

      {/* 3. APPROACH-WISE METRIC TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
            Approach-Wise Performance Breakdown
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            Elapsed Simulation Time: {summary.elapsedTime.toFixed(0)}s
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Approach</th>
                <th className="py-3 px-4">Queued</th>
                <th className="py-3 px-4">Arrivals</th>
                <th className="py-3 px-4">Served</th>
                <th className="py-3 px-4">Avg Wait</th>
                <th className="py-3 px-4">Max Wait</th>
                <th className="py-3 px-4">Arrival Rate</th>
                <th className="py-3 px-4">Weighted Demand</th>
                <th className="py-3 px-4">Cycles Served</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {approachMetricsList.map((m) => {
                const isMostCongested = m.approach === bottleneck.mostCongestedApproach;
                const isStarving = m.maxWaitTime >= engine.getSnapshot().controllerConfig.maxWaitThreshold;

                return (
                  <tr
                    key={m.approach}
                    className={`transition hover:bg-slate-800/40 ${
                      isMostCongested ? 'bg-red-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-100 uppercase flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {m.approach}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          m.queued > 25
                            ? 'bg-red-500/20 text-red-400'
                            : m.queued > 10
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {m.queued}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{m.arrivals}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">{m.served}</td>
                    <td className="py-3 px-4 text-cyan-300">{m.avgWaitTime.toFixed(1)}s</td>
                    <td className="py-3 px-4">
                      <span className={isStarving ? 'text-red-400 font-bold' : 'text-slate-300'}>
                        {m.maxWaitTime.toFixed(0)}s
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{m.arrivalRate} v/m</td>
                    <td className="py-3 px-4 text-cyan-400 font-bold">{m.weightedDemand.toFixed(1)}</td>
                    <td className="py-3 px-4 text-slate-400">{m.timesServed}</td>
                    <td className="py-3 px-4">
                      {isStarving ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-500/40 uppercase font-semibold">
                          Starvation Alert
                        </span>
                      ) : isMostCongested ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-500/40 uppercase font-semibold">
                          Congested
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 uppercase font-semibold">
                          Optimal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. RECHARTS ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Queue Lengths Over Time */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Queue Length Over Time (All Approaches)
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredSnapshots}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" unit="s" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="queueNorth" stroke="#06b6d4" name="North" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="queueSouth" stroke="#3b82f6" name="South" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="queueEast" stroke="#f59e0b" name="East" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="queueWest" stroke="#ec4899" name="West" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Average & Maximum Waiting Time Over Time */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Waiting Time Evolution (Avg vs Max)
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredSnapshots}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" unit="s" />
                <YAxis stroke="#64748b" unit="s" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="avgWaitTime" stroke="#22c55e" name="Avg Wait (s)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="maxWaitTime" stroke="#ef4444" name="Max Wait (s)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Vehicles Served vs Remaining Queued (Bar) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Served Vehicles vs Remaining Queued
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approachBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="served" fill="#22c55e" name="Served Vehicles" radius={[4, 4, 0, 0]} />
                <Bar dataKey="queued" fill="#ef4444" name="Currently Queued" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Vehicle Fleet Composition (Stacked Bar) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Vehicle Fleet Mix per Approach (%)
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compositionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="approach" stroke="#64748b" />
                <YAxis stroke="#64748b" unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="TwoWheelers" stackId="a" fill="#06b6d4" name="2-Wheelers" />
                <Bar dataKey="AutoRickshaws" stackId="a" fill="#eab308" name="Autos" />
                <Bar dataKey="Cars" stackId="a" fill="#3b82f6" name="Cars" />
                <Bar dataKey="Buses" stackId="a" fill="#ec4899" name="Buses" />
                <Bar dataKey="Trucks" stackId="a" fill="#f97316" name="Trucks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. SEARCHABLE SIGNAL DECISION AUDIT LOG */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/70">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
              Signal Decision Audit Log
            </h4>
            <p className="text-xs text-slate-500">
              Complete historical record of phase selection decisions and allocated green times.
            </p>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search decision reason..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
          {filteredDecisions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic">No decision events recorded yet.</div>
          ) : (
            filteredDecisions.map((d, idx) => (
              <div key={idx} className="p-3 hover:bg-slate-800/30 transition flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-400 uppercase">
                      {d.selectedPhase === 'NS_THROUGH' ? 'North–South Green' : 'East–West Green'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                      {d.allocatedGreenDuration}s duration
                    </span>
                    {d.starvationAlertTriggered && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/40">
                        Anti-Starvation
                      </span>
                    )}
                  </div>
                  <div className="text-slate-300 font-sans text-xs">{d.reason}</div>
                  <div className="text-[10px] text-slate-500">
                    NS Demand: {(d.weightedScores.north + d.weightedScores.south).toFixed(1)} | EW Demand:{' '}
                    {(d.weightedScores.east + d.weightedScores.west).toFixed(1)}
                  </div>
                </div>
                <div className="text-slate-500 shrink-0 text-right">t={d.timestamp.toFixed(0)}s</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
