/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ChronicDiseaseType = 'Hypertension' | 'Diabetes' | 'COPD' | 'CKD';

export interface DiseaseConfig {
  id: ChronicDiseaseType;
  name: string;
  engName: string;
  description: string;
  primaryColor: string;
  accentBg: string;
  icon: string;
  vitalThresholds: Record<string, { min: number; max: number; cautionMax?: number; cautionMin?: number; unit: string; label: string }>;
}

export interface PatientProfile {
  id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  diseaseType: ChronicDiseaseType;
  diagnosedYear: number;
  medications: string[];
  contactPerson: string;
  contactPhone: string;
}

export interface VitalState {
  heartRate: number;      // bpm
  bloodPressureSystolic: number; // mmHg
  bloodPressureDiastolic: number; // mmHg
  bloodGlucose: number;    // mmol/L
  spo2: number;            // %
  respiratoryRate: number; // breaths/min
  temperature: number;     // °C
  egfr: number;            // mL/min/1.73m² (CKD)
  urineProtein: number;    // g/24h (CKD)
}

export interface LogEntry {
  id: string;
  patientId: string;
  timestamp: string; // ISO string
  diseaseType: ChronicDiseaseType;
  vitals: Partial<VitalState>;
  symptoms: string[];
  medTaken: boolean;
  notes: string;
}

export interface UserThresholds {
  bpSystolicMax: number;
  bpDiastolicMax: number;
  glucoseMax: number;
  glucoseMin: number;
  spo2Min: number;
  egfrMin: number;
}

export interface AIAnalysisResponse {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  statusSummary: string;
  abnormalAnalysis: string[];
  lifestyleAdvice: string[];
  dietaryAdjustments: string[];
  medicationAlerts: string;
  consultationNeeded: boolean;
  timestamp: string;
}
