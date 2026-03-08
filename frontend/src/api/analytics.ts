import client from './client';

export interface AnalyticsSummary {
    totalPatients: number;
    criticalCount: number;
    moderateCount: number;
    lowCount: number;
    avgRiskScore: number;
    improvingCount: number;
    deterioratingCount: number;
    stableCount: number;
    activeAlerts: number;
    criticalAlerts: number;
    aiAccuracy: number;
    avgSofa: number;
    avgLactate: number;
}

export async function getSummary() {
    const { data } = await client.get<{ success: boolean; summary: AnalyticsSummary }>('/analytics/summary');
    return data.summary;
}

export async function getHourlyRisk() {
    const { data } = await client.get<{ success: boolean; data: { hour: string; avgRisk: number }[] }>('/analytics/hourly-risk');
    return data.data;
}

export async function getHourlyAlerts() {
    const { data } = await client.get<{ success: boolean; data: { hour: string; count: number }[] }>('/analytics/hourly-alerts');
    return data.data;
}

export async function getRiskDistribution() {
    const { data } = await client.get<{
        success: boolean;
        distribution: { label: string; value: number; color: string; pct: number }[]
    }>('/analytics/risk-distribution');
    return data.distribution;
}

export async function getLeaderboard() {
    const { data } = await client.get('/analytics/leaderboard');
    return data.leaderboard;
}
