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
import { SystemLimitationHUD } from '@/components/SystemLimitationHUD';
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

  // Smooth Simulation Clock Tick Loop
  useEffect(() => {
    let lastWallTime = performance.now();
    let accumulatedSimTime = 0;
    let lastUiUpdateTime = 0;
    let animId: number;

    const loop = (currentWallTime: number) => {
      const dtReal = Math.min((currentWallTime - lastWallTime) / 1000, 0.1);
      lastWallTime = currentWallTime;

      const state = engine.getSnapshot();

      if (state.isRunning) {
        // Advance simulation time based on speedMultiplier
        const targetSimDt = dtReal * state.speedMultiplier;
        accumulatedSimTime += targetSimDt;

        // Smooth physics step: 0.033s (~30 Hz) for fluid continuous car movement
        const stepSize = 0.033;
        let didTick = false;
        while (accumulatedSimTime >= stepSize) {
          engine.tick(stepSize);
          accumulatedSimTime -= stepSize;
          didTick = true;
        }

        // Throttle React state re-renders to ~12 FPS so UI counters update smoothly
        // without choking the browser or dropping button click events
        if (didTick && currentWallTime - lastUiUpdateTime > 80) {
          lastUiUpdateTime = currentWallTime;
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

  const handleSimulateCurrentSystem = () => {
    engine.applyPreset('unequal');
    engine.setControllerType('baseline');
    engine.start();
    forceUpdate();
  };

  const handleSimulateOurSolution = () => {
    engine.activateMySystemAndSolve();
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* TOP COMMAND CENTER HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800/90 backdrop-blur-md px-6 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Project Title and Context */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 font-bold text-sm shadow-inner">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-100 tracking-tight">
                  CoSiCoSt Traffic Studio
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  Indian Mixed Traffic
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                  Autonomous Simulation
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Comparative Study: Conventional Volume Actuation vs AI-Enhanced Passenger Priority
              </p>
            </div>
          </div>

          {/* Quick Simulation Stats & Mode Switcher */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Clock */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 font-mono">
              <span className="text-slate-500">TIME:</span>
              <span className="font-semibold text-slate-200 text-sm">{formatTime(state.time)}</span>
            </div>

            {/* Status indicator */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  state.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span className="font-mono uppercase font-semibold text-slate-300 text-[11px]">
                {state.isRunning ? 'Running' : 'Paused'}
              </span>
            </div>

            {/* Master Controller Mode Switcher */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
              <button
                onClick={handleSimulateCurrentSystem}
                title="Simulate Conventional CoSiCoSt controller (Shows Limitations)"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  state.controllerType === 'baseline'
                    ? 'bg-rose-900/50 text-rose-200 border border-rose-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Current System</span>
              </button>
              <button
                onClick={handleSimulateOurSolution}
                title="Simulate Our Solution (Solves All Limitations)"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  state.controllerType === 'enhanced'
                    ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Our Solution</span>
              </button>
            </div>

            {/* Export Report Button */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export</span>
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
              className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                state.isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
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
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
            >
              <StepForward className="w-3.5 h-3.5" /> +1s Step
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
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
                  className={`px-2 py-0.5 rounded font-mono font-semibold transition cursor-pointer ${
                    state.speedMultiplier === s
                      ? 'bg-slate-200 text-slate-950 shadow-sm'
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
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Flaws & Solutions Matrix</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" /> Preset:
              </span>
              <select
                value={state.activePresetId}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-slate-500 cursor-pointer"
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm font-semibold'
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
            {/* Real-time Limitations vs AI Solutions HUD */}
            <SystemLimitationHUD engine={engine} onStateChange={forceUpdate} />

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
              <BaselineProblemsCard engine={engine} onStateChange={forceUpdate} />
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
