'use client';

import React, { useState } from 'react';
import { TrafficSimulationEngine } from '@/simulation/engine';
import { Approach, VehicleType, VehicleComposition, ApproachConfig } from '@/types/traffic';
import { DEFAULT_COMPOSITION } from '@/simulation/presets';
import { Plus, Minus, Sliders, History, AlertTriangle, CheckCircle } from 'lucide-react';

interface VehicleControlPanelProps {
  engine: TrafficSimulationEngine;
  onStateChange: () => void;
}

export const VehicleControlPanel: React.FC<VehicleControlPanelProps> = ({ engine, onStateChange }) => {
  const [selectedApproach, setSelectedApproach] = useState<Approach>('south');
  const [activeTab, setActiveTab] = useState<'counts' | 'composition' | 'log'>('counts');

  const snapshot = engine.getSnapshot();
  const approaches: Approach[] = ['north', 'south', 'east', 'west'];
  const currentConfig: ApproachConfig = snapshot.approachConfigs[selectedApproach];
  const queuedVehicles = engine.getQueuedVehicles(selectedApproach);

  // Composition validation
  const comp = currentConfig.composition;
  const compSum = comp.motorcycle + comp.auto + comp.car + comp.bus + comp.truck;
  const isCompValid = Math.abs(compSum - 100) < 0.1;

  const handleAdjustCount = (app: Approach, action: 'add_1' | 'add_5' | 'add_10' | 'remove_1' | 'set_exact', val?: number) => {
    engine.adjustVehicleCount(app, action, val);
    onStateChange();
  };

  const handleArrivalRateChange = (app: Approach, rate: number) => {
    engine.setArrivalRate(app, rate);
    onStateChange();
  };

  const handleCompositionChange = (type: VehicleType, value: number) => {
    const updated = { ...currentConfig.composition, [type]: Math.max(0, Math.min(100, value)) };
    engine.setComposition(selectedApproach, updated);
    onStateChange();
  };

  const applyCompositionPreset = (presetName: keyof typeof DEFAULT_COMPOSITION) => {
    const preset = DEFAULT_COMPOSITION[presetName];
    if (preset) {
      engine.setComposition(selectedApproach, { ...preset });
      onStateChange();
    }
  };

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
            Traffic Demand & Queue Controls
          </h3>
        </div>
        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('counts')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              activeTab === 'counts'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Queue & Arrival
          </button>
          <button
            onClick={() => setActiveTab('composition')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              activeTab === 'composition'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vehicle Mix
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              activeTab === 'log'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Adjustment Log
          </button>
        </div>
      </div>

      {/* Approach Selector Buttons */}
      <div className="grid grid-cols-4 gap-2 p-3 bg-slate-950/50 border-b border-slate-800/80 text-xs">
        {approaches.map((app) => {
          const count = engine.getQueuedVehicles(app).length;
          const rate = snapshot.approachConfigs[app].arrivalRatePerMin;
          const isSelected = selectedApproach === app;

          return (
            <button
              key={app}
              onClick={() => setSelectedApproach(app)}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200 shadow-md ring-1 ring-cyan-500/30'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className="font-semibold uppercase tracking-wider text-[11px]">{app} Approach</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                    count > 25
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : count > 10
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {count} queued
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{rate} veh/min</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Queue & Arrival Controls */}
      {activeTab === 'counts' && (
        <div className="p-5 space-y-6">
          {/* Live Count and Quick Increment Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Queued Vehicles on <span className="capitalize text-cyan-400">{selectedApproach}</span>
              </label>
              <span className="text-xs font-mono text-slate-400">
                Currently waiting: <strong className="text-slate-100 text-sm">{queuedVehicles.length}</strong>
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <button
                onClick={() => handleAdjustCount(selectedApproach, 'add_1')}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-medium flex items-center justify-center gap-1.5 text-xs transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> +1 Vehicle
              </button>
              <button
                onClick={() => handleAdjustCount(selectedApproach, 'add_5')}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-medium flex items-center justify-center gap-1.5 text-xs transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> +5 Vehicles
              </button>
              <button
                onClick={() => handleAdjustCount(selectedApproach, 'add_10')}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-200 border border-slate-700 font-medium flex items-center justify-center gap-1.5 text-xs transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> +10 Vehicles
              </button>
              <button
                onClick={() => handleAdjustCount(selectedApproach, 'remove_1')}
                disabled={queuedVehicles.length === 0}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-700 font-medium flex items-center justify-center gap-1.5 text-xs transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="w-3.5 h-3.5" /> -1 Vehicle
              </button>
            </div>

            {/* Slider and Exact Number Input */}
            <div className="flex items-center gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <input
                type="range"
                min="0"
                max="100"
                value={queuedVehicles.length}
                onChange={(e) => handleAdjustCount(selectedApproach, 'set_exact', Number(e.target.value))}
                className="flex-1 accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Exact:</span>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={queuedVehicles.length}
                  onChange={(e) => handleAdjustCount(selectedApproach, 'set_exact', Number(e.target.value))}
                  className="w-16 px-2.5 py-1 text-center bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Live updates: vehicles insert at queue tail without collision or resetting the running simulation.
            </p>
          </div>

          {/* Continuous Arrival Rate Control */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Continuous Arrival Rate (Vehicles / Minute)
              </label>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                {currentConfig.arrivalRatePerMin} veh/min
              </span>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={currentConfig.arrivalRatePerMin}
                onChange={(e) => handleArrivalRateChange(selectedApproach, Number(e.target.value))}
                className="flex-1 accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={currentConfig.arrivalRatePerMin}
                  onChange={(e) => handleArrivalRateChange(selectedApproach, Number(e.target.value))}
                  className="w-16 px-2.5 py-1 text-center bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400">v/m</span>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {[5, 12, 20, 35].map((presetVal) => (
                <button
                  key={presetVal}
                  onClick={() => handleArrivalRateChange(selectedApproach, presetVal)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 font-mono transition"
                >
                  {presetVal} v/m
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Vehicle Composition */}
      {activeTab === 'composition' && (
        <div className="p-5 space-y-5">
          {/* Preset Profile Selection */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
              Fleet Composition Preset
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyCompositionPreset('indian_mixed')}
                className="p-2 text-left rounded-lg border border-slate-700 bg-slate-800/80 hover:border-cyan-500 text-xs transition"
              >
                <div className="font-semibold text-slate-200">Indian Mixed Traffic</div>
                <div className="text-[10px] text-slate-400">40% Bike, 20% Auto, 25% Car, 15% Heavy</div>
              </button>
              <button
                onClick={() => applyCompositionPreset('mostly_two_wheelers')}
                className="p-2 text-left rounded-lg border border-slate-700 bg-slate-800/80 hover:border-cyan-500 text-xs transition"
              >
                <div className="font-semibold text-slate-200">Mostly Two-Wheelers</div>
                <div className="text-[10px] text-slate-400">65% Two-Wheelers, 15% Auto, 20% Other</div>
              </button>
              <button
                onClick={() => applyCompositionPreset('passenger_cars')}
                className="p-2 text-left rounded-lg border border-slate-700 bg-slate-800/80 hover:border-cyan-500 text-xs transition"
              >
                <div className="font-semibold text-slate-200">Passenger Cars</div>
                <div className="text-[10px] text-slate-400">60% Cars, 20% Bike, 10% Auto, 10% Heavy</div>
              </button>
              <button
                onClick={() => applyCompositionPreset('heavy_vehicles')}
                className="p-2 text-left rounded-lg border border-slate-700 bg-slate-800/80 hover:border-cyan-500 text-xs transition"
              >
                <div className="font-semibold text-slate-200">Heavy Freight Corridor</div>
                <div className="text-[10px] text-slate-400">50% Bus & Truck (High PCU demand)</div>
              </button>
            </div>
          </div>

          {/* Validation Header */}
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Fleet Percentage Sum:</span>
            <div className="flex items-center gap-1.5">
              {isCompValid ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span className={`font-mono font-bold ${isCompValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {compSum}% {isCompValid ? '(Valid 100%)' : '(Must total 100%)'}
              </span>
            </div>
          </div>

          {/* Detailed Sliders for 5 classes */}
          <div className="space-y-3">
            {[
              { type: 'motorcycle' as VehicleType, label: 'Motorcycles / Two-Wheelers (PCU: 1.0)', color: 'accent-cyan-400', tagColor: 'text-cyan-400' },
              { type: 'auto' as VehicleType, label: 'Auto-Rickshaws (PCU: 2.0)', color: 'accent-yellow-400', tagColor: 'text-yellow-400' },
              { type: 'car' as VehicleType, label: 'Passenger Cars (PCU: 2.0)', color: 'accent-blue-500', tagColor: 'text-blue-400' },
              { type: 'bus' as VehicleType, label: 'Public Transit Buses (PCU: 5.0)', color: 'accent-pink-500', tagColor: 'text-pink-400' },
              { type: 'truck' as VehicleType, label: 'Heavy Trucks & Freight (PCU: 6.0)', color: 'accent-orange-500', tagColor: 'text-orange-400' },
            ].map((item) => (
              <div key={item.type} className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className={`font-medium ${item.tagColor}`}>{item.label}</span>
                  <span className="font-mono text-slate-100 font-bold">{comp[item.type]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={comp[item.type]}
                  onChange={(e) => handleCompositionChange(item.type, Number(e.target.value))}
                  className={`w-full ${item.color} h-1.5 bg-slate-800 rounded cursor-pointer`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Adjustment Log */}
      {activeTab === 'log' && (
        <div className="p-4 space-y-2 max-h-[360px] overflow-y-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail of Manual Interventions during Simulation</span>
          </div>

          {snapshot.adjustmentLog.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs italic">
              No manual vehicle adjustments made yet.
            </div>
          ) : (
            snapshot.adjustmentLog.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-cyan-400 font-semibold uppercase mr-2">{log.approach}</span>
                  <span className="text-slate-300">
                    Action: <span className="font-mono text-slate-100">{log.adjustmentType}</span>
                  </span>
                  <span className="text-slate-500 ml-2 font-mono">
                    ({log.previousCount} → {log.newCount})
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">t={log.timestamp.toFixed(0)}s</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
