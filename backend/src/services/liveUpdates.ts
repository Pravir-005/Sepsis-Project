import { Server as IOServer } from 'socket.io';
import { getPatients, updatePatientInDb, createAlertInDb, alertExistsByPatientRecent } from '../db/database';
import { calculateRisk, simulateVitalsDrift, generateInsights } from './aiRisk';
import { Patient } from '../db/store';
import { v4 as uuidv4 } from 'uuid';

let io: IOServer;
let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function initLiveUpdates(ioServer: IOServer): void {
    io = ioServer;

    io.on('connection', (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);

        // Send initial state immediately on connect
        const patients = getPatients();
        socket.emit('patients:initial', patients);
        const { getAlerts } = require('../db/database');
        socket.emit('alerts:initial', getAlerts().filter((a: any) => !a.dismissed));

        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        });
    });

    if (!intervalHandle) {
        intervalHandle = setInterval(() => broadcastUpdates(), 4000);
        console.log('[Socket.IO] Live update broadcaster started (4s interval)');
    }
}

function broadcastUpdates(): void {
    const patients = getPatients();

    const updatedPayload = patients.map(p => {
        const newVitals = simulateVitalsDrift(p.vitals, p.trend);
        const newLactate = parseFloat((Math.max(0.2, Math.min(8, p.lactate + (Math.random() - 0.48) * 0.15))).toFixed(2));
        const newRisk = calculateRisk(newVitals, p.trend as Patient['trend'], newLactate, p.riskScore);
        const delta = newRisk - p.riskScore;

        const newTrend: 'rising' | 'stable' | 'falling' =
            delta > 0.008 ? 'rising' : delta < -0.008 ? 'falling' : 'stable';

        const now = new Date();
        const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const newHistory = [...(p.riskHistory || []).slice(-23), { time: timeLabel, score: newRisk }];

        let newInsights = p.aiInsights;
        if (Math.abs(delta) > 0.05) {
            newInsights = generateInsights({ ...p, vitals: newVitals, riskScore: newRisk, trend: newTrend, lactate: newLactate } as any);
        }

        // Persist to DB
        updatePatientInDb(p.id, {
            vitals: newVitals,
            riskScore: newRisk,
            trend: newTrend,
            lactate: newLactate,
            aiInsights: newInsights,
            riskHistory: newHistory,
            lastUpdated: now.toISOString(),
        });

        // Auto-alert for risk > 90%
        if (newRisk > 0.9 && !alertExistsByPatientRecent(p.id, 'critical', 5 * 60 * 1000)) {
            const newAlert = createAlertInDb({
                id: uuidv4(),
                patientId: p.id,
                patientName: p.name,
                room: p.room,
                level: 'critical',
                message: `Risk score reached ${Math.round(newRisk * 100)}% — automated alert triggered by AI monitoring system.`,
            });
            if (newAlert) io.emit('alert:new', newAlert);
        }

        return {
            id: p.id,
            vitals: newVitals,
            riskScore: newRisk,
            trend: newTrend,
            lactate: newLactate,
            aiInsights: newInsights,
            lastUpdated: now.toISOString(),
        };
    });

    io.emit('vitals:update', updatedPayload);
}

export function stopLiveUpdates(): void {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
    }
}
