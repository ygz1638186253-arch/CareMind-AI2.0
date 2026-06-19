/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with recommended user-agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API endpoints FIRST
app.post('/api/ai-assess', async (req, res) => {
  try {
    const { diseaseType, patientProfile, currentVitals, recentLogs, symptoms, notes } = req.body;

    if (!diseaseType) {
       res.status(400).json({ error: 'Missing diseaseType parameters' });
       return;
    }

    // Compose prompt incorporating user medical state, vitals and historical log trends
    const prompt = `
      You are an expert clinical consultant and specialized physician in managing key chronic illnesses.
      Your mandate is to perform an objective, precision medical evaluation of the patient's current simulated telemetry data.
      
      [Patient Demographic Profile]
      Name/Alias: ${patientProfile?.name || 'Anonymous'}
      Age: ${patientProfile?.age || 'N/A'}
      Gender: ${patientProfile?.gender || 'N/A'}
      Disease Category: ${diseaseType} (Duration: Since Year ${patientProfile?.diagnosedYear || 'N/A'})
      Active Prescription Regime: ${patientProfile?.medications ? patientProfile.medications.join(', ') : 'None logged'}

      [Current Live Telemetry Readings]
      - Heart Rate: ${currentVitals?.heartRate} bpm
      - Blood Pressure: ${currentVitals?.bloodPressureSystolic}/${currentVitals?.bloodPressureDiastolic} mmHg
      - Blood Glucose: ${currentVitals?.bloodGlucose} mmol/L (Normal range: 4.0 - 7.0 fasting, < 10.0 post-meal)
      - SpO2 (Oxygen Sat): ${currentVitals?.spo2} % (Normal: 95% - 100%, lower targets for serious COPD patients under physician advice)
      - Respiratory Rate: ${currentVitals?.respiratoryRate} breaths/min
      - Body Temperature: ${currentVitals?.temperature} °C
      - Kidney eGFR: ${currentVitals?.egfr || 'N/A'} mL/min/1.73m² (Normal: >90, lower indicates various CKD stages)
      - Urine Protein (24h): ${currentVitals?.urineProtein || 'N/A'} g/24h

      [Patient Submissions & Symptoms]
      Symptoms declared: ${symptoms && symptoms.length > 0 ? symptoms.join(', ') : 'None registered'}
      Personal Diary/Notes: ${notes || 'No extra notes.'}

      [Historical Data Context (Recent Records)]
      ${JSON.stringify(recentLogs || [])}

      [Evaluation Directives (IMPORTANT)]
      1. Choose riskLevel matching standard triage classifications: LOW, MEDIUM, HIGH, or CRITICAL.
      2. Keep statusSummary clear, human, direct. Focus on the core clinical state.
      3. Focus abnormalAnalysis strictly on which telemetry parameters deviate from standard guideline safety targets (e.g. AHA for Hypertension, ADA/AACE for Diabetes, GOLD for COPD, KDIGO for Chronic Kidney Disease).
      4. Provide actionable, practical lifestyleAdvice (salt restriction, movement, fluid monitoring, etc.) and dietaryAdjustments.
      5. Formulate logical, risk-free medicationAlerts (reminders to adhere to current plans, warnings not to double up if a dose is skipped, advice to contact a physician immediately before modifying doses).
      6. If heart rate, Systolic BP, glucose, or oxygen drops/spikes fall in life-threatening levels (e.g. SpO2 < 88%, BP > 180/120, Glucose < 3.0 or > 20.0), flag consultationNeeded as true.
    `;

    // Strict clinical tone
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `
          You are an advanced, empathetic, and objective Medical Advisor specializing in chronic care pathways.
          Provide structured health analysis based strictly on physiological telemetry parameters.
          Avoid meta-talk, sales pitches, and fluff. Rely on recognized international medical guidelines (AHA, ESC, ADA, KDIGO, GOLD).
          Provide feedback in simplified Chinese (简体中文). Ensure all answers are returned inside the specified JSON schema.
        `,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'riskLevel',
            'statusSummary',
            'abnormalAnalysis',
            'lifestyleAdvice',
            'dietaryAdjustments',
            'medicationAlerts',
            'consultationNeeded',
            'timestamp'
          ],
          properties: {
            riskLevel: {
              type: Type.STRING,
              description: "The safety/clinical risk rating for the current parameters. Select: 'LOW', 'MEDIUM', 'HIGH', or 'CRITICAL'.",
            },
            statusSummary: {
              type: Type.STRING,
              description: "Brief direct summary of the patient's current chronic disease state, written in simplified Chinese."
            },
            abnormalAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "A list of specific physiological indicators that currently fail target guidelines, detailing why."
            },
            lifestyleAdvice: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Recommended active habits or daily modifications tailored to this specific disease state."
            },
            dietaryAdjustments: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable low-sugar, low-sodium, low-fluid, or protein-restricted adjustments as clinical guidelines suggest."
            },
            medicationAlerts: {
              type: Type.STRING,
              description: "Safety guidance on the user's logged medication schedule."
            },
            consultationNeeded: {
              type: Type.BOOLEAN,
              description: "True if parameters or symptoms meet high-risk clinical alert thresholds warranting urgent healthcare provider review."
            },
            timestamp: {
              type: Type.STRING,
              description: "Current ISO representation of report generation time."
            }
          },
        },
      },
    });

    const responseContent = response.text;
    res.setHeader('Content-Type', 'application/json');
    res.send(responseContent);

  } catch (err: any) {
    console.error('Gemini Assessment Fail:', err);
    res.status(500).json({
      error: '医学AI报告评估模块触发异常',
      details: err.message
    });
  }
});

// Vite middleware setup for full-stack build
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ChronicCare Server] Active on port ${PORT}`);
  });
}

startServer();
