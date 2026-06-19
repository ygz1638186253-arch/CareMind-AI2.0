/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sparkles, Loader2, Printer, CheckCircle, AlertCircle, ShieldAlert, HeartHandshake, Eye, BookOpen } from 'lucide-react';
import { AIAnalysisResponse, VitalState, PatientProfile, LogEntry, ChronicDiseaseType } from '../types';

interface AISuggestionsProps {
  diseaseType: ChronicDiseaseType;
  patientProfile: PatientProfile;
  vitals: VitalState;
  logs: LogEntry[];
}

export default function AISuggestions({
  diseaseType,
  patientProfile,
  vitals,
  logs,
}: AISuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestAIAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diseaseType,
          patientProfile,
          currentVitals: vitals,
          recentLogs: logs.filter(l => l.diseaseType === diseaseType).slice(0, 5),
          symptoms: [], // Passed to prompt dynamically based on disease configuration
          notes: logs.length > 0 ? logs[0].notes : '',
        }),
      });

      if (!response.ok) {
        throw new Error('网络通讯或医学AI模块异常，请稍后重试');
      }

      const data = await response.json();
      setReport(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '无法获取AI评测报告，请检查服务器网络。');
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  const getRiskColor = (level: AIAnalysisResponse['riskLevel']) => {
    switch (level) {
      case 'LOW': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', label: '低度风险 (LOW)' };
      case 'MEDIUM': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: '中度预警 (MEDIUM)' };
      case 'HIGH': return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', label: '高度危险 (HIGH)' };
      case 'CRITICAL': return { bg: 'bg-rose-600/15 text-rose-300 border-rose-500/40', text: 'text-rose-400', border: 'border-rose-500/40', label: '急诊级别 (CRITICAL ALERT)' };
      default: return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', label: '未评级' };
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-2xl relative" id="ai-physician-assistant-panel">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-3 mb-5 gap-3" id="ai-panel-header">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-md font-display font-semibold text-slate-100 tracking-wide flex items-center gap-1.5">
              <span>AI 专科医生智能诊疗审计</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              融合临床慢病路径指南 (ADA, AHA, KDIGO) 的模型离线精筛与诊断
            </p>
          </div>
        </div>

        <button
          onClick={requestAIAssessment}
          disabled={loading}
          className="cursor-pointer bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-40 text-white font-medium py-2 px-4 rounded-lg text-xs transition duration-150 flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-950/40"
          id="trigger-ai-audit-btn"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>正在调配临床知识图谱...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>生成实时 AI 理疗评估报告</span>
            </>
          )}
        </button>
      </div>

      {/* Error displays */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3.5 rounded-lg flex items-center space-x-2.5 mb-5" id="ai-error-flash">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Report Area */}
      {!report && !loading ? (
        <div className="py-8 flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-xl bg-[#050608]/40" id="empty-ai-splash-placeholder">
          <BookOpen className="w-10 h-10 text-slate-600 mb-2.5" />
          <span className="text-xs text-slate-400 font-medium font-display">等待生成医生健康审计报告</span>
          <span className="text-[10px] text-slate-500 mt-1 max-w-sm text-center leading-relaxed">
            点击右上角按钮。AI 将即刻提取当下传感器的实时生理数据，配合您的处方跟进记录，输出符合医学范式的个性化膳食营养、用药偏差、及临界急诊干预报告。
          </span>
        </div>
      ) : loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3" id="ai-loading-splash">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <div className="text-center">
            <p className="text-xs text-slate-300 font-semibold tracking-wide">AI 医学评级单元诊断中...</p>
            <p className="text-[10px] text-slate-500 mt-1">正在校准高血压/糖耐受标准指南，计算靶器官潜在风险</p>
          </div>
        </div>
      ) : (
        /* The printable medical report layout */
        <div className="bg-[#050608]/90 rounded-xl p-5 border border-slate-800/80 shadow-inner print:bg-white print:text-black print:p-0 print:border-none" id="medical-report-body">
          
          {/* Print only banner */}
          <div className="hidden print:block border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold tracking-tight uppercase">智能慢性病健康监管仪 临床体征审计报告</h1>
            <p className="text-xs text-slate-500 mt-1">
              打印日期: {new Date().toLocaleString()} | 患者姓名: {patientProfile.name} ({patientProfile.gender === 'Male' ? '男' : '女'}) | 年龄: {patientProfile.age}岁
            </p>
          </div>

          {/* Action Row - print / refresh on screen only */}
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800/60 print:hidden" id="report-controls-bar">
            <div className="text-xs text-slate-400 font-mono flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
              <span>报告生成时间: {new Date(report.timestamp).toLocaleString()}</span>
            </div>

            <button
              onClick={printReport}
              className="cursor-pointer text-[11px] bg-slate-900 hover:bg-[#0c0d11] text-slate-300 py-1.5 px-3 rounded-lg font-medium transition flex items-center space-x-1.5 border border-slate-800"
              id="print-report-btn"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>打印/导出 PDF 报告</span>
            </button>
          </div>

          {/* Patient profile header on screen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#050608]/80 p-3.5 rounded-lg border border-slate-800/85 mb-5 text-xs print:hidden" id="screen-report-patient-profile">
            <div>
              <span className="text-slate-500 block mb-0.5">患者主档案</span>
              <span className="text-slate-200 font-semibold">{patientProfile.name} / {patientProfile.gender === 'Male' ? '男' : '女'} / {patientProfile.age}岁</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">慢病所属类</span>
              <span className="text-slate-200 font-semibold">{diseaseType === 'Hypertension' ? '原发性高血压' : diseaseType === 'Diabetes' ? 'II型糖尿病' : diseaseType === 'COPD' ? 'COPD肺病' : '肾功能不全 CKD'}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">确诊年份</span>
              <span className="text-slate-200 font-semibold">自 {patientProfile.diagnosedYear} 年起</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">临床用药清单</span>
              <span className="text-slate-200 font-semibold truncate block" title={patientProfile.medications.join(', ')}>
                {patientProfile.medications.join(', ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="report-details-layout">
            
            {/* Risk level and status summary block */}
            <div className="md:col-span-1 space-y-4" id="report-summary-column">
              <div 
                className={`p-4 rounded-xl border text-center ${getRiskColor(report.riskLevel).bg} ${getRiskColor(report.riskLevel).border}`}
                id="risk-box"
              >
                <span className="text-[11px] font-mono tracking-wider block text-slate-400 uppercase">临床综合风险评定</span>
                <span className={`text-lg font-bold block mt-1.5 tracking-wide ${getRiskColor(report.riskLevel).text}`}>
                  {getRiskColor(report.riskLevel).label}
                </span>
              </div>

              {/* Patient telemetry warnings indicator */}
              <div className="bg-[#050608]/50 p-4 rounded-xl border border-slate-800/60" id="status-card-box">
                <span className="text-xs text-slate-300 font-semibold font-display flex items-center space-x-1.5 mb-2.5">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                  <span>病情综合陈述</span>
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {report.statusSummary}
                </p>
              </div>

              {/* Consultation reminder banner */}
              {report.consultationNeeded && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start space-x-3 text-red-200" id="immediate-consultation-call">
                  <HeartHandshake className="w-5 h-5 shrink-0 text-red-400 animate-pulse mt-0.5" />
                  <div className="text-xs">
                    <span className="font-semibold block text-red-400">急诊就医通道建议</span>
                    <p className="opacity-80 mt-1 leading-relaxed">
                      系统检测到部分生理读数极度不契合慢病正常波动区间。请勿自行调整重大处方用药。建议在工作时间内就近前往慢性病门诊进行靶器官排查。
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* In depth Clinical Recommendations Column */}
            <div className="md:col-span-2 space-y-5" id="report-guidelines-column">
              
              {/* Deviation Analysis */}
              <div>
                <h4 className="text-xs font-semibold text-slate-200 font-display uppercase tracking-wider mb-2.5">
                  ⚠️ 生理指标异常偏差成因 (Guideline Deviation Analysis)
                </h4>
                <ul className="text-xs text-slate-300 space-y-2" id="abnormalities-bullets">
                  {report.abnormalAnalysis.map((item, id) => (
                    <li key={id} className="flex items-start space-x-1.5">
                      <span className="text-red-500 shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                  {report.abnormalAnalysis.length === 0 && (
                    <li className="text-[#22c55e] flex items-center space-x-1.5">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>未检测到超出指南阈值的生理偏差分型，状态非常优异。</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Food nutrition choices */}
              <div>
                <h4 className="text-xs font-semibold text-slate-200 font-display uppercase tracking-wider mb-2.5">
                  🥗 营养学膳食干预细则 (Nutritional Guidelines)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="diet-cards">
                  {report.dietaryAdjustments.map((adjust, id) => (
                    <div key={id} className="bg-[#050608]/50 border border-slate-800/80 p-2.5 rounded-lg text-xs text-slate-300 flex items-start space-x-2">
                      <span className="text-blue-400 mt-0.5 font-bold">✓</span>
                      <span className="leading-relaxed">{adjust}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Habits and drug schedulers */}
              <div>
                <h4 className="text-xs font-semibold text-slate-200 font-display uppercase tracking-wider mb-2.5">
                  🏃 运动康复与用药监护
                </h4>
                
                <div className="space-y-3" id="med-and-style-list">
                  <div className="p-3 bg-[#050608]/50 border border-slate-800/80 rounded-lg text-xs" id="style-inner-card">
                    <span className="text-slate-400 font-semibold block mb-1.5">推荐日常生活改善路径 (Lifestyle Pathways)</span>
                    <ul className="text-slate-300 space-y-1.5">
                      {report.lifestyleAdvice.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <span className="text-blue-400 shrink-0">•</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-lg text-xs text-blue-300" id="meds-inner-card">
                    <span className="text-blue-300 font-semibold block mb-1">用药安全性及依从提醒</span>
                    <p className="text-blue-300 leading-relaxed font-sans text-[11px]">
                      {report.medicationAlerts}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
