// Shared patient data used across Dashboard, PatientDetails, etc.

export interface Patient {
    id: number;
    name: string;
    age: number;
    gender: "M" | "F";
    room: string;
    ward: string;
    riskScore: number;
    trend: "rising" | "stable" | "falling";
    vitals: { hr: number; bp: string; spo2: number; temp: number };
    lastUpdated: string;
    diagnosis: string;
    aiInsights: string[];
    riskHistory: { time: string; score: number }[];
    medications: string[];
    physician: string;
}

export const PATIENTS: Patient[] = [
    {
        id: 1,
        name: "R. Meenakshi",
        age: 67,
        gender: "F",
        room: "ICU-01",
        ward: "ICU",
        riskScore: 0.87,
        trend: "rising",
        vitals: { hr: 118, bp: "88/60", spo2: 92, temp: 39.2 },
        lastUpdated: "2 min ago",
        diagnosis: "Suspected Gram-negative sepsis, post-surgical",
        aiInsights: [
            "Lactate rising — consider early fluids & vasopressors",
            "WBC trend suggests gram-negative origin",
            "SpO₂ declining — evaluate for ARDS",
            "High probability of ICU deterioration in next 6 hrs",
        ],
        riskHistory: [
            { time: "06:00", score: 0.55 }, { time: "08:00", score: 0.60 },
            { time: "10:00", score: 0.68 }, { time: "12:00", score: 0.74 },
            { time: "14:00", score: 0.80 }, { time: "16:00", score: 0.87 },
        ],
        medications: ["Piperacillin-Tazobactam 4.5g IV", "Norepinephrine 0.1 mcg/kg/min", "Hydrocortisone 200mg/day"],
        physician: "Dr. A. Krishnamurthy",
    },
    {
        id: 2,
        name: "A. Selvakumar",
        age: 54,
        gender: "M",
        room: "ICU-07",
        ward: "ICU",
        riskScore: 0.82,
        trend: "stable",
        vitals: { hr: 112, bp: "90/64", spo2: 93, temp: 38.8 },
        lastUpdated: "5 min ago",
        diagnosis: "Urosepsis with AKI",
        aiInsights: [
            "Creatinine doubling in 24h — renal replacement therapy may be needed",
            "Blood cultures pending — empiric coverage adequate",
            "Haemodynamics partially stabilised on current pressors",
        ],
        riskHistory: [
            { time: "06:00", score: 0.80 }, { time: "08:00", score: 0.84 },
            { time: "10:00", score: 0.82 }, { time: "12:00", score: 0.83 },
            { time: "14:00", score: 0.81 }, { time: "16:00", score: 0.82 },
        ],
        medications: ["Meropenem 1g IV q8h", "Furosemide 40mg IV", "Vasopressin 0.03 units/min"],
        physician: "Dr. S. Lakshmi",
    },
    {
        id: 3,
        name: "P. Jayalakshmi",
        age: 71,
        gender: "F",
        room: "ICU-12",
        ward: "ICU",
        riskScore: 0.68,
        trend: "falling",
        vitals: { hr: 96, bp: "102/70", spo2: 95, temp: 38.1 },
        lastUpdated: "8 min ago",
        diagnosis: "Sepsis secondary to pneumonia",
        aiInsights: [
            "Responding to antibiotics — Consider step-down in 24–48h",
            "CRP declining — positive trajectory",
            "Weaning vasopressors feasible",
        ],
        riskHistory: [
            { time: "06:00", score: 0.80 }, { time: "08:00", score: 0.78 },
            { time: "10:00", score: 0.74 }, { time: "12:00", score: 0.71 },
            { time: "14:00", score: 0.70 }, { time: "16:00", score: 0.68 },
        ],
        medications: ["Ceftriaxone 2g IV OD", "Azithromycin 500mg OD", "Low-dose Norepinephrine"],
        physician: "Dr. R. Narayanan",
    },
    {
        id: 4,
        name: "K. Rajan",
        age: 45,
        gender: "M",
        room: "GEN-02",
        ward: "General",
        riskScore: 0.45,
        trend: "stable",
        vitals: { hr: 88, bp: "118/76", spo2: 97, temp: 37.8 },
        lastUpdated: "12 min ago",
        diagnosis: "Soft-tissue infection, cellulitis",
        aiInsights: [
            "Vitals stabilising — monitor for spreading infection",
            "IV antibiotics effective, oral switch in 48h feasible",
        ],
        riskHistory: [
            { time: "06:00", score: 0.50 }, { time: "08:00", score: 0.48 },
            { time: "10:00", score: 0.46 }, { time: "12:00", score: 0.45 },
            { time: "14:00", score: 0.45 }, { time: "16:00", score: 0.45 },
        ],
        medications: ["Amoxicillin-Clavulanate 1.2g IV", "Paracetamol 1g q6h"],
        physician: "Dr. M. Venkatesan",
    },
    {
        id: 5,
        name: "S. Dharani",
        age: 38,
        gender: "F",
        room: "GEN-08",
        ward: "General",
        riskScore: 0.22,
        trend: "falling",
        vitals: { hr: 78, bp: "122/80", spo2: 99, temp: 37.2 },
        lastUpdated: "15 min ago",
        diagnosis: "Post-op monitoring, stable",
        aiInsights: [
            "Low sepsis risk — routine monitoring sufficient",
            "Early ambulation recommended",
        ],
        riskHistory: [
            { time: "06:00", score: 0.30 }, { time: "08:00", score: 0.28 },
            { time: "10:00", score: 0.25 }, { time: "12:00", score: 0.24 },
            { time: "14:00", score: 0.23 }, { time: "16:00", score: 0.22 },
        ],
        medications: ["Paracetamol 500mg q8h", "Pantoprazole 40mg OD"],
        physician: "Dr. A. Krishnamurthy",
    },
    {
        id: 6,
        name: "T. Balakrishnan",
        age: 60,
        gender: "M",
        room: "CCU-03",
        ward: "CCU",
        riskScore: 0.73,
        trend: "rising",
        vitals: { hr: 104, bp: "94/62", spo2: 94, temp: 38.6 },
        lastUpdated: "3 min ago",
        diagnosis: "Sepsis with cardiac depression",
        aiInsights: [
            "Troponin elevated — cardiology consult advised",
            "Fluid balance critical — cautious resuscitation",
            "Echo shows reduced EF, consider dobutamine",
        ],
        riskHistory: [
            { time: "06:00", score: 0.60 }, { time: "08:00", score: 0.64 },
            { time: "10:00", score: 0.67 }, { time: "12:00", score: 0.70 },
            { time: "14:00", score: 0.72 }, { time: "16:00", score: 0.73 },
        ],
        medications: ["Vancomycin 1g IV q12h", "Dobutamine 5 mcg/kg/min", "Enoxaparin 40mg SC"],
        physician: "Dr. S. Lakshmi",
    },
];
