'use client';

import React, { useState, useEffect, useRef, useReducer } from 'react';
import { TrafficSimulationEngine } from '@/simulation/engine';
import { PRESET_SCENARIOS } from '@/simulation/presets';
import { TrafficCanvas } from '@/components/TrafficCanvas';
import { VehicleControlPanel } from '@/components/VehicleControlPanel';
import { SignalControllerPanel } from '@/components/SignalControllerPanel';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { ComparisonView } from '@/components/ComparisonView';
import { DemonstrationMode } from '@/components/DemonstrationMode';
import { ArchitectureDocTab } from '@/components/ArchitectureDocTab';
import { BaselineProblemsCard } from '@/components/BaselineProblemsCard';
import { ProblemsAndSolutionsView } from '@/components/ProblemsAndSolutionsView';
import { ExportModal } from '@/components/ExportModal';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Download,
  Activity,
  BarChart3,
  GitCompare,
  Presentation,
  BookOpen,
  Sparkles,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react';

export default function HomePage() {
  // Engine instance persists across re-renders
  const engineRef = useRef<TrafficSimulationEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new TrafficSimulationEngine(42, 'unequal');
  }
  const engine = engineRef.current;

  // Force re-render tick counter
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const [activeTab, setActiveTab] = useState<
    'simulation' | 'problems' | 'analytics' | 'comparison' | 'demo' | 'architecture'
  >('simulation');

  const [isExportOpen, setIsExportOpen] = useState(false);

  // Simulation Clock Tick Loop
  useEffect(() => {
    let lastWallTime = performance.now();
    let accumulatedSimTime = 0;
    let animId: number;

    const loop = (currentWallTime: number) => {
      const dtReal = (currentWallTime - lastWallTime) / 1000;
      lastWallTime = currentWallTime;

      const state = engine.getSnapshot();

      if (state.isRunning) {
        // Advance simulation time based on speedMultiplier
        const targetSimDt = dtReal * state.speedMultiplier;
        accumulatedSimTime += targetSimDt;

        // Step in fixed 0.5s or 1.0s chunks for numerical determinism
        const stepSize = 0.5;
        while (accumulatedSimTime >= stepSize) {
          engine.tick(stepSize);
          accumulatedSimTime -= stepSize;
          forceUpdate();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  const state = engine.getSnapshot();
  const summary = engine.getSummaryMetrics();

  const handleStartPause = () => {
    if (state.isRunning) {
      engine.pause();
    } else {
      engine.start();
    }
    forceUpdate();
  };

  const handleStepForward = () => {
    engine.pause();
    engine.tick(1.0);
    forceUpdate();
  };

  const handleReset = () => {
    engine.reset();
    forceUpdate();
  };

  const handleSpeedChange = (mult: number) => {
    engine.setSpeed(mult);
    forceUpdate();
  };

  const handlePresetSelect = (presetId: string) => {
    engine.applyPreset(presetId);
    forceUpdate();
  };

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const presets = Object.values(PRESET_SCENARIOS);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* TOP COMMAND CENTER HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-6 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Project Title and Badges */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950 font-black text-lg">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-wide">
                  AI-Enhanced CoSiCoSt
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                  Adaptive Traffic Control
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-semibold">
                  Indian Mixed Traffic
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Reverse Engineering Study & AI-Driven Passenger Priority Simulation (C-DAC Inspired)
              </p>
            </div>
          </div>

          {/* Quick Simulation Stats & Actions */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Clock */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 font-mono">
              <span className="text-slate-400">TIME:</span>
              <span className="font-bold text-cyan-400 text-sm">{formatTime(state.time)}</span>
            </div>

            {/* Status indicator */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  state.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span className="font-mono uppercase font-semibold text-slate-300">
                {state.isRunning ? 'Running' : 'Paused'}
              </span>
            </div>

            {/* Active Controller Badge */}
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-semibold ${
                state.controllerType === 'enhanced'
                  ? 'bg-violet-950/50 border-violet-500/40 text-violet-300'
                  : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>
                {state.controllerType === 'enhanced' ? 'AI-Enhanced' : 'Baseline CoSiCoSt'}
              </span>
            </div>

            {/* Export Report Button */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* SECONDARY CONTROL BAR: PLAYBACK & SCENARIO SELECTION */}
      <section className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Playback Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartPause}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 ${
                state.isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {state.isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-slate-950" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" /> Start Simulation
                </>
              )}
            </button>

            <button
              onClick={handleStepForward}
              title="Step forward 1 simulation second"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs flex items-center gap-1 transition active:scale-95"
            >
              <StepForward className="w-3.5 h-3.5" /> +1s Step
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/50 font-medium text-xs flex items-center gap-1 transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center gap-1 ml-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500 font-mono px-1">SPEED:</span>
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-2 py-0.5 rounded font-mono font-bold transition ${
                    state.speedMultiplier === s
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Traffic Scenario Preset Selector and Flaws Jump Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('problems')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-500/10"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>CoSiCoSt Flaws vs AI Fixes</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-0.5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" /> Preset:
              </span>
              <select
                value={state.activePresetId}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* NAVIGATION TABS */}
      <nav className="bg-slate-950 border-b border-slate-800 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto text-xs py-2">
          {[
            { id: 'simulation', label: 'Live Simulation & Controls', icon: Activity },
            { id: 'problems', label: 'CoSiCoSt Flaws vs AI Solutions', icon: AlertTriangle },
            { id: 'analytics', label: 'Analytics & Bottlenecks', icon: BarChart3 },
            { id: 'comparison', label: 'Controller Comparison Benchmark', icon: GitCompare },
            { id: 'demo', label: 'Professor Guided Demo', icon: Presentation },
            { id: 'architecture', label: 'Architecture & Documentation', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* TAB 1: LIVE SIMULATION & CONTROLS */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Canvas (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <TrafficCanvas engine={engine} tickCounter={state.time} />
              </div>

              {/* Right Column: Signal Controller & Decision AI (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <SignalControllerPanel engine={engine} onStateChange={forceUpdate} />
              </div>
            </div>

            {/* Bottom Row: Full Vehicle Queue & Fleet Mix Controls */}
            <div>
              <VehicleControlPanel engine={engine} onStateChange={forceUpdate} />
            </div>

            {/* Baseline CoSiCoSt Problems & Vulnerabilities Card */}
            <div>
              <BaselineProblemsCard engine={engine} />
            </div>
          </div>
        )}

        {/* TAB: PROBLEMS IN TRADITIONAL COSICOST & OUR AI SOLUTIONS */}
        {activeTab === 'problems' && (
          <ProblemsAndSolutionsView
            engine={engine}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onStateChange={forceUpdate}
          />
        )}

        {/* TAB 2: ANALYTICS & BOTTLENECK DASHBOARD */}
        {activeTab === 'analytics' && <AnalyticsDashboard engine={engine} />}

        {/* TAB 3: FAIR CONTROLLER COMPARISON BENCHMARK */}
        {activeTab === 'comparison' && <ComparisonView currentPresetId={state.activePresetId} />}

        {/* TAB 4: GUIDED DEMONSTRATION MODE */}
        {activeTab === 'demo' && (
          <DemonstrationMode
            engine={engine}
            onStateChange={forceUpdate}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* TAB 5: ARCHITECTURE & DOCUMENTATION */}
        {activeTab === 'architecture' && <ArchitectureDocTab />}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800/80 px-6 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div>
            AI-Enhanced CoSiCoSt — Adaptive Traffic Signal Control in Indian Mixed Traffic
          </div>
          <div className="flex items-center gap-4">
            <span>Deterministic Simulation Engine</span>
            <span>•</span>
            <span>Next.js 16 App Router</span>
            <span>•</span>
            <span>Vercel Deployable</span>
          </div>
        </div>
      </footer>

      {/* EXPORT MODAL */}
      <ExportModal
        engine={engine}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
