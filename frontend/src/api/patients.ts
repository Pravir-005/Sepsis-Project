import client from './client';

export interface Vitals {
    hr: number;
    bp: string;
    spo2: number;
    temp: number;
    rr: number;
    map: number;
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
    riskHistory: { time: string; score: number }[];
    medications: string[];
    physician: string;
    admittedAt: string;
    sofa: number;
    lactate: number;
}

export interface PatientSummary {
    total: number; critical: number; moderate: number; low: number; avgRisk: number;
}

export async function getPatients(params?: { filter?: string; sort?: string; ward?: string }) {
    const { data } = await client.get<{ success: boolean; summary: PatientSummary; count: number; patients: Patient[] }>(
        '/patients', { params }
    );
    return data;
}

export async function getPatientById(id: number) {
    const { data } = await client.get<{ success: boolean; patient: Patient }>(`/patients/${id}`);
    return data.patient;
}

export async function getPatientHistory(id: number) {
    const { data } = await client.get<{ success: boolean; history: { time: string; score: number }[] }>(`/patients/${id}/history`);
    return data.history;
}

export async function updateVitals(id: number, vitals: Partial<Vitals>) {
    const { data } = await client.put(`/patients/${id}/vitals`, vitals);
    return data;
}

export async function refreshInsights(id: number) {
    const { data } = await client.patch(`/patients/${id}/insights`);
    return data;
}

export interface NewPatientInput {
    name: string;
    age: number;
    gender: 'M' | 'F';
    room: string;
    ward: string;
    diagnosis: string;
    physician: string;
    admittedAt: string;
    sofa: number;
    lactate: number;
    trend: 'rising' | 'stable' | 'falling';
    vitals: Vitals;
    medications: string[];
}

export async function createPatient(input: NewPatientInput) {
    const { data } = await client.post<{ success: boolean; patient: Patient }>('/patients', input);
    return data;
}

export async function runOfflineRiskCheck(input: {
    vitals: Vitals;
    trend: 'rising' | 'stable' | 'falling';
    lactate: number;
    sofa: number;
    existingScore?: number;
}) {
    const { data } = await client.post<{
        success: boolean;
        riskScore: number;
        level: 'critical' | 'moderate' | 'low';
        insights: string[];
    }>('/patients/risk-check', input);
    return data;
}
