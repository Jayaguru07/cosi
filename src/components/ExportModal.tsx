'use client';

import React from 'react';
import { TrafficSimulationEngine } from '@/simulation/engine';
import { Download, Printer, X, FileSpreadsheet, FileCode, CheckCircle } from 'lucide-react';

interface ExportModalProps {
  engine: TrafficSimulationEngine;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ engine, isOpen, onClose }) => {
  if (!isOpen) return null;

  const snapshot = engine.getSnapshot();
  const summary = engine.getSummaryMetrics();
  const bottleneck = engine.getBottleneckAnalysis();

  const approaches = ['north', 'south', 'east', 'west'] as const;
  const approachMetrics = approaches.map((app) => engine.getApproachMetrics(app));

  // 1. Export Approach-Wise Metrics CSV
  const exportApproachCSV = () => {
    let csv = 'Approach,Queued,Arrivals,Served,AvgWaitSeconds,MaxWaitSeconds,ArrivalRate,WeightedDemand,TimesServed\n';
    approachMetrics.forEach((m) => {
      csv += `${m.approach},${m.queued},${m.arrivals},${m.served},${m.avgWaitTime.toFixed(1)},${m.maxWaitTime.toFixed(1)},${m.arrivalRate},${m.weightedDemand.toFixed(1)},${m.timesServed}\n`;
    });
    downloadFile(csv, `cosicost_approach_metrics_${Date.now()}.csv`, 'text/csv');
  };

  // 2. Export Time-Series Snapshots CSV
  const exportSnapshotsCSV = () => {
    let csv = 'Timestamp,ActivePhase,MachineState,QueueNorth,QueueSouth,QueueEast,QueueWest,TotalQueue,AvgWait,MaxWait,WeightedDemandNS,WeightedDemandEW,TotalServed,ThroughputPerMin\n';
    snapshot.snapshots.forEach((s) => {
      csv += `${s.timestamp},${s.activePhase},${s.machineState},${s.queueNorth},${s.queueSouth},${s.queueEast},${s.queueWest},${s.totalQueue},${s.avgWaitTime},${s.maxWaitTime},${s.weightedDemandNS},${s.weightedDemandEW},${s.vehiclesServedTotal},${s.throughputPerMin}\n`;
    });
    downloadFile(csv, `cosicost_time_series_${Date.now()}.csv`, 'text/csv');
  };

  // 3. Export Decision History CSV
  const exportDecisionsCSV = () => {
    let csv = 'Timestamp,SelectedPhase,GreenDuration,StarvationAlert,StarvingApproach,Reason\n';
    snapshot.decisionLog.forEach((d) => {
      const sanitizedReason = `"${d.reason.replace(/"/g, '""')}"`;
      csv += `${d.timestamp},${d.selectedPhase},${d.allocatedGreenDuration},${d.starvationAlertTriggered},${d.starvingApproach || 'none'},${sanitizedReason}\n`;
    });
    downloadFile(csv, `cosicost_decision_audit_${Date.now()}.csv`, 'text/csv');
  };

  // 4. Export JSON Package
  const exportJSON = () => {
    const data = {
      project: 'AI-Enhanced CoSiCoSt for Adaptive Traffic Signal Control in Indian Mixed Traffic',
      exportTimestamp: new Date().toISOString(),
      simulationState: {
        elapsedTime: summary.elapsedTime,
        controller: snapshot.controllerType,
        preset: snapshot.activePresetId,
        seed: snapshot.seed,
        summaryMetrics: summary,
        bottleneckAnalysis: bottleneck,
        approachMetrics,
        decisionCount: snapshot.decisionLog.length,
        adjustmentCount: snapshot.adjustmentLog.length,
      },
    };
    downloadFile(JSON.stringify(data, null, 2), `cosicost_experiment_${Date.now()}.json`, 'application/json');
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Export Research Experiment Data & Report
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          <p className="text-xs text-slate-300 leading-relaxed">
            Download simulation measurements, empirical queue time-series, and decision audit logs for your project
            report, paper submission, or presentation to your college professor.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              onClick={exportApproachCSV}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 text-left transition flex items-start gap-3 group"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0 group-hover:scale-110 transition" />
              <div>
                <div className="font-semibold text-slate-200">Approach Metrics (CSV)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Summary data per N, S, E, W corridor</div>
              </div>
            </button>

            <button
              onClick={exportSnapshotsCSV}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 text-left transition flex items-start gap-3 group"
            >
              <FileSpreadsheet className="w-5 h-5 text-cyan-400 shrink-0 group-hover:scale-110 transition" />
              <div>
                <div className="font-semibold text-slate-200">Time-Series Data (CSV)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Periodic sampled queue & delay timeline</div>
              </div>
            </button>

            <button
              onClick={exportDecisionsCSV}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 text-left transition flex items-start gap-3 group"
            >
              <FileSpreadsheet className="w-5 h-5 text-amber-400 shrink-0 group-hover:scale-110 transition" />
              <div>
                <div className="font-semibold text-slate-200">Decision Audit Log (CSV)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Phase changes and AI rationale log</div>
              </div>
            </button>

            <button
              onClick={exportJSON}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 text-left transition flex items-start gap-3 group"
            >
              <FileCode className="w-5 h-5 text-violet-400 shrink-0 group-hover:scale-110 transition" />
              <div>
                <div className="font-semibold text-slate-200">Complete JSON Experiment</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Full reproducibility package & configs</div>
              </div>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Includes academic disclaimer & experimental parameters</span>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700 transition"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              Print / Save PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
