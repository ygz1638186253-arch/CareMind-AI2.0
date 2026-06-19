/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Heart, Activity, User, PlusCircle, Settings, ClipboardList, HelpCircle, HardDrive, Bell } from 'lucide-react';
import { ChronicDiseaseType, PatientProfile, VitalState, LogEntry, UserThresholds } from './types';
import ECGWaveform from './components/ECGWaveform';
import VitalPanel from './components/VitalPanel';
import InteractiveSimulator from './components/InteractiveSimulator';
import HistoryLogs from './components/HistoryLogs';
import AISuggestions from './components/AISuggestions';

// Preset patient profiles database matching clinical chronic diseases
const PRESET_PROFILES: Record<ChronicDiseaseType, PatientProfile> = {
  Hypertension: {
    id: 'patient-1',
    name: '张建国 (Zhang Jianguo)',
    gender: 'Male',
    age: 64,
    diseaseType: 'Hypertension',
    diagnosedYear: 2018,
    medications: ['硝苯地平控释片 (30mg qd)', '马来酸依那普利片 (10mg qd)'],
    contactPerson: '张大勇 (儿子)',
    contactPhone: '138-xxxx-5678',
  },
  Diabetes: {
    id: 'patient-2',
    name: '李秀琴 (Li Xiuqin)',
    gender: 'Female',
    age: 58,
    diseaseType: 'Diabetes',
    diagnosedYear: 2020,
    medications: ['盐酸二甲双胍缓释片 (0.5g bid)', '达格列净片 (10mg qd)'],
    contactPerson: '李芳 (女儿)',
    contactPhone: '139-xxxx-1234',
  },
  COPD: {
    id: 'patient-3',
    name: '王强 (Wang Qiang)',
    gender: 'Male',
    age: 62,
    diseaseType: 'COPD',
    diagnosedYear: 2015,
    medications: ['噻托溴铵粉吸入剂 (18ug qd)', '沙美特罗替卡松吸入粉雾剂 (50ug/250ug bid)'],
    contactPerson: '刘玉兰 (妻子)',
    contactPhone: '135-xxxx-9876',
  },
  CKD: {
    id: 'patient-4',
    name: '周德明 (Zhou Deming)',
    gender: 'Male',
    age: 71,
    diseaseType: 'CKD',
    diagnosedYear: 2019,
    medications: ['百令胶囊 (2.0g tid)', '碳酸氢钠片 (0.5g tid)', '氯沙坦钾片 (50mg qd)'],
    contactPerson: '周小梅 (女儿)',
    contactPhone: '137-xxxx-4321',
  },
};

// Initial simulated telemetry vitals baseline state
const INITIAL_VITALS: Record<ChronicDiseaseType, VitalState> = {
  Hypertension: {
    heartRate: 75,
    temperature: 36.6,
    respiratoryRate: 16,
    bloodPressureSystolic: 128,
    bloodPressureDiastolic: 82,
    bloodGlucose: 5.6,
    spo2: 97,
    egfr: 85,
    urineProtein: 0.1,
  },
  Diabetes: {
    heartRate: 72,
    temperature: 36.4,
    respiratoryRate: 15,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 78,
    bloodGlucose: 6.8, // Baseline slightly elevated
    spo2: 98,
    egfr: 90,
    urineProtein: 0.08,
  },
  COPD: {
    heartRate: 85,
    temperature: 36.7,
    respiratoryRate: 20, // Slightly higher
    bloodPressureSystolic: 125,
    bloodPressureDiastolic: 80,
    bloodGlucose: 5.4,
    spo2: 93, // Baseline SpO2 lower for COPD
    egfr: 82,
    urineProtein: 0.12,
  },
  CKD: {
    heartRate: 70,
    temperature: 36.3,
    respiratoryRate: 16,
    bloodPressureSystolic: 132, // Controlled but elevated
    bloodPressureDiastolic: 83,
    bloodGlucose: 5.9,
    spo2: 96,
    egfr: 52, // Nephropathy stage 3 baseline
    urineProtein: 0.85, // Mild protein leakage
  },
};

// Standard physiological alarms thresholds configuration
const DEFAULT_THRESHOLDS: UserThresholds = {
  bpSystolicMax: 140,
  bpDiastolicMax: 90,
  glucoseMax: 11.1,
  glucoseMin: 3.9,
  spo2Min: 90,
  egfrMin: 45,
};

// Generate some authentic historical entries for plotting graph on start
const generateMockLogs = (): LogEntry[] => {
  const list: LogEntry[] = [];
  const diseases: ChronicDiseaseType[] = ['Hypertension', 'Diabetes', 'COPD', 'CKD'];
  const now = new Date();

  diseases.forEach((dis) => {
    const baseVitals = INITIAL_VITALS[dis];
    // Create 5 offsets
    for (let i = 5; i >= 1; i--) {
      const timeOffset = new Date(now.getTime() - i * 6 * 60 * 60 * 1000); // every 6 hours
      const dev = (Math.sin(i) * 1.5);
      
      const entryVitals: Partial<VitalState> = {
        heartRate: Math.round(baseVitals.heartRate + dev * 3),
      };

      if (dis === 'Hypertension') {
        entryVitals.bloodPressureSystolic = Math.round(baseVitals.bloodPressureSystolic + dev * 6);
        entryVitals.bloodPressureDiastolic = Math.round(baseVitals.bloodPressureDiastolic + dev * 3);
      } else if (dis === 'Diabetes') {
        entryVitals.bloodGlucose = Number((baseVitals.bloodGlucose + dev * 0.8).toFixed(1));
      } else if (dis === 'COPD') {
        entryVitals.spo2 = Math.round(baseVitals.spo2 + (i % 2 === 0 ? 1 : -1));
        entryVitals.respiratoryRate = Math.round(baseVitals.respiratoryRate + (i % 2 === 0 ? 1 : -1));
      } else if (dis === 'CKD') {
        entryVitals.egfr = Math.round(baseVitals.egfr + dev * 2);
        entryVitals.urineProtein = Number((baseVitals.urineProtein + dev * 0.05).toFixed(2));
      }

      list.push({
        id: `mock-log-${dis}-${i}`,
        patientId: 'patient-1',
        timestamp: timeOffset.toISOString(),
        diseaseType: dis,
        vitals: entryVitals,
        symptoms: i === 3 ? ['轻微头晕/乏力'] : [],
        medTaken: i !== 2, // simulated dose skipped once
        notes: i === 3 ? '今日气温变化，感觉有轻微不适，已按期测定体征。' : '状态平稳，测定正常。',
      });
    }
  });

  return list;
};

export default function App() {
  const [selectedDisease, setSelectedDisease] = useState<ChronicDiseaseType>('Hypertension');
  const [patient, setPatient] = useState<PatientProfile>(PRESET_PROFILES.Hypertension);
  const [vitals, setVitals] = useState<VitalState>(INITIAL_VITALS.Hypertension);
  const [thresholds, setThresholds] = useState<UserThresholds>(DEFAULT_THRESHOLDS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [sessionTime, setSessionTime] = useState('04:12:45');

  // Real time session seconds ticker
  useEffect(() => {
    let startSeconds = 4 * 3600 + 12 * 60 + 45;
    const interval = setInterval(() => {
      startSeconds++;
      const h = Math.floor(startSeconds / 3600);
      const m = Math.floor((startSeconds % 3600) / 60);
      const s = startSeconds % 60;
      setSessionTime(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load state logs from localStorage if available, or populate with mock values
  useEffect(() => {
    const saved = localStorage.getItem('chronic_vitals_logs');
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
      } catch (e) {
        const mocks = generateMockLogs();
        setLogs(mocks);
        localStorage.setItem('chronic_vitals_logs', JSON.stringify(mocks));
      }
    } else {
      const mocks = generateMockLogs();
      setLogs(mocks);
      localStorage.setItem('chronic_vitals_logs', JSON.stringify(mocks));
    }
  }, []);

  // Sync profile & baseline of vitals when chronic category changes
  const handleDiseaseChange = (type: ChronicDiseaseType) => {
    setSelectedDisease(type);
    setPatient(PRESET_PROFILES[type]);
    setVitals(INITIAL_VITALS[type]);
  };

  const handleModifyVitals = (nextVitals: VitalState) => {
    setVitals(nextVitals);
  };

  const handleModifyThresholds = (nextThresholds: UserThresholds) => {
    setThresholds(nextThresholds);
  };

  const handleAddLog = (item: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...item,
    };
    const nextLogs = [newEntry, ...logs];
    setLogs(nextLogs);
    localStorage.setItem('chronic_vitals_logs', JSON.stringify(nextLogs));
  };

  const handleClearLogs = () => {
    if (window.confirm('确定要清除该慢病本地所有的测定历史日记吗？此操作无法恢复。')) {
      const remainingLogs = logs.filter((l) => l.diseaseType !== selectedDisease);
      setLogs(remainingLogs);
      localStorage.setItem('chronic_vitals_logs', JSON.stringify(remainingLogs));
    }
  };

  const activeWaveType = selectedDisease === 'COPD' ? 'Capnography' : 
                          selectedDisease === 'Diabetes' ? 'Glucose' : 'ECG';

  const criticalWaveAssert = selectedDisease === 'COPD' ? vitals.spo2 < thresholds.spo2Min :
                             selectedDisease === 'Diabetes' ? (vitals.bloodGlucose > thresholds.glucoseMax || vitals.bloodGlucose < thresholds.glucoseMin) :
                             selectedDisease === 'Hypertension' ? (vitals.bloodPressureSystolic > thresholds.bpSystolicMax) :
                             vitals.egfr < thresholds.egfrMin;

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 font-sans antialiased pb-12 scanline" id="homeostasis-root-container">
      
      {/* 1. Header Area with Premium Immersive UI style */}
      <header className="bg-[#050608]/90 border-b border-slate-800 sticky top-0 z-50 px-6 py-4 shadow-2xl backdrop-blur-md" id="console-header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-4" id="branding-wrap">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xs uppercase tracking-widest text-slate-500 font-bold font-mono">Patient Monitor System</h1>
              <p className="text-lg md:text-xl font-medium tracking-tight text-white">
                智能慢性病监管仪 // CH-0922: {patient.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6" id="header-interactive-strip">
            {/* Disease Selector Buttons */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800" id="tabs-disease-switches">
              <button
                onClick={() => handleDiseaseChange('Hypertension')}
                className={`cursor-pointer text-xs font-mono px-3 py-1.5 rounded transition-all duration-150 ${
                  selectedDisease === 'Hypertension'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 font-semibold shadow-inner shadow-red-950/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                高血压 (HYP)
              </button>
              <button
                onClick={() => handleDiseaseChange('Diabetes')}
                className={`cursor-pointer text-xs font-mono px-3 py-1.5 rounded transition-all duration-150 ${
                  selectedDisease === 'Diabetes'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 font-semibold shadow-inner shadow-amber-950/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                糖尿病 (DIA)
              </button>
              <button
                onClick={() => handleDiseaseChange('COPD')}
                className={`cursor-pointer text-xs font-mono px-3 py-1.5 rounded transition-all duration-150 ${
                  selectedDisease === 'COPD'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-semibold shadow-inner shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                慢阻肺 (COP)
              </button>
              <button
                onClick={() => handleDiseaseChange('CKD')}
                className={`cursor-pointer text-xs font-mono px-3 py-1.5 rounded transition-all duration-150 ${
                  selectedDisease === 'CKD'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 font-semibold shadow-inner shadow-blue-950/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                肾滤 (CKD)
              </button>
            </div>

            <div className="h-6 w-[1px] bg-slate-800 hidden lg:block"></div>

            <div className="flex items-center gap-4" id="header-metadata">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-500 uppercase block font-mono">Device State</span>
                <span className="text-xs text-emerald-400 font-mono font-bold tracking-tight">SYNCED // CALIBRATED</span>
              </div>
              <div className="h-8 w-[1px] bg-slate-800 hidden sm:block"></div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block font-mono">Session Time</span>
                <span className="text-lg font-mono font-bold text-white tracking-wider">{sessionTime}</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Main content container using precise responsive desktop grid container spacing */}
      <main className="max-w-7xl mx-auto px-6 mt-6 space-y-6" id="dashboard-sections-outlet">
        
        {/* Layout Grid First Row: Profile Card & ECG Line Oscillogram */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="overview-row">
          
          {/* Patient medical summary panel - Immersive styled */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden" id="patient-card">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500/70" />
            
            <div>
              <div className="flex items-center space-x-2 border-b border-slate-800/60 pb-3 mb-4" id="patient-title-row">
                <User className="w-5 h-5 text-blue-400" />
                <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Patient Medical Dossier
                </h3>
              </div>

              <div className="space-y-3.5 text-xs text-slate-300" id="patient-characteristics">
                <div className="flex justify-between border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500">姓名及性别 / Name</span>
                  <span className="font-semibold text-slate-200">{patient.name} ({patient.gender === 'Male' ? '男' : '女'})</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500">年龄及病史 / Diagnostics</span>
                  <span className="font-semibold text-slate-200">{patient.age} 岁 / 已管理 {new Date().getFullYear() - patient.diagnosedYear} 年</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500">紧急联系对象 / Contact</span>
                  <span className="font-semibold text-emerald-400">{patient.contactPerson} ({patient.contactPhone})</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1.5 font-mono text-[10px] uppercase">当前医嘱药物 (Medications)</span>
                  <div className="flex flex-col gap-1" id="medications-labels">
                    {patient.medications.map((m, id) => (
                      <span key={id} className="bg-[#050608]/80 border border-slate-800/60 px-2.5 py-1 rounded text-[11px] text-blue-400 font-mono">
                        💊 {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#050608]/40 border border-slate-800/50 p-3 rounded-lg text-[11px] text-slate-500 mt-4 leading-relaxed flex items-start space-x-2" id="patient-caution-box">
              <Bell className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>注意：此监护仪处于临床拟合状态。该虚拟引擎数据配合慢病标准运行。请勿取代真正临床诊断。</span>
            </div>
          </div>

          {/* Oscilloscope ECG Wave visualizer */}
          <div className="lg:col-span-2 h-[220px] lg:h-auto" id="oscilloscope-wrapper">
            <ECGWaveform 
              type={activeWaveType} 
              rate={vitals.heartRate} 
              statusColor={criticalWaveAssert ? '#f97316' : '#22c55e'} 
              isCritical={criticalWaveAssert}
            />
          </div>

        </div>

        {/* Layout Grid Second Row: Real time vitals indicators & Controller Simulators */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="vitals-controllers-row">
          <div className="lg:col-span-2" id="vital-panel-box">
            <VitalPanel 
              diseaseType={selectedDisease} 
              vitals={vitals} 
              userThresholds={thresholds} 
              onModifyThresholds={handleModifyThresholds}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
            />
          </div>
          <div className="lg:col-span-1" id="simulator-panel-box">
            <InteractiveSimulator 
              diseaseType={selectedDisease} 
              vitals={vitals} 
              onModifyVitals={handleModifyVitals}
            />
          </div>
        </div>

        {/* Section 3: Diagnostic logging entries & trend lines charts */}
        <div className="bg-slate-900/20 border border-slate-800/80 p-5 rounded-2xl shadow-xl" id="logs-wrapping">
          <h3 className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase mb-4 flex items-center space-x-1.5">
            <Activity className="w-4 h-4 animate-pulse text-emerald-500" />
            <span>患者个人测定日记与波动趋势历史数据库 (Patient Measurement Repository)</span>
          </h3>
          <HistoryLogs 
            diseaseType={selectedDisease} 
            logs={logs} 
            vitals={vitals} 
            onAddLog={handleAddLog} 
            onClearLogs={handleClearLogs}
          />
        </div>

        {/* Section 4: AI Smart consultant medical auditing report */}
        <div className="border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl" id="ai-auditing-section">
          <AISuggestions 
            diseaseType={selectedDisease} 
            patientProfile={patient} 
            vitals={vitals} 
            logs={logs}
          />
        </div>

        {/* Immersive high level diagnostic footer */}
        <footer className="mt-12 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-slate-600 border-t border-slate-800/80 pt-6 gap-3 pb-8" id="applet-footer">
          <div className="flex flex-wrap gap-6 uppercase justify-center md:justify-start">
            <span>Encrypted Node: XC-911-PRO</span>
            <span>Buffer: 100% Loaded</span>
            <span>Kernel: v4.2.0-MED</span>
            <span>Standard: AHA & ADA & GOLD Guidelines</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="uppercase tracking-tighter">Remote Caretaker Connected</span>
          </div>
        </footer>

      </main>

    </div>
  );
}
