import client from './client';

export interface Alert {
    id: string;
    patientId: number;
    patientName: string;
    room: string;
    level: 'critical' | 'warn' | 'info';
    message: string;
    time: string;
    dismissed: boolean;
    createdAt: Date;
}

export interface AlertCounts {
    total: number; active: number; critical: number;
    warn: number; info: number; dismissed: number;
}

export async function getAlerts() {
    const { data } = await client.get<{ success: boolean; counts: AlertCounts; alerts: Alert[] }>('/alerts');
    return data;
}

export async function dismissAlert(id: string) {
    const { data } = await client.patch(`/alerts/${id}/dismiss`);
    return data;
}

export async function dismissAllAlerts() {
    const { data } = await client.post('/alerts/dismiss-all');
    return data;
}

export async function deleteAlert(id: string) {
    const { data } = await client.delete(`/alerts/${id}`);
    return data;
}

export async function createAlert(patientName: string, room: string, level: 'critical' | 'warn' | 'info', message: string) {
    const { data } = await client.post<{ success: boolean; alert: Alert }>('/alerts', { patientName, room, level, message });
    return data.alert;
}
