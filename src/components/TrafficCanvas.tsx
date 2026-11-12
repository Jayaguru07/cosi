'use client';

import React, { useRef, useEffect, useState } from 'react';
import { TrafficSimulationEngine } from '@/simulation/engine';
import { Approach, Vehicle, VEHICLE_SPECS, SignalColor } from '@/types/traffic';
import { Info } from 'lucide-react';

interface TrafficCanvasProps {
  engine: TrafficSimulationEngine;
  tickCounter: number; // forces re-render/sync when state updates
}

export const TrafficCanvas: React.FC<TrafficCanvasProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredVehicle, setHoveredVehicle] = useState<Vehicle | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const roadWidth = 140; // width of road (70px per direction, 35px per lane)
      const halfRoad = roadWidth / 2;

      const state = engine.getSnapshot();
      const { signalState, vehicles } = state;
      const isBaseline = state.controllerType === 'baseline';

      // Clear Canvas (Surrounding terrain / cityscape)
      ctx.fillStyle = '#0f172a'; // dark navy background
      ctx.fillRect(0, 0, width, height);

      // Grid landscape effect
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Corner Sidewalks / Curbs
      ctx.fillStyle = '#1e293b';
      // Top-Left corner block
      ctx.fillRect(0, 0, centerX - halfRoad, centerY - halfRoad);
      // Top-Right corner block
      ctx.fillRect(centerX + halfRoad, 0, width - (centerX + halfRoad), centerY - halfRoad);
      // Bottom-Left corner block
      ctx.fillRect(0, centerY + halfRoad, centerX - halfRoad, height - (centerY + halfRoad));
      // Bottom-Right corner block
      ctx.fillRect(centerX + halfRoad, centerY + halfRoad, width - (centerX + halfRoad), height - (centerY + halfRoad));

      // Draw Sidewalk curb borders
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, centerX - halfRoad, centerY - halfRoad);
      ctx.strokeRect(centerX + halfRoad, 0, width - (centerX + halfRoad), centerY - halfRoad);
      ctx.strokeRect(0, centerY + halfRoad, centerX - halfRoad, height - (centerY + halfRoad));
      ctx.strokeRect(centerX + halfRoad, centerY + halfRoad, width - (centerX + halfRoad), height - (centerY + halfRoad));

      // Draw Roads (Asphalt)
      ctx.fillStyle = '#0b0f19'; // deep asphalt
      // North-South road
      ctx.fillRect(centerX - halfRoad, 0, roadWidth, height);
      // East-West road
      ctx.fillRect(0, centerY - halfRoad, width, roadWidth);

      // Draw Road Markings
      // Central Yellow Divider Line (Double solid)
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      // North road divider
      ctx.beginPath();
      ctx.moveTo(centerX - 1.5, 0);
      ctx.lineTo(centerX - 1.5, centerY - halfRoad - 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + 1.5, 0);
      ctx.lineTo(centerX + 1.5, centerY - halfRoad - 20);
      ctx.stroke();

      // South road divider
      ctx.beginPath();
      ctx.moveTo(centerX - 1.5, centerY + halfRoad + 20);
      ctx.lineTo(centerX - 1.5, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + 1.5, centerY + halfRoad + 20);
      ctx.lineTo(centerX + 1.5, height);
      ctx.stroke();

      // West road divider
      ctx.beginPath();
      ctx.moveTo(0, centerY - 1.5);
      ctx.lineTo(centerX - halfRoad - 20, centerY - 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, centerY + 1.5);
      ctx.lineTo(centerX - halfRoad - 20, centerY + 1.5);
      ctx.stroke();

      // East road divider
      ctx.beginPath();
      ctx.moveTo(centerX + halfRoad + 20, centerY - 1.5);
      ctx.lineTo(width, centerY - 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + halfRoad + 20, centerY + 1.5);
      ctx.lineTo(width, centerY + 1.5);
      ctx.stroke();

      // Lane separator dashed white lines (35px from edge)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);

      // North incoming & outgoing lane dividers
      ctx.beginPath();
      ctx.moveTo(centerX - 35, 0);
      ctx.lineTo(centerX - 35, centerY - halfRoad - 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + 35, 0);
      ctx.lineTo(centerX + 35, centerY - halfRoad - 20);
      ctx.stroke();

      // South incoming & outgoing lane dividers
      ctx.beginPath();
      ctx.moveTo(centerX - 35, centerY + halfRoad + 20);
      ctx.lineTo(centerX - 35, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + 35, centerY + halfRoad + 20);
      ctx.lineTo(centerX + 35, height);
      ctx.stroke();

      // West incoming & outgoing lane dividers
      ctx.beginPath();
      ctx.moveTo(0, centerY - 35);
      ctx.lineTo(centerX - halfRoad - 20, centerY - 35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, centerY + 35);
      ctx.lineTo(centerX - halfRoad - 20, centerY + 35);
      ctx.stroke();

      // East incoming & outgoing lane dividers
      ctx.beginPath();
      ctx.moveTo(centerX + halfRoad + 20, centerY - 35);
      ctx.lineTo(width, centerY - 35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + halfRoad + 20, centerY + 35);
      ctx.lineTo(width, centerY + 35);
      ctx.stroke();

      ctx.setLineDash([]); // Reset line dash

      // Crosswalks / Zebra Markings
      const drawCrosswalk = (startX: number, startY: number, w: number, h: number, horizontal: boolean) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        if (horizontal) {
          const count = 10;
          const barW = w / (count * 2);
          for (let i = 0; i < count; i++) {
            ctx.fillRect(startX + i * barW * 2, startY, barW, h);
          }
        } else {
          const count = 10;
          const barH = h / (count * 2);
          for (let i = 0; i < count; i++) {
            ctx.fillRect(startX, startY + i * barH * 2, w, barH);
          }
        }
      };

      // North crosswalk
      drawCrosswalk(centerX - halfRoad, centerY - halfRoad - 18, roadWidth, 14, true);
      // South crosswalk
      drawCrosswalk(centerX - halfRoad, centerY + halfRoad + 4, roadWidth, 14, true);
      // West crosswalk
      drawCrosswalk(centerX - halfRoad - 18, centerY - halfRoad, 14, roadWidth, false);
      // East crosswalk
      drawCrosswalk(centerX + halfRoad + 4, centerY - halfRoad, 14, roadWidth, false);

      // Stop Lines with Reactive Light Signal Bar
      const drawStopLine = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: SignalColor,
        approach: string
      ) => {
        ctx.save();
        const isRed = color === 'red';
        const isYellow = color === 'yellow';

        // Glowing stop line bar
        ctx.strokeStyle = isRed ? '#ef4444' : isYellow ? '#f59e0b' : '#22c55e';
        ctx.lineWidth = isRed ? 4 : isYellow ? 3.5 : 3;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = isRed ? 12 : isYellow ? 8 : 10;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Label on the road stop line
        ctx.fillStyle = isRed ? '#ef4444' : isYellow ? '#f59e0b' : '#22c55e';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        if (approach === 'north') ctx.fillText(isRed ? '⛔ RED STOP' : '🟢 GREEN', midX, midY - 6);
        else if (approach === 'south') ctx.fillText(isRed ? '⛔ RED STOP' : '🟢 GREEN', midX, midY + 12);
        else if (approach === 'east') ctx.fillText(isRed ? '⛔ STOP' : '🟢 GO', midX + 16, midY - 4);
        else if (approach === 'west') ctx.fillText(isRed ? '⛔ STOP' : '🟢 GO', midX - 16, midY + 10);
        ctx.restore();
      };

      // North incoming stop line (East side of North road)
      drawStopLine(centerX, centerY - halfRoad - 20, centerX + halfRoad, centerY - halfRoad - 20, signalState.signals.north, 'north');
      // South incoming stop line (West side of South road)
      drawStopLine(centerX - halfRoad, centerY + halfRoad + 20, centerX, centerY + halfRoad + 20, signalState.signals.south, 'south');
      // East incoming stop line (North side of East road)
      drawStopLine(centerX + halfRoad + 20, centerY - halfRoad, centerX + halfRoad + 20, centerY, signalState.signals.east, 'east');
      // West incoming stop line (South side of West road)
      drawStopLine(centerX - halfRoad - 20, centerY, centerX - halfRoad - 20, centerY + halfRoad, signalState.signals.west, 'west');

      // Draw Upright, High-Visibility Traffic Signals Gantries
      const drawTrafficLight = (
        x: number,
        y: number,
        color: SignalColor,
        approachName: string
      ) => {
        ctx.save();
        ctx.translate(x, y);

        // Signal Housing (Always upright: 24px wide, 58px tall)
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-12, -29, 24, 58, 5);
        ctx.fill();
        ctx.stroke();

        // 3 Vertical Lamps: Red (top: -18), Yellow (middle: 0), Green (bottom: +18)
        const lamps: { c: SignalColor; y: number; activeHex: string }[] = [
          { c: 'red', y: -18, activeHex: '#ef4444' },
          { c: 'yellow', y: 0, activeHex: '#f59e0b' },
          { c: 'green', y: 18, activeHex: '#22c55e' },
        ];

        lamps.forEach((lamp) => {
          ctx.beginPath();
          ctx.arc(0, lamp.y, 6, 0, Math.PI * 2);
          if (color === lamp.c) {
            ctx.fillStyle = lamp.activeHex;
            ctx.shadowColor = lamp.activeHex;
            ctx.shadowBlur = 14;
            ctx.fill();
            ctx.shadowBlur = 0;
            // Hotspot center
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, lamp.y, 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.fill();
          }
        });

        // Approach Name and State Tag
        const badgeColor = color === 'red' ? '#ef4444' : color === 'yellow' ? '#f59e0b' : '#22c55e';
        ctx.fillStyle = badgeColor;
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${approachName.substring(0, 1)}:${color.substring(0, 3).toUpperCase()}`, 0, 40);

        ctx.restore();
      };

      // North Signal (right at North incoming stop line on East curb)
      drawTrafficLight(centerX + halfRoad + 22, centerY - halfRoad - 20, signalState.signals.north, 'North');
      // South Signal (right at South incoming stop line on West curb)
      drawTrafficLight(centerX - halfRoad - 22, centerY + halfRoad + 20, signalState.signals.south, 'South');
      // East Signal (right at East incoming stop line on North curb)
      drawTrafficLight(centerX + halfRoad + 20, centerY - halfRoad - 35, signalState.signals.east, 'East');
      // West Signal (right at West incoming stop line on South curb)
      drawTrafficLight(centerX - halfRoad - 20, centerY + halfRoad + 35, signalState.signals.west, 'West');

      // Draw Center Junction Status Halo
      const isGreenNS = signalState.activePhase === 'NS_THROUGH' && signalState.machineState === 'GREEN';
      const isGreenEW = signalState.activePhase === 'EW_THROUGH' && signalState.machineState === 'GREEN';

      ctx.save();
      if (isGreenNS) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
        ctx.fillRect(centerX - halfRoad, centerY - halfRoad, roadWidth, roadWidth);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - halfRoad, centerY - halfRoad, roadWidth, roadWidth);
      } else if (isGreenEW) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
        ctx.fillRect(centerX - halfRoad, centerY - halfRoad, roadWidth, roadWidth);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - halfRoad, centerY - halfRoad, roadWidth, roadWidth);
      } else {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
        ctx.fillRect(centerX - halfRoad, centerY - halfRoad, roadWidth, roadWidth);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - halfRoad, centerY - halfRoad, roadWidth, roadWidth);
      }
      ctx.restore();

      // Render Vehicles
      // Calculate pixel coordinates from approach and distanceToStopLine
      // Stop line positions:
      // North stop line: y = centerY - halfRoad - 20 (travels +y downward)
      // South stop line: y = centerY + halfRoad + 20 (travels -y upward)
      // East stop line:  x = centerX + halfRoad + 20 (travels -x leftward)
      // West stop line:  x = centerX - halfRoad - 20 (travels +x rightward)
      const stopLineDistPx = (distMeters: number) => distMeters * 3.5; // 3.5 pixels per meter scale

      let hovered: Vehicle | null = null;

      vehicles.forEach((v) => {
        const spec = VEHICLE_SPECS[v.type];
        const vLenPx = spec.lengthMeters * 3.5;
        const vWidthPx = spec.widthMeters * 3.5;
        const laneOffset = v.lane === 0 ? 16 : 48; // offset from road center line

        let vx = 0;
        let vy = 0;
        let angleDeg = 0;

        if (v.approach === 'north') {
          // Moves downward (+y)
          vx = centerX + laneOffset;
          vy = centerY - halfRoad - 20 - stopLineDistPx(v.distanceToStopLine);
          angleDeg = 180;
        } else if (v.approach === 'south') {
          // Moves upward (-y)
          vx = centerX - laneOffset;
          vy = centerY + halfRoad + 20 + stopLineDistPx(v.distanceToStopLine);
          angleDeg = 0;
        } else if (v.approach === 'east') {
          // Moves leftward (-x)
          vx = centerX + halfRoad + 20 + stopLineDistPx(v.distanceToStopLine);
          vy = centerY - laneOffset;
          angleDeg = 270;
        } else if (v.approach === 'west') {
          // Moves rightward (+x)
          vx = centerX - halfRoad - 20 - stopLineDistPx(v.distanceToStopLine);
          vy = centerY + laneOffset;
          angleDeg = 90;
        }

        // Check if mouse hovers over this vehicle
        if (mousePos) {
          const dx = mousePos.x - vx;
          const dy = mousePos.y - vy;
          if (Math.sqrt(dx * dx + dy * dy) < Math.max(vLenPx, vWidthPx)) {
            hovered = v;
          }
        }

        // Draw vehicle body
        ctx.save();
        ctx.translate(vx, vy);
        ctx.rotate((angleDeg * Math.PI) / 180);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(-vWidthPx / 2 + 1, -vLenPx / 2 + 2, vWidthPx, vLenPx);

        // Body Shape based on class
        ctx.fillStyle = spec.color;
        ctx.strokeStyle = spec.accentColor;
        ctx.lineWidth = 1;

        if (v.type === 'motorcycle') {
          // Slim chassis + wheels
          ctx.beginPath();
          ctx.roundRect(-vWidthPx / 2, -vLenPx / 2, vWidthPx, vLenPx, 2);
          ctx.fill();
          ctx.stroke();

          // Rider helmet
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Headlight
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(0, vLenPx / 2 - 1, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (v.type === 'auto') {
          // Tapered cabin + green roof
          ctx.beginPath();
          ctx.roundRect(-vWidthPx / 2, -vLenPx / 2, vWidthPx, vLenPx, 3);
          ctx.fill();
          ctx.stroke();

          // Roof top canvas
          ctx.fillStyle = spec.accentColor;
          ctx.fillRect(-vWidthPx / 2 + 1, -vLenPx / 2 + 3, vWidthPx - 2, vLenPx - 6);

          // Headlight
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-1.5, vLenPx / 2 - 2, 3, 2);
        } else if (v.type === 'car') {
          // Sedan / Hatchback with windshield
          ctx.beginPath();
          ctx.roundRect(-vWidthPx / 2, -vLenPx / 2, vWidthPx, vLenPx, 3);
          ctx.fill();
          ctx.stroke();

          // Windshields (front and rear)
          ctx.fillStyle = '#0f172a';
          // Front windshield
          ctx.fillRect(-vWidthPx / 2 + 1.5, vLenPx / 2 - 5, vWidthPx - 3, 2.5);
          // Rear window
          ctx.fillRect(-vWidthPx / 2 + 1.5, -vLenPx / 2 + 2.5, vWidthPx - 3, 2);

          // Headlights
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-vWidthPx / 2 + 1, vLenPx / 2 - 1.5, 2, 1.5);
          ctx.fillRect(vWidthPx / 2 - 3, vLenPx / 2 - 1.5, 2, 1.5);
        } else if (v.type === 'bus') {
          // Large commuter bus
          ctx.beginPath();
          ctx.roundRect(-vWidthPx / 2, -vLenPx / 2, vWidthPx, vLenPx, 4);
          ctx.fill();
          ctx.stroke();

          // Passenger window strips
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-vWidthPx / 2 + 1, -vLenPx / 2 + 5, 2, vLenPx - 10);
          ctx.fillRect(vWidthPx / 2 - 3, -vLenPx / 2 + 5, 2, vLenPx - 10);

          // Roof vents
          ctx.fillStyle = spec.accentColor;
          ctx.fillRect(-2, -5, 4, 10);

          // Front Destination Board
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-vWidthPx / 2 + 2, vLenPx / 2 - 3, vWidthPx - 4, 2);
        } else if (v.type === 'truck') {
          // Heavy freight truck (Cab + Cargo Container)
          ctx.beginPath();
          ctx.roundRect(-vWidthPx / 2, -vLenPx / 2, vWidthPx, vLenPx, 2);
          ctx.fill();
          ctx.stroke();

          // Driver Cab
          ctx.fillStyle = spec.accentColor;
          ctx.fillRect(-vWidthPx / 2 + 1, vLenPx / 2 - 6, vWidthPx - 2, 5);

          // Cargo Container ribs
          ctx.strokeStyle = '#7c2d12';
          ctx.lineWidth = 1;
          for (let r = -vLenPx / 2 + 4; r < vLenPx / 2 - 8; r += 5) {
            ctx.beginPath();
            ctx.moveTo(-vWidthPx / 2 + 2, r);
            ctx.lineTo(vWidthPx / 2 - 2, r);
            ctx.stroke();
          }
        }

        // Rear Brake Lights (bright red twin LEDs when stopped or waiting on red)
        const appSignal = signalState.signals[v.approach];
        const isBraking = v.speed < 1.0 || (!v.hasCrossedStopLine && appSignal !== 'green');
        if (isBraking) {
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 6;
          ctx.fillRect(-vWidthPx / 2 + 0.5, -vLenPx / 2 - 1.5, Math.max(2, vWidthPx * 0.25), 2);
          ctx.fillRect(vWidthPx / 2 - Math.max(2, vWidthPx * 0.25) - 0.5, -vLenPx / 2 - 1.5, Math.max(2, vWidthPx * 0.25), 2);
          ctx.shadowBlur = 0;
        } else if (v.speed > 1.0) {
          // Front Headlight Beams (soft bright light cones when moving through green)
          ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
          ctx.beginPath();
          ctx.moveTo(-vWidthPx / 2, vLenPx / 2);
          ctx.lineTo(-vWidthPx / 2 - 3, vLenPx / 2 + 12);
          ctx.lineTo(vWidthPx / 2 + 3, vLenPx / 2 + 12);
          ctx.lineTo(vWidthPx / 2, vLenPx / 2);
          ctx.closePath();
          ctx.fill();
        }

        // Waiting time indicator ring and Starvation Warning
        const isStarving = v.waitingTime >= state.controllerConfig.maxWaitThreshold;

        // Bus capacity awareness tag
        if (v.type === 'bus' && v.isQueued) {
          ctx.save();
          if (isBaseline) {
            // Baseline flaw: Bus treated as solo scooter
            ctx.fillStyle = '#fca5a5';
            ctx.font = 'bold 8px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('1x Wt (50 Pax Ignored)', 0, vLenPx / 2 + 8);
          } else {
            // Enhanced fix: Bus given 5x PCU priority
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(vLenPx, vWidthPx) / 2 + 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#67e8f9';
            ctx.font = 'bold 8px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✨ 5x PCU (50 Pax Priority)', 0, vLenPx / 2 + 8);
          }
          ctx.restore();
        }

        if (isStarving) {
          if (isBaseline) {
            // Pulsing Red Starvation Halo in Baseline
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(vLenPx, vWidthPx) / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Starvation text tag
            ctx.fillStyle = '#fca5a5';
            ctx.font = 'bold 8px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`🚨 STARVED ${v.waitingTime.toFixed(0)}s (Flaw)`, 0, -vLenPx / 2 - 6);
          } else {
            // Rescuing halo in My System
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(vLenPx, vWidthPx) / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#6ee7b7';
            ctx.font = 'bold 8px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`⚡ RESCUING ${v.waitingTime.toFixed(0)}s`, 0, -vLenPx / 2 - 6);
          }
        } else if (v.waitingTime >= state.controllerConfig.maxWaitThreshold * 0.7) {
          // Approaching Starvation (Amber Halo)
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(vLenPx, vWidthPx) / 2 + 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      });

      setHoveredVehicle(hovered);

      // Approach Informational Overlay Badges
      const drawApproachBadge = (
        app: Approach,
        label: string,
        bx: number,
        by: number,
        qCount: number,
        rate: number
      ) => {
        const appMetric = engine.getApproachMetrics(app);
        const appSignal = signalState.signals[app];
        const isGreen = appSignal === 'green';
        const hasStarvation = appMetric.maxWaitTime >= state.controllerConfig.maxWaitThreshold;

        ctx.save();
        ctx.fillStyle = hasStarvation
          ? 'rgba(69, 10, 10, 0.95)'
          : isGreen
          ? 'rgba(6, 78, 59, 0.92)'
          : 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = hasStarvation
          ? '#ef4444'
          : isGreen
          ? '#22c55e'
          : qCount > 15
          ? '#f59e0b'
          : '#3b82f6';
        ctx.lineWidth = hasStarvation ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.roundRect(bx - 70, by - 18, 140, 36, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = hasStarvation ? '#fca5a5' : isGreen ? '#86efac' : '#f8fafc';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${label} ${isGreen ? '🟢 GREEN' : '🔴 RED'}`, bx, by - 4);

        ctx.fillStyle = hasStarvation ? '#f87171' : isGreen ? '#4ade80' : '#94a3b8';
        ctx.font = hasStarvation ? 'bold 10px Inter, sans-serif' : '10px Inter, sans-serif';
        ctx.fillText(
          hasStarvation
            ? isBaseline
              ? `🚨 STARVED (${appMetric.maxWaitTime.toFixed(0)}s) [CURRENT FLAW]`
              : `⚡ RESCUED (${appMetric.maxWaitTime.toFixed(0)}s) [MY SYSTEM FIX]`
            : isGreen
            ? `Flowing | Queue: ${qCount}`
            : `Wait: ${appMetric.maxWaitTime.toFixed(0)}s | Q: ${qCount}`,
          bx,
          by + 11
        );
        ctx.restore();
      };

      const qN = engine.getQueuedVehicles('north').length;
      const qS = engine.getQueuedVehicles('south').length;
      const qE = engine.getQueuedVehicles('east').length;
      const qW = engine.getQueuedVehicles('west').length;

      const rateN = state.approachConfigs.north.arrivalRatePerMin;
      const rateS = state.approachConfigs.south.arrivalRatePerMin;
      const rateE = state.approachConfigs.east.arrivalRatePerMin;
      const rateW = state.approachConfigs.west.arrivalRatePerMin;

      // Draw Badges
      drawApproachBadge('north', 'North Approach', centerX + 110, 30, qN, rateN);
      drawApproachBadge('south', 'South Approach', centerX - 110, height - 30, qS, rateS);
      drawApproachBadge('east', 'East Approach', width - 75, centerY - 80, qE, rateE);
      drawApproachBadge('west', 'West Approach', 75, centerY + 80, qW, rateW);

      // Center Green Phase Banner
      ctx.save();
      const currentActiveLabel =
        signalState.machineState === 'GREEN'
          ? `${signalState.activePhase === 'NS_THROUGH' ? 'NORTH-SOUTH' : 'EAST-WEST'} GREEN`
          : signalState.machineState === 'YELLOW'
          ? 'YELLOW TRANSITION'
          : 'ALL-RED CLEARANCE';

      const bannerColor =
        signalState.machineState === 'GREEN'
          ? '#22c55e'
          : signalState.machineState === 'YELLOW'
          ? '#f59e0b'
          : '#ef4444';

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = bannerColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(centerX - 95, centerY - 18, 190, 36, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = bannerColor;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(currentActiveLabel, centerX, centerY - 2);

      const remainingTime = Math.max(0, signalState.targetDuration - signalState.timeInCurrentState);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`Remaining: ${remainingTime.toFixed(0)}s / ${signalState.targetDuration}s`, centerX, centerY + 11);
      ctx.restore();

      // Draw Top Ribbon Across Canvas indicating Current System vs My System
      const isBaselineMode = state.controllerType === 'baseline';
      ctx.save();
      ctx.fillStyle = isBaselineMode ? 'rgba(30, 41, 59, 0.94)' : 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = isBaselineMode ? '#e11d48' : '#059669';
      ctx.lineWidth = 1;
      ctx.fillRect(0, 0, width, 24);
      ctx.beginPath();
      ctx.moveTo(0, 24);
      ctx.lineTo(width, 24);
      ctx.stroke();

      ctx.fillStyle = isBaselineMode ? '#fda4af' : '#a7f3d0';
      ctx.font = '600 10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        isBaselineMode
          ? 'Conventional CoSiCoSt Mode: Arterial Volume Bias • Cross-Street Starvation Risk'
          : 'Our Adaptive PCU Solution: Passenger Priority • 30s Anti-Starvation Ceiling Active',
        14,
        16
      );

      ctx.fillStyle = isBaselineMode ? '#f43f5e' : '#10b981';
      ctx.font = '500 9px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(
        isBaselineMode ? 'Mode: Conventional Baseline' : 'Mode: Adaptive Solution',
        width - 14,
        16
      );
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [engine, mousePos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    setMousePos({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoveredVehicle(null);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-900/80 shadow-2xl backdrop-blur-md">
      {/* Top Header info */}
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
            Live Four-Way Mixed Traffic Junction
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            Indian Mixed Fleet
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Bike (1.0)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400" /> Auto (2.0)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Car (2.0)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-500" /> Bus (5.0)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> Truck (6.0)
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full aspect-[16/10] max-h-[580px] flex items-center justify-center bg-slate-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full object-contain cursor-crosshair"
        />

        {/* Vehicle Hover Tooltip */}
        {hoveredVehicle && mousePos && (
          <div
            className="absolute z-20 pointer-events-none px-3 py-2 rounded-lg bg-slate-900/95 border border-cyan-500/50 shadow-xl text-xs text-slate-200"
            style={{
              left: `${(mousePos.x / 800) * 100}%`,
              top: `${(mousePos.y / 500) * 100}%`,
              transform: 'translate(12px, -50%)',
            }}
          >
            <div className="font-semibold text-cyan-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              {VEHICLE_SPECS[hoveredVehicle.type].label} ({hoveredVehicle.id})
            </div>
            <div className="mt-1 space-y-0.5 text-slate-300">
              <div>Approach: <span className="capitalize font-mono">{hoveredVehicle.approach}</span></div>
              <div>PCU Weight: <span className="font-mono text-amber-400">{VEHICLE_SPECS[hoveredVehicle.type].weight}</span></div>
              <div>Waiting Time: <span className="font-mono text-emerald-400">{hoveredVehicle.waitingTime.toFixed(1)}s</span></div>
              <div>Distance to line: <span className="font-mono">{hoveredVehicle.distanceToStopLine.toFixed(1)}m</span></div>
              <div>Speed: <span className="font-mono">{(hoveredVehicle.speed * 3.6).toFixed(1)} km/h</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sub-bar */}
      <div className="px-5 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-slate-300 font-medium">Junction Scale:</span> 1m = 3.5px | Clearance: 25m
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>Move mouse over vehicles to inspect PCU weight & waiting duration</span>
        </div>
      </div>
    </div>
  );
};
