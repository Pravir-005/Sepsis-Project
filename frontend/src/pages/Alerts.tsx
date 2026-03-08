import MainLayout from "../layouts/MainLayout";
import { useState, useEffect } from "react";
import { getAlerts, dismissAlert, dismissAllAlerts, createAlert } from "../api/alerts";
import type { Alert, AlertCounts } from "../api/alerts";

const levelColors = {
    critical: { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", color: "#f87171", label: "CRITICAL" },
    warn: { bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)", color: "#fb923c", label: "WARNING" },
    info: { bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.2)", color: "#38bdf8", label: "INFO" },
};

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    const bg = type === "success" ? "#22c55e" : "#f87171";
    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            background: bg, color: "#fff", padding: "12px 20px",
            borderRadius: 10, fontWeight: 600, fontSize: 13,
            boxShadow: "0 8px 30px rgba(0,0,0,0.3)", animation: "fadeUp 0.3s ease",
        }}>
            {type === "success" ? "✓" : "✗"} {msg}
        </div>
    );
}

function CreateAlertModal({ onClose, onCreated }: { onClose: () => void; onCreated: (a: Alert) => void }) {
    const [form, setForm] = useState({ patientName: "", room: "", level: "warn" as "critical" | "warn" | "info", message: "" });
    const [saving, setSaving] = useState(false);
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    const handleSave = async () => {
        if (!form.patientName || !form.message) return;
        setSaving(true);
        try {
            const a = await createAlert(form.patientName, form.room || "-", form.level, form.message);
            onCreated(a);
        } catch { onClose(); } finally { setSaving(false); }
    };
    const c = levelColors[form.level];
    const inp: React.CSSProperties = { background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
    const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" };
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 24px 80px rgba(0,0,0,0.5)", animation: "fadeUp 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>Create Alert</div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: "5px 9px" }}>✕</button>
                </div>
                <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}><label style={lbl}>Patient Name *</label><input style={inp} placeholder="e.g., R. Meenakshi" value={form.patientName} onChange={e => set("patientName", e.target.value)} /></div>
                        <div style={{ flex: "0 0 110px" }}><label style={lbl}>Room</label><input style={inp} placeholder="ICU-01" value={form.room} onChange={e => set("room", e.target.value)} /></div>
                    </div>
                    <div><label style={lbl}>Alert Level</label>
                        <select style={{ ...inp, borderColor: c.border, background: c.bg, color: c.color, fontWeight: 700 }} value={form.level} onChange={e => set("level", e.target.value as typeof form.level)}>
                            <option value="critical">🔴 Critical</option>
                            <option value="warn">🟠 Warning</option>
                            <option value="info">🔵 Info</option>
                        </select>
                    </div>
                    <div><label style={lbl}>Message *</label>
                        <textarea style={{ ...inp, minHeight: 80, resize: "vertical" as const, fontFamily: "inherit" }} placeholder="Describe the clinical concern…" value={form.message} onChange={e => set("message", e.target.value)} />
                    </div>
                </div>
                <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button className="btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving || !form.patientName || !form.message} style={{ opacity: saving || !form.patientName || !form.message ? 0.5 : 1 }}>
                        {saving ? "Creating…" : "Create Alert"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Alerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [counts, setCounts] = useState<AlertCounts>({ total: 0, active: 0, critical: 0, warn: 0, info: 0, dismissed: 0 });
    const [filter, setFilter] = useState<"all" | "critical" | "warn" | "info">("all");
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const load = async () => {
        try {
            const data = await getAlerts();
            setAlerts(data.alerts);
            setCounts(data.counts);
        } catch (e) {
            console.error("Failed to load alerts:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const dismiss = async (id: string) => {
        await dismissAlert(id);
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
        setCounts(prev => ({ ...prev, active: prev.active - 1 }));
    };

    const dismissAll = async () => {
        await dismissAllAlerts();
        setAlerts(prev => prev.map(a => ({ ...a, dismissed: true })));
        setCounts(prev => ({ ...prev, active: 0, critical: 0, warn: 0, info: 0 }));
    };

    const handleCreated = (a: Alert) => {
        setAlerts(prev => [a, ...prev]);
        setCounts(prev => ({
            ...prev, total: prev.total + 1, active: prev.active + 1,
            [a.level]: (prev[a.level as keyof typeof prev] as number) + 1,
        }));
        setShowCreate(false);
        setToast({ msg: "Alert created", type: "success" });
    };

    const active = alerts.filter(a => !a.dismissed);
    const dismissed = alerts.filter(a => a.dismissed);
    const visible = active.filter(a => filter === "all" || a.level === filter);

    return (
        <MainLayout>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            {showCreate && <CreateAlertModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
            <div style={s.pageHeader}>
                <div>
                    <h1 style={s.pageTitle}>Alert Center</h1>
                    <p style={s.pageSubtitle}>
                        {counts.critical > 0 ? `${counts.critical} critical` : "No critical"} · {counts.warn} warnings · {counts.active} total active
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-primary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }} onClick={() => setShowCreate(true)}>
                        + Create Alert
                    </button>
                    {active.length > 0 && (
                        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={dismissAll}>
                            Dismiss All
                        </button>
                    )}
                </div>
            </div>

            <div style={s.summaryBar}>
                {(["all", "critical", "warn", "info"] as const).map(f => (
                    <button
                        key={f}
                        className={filter === f ? "btn-primary" : "btn-ghost"}
                        onClick={() => setFilter(f)}
                        style={{ padding: "7px 18px", fontSize: 13 }}
                    >
                        {f === "all" ? `All (${counts.active})` :
                            f === "critical" ? `Critical (${counts.critical})` :
                                f === "warn" ? `Warning (${counts.warn})` :
                                    `Info (${counts.info})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)", fontSize: 14 }}>
                    <span style={{ fontSize: 28 }}>⏳</span><br />Loading alerts…
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                    {visible.length === 0 ? (
                        <div style={s.empty}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                            <div style={{ fontWeight: 600, color: "#475569", marginBottom: 4 }}>All Clear</div>
                            <div style={{ fontSize: 13, color: "#334155" }}>No active alerts in this category</div>
                        </div>
                    ) : visible.map(a => {
                        const c = levelColors[a.level];
                        return (
                            <div key={a.id} style={{ ...s.alertCard, background: c.bg, borderColor: c.border }}>
                                <div style={{ ...s.alertLevel, color: c.color }}>{c.label}</div>
                                <div style={s.alertBody}>
                                    <div style={s.alertMeta}>
                                        <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>{a.patientName}</span>
                                        <span className="badge badge-accent" style={{ fontSize: 10 }}>{a.room}</span>
                                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.time}</span>
                                    </div>
                                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, marginTop: 4, lineHeight: 1.5 }}>{a.message}</p>
                                </div>
                                <button style={{ ...s.dismissBtn, color: c.color }} onClick={() => dismiss(a.id)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                        );
                    })}

                    {dismissed.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                            <div className="section-title">DISMISSED ({dismissed.length})</div>
                            {dismissed.map(a => {
                                const c = levelColors[a.level];
                                return (
                                    <div key={a.id} style={{ ...s.alertCard, background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.04)", opacity: 0.5, marginBottom: 8 }}>
                                        <div style={{ ...s.alertLevel, color: "#334155" }}>{c.label}</div>
                                        <div style={s.alertBody}>
                                            <div style={s.alertMeta}>
                                                <span style={{ fontWeight: 600, color: "#475569", fontSize: 13 }}>{a.patientName}</span>
                                                <span style={{ fontSize: 11, color: "#1e293b" }}>{a.room} · {a.time}</span>
                                            </div>
                                            <p style={{ fontSize: 12, color: "#334155", margin: 0, marginTop: 3 }}>{a.message}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </MainLayout>
    );
}

const s: any = {
    pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 },
    pageTitle: { fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px", marginBottom: 4 },
    pageSubtitle: { fontSize: 13, color: "var(--text-muted)" },
    summaryBar: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" as const },
    alertCard: {
        display: "flex", alignItems: "flex-start", gap: 14,
        border: "1px solid", borderRadius: 12, padding: "14px 16px",
        animation: "fadeUp 0.3s ease both", transition: "all 0.2s",
    },
    alertLevel: { fontSize: 10, fontWeight: 800, letterSpacing: "1px", flexShrink: 0, marginTop: 2, minWidth: 58 },
    alertBody: { flex: 1 },
    alertMeta: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const },
    dismissBtn: {
        background: "none", border: "none", cursor: "pointer",
        padding: 6, borderRadius: 6, flexShrink: 0,
        display: "flex", alignItems: "center",
        opacity: 0.7, transition: "opacity 0.2s",
    },
    empty: { textAlign: "center", padding: "60px 0", color: "var(--text-muted)" },
};
