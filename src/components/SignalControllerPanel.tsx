'use client';

import React from 'react';
import { TrafficSimulationEngine } from '@/simulation/engine';
import { ControllerType, ControllerConfig } from '@/types/traffic';
import { ShieldCheck, Cpu, AlertOctagon, Activity, Radio, Sparkles } from 'lucide-react';

interface SignalControllerPanelProps {
  engine: TrafficSimulationEngine;
  onStateChange: () => void;
}

export const SignalControllerPanel: React.FC<SignalControllerPanelProps> = ({ engine, onStateChange }) => {
  const snapshot = engine.getSnapshot();
  const { signalState, controllerType, controllerConfig, decisionLog } = snapshot;

  const currentDecision = decisionLog[0];

  const handleControllerSwitch = (type: ControllerType) => {
    if (type === 'enhanced') {
      engine.activateMySystemAndSolve();
    } else {
      engine.setControllerType(type);
      if (!snapshot.isRunning) {
        engine.start();
      }
    }
    onStateChange();
  };

  const handleConfigChange = (key: keyof ControllerConfig, val: number) => {
    engine.setControllerConfig({ [key]: val });
    onStateChange();
  };

  const isGreen = signalState.machineState === 'GREEN';
  const isYellow = signalState.machineState === 'YELLOW';
  const isAllRed = signalState.machineState === 'ALL_RED';

  const remaining = Math.max(0, signalState.targetDuration - signalState.timeInCurrentState);

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
            Adaptive Signal Controller & Decision AI
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Mode:</span>
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => handleControllerSwitch('baseline')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                controllerType === 'baseline'
                  ? 'bg-rose-900/50 text-rose-200 border border-rose-600/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Current System</span>
            </button>
            <button
              onClick={() => handleControllerSwitch('enhanced')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                controllerType === 'enhanced'
                  ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-600/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Our Solution</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Active Phase & Signal Status Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>CURRENT RUNNING PHASE</span>
            </div>
            <div className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
              <span>{signalState.activePhase === 'NS_THROUGH' ? 'North–South Corridor' : 'East–West Corridor'}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono uppercase font-semibold ${
                  isGreen
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isYellow
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {signalState.machineState}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 italic">
              {signalState.reason}
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase font-medium">Time Left</div>
            <div
              className={`text-3xl font-black font-mono tracking-tight ${
                isGreen ? 'text-emerald-400' : isYellow ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {remaining.toFixed(0)}
              <span className="text-sm font-normal text-slate-500 ml-1">sec</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              of {signalState.targetDuration}s total window
            </div>
          </div>
        </div>

        {/* System Status Banner */}
        {controllerType === 'baseline' ? (
          <div className="p-2.5 rounded-xl bg-slate-950 border border-rose-800/50 text-xs text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Conventional Mode Active:</strong> Arterial volume prioritization with starvation vulnerability.
              </span>
            </div>
            <button
              onClick={() => handleControllerSwitch('enhanced')}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs shrink-0 transition active:scale-95 cursor-pointer shadow-sm"
            >
              Simulate Solution
            </button>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-800/50 text-xs text-emerald-200 flex items-center gap-2 shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Adaptive Solution Active:</strong> 30s Anti-starvation ceiling enforced with 5.0x PCU bus priority.
            </span>
          </div>
        )}

        {/* Live Controller Decision Breakdown */}
        {currentDecision && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Latest Controller Decision Rationale
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Decided at t={currentDecision.timestamp.toFixed(0)}s
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700/60 text-xs text-slate-200 leading-relaxed">
              {currentDecision.reason}
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase">Allocated Green</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  {currentDecision.allocatedGreenDuration}s
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase">NS Demand Score</div>
                <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                  {(currentDecision.weightedScores.north + currentDecision.weightedScores.south).toFixed(1)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase">EW Demand Score</div>
                <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                  {(currentDecision.weightedScores.east + currentDecision.weightedScores.west).toFixed(1)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase">Max Wait Observed</div>
                <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                  {Math.max(
                    currentDecision.maxWaitingTimes.north,
                    currentDecision.maxWaitingTimes.south,
                    currentDecision.maxWaitingTimes.east,
                    currentDecision.maxWaitingTimes.west
                  ).toFixed(0)}s
                </div>
              </div>
            </div>

            {/* Starvation Alert Banner */}
            {currentDecision.starvationAlertTriggered && (
              <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/50 flex items-center gap-2 text-xs text-red-200">
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Anti-Starvation Shield Active:</strong> Approach{' '}
                  <span className="uppercase font-mono font-bold text-red-300">
                    {currentDecision.starvingApproach}
                  </span>{' '}
                  breached the {controllerConfig.maxWaitThreshold}s maximum threshold. Priority override enforced.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Configurable Thresholds */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Controller Limits & Safety Parameters
            </span>
            <span className="text-[10px] text-slate-500">Configurable Experimental Settings</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Min Green:</span>
                <span className="font-mono text-slate-100">{controllerConfig.minGreen}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                value={controllerConfig.minGreen}
                onChange={(e) => handleConfigChange('minGreen', Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Max Green:</span>
                <span className="font-mono text-slate-100">{controllerConfig.maxGreen}s</span>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                value={controllerConfig.maxGreen}
                onChange={(e) => handleConfigChange('maxGreen', Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Starvation Limit:</span>
                <span className="font-mono text-amber-400 font-bold">{controllerConfig.maxWaitThreshold}s</span>
              </div>
              <input
                type="range"
                min="15"
                max="90"
                step="5"
                value={controllerConfig.maxWaitThreshold}
                onChange={(e) => handleConfigChange('maxWaitThreshold', Number(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <div className="flex gap-1 mt-1.5">
                {[15, 25, 35, 60].map((thr) => (
                  <button
                    key={thr}
                    onClick={() => handleConfigChange('maxWaitThreshold', thr)}
                    className={`flex-1 py-0.5 rounded text-[10px] font-mono transition ${
                      controllerConfig.maxWaitThreshold === thr
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {thr}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Starvation Status Monitor Banner */}
          {(() => {
            const summary = engine.getSummaryMetrics();
            const hasStarvation = summary.maxWaitTime >= controllerConfig.maxWaitThreshold;
            const bottleneck = engine.getBottleneckAnalysis();

            return (
              <div className="mt-3 space-y-2">
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                    hasStarvation
                      ? 'bg-red-950/70 border-red-500/50 text-red-200'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        hasStarvation ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                      }`}
                    />
                    <span>
                      {hasStarvation ? (
                        <>
                          <strong className="text-red-300">STARVATION ALERT:</strong> Approach{' '}
                          <span className="uppercase font-mono font-bold text-red-400">
                            {bottleneck.longestMaxWaitApproach}
                          </span>{' '}
                          has waited <strong>{summary.maxWaitTime.toFixed(0)}s</strong> (Threshold:{' '}
                          {controllerConfig.maxWaitThreshold}s).{' '}
                          {controllerType === 'enhanced'
                            ? '🛡️ AI Shield actively forcing priority switch!'
                            : '⚠️ Traditional CoSiCoSt ignoring wait time.'}
                        </>
                      ) : (
                        <>
                          <strong>Anti-Starvation Shield:</strong> Max wait is{' '}
                          <span className="font-mono text-cyan-400">{summary.maxWaitTime.toFixed(0)}s</span> (Threshold:{' '}
                          {controllerConfig.maxWaitThreshold}s).
                        </>
                      )}
                    </span>
                  </div>

                  {hasStarvation && controllerType === 'baseline' && (
                    <button
                      onClick={() => handleControllerSwitch('enhanced')}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition whitespace-nowrap ml-2"
                    >
                      <Sparkles className="w-3 h-3" />
                      Rescue with AI Shield
                    </button>
                  )}
                </div>

                {/* Quick Starvation Demonstration Buttons */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button
                    onClick={() => {
                      engine.applyPreset('unequal');
                      handleControllerSwitch('baseline');
                      engine.start();
                      onStateChange();
                    }}
                    className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 text-amber-300 flex items-center justify-center gap-1.5 transition text-left"
                    title="Loads Unequal Traffic under Baseline mode to demonstrate cross-street starvation"
                  >
                    <span>🔥 Induce Starvation (Baseline)</span>
                  </button>
                  <button
                    onClick={() => {
                      handleControllerSwitch('enhanced');
                      handleConfigChange('maxWaitThreshold', 25);
                      engine.start();
                      onStateChange();
                    }}
                    className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-indigo-500/30 text-indigo-300 flex items-center justify-center gap-1.5 transition text-left"
                    title="Activates AI-Enhanced mode with 25s threshold to demonstrate automatic queue rescue"
                  >
                    <span>🛡️ AI Anti-Starvation (25s)</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* AI & Subsystem Integration Status (Academic Transparency) */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              AI Subsystem Integration Status
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Academic Transparency Audit</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400">YOLO Vehicle Vision</div>
              <div className="font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Simulated Sensor Stream
              </div>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400">Green Time Predictor</div>
              <div className="font-semibold text-cyan-400 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Rule-Based (ML Interface)
              </div>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400">SUMO Co-Simulation</div>
              <div className="font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Self-Contained Engine
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
