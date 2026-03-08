import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// =========== TYPES ===========

export interface Vitals {
    hr: number;
    bp: string;
    spo2: number;
    temp: number;
    rr: number;       // respiratory rate
    map: number;      // mean arterial pressure
}

export interface RiskPoint {
    time: string;
    score: number;
}

export interface Patient {
    id: number;
    name: string;
    age: number;
    gender: 'M' | 'F';
    room: string;
    ward: string;
    riskScore: number;
    trend: 'rising' | 'stable' | 'falling';
    vitals: Vitals;
    lastUpdated: string;
    diagnosis: string;
    aiInsights: string[];
    riskHistory: RiskPoint[];
    medications: string[];
    physician: string;
    admittedAt: string;
    sofa: number;       // SOFA score
    lactate: number;    // mmol/L
}

export type AlertLevel = 'critical' | 'warn' | 'info';

export interface Alert {
    id: string;
    patientId: number;
    patientName: string;
    room: string;
    level: AlertLevel;
    message: string;
    time: string;
    dismissed: boolean;
    createdAt: Date;
}

export interface User {
    id: string;
    username: string;
    passwordHash: string;
    role: 'doctor' | 'nurse' | 'admin';
    name: string;
    department: string;
}

// =========== USERS ===========

const passwordHash = bcrypt.hashSync('password123', 10);

export const users: User[] = [
    { id: uuidv4(), username: 'doctor', passwordHash, role: 'doctor', name: 'Dr. Kavya Mahesh', department: 'ICU' },
    { id: uuidv4(), username: 'nurse', passwordHash, role: 'nurse', name: 'Nurse Priya R.', department: 'ICU' },
    { id: uuidv4(), username: 'admin', passwordHash, role: 'admin', name: 'Admin Suresh K.', department: 'IT' },
];

// =========== PATIENTS ===========

export const patients: Patient[] = [
    {
        id: 1,
        name: 'R. Meenakshi',
        age: 67,
        gender: 'F',
        room: 'ICU-01',
        ward: 'ICU',
        riskScore: 0.87,
        trend: 'rising',
        vitals: { hr: 118, bp: '88/60', spo2: 92, temp: 39.2, rr: 28, map: 69 },
        lastUpdated: new Date().toISOString(),
        diagnosis: 'Suspected Gram-negative sepsis, post-surgical',
        aiInsights: [
            'Lactate rising — consider early fluids & vasopressors',
            'WBC trend suggests gram-negative origin',
            'SpO₂ declining — evaluate for ARDS',
            'High probability of ICU deterioration in next 6 hrs',
        ],
        riskHistory: [
            { time: '06:00', score: 0.55 }, { time: '08:00', score: 0.60 },
            { time: '10:00', score: 0.68 }, { time: '12:00', score: 0.74 },
            { time: '14:00', score: 0.80 }, { time: '16:00', score: 0.87 },
        ],
        medications: ['Piperacillin-Tazobactam 4.5g IV', 'Norepinephrine 0.1 mcg/kg/min', 'Hydrocortisone 200mg/day'],
        physician: 'Dr. A. Krishnamurthy',
        admittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        sofa: 9,
        lactate: 4.2,
    },
    {
        id: 2,
        name: 'A. Selvakumar',
        age: 54,
        gender: 'M',
        room: 'ICU-07',
        ward: 'ICU',
        riskScore: 0.82,
        trend: 'stable',
        vitals: { hr: 112, bp: '90/64', spo2: 93, temp: 38.8, rr: 24, map: 73 },
        lastUpdated: new Date().toISOString(),
        diagnosis: 'Urosepsis with AKI',
        aiInsights: [
            'Creatinine doubling in 24h — renal replacement therapy may be needed',
            'Blood cultures pending — empiric coverage adequate',
            'Haemodynamics partially stabilised on current pressors',
        ],
        riskHistory: [
            { time: '06:00', score: 0.80 }, { time: '08:00', score: 0.84 },
            { time: '10:00', score: 0.82 }, { time: '12:00', score: 0.83 },
            { time: '14:00', score: 0.81 }, { time: '16:00', score: 0.82 },
        ],
        medications: ['Meropenem 1g IV q8h', 'Furosemide 40mg IV', 'Vasopressin 0.03 units/min'],
        physician: 'Dr. S. Lakshmi',
        admittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        sofa: 8,
        lactate: 3.1,
    },
    {
        id: 3,
        name: 'P. Jayalakshmi',
        age: 71,
        gender: 'F',
        room: 'ICU-12',
        ward: 'ICU',
        riskScore: 0.68,
        trend: 'falling',
        vitals: { hr: 96, bp: '102/70', spo2: 95, temp: 38.1, rr: 20, map: 81 },
        lastUpdated: new Date().toISOString(),
        diagnosis: 'Sepsis secondary to pneumonia',
        aiInsights: [
            'Responding to antibiotics — Consider step-down in 24–48h',
            'CRP declining — positive trajectory',
            'Weaning vasopressors feasible',
        ],
        riskHistory: [
            { time: '06:00', score: 0.80 }, { time: '08:00', score: 0.78 },
            { time: '10:00', score: 0.74 }, { time: '12:00', score: 0.71 },
            { time: '14:00', score: 0.70 }, { time: '16:00', score: 0.68 },
        ],
        medications: ['Ceftriaxone 2g IV OD', 'Azithromycin 500mg OD', 'Low-dose Norepinephrine'],
        physician: 'Dr. R. Narayanan',
        admittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        sofa: 6,
        lactate: 2.1,
    },
    {
        id: 4,
        name: 'K. Rajan',
        age: 45,
        gender: 'M',
        room: 'GEN-02',
        ward: 'General',
        riskScore: 0.45,
        trend: 'stable',
        vitals: { hr: 88, bp: '118/76', spo2: 97, temp: 37.8, rr: 18, map: 90 },
        lastUpdated: new Date().toISOString(),
        diagnosis: 'Soft-tissue infection, cellulitis',
        aiInsights: [
            'Vitals stabilising — monitor for spreading infection',
            'IV antibiotics effective, oral switch in 48h feasible',
        ],
        riskHistory: [
            { time: '06:00', score: 0.50 }, { time: '08:00', score: 0.48 },
            { time: '10:00', score: 0.46 }, { time: '12:00', score: 0.45 },
            { time: '14:00', score: 0.45 }, { time: '16:00', score: 0.45 },
        ],
        medications: ['Amoxicillin-Clavulanate 1.2g IV', 'Paracetamol 1g q6h'],
        physician: 'Dr. M. Venkatesan',
        admittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        sofa: 3,
        lactate: 1.4,
    },
    {
        id: 5,
        name: 'S. Dharani',
        age: 38,
        gender: 'F',
        room: 'GEN-08',
        ward: 'General',
        riskScore: 0.22,
        trend: 'falling',
        vitals: { hr: 78, bp: '122/80', spo2: 99, temp: 37.2, rr: 16, map: 94 },
        lastUpdated: new Date().toISOString(),
        diagnosis: 'Post-op monitoring, stable',
        aiInsights: [
            'Low sepsis risk — routine monitoring sufficient',
            'Early ambulation recommended',
        ],
        riskHistory: [
            { time: '06:00', score: 0.30 }, { time: '08:00', score: 0.28 },
            { time: '10:00', score: 0.25 }, { time: '12:00', score: 0.24 },
            { time: '14:00', score: 0.23 }, { time: '16:00', score: 0.22 },
        ],
        medications: ['Paracetamol 500mg q8h', 'Pantoprazole 40mg OD'],
        physician: 'Dr. A. Krishnamurthy',
        admittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        sofa: 1,
        lactate: 0.8,
    },
    {
        id: 6,
        name: 'T. Balakrishnan',
        age: 60,
        gender: 'M',
        room: 'CCU-03',
        ward: 'CCU',
        riskScore: 0.73,
        trend: 'rising',
        vitals: { hr: 104, bp: '94/62', spo2: 94, temp: 38.6, rr: 22, map: 73 },
        lastUpdated: new Date().toISOString(),
        diagnosis: 'Sepsis with cardiac depression',
        aiInsights: [
            'Troponin elevated — cardiology consult advised',
            'Fluid balance critical — cautious resuscitation',
            'Echo shows reduced EF, consider dobutamine',
        ],
        riskHistory: [
            { time: '06:00', score: 0.60 }, { time: '08:00', score: 0.64 },
            { time: '10:00', score: 0.67 }, { time: '12:00', score: 0.70 },
            { time: '14:00', score: 0.72 }, { time: '16:00', score: 0.73 },
        ],
        medications: ['Vancomycin 1g IV q12h', 'Dobutamine 5 mcg/kg/min', 'Enoxaparin 40mg SC'],
        physician: 'Dr. S. Lakshmi',
        admittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        sofa: 7,
        lactate: 2.8,
    },
];

// =========== ALERTS ===========

export const alerts: Alert[] = [
    {
        id: uuidv4(),
        patientId: 1,
        patientName: 'R. Meenakshi',
        room: 'ICU-01',
        level: 'critical',
        message: 'Sepsis risk score crossed 85% — immediate intervention required. Lactate >4 mmol/L detected.',
        time: '2 min ago',
        dismissed: false,
        createdAt: new Date(Date.now() - 2 * 60 * 1000),
    },
    {
        id: uuidv4(),
        patientId: 6,
        patientName: 'T. Balakrishnan',
        room: 'CCU-03',
        level: 'critical',
        message: 'Rising risk trend — 13-point increase in last 2 hours. Troponin elevated.',
        time: '8 min ago',
        dismissed: false,
        createdAt: new Date(Date.now() - 8 * 60 * 1000),
    },
    {
        id: uuidv4(),
        patientId: 2,
        patientName: 'A. Selvakumar',
        room: 'ICU-07',
        level: 'warn',
        message: 'Creatinine rising — possible acute kidney injury. Urine output dropping.',
        time: '22 min ago',
        dismissed: false,
        createdAt: new Date(Date.now() - 22 * 60 * 1000),
    },
    {
        id: uuidv4(),
        patientId: 3,
        patientName: 'P. Jayalakshmi',
        room: 'ICU-12',
        level: 'info',
        message: 'Risk score improving. Antibiotic course showing effect — CRP declining.',
        time: '40 min ago',
        dismissed: false,
        createdAt: new Date(Date.now() - 40 * 60 * 1000),
    },
    {
        id: uuidv4(),
        patientId: 4,
        patientName: 'K. Rajan',
        room: 'GEN-02',
        level: 'warn',
        message: 'Temperature spike to 38.8°C — monitor for secondary infection.',
        time: '1 hr ago',
        dismissed: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
    },
];
