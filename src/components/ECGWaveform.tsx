/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface ECGWaveformProps {
  type: 'ECG' | 'Glucose' | 'Capnography' | 'Pulse';
  rate: number; // heart rate or respiratory rate or pulse
  statusColor: string; // Tailwind hex color or similar (e.g. '#22c55e')
  isCritical: boolean;
}

export default function ECGWaveform({
  type,
  rate,
  statusColor = '#22c55e',
  isCritical = false,
}: ECGWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width;
    let height = canvas.height;

    // Handle high DPI screens
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    
    const resize = () => {
      if (!canvas || !parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight || 120;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (parent) observer.observe(parent);

    let x = 0;
    const points: number[] = new Array(Math.ceil(width)).fill(height / 2);
    let cycleTime = 0;

    // Pulse settings
    // Normalize cycle rate
    const beatsPerSec = Math.max(30, Math.min(180, rate)) / 60;
    const framesPerBeat = 60 / beatsPerSec;

    const tick = () => {
      if (!ctx || !canvas) return;

      // Draw black grid background with high tech cyber grid lines
      ctx.fillStyle = '#050608'; // deep dark blue-black md tone
      ctx.fillRect(0, 0, width, height);

      // Grid helper lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let gridX = 0; gridX < width; gridX += 30) {
        ctx.beginPath();
        ctx.moveTo(gridX, 0);
        ctx.lineTo(gridX, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let gridY = 0; gridY < height; gridY += 20) {
        ctx.beginPath();
        ctx.moveTo(0, gridY);
        ctx.lineTo(width, gridY);
        ctx.stroke();
      }

      // Generate signal point
      let targetY = height / 2;
      cycleTime++;

      if (type === 'ECG') {
        // Standard ECG simulation loop (P, Q, R, S, T complex waves)
        const phase = cycleTime % Math.round(framesPerBeat);
        const pLen = Math.round(framesPerBeat);
        
        if (phase < pLen * 0.1) {
          // P Wave (auricular depolarization)
          const subPhase = phase / (pLen * 0.1);
          targetY = height / 2 - Math.sin(subPhase * Math.PI) * 8;
        } else if (phase >= pLen * 0.12 && phase < pLen * 0.16) {
          // Q drop
          targetY = height / 2 + 5;
        } else if (phase >= pLen * 0.16 && phase < pLen * 0.22) {
          // R sharp peak (ventricular depolarization)
          const subPhase = (phase - pLen * 0.16) / (pLen * 0.06);
          targetY = height / 2 - Math.sin(subPhase * Math.PI) * 45;
        } else if (phase >= pLen * 0.22 && phase < pLen * 0.26) {
          // S deep drop
          const subPhase = (phase - pLen * 0.22) / (pLen * 0.04);
          targetY = height / 2 + Math.sin(subPhase * Math.PI) * 15;
        } else if (phase >= pLen * 0.35 && phase < pLen * 0.50) {
          // T Wave (ventricular repolarization)
          const subPhase = (phase - pLen * 0.35) / (pLen * 0.15);
          targetY = height / 2 - Math.sin(subPhase * Math.PI) * 12;
        }
      } else if (type === 'Glucose') {
        // Slow sinusoidal wave with tiny noise
        const freq = (2 * Math.PI) / 300;
        targetY = height / 2 + Math.sin(cycleTime * freq) * 15 + Math.sin(cycleTime * 0.1) * 2;
      } else if (type === 'Capnography' || type === 'Pulse') {
        // Standard high SpO2 plethysmography wave (smooth pulse wave)
        const phase = cycleTime % Math.round(framesPerBeat);
        const ratio = phase / framesPerBeat;
        
        if (ratio < 0.4) {
          // Anacrotic rise & dicrotic limb
          targetY = height / 2 - Math.sin(ratio * (Math.PI / 0.4)) * 25;
        } else if (ratio >= 0.4 && ratio < 0.5) {
          // Dicrotic notch drop
          const notchPhase = (ratio - 0.4) / 0.1;
          targetY = height / 2 - 12 + Math.sin(notchPhase * Math.PI) * 3;
        } else if (ratio >= 0.5 && ratio < 0.8) {
          // Repolarization run down
          const fallPhase = (ratio - 0.5) / 0.3;
          targetY = height / 2 - 9 + Math.cos(fallPhase * Math.PI / 2) * 9;
        }
      }

      // Add small baseline random noise to make it realistic
      const noise = isCritical ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 1.2;
      targetY += noise;

      // Shift existing points and append new one
      points.shift();
      points.push(targetY);

      // Draw the waveform with a glowing effect
      ctx.shadowBlur = isCritical ? 14 : 6;
      ctx.shadowColor = statusColor;
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(0, points[0]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(i, points[i]);
      }
      ctx.stroke();

      // Draw the moving electron dot at the trailing edge
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.arc(points.length - 1, points[points.length - 1], 4, 0, 2 * Math.PI);
      ctx.fill();

      // Reset shadows for clean interface rendering
      ctx.shadowBlur = 0;

      // Draw signal standard info overlay overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '10px monospace';
      ctx.fillText(`${type} OSCILLOSCOPE | ${rate} ${type === 'ECG' || type === 'Pulse' ? 'BPM' : 'RESP'}`, 12, 16);

      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [type, rate, statusColor, isCritical]);

  return (
    <div className="relative w-full h-full overflow-hidden border border-slate-800 rounded bg-[#050608]" id={`waveform-container-${type}`}>
      <canvas ref={canvasRef} className="block w-full h-full" id={`waveform-canvas-${type}`} />
      <div className="absolute top-2 right-2 flex items-center space-x-1" id={`waveform-badge-${type}`}>
        <span className="relative flex h-2 w-2">
          <span 
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: statusColor }}
          />
          <span 
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: statusColor }}
          />
        </span>
        <span className="text-[9px] font-mono tracking-wider uppercase" style={{ color: statusColor }}>
          {isCritical ? 'ALERT' : 'LIVE'}
        </span>
      </div>
    </div>
  );
}
