/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, AlertCircle, Plus, ClipboardList, Trash2, CheckCircle } from 'lucide-react';
import { LogEntry, ChronicDiseaseType, VitalState } from '../types';

interface HistoryLogsProps {
  diseaseType: ChronicDiseaseType;
  logs: LogEntry[];
  vitals: VitalState;
  onAddLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onClearLogs: () => void;
}

export default function HistoryLogs({
  diseaseType,
  logs,
  vitals,
  onAddLog,
  onClearLogs,
}: HistoryLogsProps) {
  const [notes, setNotes] = useState('');
  const [medTaken, setMedTaken] = useState(true);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState(false);

  // Common clinical symptoms list matched to selected disease
  const symptomsDatabase: Record<ChronicDiseaseType, string[]> = {
    Hypertension: ['偏头痛/头晕 (Headache)', '胸闷 (Chest Tightness)', '视物模糊 (Blurry Vision)', '心悸 (Palpitations)', '四肢麻木 (Numbness)'],
    Diabetes: ['口渴/多饮 (Polydipsia)', '极度饥饿 (Extreme Hunger)', '尿频 (Polyuria)', '疲乏无力 (Fatigue)', '手脚麻木 (Tingling)'],
    COPD: ['持续性咳嗽 (Chronic Cough)', '剧烈咳痰 (Sputum production)', '气短呼吸急促 (Short of breath)', '胸部紧缩 (Chest tightness)', '喘息作响 (Wheezing)'],
    CKD: ['水肿/眼睑浮肿 (Edema)', '夜尿增多 (Nocturia)', '皮肤冰冷刺痒 (Itchy skin)', '泡沫尿明显 (Foamy urine)', '恶心胃寒 (Nausea)'],
  };

  const currentSymptoms = symptomsDatabase[diseaseType];

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Prepare logs based on currently selected disease telemetry
    const vitalExcerpt: Partial<VitalState> = {
      heartRate: vitals.heartRate,
      temperature: vitals.temperature,
    };

    if (diseaseType === 'Hypertension') {
      vitalExcerpt.bloodPressureSystolic = vitals.bloodPressureSystolic;
      vitalExcerpt.bloodPressureDiastolic = vitals.bloodPressureDiastolic;
    } else if (diseaseType === 'Diabetes') {
      vitalExcerpt.bloodGlucose = vitals.bloodGlucose;
    } else if (diseaseType === 'COPD') {
      vitalExcerpt.spo2 = vitals.spo2;
      vitalExcerpt.respiratoryRate = vitals.respiratoryRate;
    } else if (diseaseType === 'CKD') {
      vitalExcerpt.egfr = vitals.egfr;
      vitalExcerpt.urineProtein = vitals.urineProtein;
    }

    onAddLog({
      patientId: 'patient-1',
      diseaseType,
      vitals: vitalExcerpt,
      symptoms: selectedSymptoms,
      medTaken,
      notes: notes.trim(),
    });

    // Reset layout triggers
    setNotes('');
    setSelectedSymptoms([]);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  // Build chart-friendly historical arrays
  const chartData = logs
    .filter((l) => l.diseaseType === diseaseType)
    .map((l) => {
      const date = new Date(l.timestamp);
      const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      return {
        name: timeStr,
        ...l.vitals,
      };
    })
    .reverse(); // Standard chronological listing

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="history-logs-module">
      
      {/* 1. Record manual entry column */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between lg:col-span-1" id="log-generator-container">
        <div>
          <div className="flex items-center space-x-2 border-b border-slate-800/40 pb-3 mb-4" id="log-generator-title">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            <h3 className="text-md font-display font-semibold text-slate-100 tracking-wide">
              录入当下诊断日志
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" id="measurement-manual-form">
            
            {/* Show parameters that will be archived */}
            <div className="p-3 bg-[#050608]/80 border border-slate-800/60 rounded-lg text-xs" id="archive-vitals-preview">
              <span className="text-slate-400 font-mono block mb-1 uppercase tracking-wider">
                将要打包存档的传感器流:
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-200 font-mono">
                <div>心率: {vitals.heartRate} bpm</div>
                {diseaseType === 'Hypertension' && (
                  <>
                    <div>高压: {vitals.bloodPressureSystolic} mmHg</div>
                    <div>低压: {vitals.bloodPressureDiastolic} mmHg</div>
                  </>
                )}
                {diseaseType === 'Diabetes' && (
                  <div>血糖: {vitals.bloodGlucose.toFixed(1)} mmol/L</div>
                )}
                {diseaseType === 'COPD' && (
                  <>
                    <div>血氧 (SpO2): {vitals.spo2}%</div>
                    <div>呼吸比: {vitals.respiratoryRate}/分</div>
                  </>
                )}
                {diseaseType === 'CKD' && (
                  <>
                    <div>肾滤 eGFR: {vitals.egfr}</div>
                    <div>尿蛋白: {vitals.urineProtein.toFixed(2)}g</div>
                  </>
                )}
              </div>
            </div>

            {/* Symptoms declaration checkboxes */}
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1.5">
                当下不适症状（多选）
              </label>
              <div className="flex flex-wrap gap-1.5" id="symptoms-switches">
                {currentSymptoms.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSymptomToggle(s)}
                    className={`cursor-pointer px-2.5 py-1 rounded text-[11px] font-sans transition duration-150 border ${
                      selectedSymptoms.includes(s)
                        ? 'bg-rose-500/20 border-rose-500/65 text-rose-300'
                        : 'bg-[#050608]/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Prescriptions took indicator */}
            <div className="flex items-center justify-between bg-[#050608]/60 p-2.5 rounded-lg border border-slate-800" id="meds-taken-toggle">
              <span className="text-xs text-slate-400 font-medium">今天是否已按医嘱服用相关药物?</span>
              <button
                type="button"
                onClick={() => setMedTaken(!medTaken)}
                className={`cursor-pointer px-3 py-1 rounded text-[11px] font-bold tracking-wider transition duration-150 ${
                  medTaken ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-650/25 text-red-300 border border-red-500/30'
                }`}
              >
                {medTaken ? '已服用 MED ON' : '未服药 MED OFF'}
              </button>
            </div>

            {/* Diary notes text input */}
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">
                患者备注 & 作息饮食记录
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如: 今天早晨食用全麦面包与牛奶，身体无大碍；或者感觉四肢轻微水肿，口渴..."
                className="w-full bg-[#050608]/80 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-slate-700 min-h-[75px]"
                id="notes-textarea"
              />
            </div>

            <button
              type="submit"
              className="cursor-pointer w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-xs transition duration-150 flex items-center justify-center space-x-1.5"
              id="submitting-log-button"
            >
              <Plus className="w-4 h-4" />
              <span>提交存档日志 & 更新图表</span>
            </button>
          </form>
        </div>

        {/* Action cues messages */}
        {successMsg && (
          <div className="mt-3 flex items-center space-x-2 text-xs bg-emerald-900/20 border border-emerald-800/40 text-emerald-300 p-2.5 rounded-lg animate-pulse" id="success-flash-log">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>日志已同步至监护仪本地存储池。</span>
          </div>
        )}
      </div>

      {/* 2. Charts trend columns */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-2xl lg:col-span-2 flex flex-col justify-between" id="trends-charts-column">
        <div>
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-3 mb-4" id="trends-charts-header">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h3 className="text-md font-display font-semibold text-slate-100 tracking-wide">
                体征历史走势图览 (Trend Oscillograms)
              </h3>
            </div>
            
            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="cursor-pointer flex items-center space-x-1 text-slate-500 hover:text-rose-400 text-xs transition border border-transparent hover:border-rose-950/20 px-2 py-1 rounded"
                id="clear-logs-btn"
              >
                <Trash2 className="w-3 h-3" />
                <span>清除历史</span>
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400 mb-5">
            展现近几次测定结果。科学发现趋势，对降压药或降糖药疗效随访评估至关重要。
          </p>

          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[260px] bg-[#050608]/40 border border-dashed border-slate-800/80 rounded-xl" id="no-charts-splash">
              <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
              <span className="text-xs text-slate-500">目前暂无该慢病类别的历史日志数据</span>
              <span className="text-[10px] text-slate-600 mt-1">请在左侧录入第一条数据，以绘制参数波动弦线。</span>
            </div>
          ) : (
            <div className="w-full h-[260px] bg-[#050608]/80 p-3 rounded-lg border border-slate-800/80" id="recharts-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: 11 }}
                    itemStyle={{ padding: '2px 0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                  
                  {diseaseType === 'Hypertension' && (
                    <>
                      <Line type="monotone" dataKey="bloodPressureSystolic" name="收缩压 (SYS)" stroke="#f43f5e" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="bloodPressureDiastolic" name="舒张压 (DIA)" stroke="#3b82f6" strokeWidth={2} />
                    </>
                  )}

                  {diseaseType === 'Diabetes' && (
                    <Line type="monotone" dataKey="bloodGlucose" name="血糖 (Glucose)" stroke="#fbbf24" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  )}

                  {diseaseType === 'COPD' && (
                    <>
                      <Line type="monotone" dataKey="spo2" name="血氧饱和度 (%)" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="respiratoryRate" name="呼吸频率" stroke="#8b5cf6" strokeWidth={2} />
                    </>
                  )}

                  {diseaseType === 'CKD' && (
                    <>
                      <Line type="monotone" dataKey="egfr" name="肾小球滤过率 (eGFR)" stroke="#38bdf8" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="urineProtein" name="尿蛋白量 (PRO)" stroke="#ec4899" strokeWidth={2} />
                    </>
                  )}

                  <Line type="monotone" dataKey="heartRate" name="心率" stroke="#a1a1aa" strokeWidth={1} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* History log review cards list below graph */}
        <div className="mt-5 border-t border-slate-800/80 pt-4" id="recent-logs-list">
          <span className="text-xs font-semibold text-slate-300 font-display block mb-3">最近记录明细</span>
          <div className="max-h-[120px] overflow-y-auto space-y-2 text-xs pr-1" id="scrolling-logs">
            {logs.filter(l => l.diseaseType === diseaseType).length === 0 ? (
              <div className="text-slate-500 font-mono italic">暂不满足明细报表归档条件</div>
            ) : (
              logs.filter(l => l.diseaseType === diseaseType).map((l, idx) => (
                <div key={l.id} className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg flex justify-between items-start gap-4 animate-fade-in">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 font-mono text-[10px]">
                        {new Date(l.timestamp).toLocaleString('zh-CN', { hour12: false })}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                        l.medTaken ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                      }`}>
                        {l.medTaken ? '已服药' : '漏服药'}
                      </span>
                    </div>

                    {l.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {l.symptoms.map(s => (
                          <span key={s} className="bg-rose-950/40 text-rose-300 text-[9px] px-1 py-0.2 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {l.notes && (
                      <p className="text-[11px] text-slate-400 mt-1.5 border-l-2 border-slate-700 pl-1.5 italic">
                        "{l.notes}"
                      </p>
                    )}
                  </div>

                  <div className="text-right text-[11px] font-mono font-medium text-slate-300">
                    {l.vitals.bloodPressureSystolic ? `SYS/DIA: ${l.vitals.bloodPressureSystolic}/${l.vitals.bloodPressureDiastolic}` :
                     l.vitals.bloodGlucose ? `血糖: ${l.vitals.bloodGlucose?.toFixed(1)}` :
                     l.vitals.spo2 ? `血氧: ${l.vitals.spo2}% / RR: ${l.vitals.respiratoryRate}` :
                     `eGFR: ${l.vitals.egfr} / PRO: ${l.vitals.urineProtein?.toFixed(2)}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
