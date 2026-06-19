/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Play, RotateCcw, Zap, Heart, Droplet, Flame, Compass } from 'lucide-react';
import { VitalState, ChronicDiseaseType } from '../types';

interface InteractiveSimulatorProps {
  diseaseType: ChronicDiseaseType;
  vitals: VitalState;
  onModifyVitals: (vitals: VitalState) => void;
}

export default function InteractiveSimulator({
  diseaseType,
  vitals,
  onModifyVitals,
}: InteractiveSimulatorProps) {

  // Preset quick macros configuration
  const applyPreset = (presetName: string) => {
    let copy = { ...vitals };
    switch (presetName) {
      case 'resting':
        copy.heartRate = 68;
        copy.temperature = 36.5;
        copy.respiratoryRate = 14;
        copy.bloodPressureSystolic = 118;
        copy.bloodPressureDiastolic = 75;
        copy.bloodGlucose = 5.2;
        copy.spo2 = 98;
        copy.egfr = 92;
        copy.urineProtein = 0.05;
        break;
      
      case 'exercise':
        copy.heartRate = 142;
        copy.temperature = 37.1;
        copy.respiratoryRate = 26;
        copy.bloodPressureSystolic = 152;
        copy.bloodPressureDiastolic = 85;
        copy.bloodGlucose = 4.8;
        copy.spo2 = 96;
        break;

      case 'high-sugar-meal':
        copy.heartRate = 78;
        copy.respiratoryRate = 16;
        copy.bloodGlucose = 13.8; // severe post-meals hyperglycemic spike
        copy.bloodPressureSystolic = 125;
        copy.bloodPressureDiastolic = 80;
        break;

      case 'copd-attack':
        copy.heartRate = 118; // tachycardia response
        copy.respiratoryRate = 28; // hyperventilation attempt
        copy.spo2 = 86; // hypoxemia emergency
        copy.bloodPressureSystolic = 145; // anxiety driven High BP
        copy.bloodPressureDiastolic = 92;
        break;

      case 'bp-spike':
        copy.bloodPressureSystolic = 184; // hypertensive crisis threshold 
        copy.bloodPressureDiastolic = 108;
        copy.heartRate = 94;
        copy.respiratoryRate = 18;
        break;

      case 'med-stabilized':
        copy.heartRate = 72;
        copy.respiratoryRate = 15;
        copy.temperature = 36.6;
        copy.bloodPressureSystolic = 122; // safely aligned
        copy.bloodPressureDiastolic = 78;
        copy.bloodGlucose = 6.1; // optimized fasting standard
        copy.spo2 = 97;
        copy.egfr = 88;
        copy.urineProtein = 0.12;
        break;

      default:
        break;
    }
    onModifyVitals(copy);
  };

  const handleSliderChange = (param: keyof VitalState, val: number) => {
    onModifyVitals({ ...vitals, [param]: val });
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-2xl relative overflow-hidden" id="simulation-scenarios-panel">
      
      {/* Decorative pulse glow indicator */}
      <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none text-blue-500 font-mono text-[9px]" id="sim-glow-tag">
        SIM-ENG: [RUNNING]
      </div>

      <div className="flex items-center space-x-2 border-b border-slate-800/60 pb-3 mb-4" id="sim-header">
        <Compass className="w-5 h-5 text-blue-400" />
        <h3 className="text-md font-display font-semibold text-slate-100 tracking-wide">
          生理状态传感器模拟器 | Clinical Sensor Simulator
        </h3>
      </div>

      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        慢性病健康参数通常处于波动与适应状态。您可以使用内置临床场景，或直接调整特定滑动阀值，来模拟和观察仪器警报系统及AI分析的智能响应。
      </p>

      {/* Quick clinical presets block */}
      <div className="mb-6 p-4 rounded-lg bg-slate-950/60 border border-slate-800/60" id="presets-panel">
        <div className="text-xs font-semibold text-slate-400 font-mono tracking-wider mb-2.5">
          快速触发临床状态 (Clinical Preset Macros)
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" id="preset-buttons-grid">
          <button
            onClick={() => applyPreset('resting')}
            className="cursor-pointer flex items-center justify-center space-x-2 bg-slate-900 hover:bg-[#0c0d11] border border-slate-800 text-slate-200 py-2 px-3 rounded-lg text-xs transition duration-150"
            id="preset-resting"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>平稳静息期 (Resting)</span>
          </button>

          <button
            onClick={() => applyPreset('exercise')}
            className="cursor-pointer flex items-center justify-center space-x-2 bg-slate-900 hover:bg-[#0c0d11] border border-slate-800 text-slate-200 py-2 px-3 rounded-lg text-xs transition duration-150"
            id="preset-exercise"
          >
            <Play className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>高强度运动 (Exercise)</span>
          </button>

          <button
            onClick={() => applyPreset('med-stabilized')}
            className="cursor-pointer flex items-center justify-center space-x-2 bg-slate-900 hover:bg-[#0c0d11] border border-slate-800 text-slate-200 py-2 px-3 rounded-lg text-xs transition duration-150"
            id="preset-med-stabilized"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>服用药物后 (Post-Meds)</span>
          </button>

          {diseaseType === 'Diabetes' && (
            <button
              onClick={() => applyPreset('high-sugar-meal')}
              className="cursor-pointer flex items-center justify-center space-x-2 bg-red-950/20 hover:bg-red-950/45 border border-red-900/30 text-rose-200 py-2 px-3 rounded-lg text-xs transition duration-150"
              id="preset-glucose-spike"
            >
              <Droplet className="w-3.5 h-3.5 text-red-500" />
              <span>饭后高糖饱餐 (Hyperglycemia)</span>
            </button>
          )}

          {diseaseType === 'COPD' && (
            <button
              onClick={() => applyPreset('copd-attack')}
              className="cursor-pointer flex items-center justify-center space-x-2 bg-red-950/20 hover:bg-red-950/45 border border-red-900/30 text-rose-200 py-2 px-3 rounded-lg text-xs transition duration-150"
              id="preset-copd-attack"
            >
              <Flame className="w-3.5 h-3.5 text-red-500 animate-ping" />
              <span>慢阻肺急性发病 (Hypoxemia)</span>
            </button>
          )}

          {diseaseType === 'Hypertension' && (
            <button
              onClick={() => applyPreset('bp-spike')}
              className="cursor-pointer flex items-center justify-center space-x-2 bg-red-950/20 hover:bg-red-950/45 border border-red-900/30 text-rose-200 py-2 px-3 rounded-lg text-xs transition duration-150"
              id="preset-bp-spike"
            >
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span>应激性高血压 (BP Crisis)</span>
            </button>
          )}
        </div>
      </div>

      {/* Precise Sliders Adjustments */}
      <div className="space-y-4" id="simulators-sliders-block">
        <div className="text-xs font-semibold text-slate-300 font-mono tracking-wider">
          高精体征参数微调 (Hardware Telemetry Fine-Tuning)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="sliders-grid">
          {/* Heart Rate Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 font-mono mb-1.5">
              <span>心率: {vitals.heartRate} bpm</span>
              <span className="text-[10px] text-slate-500">正常: 60-100</span>
            </div>
            <input
              type="range"
              min="40"
              max="160"
              value={vitals.heartRate}
              onChange={(e) => handleSliderChange('heartRate', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              id="slider-hr"
            />
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 font-mono mb-1.5">
              <span>体温: {vitals.temperature.toFixed(1)} °C</span>
              <span className="text-[10px] text-slate-500">正常: 36.1-37.2</span>
            </div>
            <input
              type="range"
              min="35"
              step="0.1"
              max="40"
              value={vitals.temperature}
              onChange={(e) => handleSliderChange('temperature', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              id="slider-temp"
            />
          </div>

          {/* Disease specific sliders */}
          {diseaseType === 'Hypertension' && (
            <>
              <div>
                <div className="flex justify-between text-xs text-slate-400 font-mono mb-1.5">
                  <span>收缩压 (SYS): {vitals.bloodPressureSystolic} mmHg</span>
                  <span className="text-[10px] text-slate-500">正常: &lt; 120</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="210"
                  value={vitals.bloodPressureSystolic}
                  onChange={(e) => handleSliderChange('bloodPressureSystolic', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  id="slider-sys"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 font-mono mb-1.5">
                  <span>舒张压 (DIA): {vitals.bloodPressureDiastolic} mmHg</span>
                  <span className="text-[10px] text-slate-500">正常: &lt; 80</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="130"
                  value={vitals.bloodPressureDiastolic}
                  onChange={(e) => handleSliderChange('bloodPressureDiastolic', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  id="slider-dia"
                />
              </div>
            </>
          )}

          {diseaseType === 'Diabetes' && (
            <div>
              <div className="flex justify-between text-xs text-slate-400 font-mono mb-1.5">
                <span>空腹/餐后血糖 (GLU): {vitals.bloodGlucose.toFixed(1)} mmol/L</span>
                <span className="text-[10px] text-slate-500">正常: 4.0 - 7.0 / &lt; 10.0</span>
              </div>
              <input
                type="range"
                min="2.0"
                step="0.1"
                max="25.0"
                value={vitals.bloodGlucose}
                onChange={(e) => handleSliderChange('bloodGlucose', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                id="slider-blood-sugar"
              />
            </div>
          )}

          {diseaseType === 'COPD' && (
            <div>
              <div className="flex justify-between text-xs text-slate-400 font-mono mb-1.5">
                <span>血氧饱和度 (SpO2): {vitals.spo2} %</span>
                <span className="text-[10px] text-slate-500">健康标准: 95-100</span>
              </div>
              <input
                type="range"
                min="75"
                max="100"
                value={vitals.spo2}
                onChange={(e) => handleSliderChange('spo2', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                id="slider-spo2"
              />
            </div>
          )}

          {diseaseType === 'CKD' && (
            <>
              <div>
                <div className="flex justify-between text-xs text-slate-400 font-mono mb-1.5">
                  <span>肾滤率 (eGFR): {vitals.egfr} mL/min</span>
                  <span className="text-[10px] text-slate-500">正常期: &gt; 90</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="130"
                  value={vitals.egfr}
                  onChange={(e) => handleSliderChange('egfr', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  id="slider-egfr"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 font-mono mb-1.5">
                  <span>24h尿蛋白: {vitals.urineProtein.toFixed(2)} g/24h</span>
                  <span className="text-[10px] text-slate-500">正常: &lt; 0.15</span>
                </div>
                <input
                  type="range"
                  min="0"
                  step="0.01"
                  max="5"
                  value={vitals.urineProtein}
                  onChange={(e) => handleSliderChange('urineProtein', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  id="slider-urine-protein"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
