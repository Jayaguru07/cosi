'use client';

import React, { useState } from 'react';
import { TrafficSimulationEngine } from '@/simulation/engine';
import { Presentation, CheckCircle, ArrowRight, RotateCcw, Play, Sparkles } from 'lucide-react';

interface DemonstrationModeProps {
  engine: TrafficSimulationEngine;
  onStateChange: () => void;
  onNavigateTab: (tab: 'simulation' | 'analytics' | 'comparison' | 'architecture') => void;
}

export const DemonstrationMode: React.FC<DemonstrationModeProps> = ({
  engine,
  onStateChange,
  onNavigateTab,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const steps = [
    {
      step: 1,
      title: 'Step 1: Balanced Traffic Baseline',
      desc: 'Begin with symmetric traffic demand across all approaches (15 vehicles each) to establish baseline junction rhythm.',
      actionLabel: 'Configure Balanced Traffic',
      execute: () => {
        engine.applyPreset('custom');
        engine.adjustVehicleCount('north', 'set_exact', 15);
        engine.adjustVehicleCount('south', 'set_exact', 15);
        engine.adjustVehicleCount('east', 'set_exact', 15);
        engine.adjustVehicleCount('west', 'set_exact', 15);
        engine.setControllerType('baseline');
        onStateChange();
      },
    },
    {
      step: 2,
      title: 'Step 2: Introduce Heavy Arterial Demand (South & North)',
      desc: 'Simulate peak commuter rush: Inject 35 vehicles on South approach and 20 vehicles on North approach, representing an Indian mixed traffic arterial corridor.',
      actionLabel: 'Inject Heavy Arterial Queue',
      execute: () => {
        engine.adjustVehicleCount('south', 'set_exact', 35);
        engine.adjustVehicleCount('north', 'set_exact', 20);
        engine.adjustVehicleCount('east', 'set_exact', 10);
        engine.adjustVehicleCount('west', 'set_exact', 5);
        onStateChange();
      },
    },
    {
      step: 3,
      title: 'Step 3: Run Baseline Controller & Observe Starvation',
      desc: 'Execute the Baseline CoSiCoSt-inspired controller. Notice how the heavy North-South corridor monopolizes green time, causing vehicles on East and West to experience excessive wait times.',
      actionLabel: 'Run Baseline Simulation',
      execute: () => {
        engine.setControllerType('baseline');
        engine.start();
        onStateChange();
        onNavigateTab('simulation');
      },
    },
    {
      step: 4,
      title: 'Step 4: Reset Under Identical Initial Conditions',
      desc: 'Reset the junction with the exact same initial queues (South: 35, North: 20, East: 10, West: 5) and random seed to ensure an academically rigorous, fair comparison.',
      actionLabel: 'Reset Simulation with Exact Seed',
      execute: () => {
        engine.reset(42);
        engine.adjustVehicleCount('south', 'set_exact', 35);
        engine.adjustVehicleCount('north', 'set_exact', 20);
        engine.adjustVehicleCount('east', 'set_exact', 10);
        engine.adjustVehicleCount('west', 'set_exact', 5);
        onStateChange();
      },
    },
    {
      step: 5,
      title: 'Step 5: Engage AI-Enhanced Controller (Anti-Starvation)',
      desc: 'Activate the Enhanced Controller with PCU vehicle weighting (Buses=5, Trucks=6) and Anti-Starvation threshold (60s). Observe how East-West vehicles are automatically protected from starvation.',
      actionLabel: 'Launch AI-Enhanced Controller',
      execute: () => {
        engine.setControllerType('enhanced');
        engine.start();
        onStateChange();
        onNavigateTab('simulation');
      },
    },
    {
      step: 6,
      title: 'Step 6: Review Comparative Findings with Professor',
      desc: 'Navigate to the comparative benchmark tab to present empirical metrics: percentage wait time reduction, queue clearance rates, and Jain’s Fairness Index.',
      actionLabel: 'Open Comparative Benchmark',
      execute: () => {
        onNavigateTab('comparison');
      },
    },
  ];

  return (
    <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              College Professor Guided Demonstration Mode
            </h3>
            <p className="text-xs text-slate-400">
              Interactive 6-step walkthrough demonstrating the reverse engineering and enhancement of CoSiCoSt.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <span>Step {currentStep} of {steps.length}</span>
        </div>
      </div>

      {/* Step Stepper Progress Bar */}
      <div className="grid grid-cols-6 gap-2 my-5">
        {steps.map((s) => {
          const isDone = s.step < currentStep;
          const isCurrent = s.step === currentStep;

          return (
            <button
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={`p-2 rounded-xl text-left border transition ${
                isCurrent
                  ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                  : isDone
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                  : 'border-slate-800 bg-slate-900/40 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span>0{s.step}</span>
                {isDone && <CheckCircle className="w-3 h-3 text-emerald-400" />}
              </div>
              <div className="text-[11px] font-semibold truncate mt-1">{s.title.split(':')[1]}</div>
            </button>
          );
        })}
      </div>

      {/* Active Step Card */}
      {(() => {
        const active = steps[currentStep - 1];
        return (
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="text-xs font-bold text-cyan-400 uppercase font-mono">{active.title}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{active.desc}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  active.execute();
                  if (currentStep < steps.length) {
                    setCurrentStep((prev) => prev + 1);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition"
              >
                <span>{active.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
