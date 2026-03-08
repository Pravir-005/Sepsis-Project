import { Router, Request, Response } from 'express';
import { getPatients, getPatientById, updatePatientInDb } from '../db/database';
import { authenticate } from '../middleware/auth';
import { simulateVitalsDrift } from '../services/aiRisk';

const router = Router();

router.use(authenticate);

// GET /api/vitals/live
router.get('/live', (_req: Request, res: Response): void => {
    const snapshot = getPatients().map(p => ({
        id: p.id, name: p.name, room: p.room, ward: p.ward,
        vitals: p.vitals, riskScore: p.riskScore, trend: p.trend,
        lactate: p.lactate, sofa: p.sofa, lastUpdated: p.lastUpdated,
    }));
    res.json({ success: true, timestamp: new Date().toISOString(), vitals: snapshot });
});

// GET /api/vitals/:patientId
router.get('/:patientId', (req: Request, res: Response): void => {
    const patient = getPatientById(parseInt(req.params.patientId));
    if (!patient) {
        res.status(404).json({ success: false, message: 'Patient not found' });
        return;
    }
    res.json({
        success: true,
        patientId: patient.id,
        vitals: patient.vitals,
        riskScore: patient.riskScore,
        lactate: patient.lactate,
        sofa: patient.sofa,
        trend: patient.trend,
    });
});

// POST /api/vitals/simulate
router.post('/simulate', (_req: Request, res: Response): void => {
    const patients = getPatients();
    const updated = patients.map(p => {
        const newVitals = simulateVitalsDrift(p.vitals, p.trend);
        updatePatientInDb(p.id, { vitals: newVitals, lastUpdated: new Date().toISOString() });
        return { id: p.id, vitals: newVitals };
    });
    res.json({ success: true, message: 'Vitals simulated', updated });
});

export default router;
