import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { getPatients, createPatient, runOfflineRiskCheck } from "../api/patients";
import type { Patient, NewPatientInput, Vitals } from "../api/patients";

// ─── Toast helper ──────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    const bg = type === "success" ? "#22c55e" : "#f87171";
    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            background: bg, color: "#fff", padding: "12px 20px",
            borderRadius: 10, fontWeight: 600, fontSize: 13,
            boxShadow: "0 8px 30px rgba(0,0,0,0.3)", animation: "fadeUp 0.3s ease",
            display: "flex", alignItems: "center", gap: 10,
        }}>
            {type === "success" ? "✓" : "✗"} {msg}
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0, marginLeft: 4 }}>×</button>
        </div>
    );
}

// ─── Risk Check Result Panel ────────────────────────────────────────────────────
function RiskCheckPanel({ riskScore, level, insights }: { riskScore: number; level: string; insights: string[] }) {
    const color = level === "critical" ? "#f87171" : level === "moderate" ? "#fb923c" : "#34d399";
    return (
        <div style={{ background: `${color}10`, border: `1px solid ${color}33`, borderRadius: 12, padding: "16px 18px", marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
                <span style={{ fontWeight: 700, fontSize: 13, color }}>AI Risk Assessment Result</span>
                <span style={{ marginLeft: "auto", fontSize: 22, fontWeight: 900, color, fontFamily: "JetBrains Mono, monospace" }}>{Math.round(riskScore * 100)}%</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "1px", marginBottom: 6, textTransform: "uppercase" as const }}>
                {level} Risk · {insights.length} insights
            </div>
            <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column" as const, gap: 4 }}>
                {insights.map((ins, i) => (
                    <li key={i} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{ins}</li>
                ))}
            </ul>
        </div>
    );
}

// ─── Add Patient Modal ──────────────────────────────────────────────────────────
const emptyVitals: Vitals = { hr: 80, bp: "120/80", spo2: 98, temp: 37.0, rr: 16, map: 93 };

function AddPatientModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (p: Patient) => void }) {
    const [step, setStep] = useState(1); // 1 = basic info, 2 = vitals/clinical
    const [form, setForm] = useState({
        name: "", age: "", gender: "M" as "M" | "F",
        room: "", ward: "ICU",
        diagnosis: "", physician: "",
        admittedAt: new Date().toISOString().slice(0, 10),
        sofa: "0", lactate: "1.0",
        trend: "stable" as "rising" | "stable" | "falling",
        medications: "",
    });
    const [vitals, setVitals] = useState<Vitals>(emptyVitals);
    const [riskResult, setRiskResult] = useState<{ riskScore: number; level: string; insights: string[] } | null>(null);
    const [checking, setChecking] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = (k: string, v: string) => {
        setForm(f => ({ ...f, [k]: v }));
        setErrors(e => { const ne = { ...e }; delete ne[k]; return ne; });
    };
    const setV = (k: keyof Vitals, v: string) => setVitals(prev => ({ ...prev, [k]: k === "bp" ? v : parseFloat(v) || 0 }));

    const validateStep1 = () => {
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = "Required";
        if (!form.age || isNaN(parseInt(form.age))) errs.age = "Enter valid age";
        if (!form.room.trim()) errs.room = "Required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const runCheck = async () => {
        setChecking(true);
        try {
            const res = await runOfflineRiskCheck({
                vitals, trend: form.trend,
                lactate: parseFloat(form.lactate) || 1.0,
                sofa: parseInt(form.sofa) || 0,
            });
            setRiskResult(res);
        } catch {
            // offline fallback — calculate client-side
            const score = clientSideRisk(vitals, form.trend, parseFloat(form.lactate) || 1.0);
            setRiskResult({ riskScore: score, level: score > 0.7 ? "critical" : score > 0.4 ? "moderate" : "low", insights: ["Risk estimated offline — Verify with clinical assessment"] });
        } finally { setChecking(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const input: NewPatientInput = {
                name: form.name.trim(),
                age: parseInt(form.age),
                gender: form.gender,
                room: form.room.trim(),
                ward: form.ward,
                diagnosis: form.diagnosis || "Under Investigation",
                physician: form.physician || "Unassigned",
                admittedAt: new Date(form.admittedAt).toISOString(),
                sofa: parseInt(form.sofa) || 0,
                lactate: parseFloat(form.lactate) || 1.0,
                trend: form.trend,
                vitals,
                medications: form.medications ? form.medications.split(",").map(s => s.trim()).filter(Boolean) : [],
            };
            const res = await createPatient(input);
            if (res.success && res.patient) onSuccess(res.patient);
        } catch (e: any) {
            setErrors({ save: e?.response?.data?.message || "Failed to save patient" });
        } finally { setSaving(false); }
    };

    return (
        <div style={m.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={m.modal}>
                <div style={m.modalHeader}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>Add New Patient</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Step {step} of 2 — {step === 1 ? "Basic Information" : "Vitals & Clinical Data"}</div>
                    </div>
                    <button onClick={onClose} style={m.closeBtn}>✕</button>
                </div>

                {/* Step indicator */}
                <div style={{ display: "flex", gap: 8, padding: "0 24px 16px", borderBottom: "1px solid var(--border)" }}>
                    {[1, 2].map(s => (
                        <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? "#38bdf8" : "var(--border)", transition: "background 0.3s" }} />
                    ))}
                </div>

                <div style={m.modalBody}>
                    {step === 1 ? (
                        /* ── STEP 1: Basic Info ── */
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
                            <div style={m.row}>
                                <div style={m.field}>
                                    <label style={m.label}>Full Name *</label>
                                    <input style={{ ...m.input, borderColor: errors.name ? "#f87171" : undefined }}
                                        placeholder="e.g., P. Anitha" value={form.name} onChange={e => set("name", e.target.value)} />
                                    {errors.name && <span style={m.errText}>{errors.name}</span>}
                                </div>
                                <div style={{ ...m.field, flex: "0 0 90px" }}>
                                    <label style={m.label}>Age *</label>
                                    <input style={{ ...m.input, borderColor: errors.age ? "#f87171" : undefined }}
                                        type="number" min={1} max={120} placeholder="45" value={form.age} onChange={e => set("age", e.target.value)} />
                                    {errors.age && <span style={m.errText}>{errors.age}</span>}
                                </div>
                                <div style={{ ...m.field, flex: "0 0 90px" }}>
                                    <label style={m.label}>Gender *</label>
                                    <select style={m.input} value={form.gender} onChange={e => set("gender", e.target.value as "M" | "F")}>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                    </select>
                                </div>
                            </div>
                            <div style={m.row}>
                                <div style={m.field}>
                                    <label style={m.label}>Room *</label>
                                    <input style={{ ...m.input, borderColor: errors.room ? "#f87171" : undefined }}
                                        placeholder="e.g., ICU-05" value={form.room} onChange={e => set("room", e.target.value)} />
                                    {errors.room && <span style={m.errText}>{errors.room}</span>}
                                </div>
                                <div style={m.field}>
                                    <label style={m.label}>Ward</label>
                                    <select style={m.input} value={form.ward} onChange={e => set("ward", e.target.value)}>
                                        {["ICU", "CCU", "General", "Emergency", "NICU", "Pediatrics", "Surgery"].map(w => <option key={w}>{w}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={m.field}>
                                <label style={m.label}>Diagnosis</label>
                                <input style={m.input} placeholder="e.g., Suspected sepsis secondary to pneumonia" value={form.diagnosis} onChange={e => set("diagnosis", e.target.value)} />
                            </div>
                            <div style={m.row}>
                                <div style={m.field}>
                                    <label style={m.label}>Attending Physician</label>
                                    <input style={m.input} placeholder="e.g., Dr. R. Suresh" value={form.physician} onChange={e => set("physician", e.target.value)} />
                                </div>
                                <div style={m.field}>
                                    <label style={m.label}>Admission Date</label>
                                    <input style={m.input} type="date" value={form.admittedAt} onChange={e => set("admittedAt", e.target.value)} />
                                </div>
                            </div>
                            <div style={m.field}>
                                <label style={m.label}>Current Medications (comma-separated)</label>
                                <input style={m.input} placeholder="e.g., Piperacillin-Tazobactam 4.5g IV, Norepinephrine" value={form.medications} onChange={e => set("medications", e.target.value)} />
                            </div>
                        </div>
                    ) : (
                        /* ── STEP 2: Vitals & Clinical ── */
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", marginBottom: 2 }}>CURRENT VITALS</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                {([
                                    { k: "hr", label: "Heart Rate", unit: "bpm", type: "number", min: 20, max: 250 },
                                    { k: "bp", label: "Blood Pressure", unit: "mmHg", type: "text" },
                                    { k: "spo2", label: "SpO₂", unit: "%", type: "number", min: 50, max: 100 },
                                    { k: "temp", label: "Temperature", unit: "°C", type: "number", min: 33, max: 43, step: 0.1 },
                                    { k: "rr", label: "Resp. Rate", unit: "br/m", type: "number", min: 4, max: 60 },
                                    { k: "map", label: "MAP", unit: "mmHg", type: "number", min: 20, max: 160 },
                                ] as const).map(({ k, label, unit, type, ...rest }) => (
                                    <div key={k} style={m.field}>
                                        <label style={m.label}>{label} <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>({unit})</span></label>
                                        <input style={m.input} type={type} value={vitals[k as keyof Vitals]} placeholder={unit}
                                            onChange={e => setV(k as keyof Vitals, e.target.value)} {...rest} />
                                    </div>
                                ))}
                            </div>

                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", marginTop: 4, marginBottom: 2 }}>CLINICAL SCORES</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                <div style={m.field}>
                                    <label style={m.label}>SOFA Score</label>
                                    <input style={m.input} type="number" min={0} max={24} value={form.sofa} onChange={e => set("sofa", e.target.value)} />
                                </div>
                                <div style={m.field}>
                                    <label style={m.label}>Lactate (mmol/L)</label>
                                    <input style={m.input} type="number" min={0} max={20} step={0.1} value={form.lactate} onChange={e => set("lactate", e.target.value)} />
                                </div>
                                <div style={m.field}>
                                    <label style={m.label}>Clinical Trend</label>
                                    <select style={m.input} value={form.trend} onChange={e => set("trend", e.target.value as typeof form.trend)}>
                                        <option value="rising">↑ Rising</option>
                                        <option value="stable">→ Stable</option>
                                        <option value="falling">↓ Falling</option>
                                    </select>
                                </div>
                            </div>

                            {/* AI Risk Check button */}
                            <button onClick={runCheck} disabled={checking} style={{
                                background: "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(56,189,248,0.08))",
                                border: "1px solid rgba(56,189,248,0.3)", borderRadius: 10,
                                padding: "10px 16px", color: "#38bdf8", fontWeight: 700, fontSize: 13,
                                cursor: checking ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 10,
                                transition: "all 0.2s", opacity: checking ? 0.7 : 1,
                            }}>
                                <span style={{ fontSize: 16 }}>✦</span>
                                {checking ? "Calculating…" : "Run Sepsis Risk Check (AI)"}
                                <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(56,189,248,0.7)", fontWeight: 500 }}>Offline · No internet required</span>
                            </button>

                            {riskResult && (
                                <RiskCheckPanel riskScore={riskResult.riskScore} level={riskResult.level} insights={riskResult.insights} />
                            )}

                            {errors.save && (
                                <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171" }}>
                                    ⚠ {errors.save}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={m.modalFooter}>
                    {step === 1 ? (
                        <>
                            <button className="btn-ghost" onClick={onClose}>Cancel</button>
                            <button className="btn-primary" onClick={() => { if (validateStep1()) setStep(2); }}>
                                Next: Vitals & Clinical →
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
                            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                                {saving ? "Saving…" : "✓ Save Patient"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Client-side risk fallback (mirrors backend logic) ──────────────────────────
function clientSideRisk(vitals: Vitals, trend: string, lactate: number): number {
    const hr = vitals.hr > 130 ? 0.25 : vitals.hr > 110 ? 0.18 : vitals.hr > 90 ? 0.08 : 0.02;
    const spo2 = vitals.spo2 < 90 ? 0.30 : vitals.spo2 < 93 ? 0.20 : vitals.spo2 < 95 ? 0.10 : 0.01;
    const temp = vitals.temp > 39.5 ? 0.20 : vitals.temp > 38.5 ? 0.14 : vitals.temp > 38.0 ? 0.08 : vitals.temp < 36.0 ? 0.12 : 0.01;
    const map = vitals.map < 60 ? 0.28 : vitals.map < 70 ? 0.18 : vitals.map < 80 ? 0.08 : 0.01;
    const rr = vitals.rr > 30 ? 0.18 : vitals.rr > 25 ? 0.12 : vitals.rr > 20 ? 0.06 : 0.01;
    const lac = lactate > 4 ? 0.25 : lactate > 2 ? 0.12 : lactate > 1.5 ? 0.04 : 0.01;
    const tb = trend === "rising" ? 0.03 : trend === "falling" ? -0.04 : 0;
    const raw = hr + spo2 + temp + map + rr + lac + tb;
    return Math.min(Math.max(parseFloat((0.3 * 0.8 + raw * 0.2).toFixed(3)), 0.02), 0.99);
}

// ─── Main Patients Page ──────────────────────────────────────────────────────────
export default function Patients() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "critical" | "moderate" | "low">("all");
    const [sortBy, setSortBy] = useState<"risk" | "name" | "room">("risk");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [showAddModal, setShowAddModal] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await getPatients();
            setPatients(res.patients);
        } catch {
            setToast({ msg: "Failed to load patients", type: "error" });
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = patients
        .filter(p => {
            if (search) {
                const s = search.toLowerCase();
                return p.name.toLowerCase().includes(s) || p.room.toLowerCase().includes(s) || p.diagnosis.toLowerCase().includes(s);
            }
            return true;
        })
        .filter(p => filter === "all" ? true : filter === "critical" ? p.riskScore > 0.7 : filter === "moderate" ? (p.riskScore > 0.4 && p.riskScore <= 0.7) : p.riskScore <= 0.4)
        .sort((a, b) => sortBy === "risk" ? b.riskScore - a.riskScore : sortBy === "name" ? a.name.localeCompare(b.name) : a.room.localeCompare(b.room));

    const stats = [
        { label: "Total", value: patients.length, color: "#38bdf8" },
        { label: "Critical", value: patients.filter(p => p.riskScore > 0.7).length, color: "#f87171" },
        { label: "Moderate", value: patients.filter(p => p.riskScore > 0.4 && p.riskScore <= 0.7).length, color: "#fb923c" },
        { label: "Low / Stable", value: patients.filter(p => p.riskScore <= 0.4).length, color: "#34d399" },
    ];

    const handleNewPatient = (p: Patient) => {
        setPatients(prev => [p, ...prev]);
        setShowAddModal(false);
        setToast({ msg: `Patient "${p.name}" added successfully`, type: "success" });
    };

    return (
        <MainLayout>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            {showAddModal && <AddPatientModal onClose={() => setShowAddModal(false)} onSuccess={handleNewPatient} />}

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: 4 }}>Patients</h1>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Manage and monitor all admitted patients</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px" }}>
                    <span style={{ fontSize: 16 }}>+</span> Add New Patient
                </button>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                {stats.map(s => (
                    <div key={s.label} className="stat-card" style={{ borderTop: `2px solid ${s.color}` }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "JetBrains Mono, monospace" }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" as const, alignItems: "center" }}>
                {/* Search */}
                <div style={{ position: "relative" as const, flex: 1, minWidth: 200 }}>
                    <span style={{ position: "absolute" as const, left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--text-faint)" }}>🔍</span>
                    <input
                        style={{ ...m.input, paddingLeft: 34, width: "100%", boxSizing: "border-box" as const }}
                        placeholder="Search by name, room, or diagnosis…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {/* Filter */}
                {(["all", "critical", "moderate", "low"] as const).map(f => (
                    <button key={f} className={filter === f ? "btn-primary" : "btn-ghost"}
                        style={{ padding: "7px 14px", fontSize: 12 }} onClick={() => setFilter(f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
                <div style={{ width: 1, height: 24, background: "var(--border)" }} />
                {/* Sort */}
                <select style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-secondary)", padding: "7px 10px", fontSize: 12, cursor: "pointer", outline: "none" }}
                    value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
                    <option value="risk">Sort: Risk</option>
                    <option value="name">Sort: Name</option>
                    <option value="room">Sort: Room</option>
                </select>
                {/* View toggle */}
                <div style={{ display: "flex", gap: 4, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
                    {(["grid", "table"] as const).map(v => (
                        <button key={v} onClick={() => setViewMode(v)} style={{
                            padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
                            background: viewMode === v ? "#38bdf8" : "transparent",
                            color: viewMode === v ? "#fff" : "var(--text-muted)", transition: "all 0.15s",
                        }}>
                            {v === "grid" ? "⊞ Grid" : "☰ Table"}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)", fontSize: 14 }}>
                    <span style={{ fontSize: 28 }}>⏳</span><br />Loading patients…
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>No patients found</div>
                    <div style={{ fontSize: 13 }}>Try a different search or <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setShowAddModal(true)}>add a new patient</button></div>
                </div>
            ) : viewMode === "grid" ? (
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                    {filtered.map(p => {
                        const pct = Math.round(p.riskScore * 100);
                        const color = p.riskScore > 0.7 ? "#f87171" : p.riskScore > 0.4 ? "#fb923c" : "#34d399";
                        const label = p.riskScore > 0.7 ? "Critical" : p.riskScore > 0.4 ? "Moderate" : "Low Risk";
                        return (
                            <div key={p.id} onClick={() => navigate(`/patient/${p.id}`)} style={{
                                background: "var(--bg-card)", border: `1px solid var(--border)`,
                                borderRadius: 14, padding: "18px 20px", cursor: "pointer",
                                transition: "all 0.2s", borderTop: `2px solid ${color}`,
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{p.name}</div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{p.age}y · {p.gender === "M" ? "Male" : "Female"} · {p.room}</div>
                                    </div>
                                    <div style={{ textAlign: "right" as const }}>
                                        <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: "JetBrains Mono, monospace" }}>{pct}%</div>
                                        <div style={{ fontSize: 10, color, fontWeight: 600 }}>{label}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>{p.diagnosis}</div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span className="badge badge-accent" style={{ fontSize: 10 }}>{p.ward}</span>
                                    <span style={{ fontSize: 11, color: p.trend === "rising" ? "#f87171" : p.trend === "falling" ? "#34d399" : "var(--text-faint)", fontWeight: 600 }}>
                                        {p.trend === "rising" ? "↑ Rising" : p.trend === "falling" ? "↓ Falling" : "→ Stable"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                {["Patient", "Age/Gender", "Room · Ward", "Diagnosis", "Risk Score", "Trend", "Physician"].map(h => (
                                    <th key={h} style={{ padding: "12px 14px", fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase" as const, letterSpacing: "0.8px", textAlign: "left" as const }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => {
                                const color = p.riskScore > 0.7 ? "#f87171" : p.riskScore > 0.4 ? "#fb923c" : "#34d399";
                                const label = p.riskScore > 0.7 ? "Critical" : p.riskScore > 0.4 ? "Moderate" : "Low";
                                return (
                                    <tr key={p.id} onClick={() => navigate(`/patient/${p.id}`)} style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.15s" }}>
                                        <td style={{ padding: "12px 14px", fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{p.name}</td>
                                        <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-muted)" }}>{p.age}y · {p.gender === "M" ? "M" : "F"}</td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{p.room}</span>
                                            <span className="badge badge-accent" style={{ fontSize: 10, marginLeft: 6 }}>{p.ward}</span>
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-muted)", maxWidth: 200 }}>{p.diagnosis}</td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div className="progress-wrap" style={{ width: 50, flex: "none" }}>
                                                    <div className="progress-fill" style={{ width: `${p.riskScore * 100}%`, background: color }} />
                                                </div>
                                                <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "JetBrains Mono, monospace" }}>{Math.round(p.riskScore * 100)}%</span>
                                            </div>
                                            <span className={`badge badge-${p.riskScore > 0.7 ? "critical" : p.riskScore > 0.4 ? "warn" : "safe"}`} style={{ fontSize: 10, marginTop: 4, display: "inline-block" }}>{label}</span>
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: p.trend === "rising" ? "#f87171" : p.trend === "falling" ? "#34d399" : "#64748b" }}>
                                            {p.trend === "rising" ? "↑" : p.trend === "falling" ? "↓" : "→"}
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-muted)" }}>{p.physician}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </MainLayout>
    );
}

// ─── Modal styles ───────────────────────────────────────────────────────────────
const m: any = {
    overlay: {
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        backdropFilter: "blur(4px)",
    },
    modal: {
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20,
        width: "100%", maxWidth: 640, maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)", animation: "fadeUp 0.3s ease",
    },
    modalHeader: {
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        padding: "20px 24px 16px",
    },
    closeBtn: {
        background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 8,
        color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: "6px 10px",
    },
    modalBody: { padding: "16px 24px", overflowY: "auto", flex: 1 },
    modalFooter: {
        padding: "16px 24px", borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "flex-end", gap: 10,
    },
    row: { display: "flex", gap: 12 },
    field: { display: "flex", flexDirection: "column", gap: 5, flex: 1 },
    label: { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.3px" },
    input: {
        background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8,
        padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none",
        width: "100%", boxSizing: "border-box" as const,
    },
    errText: { fontSize: 10, color: "#f87171", marginTop: 2 },
};
