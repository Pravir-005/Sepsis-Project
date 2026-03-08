import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import MainLayout from "../layouts/MainLayout";
import { getPatientById, runOfflineRiskCheck } from "../api/patients";
import type { Patient } from "../api/patients";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:4000";

function RiskChart({ history }: { history: { time: string; score: number }[] }) {
    if (!history || history.length < 2) return null;
    const w = 420, h = 100;
    const pts = history.map((p, i) => {
        const x = 30 + (i / (history.length - 1)) * (w - 40);
        const y = h - 14 - (p.score * (h - 28));
        return { x, y, score: p.score, time: p.time };
    });
    const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
    return (
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
            {[0.25, 0.5, 0.75].map(v => {
                const y = h - 14 - v * (h - 28);
                return (
                    <g key={v}>
                        <line x1={28} y1={y} x2={w - 8} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4,4" />
                        <text x={22} y={y + 4} fontSize={9} fill="var(--text-faint)" textAnchor="end">{Math.round(v * 100)}%</text>
                    </g>
                );
            })}
            <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#f87171" stopOpacity="0.01" />
                </linearGradient>
            </defs>
            <polygon points={`${pts[0].x},${h} ${polyline} ${pts[pts.length - 1].x},${h}`} fill="url(#riskGrad)" />
            <polyline points={polyline} fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r={3.5} fill="#f87171" />
                    <text x={p.x} y={h} fontSize={9} fill="#334155" textAnchor="middle">{p.time}</text>
                </g>
            ))}
        </svg>
    );
}

export default function PatientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [liveVitals, setLiveVitals] = useState<Patient["vitals"] | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);
    const [riskResult, setRiskResult] = useState<{ riskScore: number; level: string; insights: string[] } | null>(null);
    const [checking, setChecking] = useState(false);

    const showToast = useCallback((msg: string, color = "#22c55e") => {
        setToast({ msg, color });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const runAiCheck = useCallback(async () => {
        if (!patient) return;
        setChecking(true);
        try {
            const result = await runOfflineRiskCheck({
                vitals: patient.vitals,
                trend: patient.trend,
                lactate: patient.lactate,
                sofa: patient.sofa,
                existingScore: patient.riskScore,
            });
            setRiskResult(result);
            showToast("AI risk check complete", "#38bdf8");
        } catch {
            showToast("AI check failed — backend may be offline", "#f87171");
        } finally { setChecking(false); }
    }, [patient, showToast]);

    useEffect(() => {
        const pid = parseInt(id || "");
        if (!pid) { setLoading(false); return; }
        getPatientById(pid)
            .then(p => { setPatient(p); setLiveVitals(p.vitals); })
            .catch(() => setPatient(null))
            .finally(() => setLoading(false));
    }, [id]);

    // Socket.IO live vitals
    useEffect(() => {
        const pid = parseInt(id || "");
        if (!pid) return;
        const socket = io(SOCKET_URL, {
            auth: { token: localStorage.getItem("sepsis_token") },
            transports: ["websocket", "polling"],
        });
        socket.on("vitals:update", (updates: Partial<Patient>[]) => {
            const upd = updates.find(u => u.id === pid);
            if (upd?.vitals) setLiveVitals(upd.vitals);
        });
        return () => { socket.disconnect(); };
    }, [id]);

    if (loading) return (
        <MainLayout>
            {toast && (
                <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: toast.color, color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 13, boxShadow: "0 8px 30px rgba(0,0,0,0.3)", animation: "fadeUp 0.3s ease" }}>
                    {toast.msg}
                </div>
            )}
            <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)", fontSize: 14 }}>
                <span style={{ fontSize: 32 }}>⏳</span><br />Loading patient data…
            </div>
        </MainLayout>
    );

    if (!patient) return (
        <MainLayout>
            <div style={{ textAlign: "center", padding: 80, color: "#475569" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#94a3b8" }}>Patient Not Found</div>
                <button className="btn-ghost" onClick={() => navigate("/dashboard")}>← Back to Dashboard</button>
            </div>
        </MainLayout>
    );

    const pct = Math.round(patient.riskScore * 100);
    let riskColor = "#34d399", riskLabel = "Low Risk", badgeCls = "badge badge-safe";
    if (patient.riskScore > 0.7) { riskColor = "#f87171"; riskLabel = "Critical"; badgeCls = "badge badge-critical"; }
    else if (patient.riskScore > 0.4) { riskColor = "#fb923c"; riskLabel = "Moderate"; badgeCls = "badge badge-warn"; }

    const vitals = liveVitals || patient.vitals;

    return (
        <MainLayout>
            {toast && (
                <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: toast.color, color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 13, boxShadow: "0 8px 30px rgba(0,0,0,0.3)", animation: "fadeUp 0.3s ease", maxWidth: 320 }}>
                    {toast.msg}
                </div>
            )}
            <button style={s.back} onClick={() => navigate("/dashboard")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Back to Dashboard
            </button>

            <div style={s.heroCard}>
                <div style={{ ...s.heroAccent, background: riskColor }} />
                <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" as const }}>
                    <div style={{ ...s.heroAvatar, border: `2px solid ${riskColor}44` }}>
                        <span style={{ fontSize: 28, fontWeight: 800, color: riskColor }}>
                            {patient.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                        </span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" as const }}>
                            <h1 style={s.heroName}>{patient.name}</h1>
                            <span className={badgeCls} style={{ fontSize: 12 }}>{riskLabel}</span>
                            <span className="badge badge-accent">{patient.ward}</span>
                        </div>
                        <div style={s.heroMeta}>Age {patient.age} · {patient.gender === "M" ? "Male" : "Female"} · Room {patient.room}</div>
                        <div style={{ ...s.heroMeta, marginTop: 4, color: "var(--text-muted)" }}>{patient.diagnosis}</div>
                        <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-faint)" }}>
                            Attending: <span style={{ color: "var(--text-muted)" }}>{patient.physician}</span>
                            &nbsp;·&nbsp; Admitted: <span style={{ color: "var(--text-muted)" }}>{new Date(patient.admittedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div className="mono" style={{ fontSize: 44, fontWeight: 900, color: riskColor, lineHeight: 1 }}>{pct}%</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Sepsis Risk</div>
                        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>SOFA {patient.sofa} · Lactate {patient.lactate}</div>
                    </div>
                </div>
            </div>

            <div style={s.twoCol}>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                    {/* Live Vitals */}
                    <div style={s.panel}>
                        <div style={s.panelHeader}>
                            <span style={s.panelTitle}>Live Vitals</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span className="live-dot" />
                                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Live via Socket.IO</span>
                            </div>
                        </div>
                        <div style={s.vitalsGrid}>
                            {[
                                { label: "Heart Rate", value: `${vitals.hr}`, unit: "bpm", normal: "60–100", alert: vitals.hr > 110 || vitals.hr < 50, icon: "❤️" },
                                { label: "Blood Pressure", value: vitals.bp, unit: "mmHg", normal: "120/80", alert: false, icon: "🩸" },
                                { label: "SpO₂", value: `${vitals.spo2}`, unit: "%", normal: "95–100", alert: vitals.spo2 < 94, icon: "🫁" },
                                { label: "Temperature", value: `${vitals.temp}`, unit: "°C", normal: "36.1–37.2", alert: vitals.temp > 38.3, icon: "🌡️" },
                                { label: "Resp. Rate", value: `${vitals.rr}`, unit: "br/m", normal: "12–20", alert: vitals.rr > 25, icon: "💨" },
                                { label: "MAP", value: `${vitals.map}`, unit: "mmHg", normal: ">65", alert: vitals.map < 65, icon: "📊" },
                            ].map(v => (
                                <div key={v.label} style={{
                                    ...s.vitalCard,
                                    borderColor: v.alert ? `${riskColor}44` : "rgba(255,255,255,0.06)",
                                    background: v.alert ? "rgba(248,113,113,0.05)" : "rgba(255,255,255,0.02)",
                                }}>
                                    <div style={{ fontSize: 20, marginBottom: 6 }}>{v.icon}</div>
                                    <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: v.alert ? "#f87171" : "var(--text-primary)" }}>
                                        {v.value}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)", marginLeft: 3 }}>{v.unit}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{v.label}</div>
                                    <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>Normal: {v.normal}</div>
                                    {v.alert && <div style={{ fontSize: 10, color: "#f87171", marginTop: 4, fontWeight: 600 }}>⚠ Out of range</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Risk History Chart */}
                    <div style={s.panel}>
                        <div style={s.panelHeader}>
                            <span style={s.panelTitle}>Risk Score Trend</span>
                            <span className={patient.trend === "rising" ? "badge badge-critical" : patient.trend === "falling" ? "badge badge-safe" : "badge badge-warn"} style={{ fontSize: 10 }}>
                                {patient.trend === "rising" ? "↑ Rising" : patient.trend === "falling" ? "↓ Falling" : "→ Stable"}
                            </span>
                        </div>
                        <div style={{ padding: "4px 0 8px" }}>
                            <RiskChart history={patient.riskHistory} />
                        </div>
                    </div>

                    {/* Medications */}
                    <div style={s.panel}>
                        <div style={s.panelHeader}>
                            <span style={s.panelTitle}>Current Medications</span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{patient.medications.length} agents</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                            {patient.medications.map((med, i) => (
                                <div key={i} style={s.medItem}>
                                    <div style={s.medDot} />
                                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{med}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                    {/* AI Insights */}
                    <div style={{ ...s.panel, borderColor: "rgba(56,189,248,0.15)", background: "rgba(56,189,248,0.03)" }}>
                        <div style={s.panelHeader}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={s.aiIcon}>✦</div>
                                <span style={{ ...s.panelTitle, color: "#38bdf8" }}>AI Clinical Insights</span>
                            </div>
                            <button onClick={runAiCheck} disabled={checking} style={{
                                background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: 6,
                                color: "#38bdf8", fontSize: 11, fontWeight: 600, padding: "5px 10px", cursor: checking ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: checking ? 0.6 : 1,
                            }}>
                                {checking ? "Checking…" : "✦ Run Check"}
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                            {(riskResult?.insights || patient.aiInsights).map((insight, i) => (
                                <div key={i} style={s.insightItem}>
                                    <div style={s.insightNumber}>{i + 1}</div>
                                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>{insight}</p>
                                </div>
                            ))}
                        </div>
                        {riskResult && (
                            <div style={{ marginTop: 12, padding: "8px 12px", background: `${riskResult.level === "critical" ? "rgba(248,113,113,0.08)" : riskResult.level === "moderate" ? "rgba(251,146,60,0.08)" : "rgba(52,211,153,0.08)"}`, borderRadius: 8, border: `1px solid ${riskResult.level === "critical" ? "rgba(248,113,113,0.2)" : riskResult.level === "moderate" ? "rgba(251,146,60,0.2)" : "rgba(52,211,153,0.2)"}` }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: riskResult.level === "critical" ? "#f87171" : riskResult.level === "moderate" ? "#fb923c" : "#34d399" }}>
                                    Fresh AI Score: {Math.round(riskResult.riskScore * 100)}% — {riskResult.level.charAt(0).toUpperCase() + riskResult.level.slice(1)}
                                </span>
                            </div>
                        )}
                        <div style={s.aiDisclaimer}>⚠ AI insights are decision-support only. Clinical judgment takes precedence.</div>
                    </div>

                    {/* Quick Actions */}
                    <div style={s.panel}>
                        <div style={s.panelHeader}><span style={s.panelTitle}>Quick Actions</span></div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                            {[
                                { label: "Request Urgent Consult", color: "#f87171", icon: "🚨", toast: "Urgent consult request sent to attending team" },
                                { label: "Update Treatment Plan", color: "#fb923c", icon: "📋", toast: "Treatment plan update recorded in EMR" },
                                { label: "Order Lab Panel", color: "#38bdf8", icon: "🧪", toast: "Lab panel order submitted to pathology" },
                                { label: "Schedule Imaging", color: "#a78bfa", icon: "🫀", toast: "Imaging scheduled — radiology notified" },
                                { label: "Nursing Note", color: "#34d399", icon: "📝", toast: "Nursing note saved to patient record" },
                            ].map(a => (
                                <button key={a.label} style={{ ...s.actionBtn, borderColor: `${a.color}22`, color: a.color }}
                                    onClick={() => showToast(a.toast, a.color)}>
                                    <span>{a.icon}</span> {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Patient Summary */}
                    <div style={s.panel}>
                        <div style={s.panelHeader}><span style={s.panelTitle}>Patient Summary</span></div>
                        {[
                            ["ID", `PAT-${String(patient.id).padStart(4, "0")}`],
                            ["Ward", patient.ward],
                            ["Room", patient.room],
                            ["Age / Gender", `${patient.age} yrs · ${patient.gender === "M" ? "Male" : "Female"}`],
                            ["Diagnosis", patient.diagnosis],
                            ["Physician", patient.physician],
                            ["SOFA Score", String(patient.sofa)],
                            ["Lactate", `${patient.lactate} mmol/L`],
                        ].map(([label, val]) => (
                            <div key={label as string} style={s.infoRow}>
                                <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600 }}>{label}</span>
                                <span style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "right" as const, maxWidth: 180 }}>{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

const s: any = {
    back: { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 14px", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", marginBottom: 20, transition: "all 0.2s" },
    heroCard: { position: "relative", overflow: "hidden", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 24px 22px", marginBottom: 20 },
    heroAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 3, opacity: 0.8 },
    heroAvatar: { width: 72, height: 72, borderRadius: 18, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    heroName: { fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.3px" },
    heroMeta: { fontSize: 13, color: "var(--text-secondary)" },
    twoCol: { display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start" },
    panel: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" },
    panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    panelTitle: { fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.2px" },
    vitalsGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
    vitalCard: { border: "1px solid", borderRadius: 10, padding: "14px 14px 12px", transition: "all 0.3s" },
    medItem: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--bg-subtle)", borderRadius: 8, border: "1px solid var(--border)" },
    medDot: { width: 6, height: 6, borderRadius: "50%", background: "#38bdf8", flexShrink: 0 },
    aiIcon: { width: 24, height: 24, borderRadius: 6, background: "rgba(56,189,248,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#38bdf8" },
    insightItem: { display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", background: "var(--bg-subtle)", borderRadius: 8, border: "1px solid var(--border)" },
    insightNumber: { width: 22, height: 22, borderRadius: "50%", background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#38bdf8", flexShrink: 0 },
    aiDisclaimer: { marginTop: 14, fontSize: 10, color: "#1e3a5f", padding: "8px 12px", background: "rgba(251,146,60,0.06)", borderRadius: 6, border: "1px solid rgba(251,146,60,0.15)" },
    actionBtn: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "1px solid", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", textAlign: "left" },
    infoRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid var(--border)" },
};
