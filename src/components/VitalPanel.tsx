/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Activity, Droplet, Flame, Heart, RefreshCw, Thermometer, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { VitalState, ChronicDiseaseType, UserThresholds } from '../types';

interface VitalPanelProps {
  diseaseType: ChronicDiseaseType;
  vitals: VitalState;
  userThresholds: UserThresholds;
  onModifyThresholds: (thresholds: UserThresholds) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

// Simple browser AudioContext synthesizer for real clinical status warnings
function playMedicalTone(isCritical: boolean) {
  if (typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = isCritical ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isCritical ? 980 : 880, ctx.currentTime);
    
    gain.gain.setValueAtTime(isCritical ? 0.08 : 0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isCritical ? 0.25 : 0.12));
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + (isCritical ? 0.28 : 0.15));
  } catch (e) {
    // Safely ignore browser gesture restrictions
  }
}

export default function VitalPanel({
  diseaseType,
  vitals,
  userThresholds,
  onModifyThresholds,
  soundEnabled,
  onToggleSound,
}: VitalPanelProps) {

  // Evaluate status of each vital parameter
  const getVitalStatus = (name: keyof VitalState, val: number): { level: 'NORMAL' | 'CAUTION' | 'DANGER'; text: string; bg: string; textClass: string; border: string } => {
    switch (name) {
      case 'bloodPressureSystolic':
        if (val > userThresholds.bpSystolicMax) return { level: 'DANGER', text: '重度高血压', bg: 'bg-red-500/10', textClass: 'text-red-500', border: 'border-red-500/30' };
        if (val > 130) return { level: 'CAUTION', text: '偏高/预警', bg: 'bg-amber-500/10', textClass: 'text-amber-500', border: 'border-amber-500/30' };
        if (val < 90) return { level: 'CAUTION', text: '偏低', bg: 'bg-amber-500/10', textClass: 'text-amber-500', border: 'border-amber-500/30' };
        return { level: 'NORMAL', text: '正常范围内', bg: 'bg-emerald-500/10', textClass: 'text-emerald-500', border: 'border-emerald-500/30' };

      case 'bloodPressureDiastolic':
        if (val > userThresholds.bpDiastolicMax) return { level: 'DANGER', text: '舒张压极高', bg: 'bg-red-500/10', textClass: 'text-red-500', border: 'border-red-500/30' };
        if (val > 80) return { level: 'CAUTION', text: '舒张压偏高', bg: 'bg-amber-500/10', textClass: 'text-amber-500', border: 'border-amber-500/30' };
        if (val < 60) return { level: 'CAUTION', text: '偏低', bg: 'bg-amber-500/10', textClass: 'text-amber-500', border: 'border-amber-500/30' };
        return { level: 'NORMAL', text: '正常范围内', bg: 'bg-emerald-500/10', textClass: 'text-emerald-500', border: 'border-emerald-500/30' };

      case 'bloodGlucose':
        if (val > userThresholds.glucoseMax) return { level: 'DANGER', text: '高血糖/危机', bg: 'bg-red-500/10', textClass: 'text-red-500', border: 'border-red-500/30' };
        if (val < userThresholds.glucoseMin) return { level: 'DANGER', text: '低血糖警告', bg: 'bg-red-500/10', textClass: 'text-red-500', border: 'border-red-500/30' };
        if (val > 10.0 || val < 4.0) return { level: 'CAUTION', text: '轻度异常', bg: 'bg-amber-500/10', textClass: 'text-amber-500', border: 'border-amber-500/30' };
        return { level: 'NORMAL', text: '正常范围内', bg: 'bg-emerald-500/10', textClass: 'text-emerald-500', border: 'border-emerald-500/30' };

      case 'spo2':
        if (val < userThresholds.spo2Min) return { level: 'DANGER', text: '严重缺氧警告', bg: 'bg-red-500/10', textClass: 'text-red-500', border: 'border-red-500/30' };
        if (val < 95) return { level: 'CAUTION', text: '血氧偏低', bg: 'bg-amber-500/10', textClass: 'text-amber-500', border: 'border-amber-500/30' };
        return { level: 'NORMAL', text: '常态血氧', bg: 'bg-emerald-500/10', textClass: 'text-emerald-500', border: 'border-emerald-500/30' };

      case 'heartRate':
        if (val > 120 || val < 50) return { level: 'DANGER', text: '心率失常风险', bg: 'bg-red-500/10', textClass: 'text-red-500', border: 'border-red-500/30' };
        if (val > 100 || val < 60) return { level: 'CAUTION', text: '心率异常偏快/慢', bg: 'bg-amber-500/10', textClass: 'text-amber-500', border: 'border-amber-500/30' };
        return { level: 'NORMAL', text: '正常静息心率', bg: 'bg-emerald-500/10', textClass: 'text-emerald-500', border: 'border-emerald-500/30' };

      case 'egfr':
        if (val < userThresholds.egfrMin) return { level: 'DANGER', text: '肾功能损害加重', bg: 'bg-red-500/10', textClass: 'text-red-500', border: 'border-red-500/30' };
        if (val < 90) return { level: 'CAUTION', text: '轻度肾滤降', bg: 'bg-amber-500/10', textClass: 'text-amber-500', border: 'border-amber-500/30' };
        return { level: 'NORMAL', text: '正常的肾滤过', bg: 'bg-emerald-500/10', textClass: 'text-emerald-500', border: 'border-emerald-500/30' };

      case 'urineProtein':
        if (val > 1.0) return { level: 'DANGER', text: '大量蛋白尿', bg: 'bg-red-500/10', textClass: 'text-red-500', border: 'border-red-500/30' };
        if (val > 0.15) return { level: 'CAUTION', text: '微量蛋白尿', bg: 'bg-amber-500/10', textClass: 'text-amber-500', border: 'border-amber-500/30' };
        return { level: 'NORMAL', text: '无蛋白尿', bg: 'bg-emerald-500/10', textClass: 'text-emerald-500', border: 'border-emerald-500/30' };

      default:
        return { level: 'NORMAL', text: '正常', bg: 'bg-emerald-500/10', textClass: 'text-emerald-500', border: 'border-emerald-500/30' };
    }
  };

  // Compile active vitals list for selected chronic condition
  const getRelevantVitals = () => {
    const list: Array<{ id: keyof VitalState; label: string; value: number; unit: string; icon: any; precision: number }> = [
      { id: 'heartRate', label: '心率 (HR)', value: vitals.heartRate, unit: 'bpm', icon: Heart, precision: 0 },
      { id: 'temperature', label: '体温 (TEMP)', value: vitals.temperature, unit: '°C', icon: Thermometer, precision: 1 },
      { id: 'respiratoryRate', label: '呼吸频率 (RESP)', value: vitals.respiratoryRate, unit: '次/分', icon: Activity, precision: 0 },
    ];

    if (diseaseType === 'Hypertension') {
      list.unshift(
        { id: 'bloodPressureSystolic', label: '收缩压 (SYS)', value: vitals.bloodPressureSystolic, unit: 'mmHg', icon: Droplet, precision: 0 },
        { id: 'bloodPressureDiastolic', label: '舒张压 (DIA)', value: vitals.bloodPressureDiastolic, unit: 'mmHg', icon: Droplet, precision: 0 }
      );
    } else if (diseaseType === 'Diabetes') {
      list.unshift(
        { id: 'bloodGlucose', label: '瞬时血糖 (GLU)', value: vitals.bloodGlucose, unit: 'mmol/L', icon: Droplet, precision: 1 }
      );
    } else if (diseaseType === 'COPD') {
      list.unshift(
        { id: 'spo2', label: '血氧饱和度 (SpO2)', value: vitals.spo2, unit: '%', icon: Flame, precision: 0 }
      );
    } else if (diseaseType === 'CKD') {
      list.unshift(
        { id: 'egfr', label: '肾小球滤过率 (eGFR)', value: vitals.egfr, unit: 'mL/min', icon: Droplet, precision: 0 },
        { id: 'urineProtein', label: '24h尿蛋白 (PRO)', value: vitals.urineProtein, unit: 'g/24h', icon: Droplet, precision: 2 }
      );
    }

    return list;
  };

  const activeVitals = getRelevantVitals();

  // Highlight medical alarm triggers
  const hasDanger = activeVitals.some(v => getVitalStatus(v.id, v.value).level === 'DANGER');
  const hasCaution = activeVitals.some(v => getVitalStatus(v.id, v.value).level === 'CAUTION');

  // Trigger audio beeps if enabled and any parameter violates safety thresholds
  useEffect(() => {
    if (soundEnabled) {
      if (hasDanger) {
        playMedicalTone(true);
      } else if (hasCaution) {
        playMedicalTone(false);
      }
    }
  }, [
    soundEnabled,
    hasDanger,
    hasCaution,
    vitals.heartRate,
    vitals.temperature,
    vitals.respiratoryRate,
    vitals.bloodPressureSystolic,
    vitals.bloodPressureDiastolic,
    vitals.bloodGlucose,
    vitals.spo2,
    vitals.egfr,
    vitals.urineProtein,
  ]);

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-2xl relative overflow-hidden" id="vitals-instrument-card">
      {/* Scope visualizer container */}
      <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none text-slate-500 font-mono text-[9px]" id="visual-hardware-branding">
        CHRONIC-CARDIO PRO-X8 V4.2
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-4 mb-5 gap-3" id="instrument-header">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <h2 className="text-lg font-display font-semibold text-slate-100 tracking-wide">
              实时监护仪面板 | Vital Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            当前处于 {diseaseType === 'Hypertension' ? '高血压管护模式 (Hypertension Care)' :
                       diseaseType === 'Diabetes' ? '二型糖尿病管护模式 (Diabetes Gluco-Care)' :
                       diseaseType === 'COPD' ? '慢阻肺气道管护模式 (COPD Respiratory-Care)' :
                       '慢性肾脏病复合管护模式 (CKD Care)'}
          </p>
        </div>

        {/* Clinical Sound alarm warning toggler */}
        <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800" id="audio-alarm-switch">
          <span className="text-xs text-slate-400">警报音频:</span>
          <button
            onClick={onToggleSound}
            className={`cursor-pointer px-2.5 py-0.5 rounded text-xs font-semibold tracking-wider transition ${
              soundEnabled ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'
            }`}
            id="alarm-beeper-toggle"
          >
            {soundEnabled ? '● SOUND ON' : 'MUTED'}
          </button>
        </div>
      </div>

      {/* Primary Alarm banner */}
      <div 
        className={`mb-6 p-3 rounded-lg border flex items-center justify-between transition-all duration-300 ${
          hasDanger 
            ? 'bg-red-500/10 border-red-500/30 text-red-200 animate-glow-red' 
            : hasCaution 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 animate-glow-yellow' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
        }`}
        id="alarm-system-banner"
      >
        <div className="flex items-center space-x-3">
          {hasDanger ? (
            <ShieldAlert className="w-5 h-5 text-red-500 animate-bounce" />
          ) : hasCaution ? (
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
          <div className="text-xs">
            <span className="font-semibold block sm:inline">
              安全状态评定: {hasDanger ? '🚨 危险 (TELEMETRY CRITICAL)' : hasCaution ? '⚠️ 异常预警 (CAUTION STAGE)' : '🟢 安全稳定 (STABLE)'}
            </span>
            <span className="opacity-80 ml-0 sm:ml-2 text-[11px]">
              {hasDanger ? '有指标大幅超时严重超限, 请尽快查看医疗指南或使用AI建议。' :
               hasCaution ? '生理属性存在阶段性波动, 处于临床预警范畴。' :
               '当前指标吻合健康靶向目标，继续保持当前作息与用药。'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="vitals-matrix-grid">
        {activeVitals.map((v) => {
          const status = getVitalStatus(v.id, v.value);
          const Icon = v.icon;
          return (
            <div 
              key={v.id} 
              className={`bg-slate-950/40 border ${status.border} rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/60 transition duration-200 shadow-xl`}
              id={`vital-card-${v.id}`}
            >
              <div className="flex justify-between items-start">
                <div className="text-xs text-slate-400 font-mono tracking-wide">{v.label}</div>
                <div className={`p-1.5 rounded-lg ${status.bg} ${status.textClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Main value display reading */}
              <div className="my-3 flex items-baseline space-x-2">
                <span className="text-3xl font-mono font-bold text-slate-100 tracking-tight">
                  {v.value.toFixed(v.precision)}
                </span>
                <span className="text-xs text-slate-400 font-mono">{v.unit}</span>
              </div>

              {/* Health tag badge status row */}
              <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5 mt-2">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.textClass}`}>
                  {status.text}
                </span>

                {/* Show alert parameters limits info */}
                <span className="text-[10px] text-slate-500 font-mono">
                  {v.id === 'bloodPressureSystolic' && `高压限值: ${userThresholds.bpSystolicMax} mmHg`}
                  {v.id === 'bloodPressureDiastolic' && `低压限值: ${userThresholds.bpDiastolicMax} mmHg`}
                  {v.id === 'bloodGlucose' && `血糖区间: ${userThresholds.glucoseMin}-${userThresholds.glucoseMax}`}
                  {v.id === 'spo2' && `血氧底线: ${userThresholds.spo2Min}%`}
                  {v.id === 'egfr' && `肾滤底线: ${userThresholds.egfrMin}`}
                  {!['bloodPressureSystolic', 'bloodPressureDiastolic', 'bloodGlucose', 'spo2', 'egfr'].includes(v.id) && '临床参考'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom alert threshold limits controller setting trigger modal in inline form */}
      <div className="mt-6 border-t border-slate-800/60 pt-5" id="thresholds-management-panel">
        <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase mb-4">
          智能安全警报限值设定 (Custom Physician Alarm Limits)
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3" id="config-inputs-grid">
          {diseaseType === 'Hypertension' && (
            <>
              <div>
                <label className="block text-[10px] text-slate-500 font-mono mb-1">高压上限 (SYS Max)</label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    value={userThresholds.bpSystolicMax}
                    onChange={(e) => onModifyThresholds({ ...userThresholds, bpSystolicMax: Number(e.target.value) })}
                    className="w-full bg-[#050608]/60 border border-slate-800 px-2 py-1 rounded text-xs text-white font-mono focus:border-slate-700 outline-none"
                    id="sys-limit-input"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">mmHg</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-mono mb-1">低压上限 (DIA Max)</label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    value={userThresholds.bpDiastolicMax}
                    onChange={(e) => onModifyThresholds({ ...userThresholds, bpDiastolicMax: Number(e.target.value) })}
                    className="w-full bg-[#050608]/60 border border-slate-800 px-2 py-1 rounded text-xs text-white font-mono focus:border-slate-700 outline-none"
                    id="dia-limit-input"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">mmHg</span>
                </div>
              </div>
            </>
          )}

          {diseaseType === 'Diabetes' && (
            <>
              <div>
                <label className="block text-[10px] text-slate-500 font-mono mb-1">高血糖限 (GLU High)</label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={userThresholds.glucoseMax}
                    onChange={(e) => onModifyThresholds({ ...userThresholds, glucoseMax: Number(e.target.value) })}
                    className="w-full bg-[#050608]/60 border border-slate-800 px-2 py-1 rounded text-xs text-white font-mono focus:border-slate-700 outline-none"
                    id="glu-max-limit-input"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">mmol/L</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-mono mb-1">低血糖限 (GLU Low)</label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={userThresholds.glucoseMin}
                    onChange={(e) => onModifyThresholds({ ...userThresholds, glucoseMin: Number(e.target.value) })}
                    className="w-full bg-[#050608]/60 border border-slate-800 px-2 py-1 rounded text-xs text-white font-mono focus:border-slate-700 outline-none"
                    id="glu-min-limit-input"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">mmol/L</span>
                </div>
              </div>
            </>
          )}

          {diseaseType === 'COPD' && (
            <div>
              <label className="block text-[10px] text-slate-500 font-mono mb-1">血氧警告底线 (SpO2 Min)</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  value={userThresholds.spo2Min}
                  onChange={(e) => onModifyThresholds({ ...userThresholds, spo2Min: Number(e.target.value) })}
                  className="w-full bg-[#050608]/60 border border-slate-800 px-2 py-1 rounded text-xs text-white font-mono focus:border-slate-700 outline-none"
                  id="spo2-limit-input"
                />
                <span className="text-[10px] text-slate-500 font-mono">%</span>
              </div>
            </div>
          )}

          {diseaseType === 'CKD' && (
            <div>
              <label className="block text-[10px] text-slate-500 font-mono mb-1">肾衰预警底线 (eGFR Min)</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  value={userThresholds.egfrMin}
                  onChange={(e) => onModifyThresholds({ ...userThresholds, egfrMin: Number(e.target.value) })}
                  className="w-full bg-[#050608]/60 border border-slate-800 px-2 py-1 rounded text-xs text-white font-mono focus:border-slate-700 outline-none"
                  id="egfr-limit-input"
                />
                <span className="text-[10px] text-slate-500 font-mono">mg/dL</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
