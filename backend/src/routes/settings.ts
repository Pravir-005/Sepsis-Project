import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();
router.use(authenticate);

// Settings stored in a JSON file for simplicity
const settingsPath = path.resolve(process.env.DATABASE_DIR || './data', 'settings.json');

const defaultSettings = {
    alerts: {
        criticalThreshold: 70,
        warnThreshold: 40,
        soundEnabled: true,
        autoDismissAfterMin: 0,
    },
    ai: {
        sensitivity: 'balanced',
        showInsights: true,
        insightDetailLevel: 'standard',
    },
    ui: {
        theme: 'dark',
        compactMode: false,
        patientCardView: 'grid',
    },
    system: {
        hospitalName: 'SepsisGuard ICU',
        timezone: 'Asia/Kolkata',
        version: '1.0.0',
    },
};

function loadSettings() {
    try {
        if (!fs.existsSync(settingsPath)) {
            console.log('Creating default settings at:', settingsPath);
            fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
            return defaultSettings;
        }
        const data = fs.readFileSync(settingsPath, 'utf-8');
        if (!data.trim()) {
            console.log('Settings file is empty, writing defaults');
            fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
            return defaultSettings;
        }
        return { ...defaultSettings, ...JSON.parse(data) };
    } catch (err) {
        console.error('Error loading settings:', err);
        return defaultSettings;
    }
}

function saveSettings(data: object) {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error saving settings:', err);
        throw err;
    }
}

// GET /api/settings
router.get('/', (_req: AuthRequest, res: Response): void => {
    try {
        res.json({ success: true, settings: loadSettings() });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load settings' });
    }
});

// PUT /api/settings
router.put('/', (req: AuthRequest, res: Response): void => {
    try {
        const current = loadSettings();
        const merged = {
            alerts: { ...current.alerts, ...(req.body.alerts || {}) },
            ai: { ...current.ai, ...(req.body.ai || {}) },
            ui: { ...current.ui, ...(req.body.ui || {}) },
            system: { ...current.system, ...(req.body.system || {}) },
        };
        saveSettings(merged);
        res.json({ success: true, message: 'Settings saved', settings: merged });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to save settings' });
    }
});

export default router;
