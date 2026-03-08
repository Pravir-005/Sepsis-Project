import { Router, Request, Response } from 'express';
import { getAlerts, getAlertById, createAlertInDb, dismissAlertInDb, dismissAllAlertsInDb, deleteAlertInDb, getPatientById } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticate);

// GET /api/alerts
router.get('/', (_req: Request, res: Response): void => {
    const all = getAlerts();
    const active = all.filter(a => !a.dismissed);
    const dismissed = all.filter(a => a.dismissed);

    res.json({
        success: true,
        counts: {
            total: all.length,
            active: active.length,
            critical: active.filter(a => a.level === 'critical').length,
            warn: active.filter(a => a.level === 'warn').length,
            info: active.filter(a => a.level === 'info').length,
            dismissed: dismissed.length,
        },
        alerts: all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    });
});

// POST /api/alerts
router.post('/', (req: AuthRequest, res: Response): void => {
    const { patientId, patientName: pNameRaw, room: roomRaw, level, message } = req.body as {
        patientId?: number;
        patientName?: string;
        room?: string;
        level?: 'critical' | 'warn' | 'info';
        message?: string;
    };

    if (!level || !message) {
        res.status(400).json({ success: false, message: 'level and message are required' });
        return;
    }

    const patient = patientId ? getPatientById(patientId) : undefined;

    const newAlert = createAlertInDb({
        id: uuidv4(),
        patientId: patient?.id ?? 0,
        patientName: patient?.name ?? pNameRaw ?? 'System',
        room: patient?.room ?? roomRaw ?? '—',
        level,
        message,
    });

    res.status(201).json({ success: true, alert: newAlert });
});

// PATCH /api/alerts/:id/dismiss
router.patch('/:id/dismiss', (_req: Request, res: Response): void => {
    const alert = getAlertById(_req.params.id);
    if (!alert) {
        res.status(404).json({ success: false, message: 'Alert not found' });
        return;
    }
    const updated = dismissAlertInDb(_req.params.id);
    res.json({ success: true, message: 'Alert dismissed', alert: updated });
});

// DELETE /api/alerts/:id
router.delete('/:id', (_req: Request, res: Response): void => {
    const alert = getAlertById(_req.params.id);
    if (!alert) {
        res.status(404).json({ success: false, message: 'Alert not found' });
        return;
    }
    deleteAlertInDb(_req.params.id);
    res.json({ success: true, message: 'Alert deleted' });
});

// POST /api/alerts/dismiss-all
router.post('/dismiss-all', (_req: Request, res: Response): void => {
    dismissAllAlertsInDb();
    res.json({ success: true, message: 'All alerts dismissed' });
});

export default router;
