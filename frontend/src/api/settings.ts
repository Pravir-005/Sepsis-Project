import client from './client';

export interface AppSettings {
    alerts: {
        criticalThreshold: number;
        warnThreshold: number;
        soundEnabled: boolean;
        autoDismissAfterMin: number;
    };
    ai: {
        sensitivity: 'conservative' | 'balanced' | 'aggressive';
        showInsights: boolean;
        insightDetailLevel: 'minimal' | 'standard' | 'verbose';
    };
    ui: {
        theme: 'dark' | 'light' | 'system';
        compactMode: boolean;
        patientCardView: 'grid' | 'table';
    };
    system: {
        hospitalName: string;
        timezone: string;
        version: string;
    };
}

export async function getSettings(): Promise<AppSettings> {
    const { data } = await client.get<{ success: boolean; settings: AppSettings }>('/settings');
    return data.settings;
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
    const { data } = await client.put<{ success: boolean; settings: AppSettings }>('/settings', partial);
    return data.settings;
}
