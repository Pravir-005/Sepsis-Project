import { Router, Request, Response } from 'express';
import { getPatients, getAlerts } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/analytics/summary
router.get('/summary', (_req: Request, res: Response): void => {
    const patients = getPatients();
    const alerts = getAlerts();

    const critical = patients.filter(p => p.riskScore > 0.7);
    const moderate = patients.filter(p => p.riskScore > 0.4 && p.riskScore <= 0.7);
    const low = patients.filter(p => p.riskScore <= 0.4);
    const avgRisk = patients.reduce((s, p) => s + p.riskScore, 0) / patients.length;

    res.json({
        success: true,
        summary: {
            totalPatients: patients.length,
            criticalCount: critical.length,
            moderateCount: moderate.length,
            lowCount: low.length,
            avgRiskScore: parseFloat((avgRisk * 100).toFixed(1)),
            improvingCount: patients.filter(p => p.trend === 'falling').length,
            deterioratingCount: patients.filter(p => p.trend === 'rising').length,
            stableCount: patients.filter(p => p.trend === 'stable').length,
            activeAlerts: alerts.filter(a => !a.dismissed).length,
            criticalAlerts: alerts.filter(a => !a.dismissed && a.level === 'critical').length,
            aiAccuracy: 94.2,
            avgSofa: parseFloat((patients.reduce((s, p) => s + p.sofa, 0) / patients.length).toFixed(1)),
            avgLactate: parseFloat((patients.reduce((s, p) => s + p.lactate, 0) / patients.length).toFixed(2)),
        },
    });
});

// GET /api/analytics/hourly-risk
router.get('/hourly-risk', (_req: Request, res: Response): void => {
    const patients = getPatients();
    const base = patients.reduce((s, p) => s + p.riskScore, 0) / patients.length;
    const hours = Array.from({ length: 12 }, (_, i) => {
        const hour = (new Date().getHours() - 11 + i + 24) % 24;
        const variation = (Math.sin(i * 0.6) * 0.08) + (Math.random() - 0.5) * 0.04;
        return {
            hour: hour.toString().padStart(2, '0') + ':00',
            avgRisk: parseFloat(Math.min(0.99, Math.max(0.01, base + variation)).toFixed(3)),
        };
    });
    res.json({ success: true, data: hours });
});

// GET /api/analytics/hourly-alerts
router.get('/hourly-alerts', (_req: Request, res: Response): void => {
    const hours = Array.from({ length: 12 }, (_, i) => {
        const hour = (new Date().getHours() - 11 + i + 24) % 24;
        return {
            hour: hour.toString().padStart(2, '0') + ':00',
            count: Math.max(0, Math.floor(Math.random() * 5 + 1)),
        };
    });
    res.json({ success: true, data: hours });
});

// GET /api/analytics/risk-distribution
router.get('/risk-distribution', (_req: Request, res: Response): void => {
    const patients = getPatients();
    const critical = patients.filter(p => p.riskScore > 0.7).length;
    const moderate = patients.filter(p => p.riskScore > 0.4 && p.riskScore <= 0.7).length;
    const low = patients.filter(p => p.riskScore <= 0.4).length;

    res.json({
        success: true,
        distribution: [
            { label: 'Critical', value: critical, color: '#f87171', pct: parseFloat(((critical / patients.length) * 100).toFixed(1)) },
            { label: 'Moderate', value: moderate, color: '#fb923c', pct: parseFloat(((moderate / patients.length) * 100).toFixed(1)) },
            { label: 'Low Risk', value: low, color: '#34d399', pct: parseFloat(((low / patients.length) * 100).toFixed(1)) },
        ],
    });
});

// GET /api/analytics/leaderboard
router.get('/leaderboard', (_req: Request, res: Response): void => {
    const sorted = getPatients()
        .sort((a, b) => b.riskScore - a.riskScore)
        .map((p, i) => ({
            rank: i + 1,
            id: p.id, name: p.name, room: p.room, ward: p.ward,
            riskScore: p.riskScore, trend: p.trend, sofa: p.sofa, lactate: p.lactate,
        }));
    res.json({ success: true, leaderboard: sorted });
});

export default router;
