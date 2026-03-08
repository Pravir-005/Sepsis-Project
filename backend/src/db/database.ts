import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// ── Path Setup ──────────────────────────────────────────────────────────────
const dbDir = path.resolve(process.env.DATABASE_DIR || './data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'sepsis.db');
const db: InstanceType<typeof Database> = new Database(dbPath);

// Enable WAL mode for performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    username   TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'nurse',
    name       TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'General',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS patients (
    id            INTEGER PRIMARY KEY,
    name          TEXT NOT NULL,
    age           INTEGER NOT NULL,
    gender        TEXT NOT NULL,
    room          TEXT NOT NULL,
    ward          TEXT NOT NULL,
    risk_score    REAL NOT NULL DEFAULT 0,
    trend         TEXT NOT NULL DEFAULT 'stable',
    diagnosis     TEXT NOT NULL,
    physician     TEXT NOT NULL,
    admitted_at   TEXT NOT NULL,
    sofa          INTEGER NOT NULL DEFAULT 0,
    lactate       REAL NOT NULL DEFAULT 1.0,
    last_updated  TEXT NOT NULL,
    -- Stored as JSON strings
    vitals_json       TEXT NOT NULL DEFAULT '{}',
    ai_insights_json  TEXT NOT NULL DEFAULT '[]',
    risk_history_json TEXT NOT NULL DEFAULT '[]',
    medications_json  TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id           TEXT PRIMARY KEY,
    patient_id   INTEGER NOT NULL DEFAULT 0,
    patient_name TEXT NOT NULL DEFAULT 'System',
    room         TEXT NOT NULL DEFAULT '-',
    level        TEXT NOT NULL,
    message      TEXT NOT NULL,
    time_label   TEXT NOT NULL DEFAULT 'just now',
    dismissed    INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vitals_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    vitals_json TEXT NOT NULL,
    risk_score REAL NOT NULL,
    logged_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── Seed Users ───────────────────────────────────────────────────────────────
function seedUsers() {
    const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
    if (count > 0) return;

    const hash = bcrypt.hashSync('password123', 10);
    const ins = db.prepare(`
        INSERT INTO users (id, username, password_hash, role, name, department)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    ins.run(uuidv4(), 'doctor', hash, 'doctor', 'Dr. Kavya Mahesh', 'ICU');
    ins.run(uuidv4(), 'nurse', hash, 'nurse', 'Nurse Priya R.', 'ICU');
    ins.run(uuidv4(), 'admin', hash, 'admin', 'Admin Suresh K.', 'IT');
    console.log('[DB] Users seeded');
}

// ── Seed Patients ────────────────────────────────────────────────────────────
function seedPatients() {
    const count = (db.prepare('SELECT COUNT(*) as c FROM patients').get() as { c: number }).c;
    if (count > 0) return;

    const ins = db.prepare(`
        INSERT INTO patients (id, name, age, gender, room, ward, risk_score, trend, diagnosis,
            physician, admitted_at, sofa, lactate, last_updated,
            vitals_json, ai_insights_json, risk_history_json, medications_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const d = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();

    const rh = (pairs: [string, number][]) => JSON.stringify(pairs.map(([time, score]) => ({ time, score })));

    ins.run(1, 'R. Meenakshi', 67, 'F', 'ICU-01', 'ICU', 0.87, 'rising',
        'Suspected Gram-negative sepsis, post-surgical', 'Dr. A. Krishnamurthy', d(48), 9, 4.2, now,
        JSON.stringify({ hr: 118, bp: '88/60', spo2: 92, temp: 39.2, rr: 28, map: 69 }),
        JSON.stringify(['Lactate rising — consider early fluids & vasopressors', 'WBC trend suggests gram-negative origin', 'SpO₂ declining — evaluate for ARDS']),
        rh([['06:00', 0.55], ['08:00', 0.60], ['10:00', 0.68], ['12:00', 0.74], ['14:00', 0.80], ['16:00', 0.87]]),
        JSON.stringify(['Piperacillin-Tazobactam 4.5g IV', 'Norepinephrine 0.1 mcg/kg/min', 'Hydrocortisone 200mg/day']));

    ins.run(2, 'A. Selvakumar', 54, 'M', 'ICU-07', 'ICU', 0.82, 'stable',
        'Urosepsis with AKI', 'Dr. S. Lakshmi', d(24), 8, 3.1, now,
        JSON.stringify({ hr: 112, bp: '90/64', spo2: 93, temp: 38.8, rr: 24, map: 73 }),
        JSON.stringify(['Creatinine doubling in 24h — renal replacement therapy may be needed', 'Blood cultures pending — empiric coverage adequate']),
        rh([['06:00', 0.80], ['08:00', 0.84], ['10:00', 0.82], ['12:00', 0.83], ['14:00', 0.81], ['16:00', 0.82]]),
        JSON.stringify(['Meropenem 1g IV q8h', 'Furosemide 40mg IV', 'Vasopressin 0.03 units/min']));

    ins.run(3, 'P. Jayalakshmi', 71, 'F', 'ICU-12', 'ICU', 0.68, 'falling',
        'Sepsis secondary to pneumonia', 'Dr. R. Narayanan', d(72), 6, 2.1, now,
        JSON.stringify({ hr: 96, bp: '102/70', spo2: 95, temp: 38.1, rr: 20, map: 81 }),
        JSON.stringify(['Responding to antibiotics — Consider step-down in 24–48h', 'CRP declining — positive trajectory']),
        rh([['06:00', 0.80], ['08:00', 0.78], ['10:00', 0.74], ['12:00', 0.71], ['14:00', 0.70], ['16:00', 0.68]]),
        JSON.stringify(['Ceftriaxone 2g IV OD', 'Azithromycin 500mg OD', 'Low-dose Norepinephrine']));

    ins.run(4, 'K. Rajan', 45, 'M', 'GEN-02', 'General', 0.45, 'stable',
        'Soft-tissue infection, cellulitis', 'Dr. M. Venkatesan', d(48), 3, 1.4, now,
        JSON.stringify({ hr: 88, bp: '118/76', spo2: 97, temp: 37.8, rr: 18, map: 90 }),
        JSON.stringify(['Vitals stabilising — monitor for spreading infection', 'IV antibiotics effective, oral switch in 48h feasible']),
        rh([['06:00', 0.50], ['08:00', 0.48], ['10:00', 0.46], ['12:00', 0.45], ['14:00', 0.45], ['16:00', 0.45]]),
        JSON.stringify(['Amoxicillin-Clavulanate 1.2g IV', 'Paracetamol 1g q6h']));

    ins.run(5, 'S. Dharani', 38, 'F', 'GEN-08', 'General', 0.22, 'falling',
        'Post-op monitoring, stable', 'Dr. A. Krishnamurthy', d(24), 1, 0.8, now,
        JSON.stringify({ hr: 78, bp: '122/80', spo2: 99, temp: 37.2, rr: 16, map: 94 }),
        JSON.stringify(['Low sepsis risk — routine monitoring sufficient', 'Early ambulation recommended']),
        rh([['06:00', 0.30], ['08:00', 0.28], ['10:00', 0.25], ['12:00', 0.24], ['14:00', 0.23], ['16:00', 0.22]]),
        JSON.stringify(['Paracetamol 500mg q8h', 'Pantoprazole 40mg OD']));

    ins.run(6, 'T. Balakrishnan', 60, 'M', 'CCU-03', 'CCU', 0.73, 'rising',
        'Sepsis with cardiac depression', 'Dr. S. Lakshmi', d(12), 7, 2.8, now,
        JSON.stringify({ hr: 104, bp: '94/62', spo2: 94, temp: 38.6, rr: 22, map: 73 }),
        JSON.stringify(['Troponin elevated — cardiology consult advised', 'Fluid balance critical — cautious resuscitation', 'Echo shows reduced EF, consider dobutamine']),
        rh([['06:00', 0.60], ['08:00', 0.64], ['10:00', 0.67], ['12:00', 0.70], ['14:00', 0.72], ['16:00', 0.73]]),
        JSON.stringify(['Vancomycin 1g IV q12h', 'Dobutamine 5 mcg/kg/min', 'Enoxaparin 40mg SC']));

    console.log('[DB] Patients seeded');
}

// ── Seed Alerts ──────────────────────────────────────────────────────────────
function seedAlerts() {
    const count = (db.prepare('SELECT COUNT(*) as c FROM alerts').get() as { c: number }).c;
    if (count > 0) return;

    const ins = db.prepare(`
        INSERT INTO alerts (id, patient_id, patient_name, room, level, message, time_label, dismissed, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const t = (min: number) => new Date(Date.now() - min * 60 * 1000).toISOString();

    ins.run(uuidv4(), 1, 'R. Meenakshi', 'ICU-01', 'critical',
        'Sepsis risk score crossed 85% — immediate intervention required. Lactate >4 mmol/L detected.',
        '2 min ago', 0, t(2));
    ins.run(uuidv4(), 6, 'T. Balakrishnan', 'CCU-03', 'critical',
        'Rising risk trend — 13-point increase in last 2 hours. Troponin elevated.',
        '8 min ago', 0, t(8));
    ins.run(uuidv4(), 2, 'A. Selvakumar', 'ICU-07', 'warn',
        'Creatinine rising — possible acute kidney injury. Urine output dropping.',
        '22 min ago', 0, t(22));
    ins.run(uuidv4(), 3, 'P. Jayalakshmi', 'ICU-12', 'info',
        'Risk score improving. Antibiotic course showing effect — CRP declining.',
        '40 min ago', 0, t(40));
    ins.run(uuidv4(), 4, 'K. Rajan', 'GEN-02', 'warn',
        'Temperature spike to 38.8°C — monitor for secondary infection.',
        '1 hr ago', 0, t(60));

    console.log('[DB] Alerts seeded');
}

// ── Run Seed ─────────────────────────────────────────────────────────────────
seedUsers();
seedPatients();
seedAlerts();
console.log(`[DB] SQLite database ready at ${dbPath}`);

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DbPatient {
    id: number;
    name: string;
    age: number;
    gender: 'M' | 'F';
    room: string;
    ward: string;
    risk_score: number;
    trend: 'rising' | 'stable' | 'falling';
    diagnosis: string;
    physician: string;
    admitted_at: string;
    sofa: number;
    lactate: number;
    last_updated: string;
    vitals_json: string;
    ai_insights_json: string;
    risk_history_json: string;
    medications_json: string;
}

export interface DbAlert {
    id: string;
    patient_id: number;
    patient_name: string;
    room: string;
    level: 'critical' | 'warn' | 'info';
    message: string;
    time_label: string;
    dismissed: number;
    created_at: string;
}

export interface DbUser {
    id: string;
    username: string;
    password_hash: string;
    role: 'doctor' | 'nurse' | 'admin';
    name: string;
    department: string;
}

// ── Raw row → rich Patient ────────────────────────────────────────────────────
function rowToPatient(row: DbPatient) {
    return {
        id: row.id,
        name: row.name,
        age: row.age,
        gender: row.gender as 'M' | 'F',
        room: row.room,
        ward: row.ward,
        riskScore: row.risk_score,
        trend: row.trend as 'rising' | 'stable' | 'falling',
        diagnosis: row.diagnosis,
        physician: row.physician,
        admittedAt: row.admitted_at,
        sofa: row.sofa,
        lactate: row.lactate,
        lastUpdated: row.last_updated,
        vitals: JSON.parse(row.vitals_json),
        aiInsights: JSON.parse(row.ai_insights_json),
        riskHistory: JSON.parse(row.risk_history_json),
        medications: JSON.parse(row.medications_json),
    };
}

function rowToAlert(row: DbAlert) {
    return {
        id: row.id,
        patientId: row.patient_id,
        patientName: row.patient_name,
        room: row.room,
        level: row.level,
        message: row.message,
        time: row.time_label,
        dismissed: row.dismissed === 1,
        createdAt: new Date(row.created_at),
    };
}

// ── User Helpers ──────────────────────────────────────────────────────────────
export function findUserByUsername(username: string) {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as DbUser | undefined;
    if (!row) return null;
    return { id: row.id, username: row.username, passwordHash: row.password_hash, role: row.role, name: row.name, department: row.department };
}

export function findUserById(id: string) {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined;
    if (!row) return null;
    return { id: row.id, username: row.username, passwordHash: row.password_hash, role: row.role, name: row.name, department: row.department };
}

// ── Patient Helpers ───────────────────────────────────────────────────────────
export function getPatients() {
    const rows = db.prepare('SELECT * FROM patients ORDER BY risk_score DESC').all() as DbPatient[];
    return rows.map(rowToPatient);
}

export function getPatientById(id: number) {
    const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as DbPatient | undefined;
    return row ? rowToPatient(row) : null;
}

export function addPatientToDb(data: {
    name: string;
    age: number;
    gender: 'M' | 'F';
    room: string;
    ward: string;
    riskScore: number;
    trend: 'rising' | 'stable' | 'falling';
    diagnosis: string;
    physician: string;
    admittedAt: string;
    sofa: number;
    lactate: number;
    vitals: object;
    aiInsights: string[];
    medications: string[];
}) {
    const now = new Date().toISOString();
    // Get next ID
    const maxRow = db.prepare('SELECT MAX(id) as maxId FROM patients').get() as { maxId: number | null };
    const nextId = (maxRow.maxId || 0) + 1;
    const rh = [{ time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), score: data.riskScore }];
    db.prepare(`
        INSERT INTO patients (id, name, age, gender, room, ward, risk_score, trend, diagnosis,
            physician, admitted_at, sofa, lactate, last_updated,
            vitals_json, ai_insights_json, risk_history_json, medications_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        nextId, data.name, data.age, data.gender, data.room, data.ward,
        data.riskScore, data.trend, data.diagnosis, data.physician,
        data.admittedAt, data.sofa, data.lactate, now,
        JSON.stringify(data.vitals),
        JSON.stringify(data.aiInsights),
        JSON.stringify(rh),
        JSON.stringify(data.medications)
    );
    return getPatientById(nextId);
}

export function updatePatientInDb(id: number, fields: {
    vitals?: object;
    riskScore?: number;
    trend?: string;
    lactate?: number;
    aiInsights?: string[];
    riskHistory?: object[];
    lastUpdated?: string;
}) {
    const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as DbPatient | undefined;
    if (!row) return null;

    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (fields.vitals !== undefined) { updates.push('vitals_json = ?'); params.push(JSON.stringify(fields.vitals)); }
    if (fields.riskScore !== undefined) { updates.push('risk_score = ?'); params.push(fields.riskScore); }
    if (fields.trend !== undefined) { updates.push('trend = ?'); params.push(fields.trend); }
    if (fields.lactate !== undefined) { updates.push('lactate = ?'); params.push(fields.lactate); }
    if (fields.aiInsights !== undefined) { updates.push('ai_insights_json = ?'); params.push(JSON.stringify(fields.aiInsights)); }
    if (fields.riskHistory !== undefined) { updates.push('risk_history_json = ?'); params.push(JSON.stringify(fields.riskHistory)); }
    if (fields.lastUpdated !== undefined) { updates.push('last_updated = ?'); params.push(fields.lastUpdated); }

    if (updates.length === 0) return rowToPatient(row);

    params.push(id);
    db.prepare(`UPDATE patients SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return getPatientById(id);
}

// ── Alert Helpers ─────────────────────────────────────────────────────────────
export function getAlerts() {
    const rows = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC').all() as DbAlert[];
    return rows.map(rowToAlert);
}

export function getAlertById(id: string) {
    const row = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as DbAlert | undefined;
    return row ? rowToAlert(row) : null;
}

export function createAlertInDb(data: {
    id: string;
    patientId: number;
    patientName: string;
    room: string;
    level: 'critical' | 'warn' | 'info';
    message: string;
}) {
    const now = new Date().toISOString();
    db.prepare(`
        INSERT INTO alerts (id, patient_id, patient_name, room, level, message, time_label, dismissed, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'just now', 0, ?)
    `).run(data.id, data.patientId, data.patientName, data.room, data.level, data.message, now);
    return getAlertById(data.id);
}

export function dismissAlertInDb(id: string) {
    db.prepare('UPDATE alerts SET dismissed = 1 WHERE id = ?').run(id);
    return getAlertById(id);
}

export function dismissAllAlertsInDb() {
    db.prepare('UPDATE alerts SET dismissed = 1 WHERE dismissed = 0').run();
}

export function deleteAlertInDb(id: string) {
    db.prepare('DELETE FROM alerts WHERE id = ?').run(id);
}

export function alertExistsByPatientRecent(patientId: number, level: string, withinMs: number): boolean {
    const sinceIso = new Date(Date.now() - withinMs).toISOString();
    const row = db.prepare(
        `SELECT id FROM alerts WHERE patient_id = ? AND level = ? AND dismissed = 0 AND created_at >= ?`
    ).get(patientId, level, sinceIso);
    return !!row;
}

// ── Create User ───────────────────────────────────────────────────────────────
export function createUser(data: {
    id: string;
    username: string;
    passwordHash: string;
    role: 'doctor' | 'nurse' | 'admin';
    name: string;
    department: string;
}) {
    db.prepare(`
        INSERT INTO users (id, username, password_hash, role, name, department)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.id, data.username, data.passwordHash, data.role, data.name, data.department);
    return findUserById(data.id);
}

export { db };

