import { Router, Response } from 'express';
import { getPatients, getPatientById, updatePatientInDb, addPatientToDb } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateInsights, calculateRisk } from '../services/aiRisk';

const router = Router();

router.use(authenticate);

// POST /api/patients/risk-check — offline AI sepsis risk calculation (no DB write)
router.post('/risk-check', (req: AuthRequest, res: Response): void => {
    const { vitals, trend = 'stable', lactate = 1.0, sofa = 0, existingScore = 0.3 } = req.body;
    if (!vitals) {
        res.status(400).json({ success: false, message: 'vitals required' });
        return;
    }
    const riskScore = calculateRisk(vitals, trend, lactate, existingScore);
    const mockPatient = { vitals, riskScore, trend, lactate, sofa } as any;
    const insights = generateInsights(mockPatient);
    const level = riskScore > 0.7 ? 'critical' : riskScore > 0.4 ? 'moderate' : 'low';
    res.json({ success: true, riskScore: parseFloat(riskScore.toFixed(3)), level, insights });
});

// POST /api/patients — create a new patient
router.post('/', (req: AuthRequest, res: Response): void => {
    const { name, age, gender, room, ward, diagnosis, physician, admittedAt,
        sofa = 0, lactate = 1.0, trend = 'stable', vitals, medications = [] } = req.body;
    if (!name || !age || !gender || !room || !ward || !vitals) {
        res.status(400).json({ success: false, message: 'Missing required patient fields' });
        return;
    }
    const riskScore = calculateRisk(vitals, trend, lactate, 0.3);
    const mockPatient = { vitals, riskScore, trend, lactate, sofa } as any;
    const aiInsights = generateInsights(mockPatient);
    const patient = addPatientToDb({
        name, age: parseInt(age), gender, room, ward, diagnosis: diagnosis || 'Unspecified',
        physician: physician || 'Unassigned',
        admittedAt: admittedAt || new Date().toISOString(),
        sofa: parseInt(sofa), lactate: parseFloat(lactate),
        riskScore, trend, vitals, aiInsights, medications,
    });
    res.status(201).json({ success: true, message: 'Patient created', patient });
});

// GET /api/patients
router.get('/', (req: AuthRequest, res: Response): void => {
    const { filter, sort, ward } = req.query as { filter?: string; sort?: string; ward?: string };

    let list = getPatients();

    if (ward) list = list.filter(p => p.ward.toLowerCase() === ward.toLowerCase());

    switch (filter) {
        case 'critical': list = list.filter(p => p.riskScore > 0.7); break;
        case 'moderate': list = list.filter(p => p.riskScore > 0.4 && p.riskScore <= 0.7); break;
        case 'low': list = list.filter(p => p.riskScore <= 0.4); break;
    }

    switch (sort) {
        case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'room': list.sort((a, b) => a.room.localeCompare(b.room)); break;
        default: list.sort((a, b) => b.riskScore - a.riskScore); break;
    }

    const all = getPatients();
    const summary = {
        total: all.length,
        critical: all.filter(p => p.riskScore > 0.7).length,
        moderate: all.filter(p => p.riskScore > 0.4 && p.riskScore <= 0.7).length,
        low: all.filter(p => p.riskScore <= 0.4).length,
        avgRisk: parseFloat((all.reduce((s, p) => s + p.riskScore, 0) / all.length).toFixed(3)),
    };

    res.json({ success: true, summary, count: list.length, patients: list });
});

// GET /api/patients/:id
router.get('/:id', (req: AuthRequest, res: Response): void => {
    const patient = getPatientById(parseInt(req.params.id));
    if (!patient) {
        res.status(404).json({ success: false, message: 'Patient not found' });
        return;
    }
    res.json({ success: true, patient });
});

// GET /api/patients/:id/history
router.get('/:id/history', (req: AuthRequest, res: Response): void => {
    const patient = getPatientById(parseInt(req.params.id));
    if (!patient) {
        res.status(404).json({ success: false, message: 'Patient not found' });
        return;
    }
    res.json({ success: true, patientId: patient.id, history: patient.riskHistory });
});

// PUT /api/patients/:id/vitals
router.put('/:id/vitals', (req: AuthRequest, res: Response): void => {
    const patient = getPatientById(parseInt(req.params.id));
    if (!patient) {
        res.status(404).json({ success: false, message: 'Patient not found' });
        return;
    }

    const { hr, bp, spo2, temp, rr, map } = req.body as Partial<typeof patient.vitals>;
    const newVitals = { ...patient.vitals };
    if (hr !== undefined) newVitals.hr = hr;
    if (bp !== undefined) newVitals.bp = bp;
    if (spo2 !== undefined) newVitals.spo2 = spo2;
    if (temp !== undefined) newVitals.temp = temp;
    if (rr !== undefined) newVitals.rr = rr;
    if (map !== undefined) newVitals.map = map;

    const newInsights = generateInsights({ ...patient, vitals: newVitals });

    const updated = updatePatientInDb(patient.id, {
        vitals: newVitals,
        aiInsights: newInsights,
        lastUpdated: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Vitals updated', vitals: updated?.vitals, aiInsights: updated?.aiInsights });
});

// PATCH /api/patients/:id/insights
router.patch('/:id/insights', (req: AuthRequest, res: Response): void => {
    const patient = getPatientById(parseInt(req.params.id));
    if (!patient) {
        res.status(404).json({ success: false, message: 'Patient not found' });
        return;
    }
    const newInsights = generateInsights(patient as any);
    updatePatientInDb(patient.id, { aiInsights: newInsights });
    res.json({ success: true, aiInsights: newInsights });
});

export default router;
