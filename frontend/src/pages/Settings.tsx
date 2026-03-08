import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { getSettings, updateSettings } from "../api/settings";
import type { AppSettings } from "../api/settings";
import { useTheme } from "../context/ThemeContext";

// ─── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            background: "#22c55e", color: "#fff", padding: "12px 20px",
            borderRadius: 10, fontWeight: 600, fontSize: 13,
            boxShadow: "0 8px 30px rgba(0,0,0,0.3)", animation: "fadeUp 0.3s ease",
        }}>
            ✓ {msg}
        </div>
    );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</span>
            </div>
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column" as const, gap: 18 }}>
                {children}
            </div>
        </div>
    );
}

// ─── Row helpers ─────────────────────────────────────────────────────────────
function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{label}</div>
                {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
            </div>
            <div style={{ flexShrink: 0 }}>{children}</div>
        </div>
    );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button onClick={() => onChange(!value)} style={{
            width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
            background: value ? "#38bdf8" : "rgba(255,255,255,0.1)", position: "relative" as const,
            transition: "background 0.25s",
        }}>
            <div style={{
                position: "absolute" as const, top: 3, left: value ? 22 : 2, width: 18, height: 18,
                borderRadius: "50%", background: "#fff", transition: "left 0.25s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }} />
        </button>
    );
}

function Select({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)} style={{
            background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8,
            color: "var(--text-secondary)", padding: "7px 10px", fontSize: 12, outline: "none", cursor: "pointer",
        }}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
}

function NumberInput({ value, min, max, unit, onChange }: { value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} style={{
                background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8,
                color: "var(--text-primary)", padding: "7px 10px", fontSize: 13, outline: "none",
                width: 70, fontFamily: "JetBrains Mono, monospace", fontWeight: 700,
            }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{unit}</span>
        </div>
    );
}

// ─── Profile fields (local user info from localStorage) ──────────────────────
function ProfileSection() {
    const username = localStorage.getItem("sepsis_username") || "Unknown";
    const role = localStorage.getItem("sepsis_role") || "nurse";
    const name = localStorage.getItem("sepsis_name") || username;
    const dept = localStorage.getItem("sepsis_dept") || "ICU";

    return (
        <Section title="Profile & Account" icon="👤">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                    { label: "Full Name", value: name },
                    { label: "Username", value: username },
                    { label: "Role", value: role.charAt(0).toUpperCase() + role.slice(1) },
                    { label: "Department", value: dept },
                ].map(f => (
                    <div key={f.label}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>{f.label}</div>
                        <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "var(--text-primary)" }}>
                            {f.value}
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", padding: "8px 12px", background: "rgba(56,189,248,0.05)", borderRadius: 8, border: "1px solid rgba(56,189,248,0.1)" }}>
                ℹ Profile details are set by your system administrator. Contact IT to update your information.
            </div>
        </Section>
    );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function Settings() {
    const { theme, setTheme } = useTheme();
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState("");
    const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

    useEffect(() => {
        getSettings()
            .then(s => { setSettings(s); setLoading(false); setBackendStatus("online"); })
            .catch(() => { setLoading(false); setBackendStatus("offline"); });

        // Health check
        fetch(import.meta.env.VITE_API_URL?.replace("/api", "") + "/health" || "http://localhost:4000/health")
            .then(r => r.ok ? setBackendStatus("online") : setBackendStatus("offline"))
            .catch(() => setBackendStatus("offline"));
    }, []);

    const save = async (patch: Partial<AppSettings>) => {
        if (!settings) return;
        const next = {
            ...settings,
            alerts: { ...settings.alerts, ...(patch.alerts || {}) },
            ai: { ...settings.ai, ...(patch.ai || {}) },
            ui: { ...settings.ui, ...(patch.ui || {}) },
            system: { ...settings.system, ...(patch.system || {}) },
        };
        setSettings(next);
        setSaving(true);
        try {
            await updateSettings(patch);
            setToast("Settings saved");
        } catch {
            setToast("Saved locally (backend offline)");
        } finally { setSaving(false); }
    };

    const handleThemeChange = (t: string) => {
        setTheme(t as "dark" | "light" | "system");
        if (settings) save({ ui: { ...settings.ui, theme: t as "dark" | "light" | "system" } });
    };

    const exportCSV = async () => {
        try {
            const token = localStorage.getItem("sepsis_token");
            const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
            const res = await fetch(`${apiBase}/analytics/leaderboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            const rows = (data.leaderboard || data || []) as any[];
            const csv = [
                ["Rank", "Name", "Room", "Ward", "Risk Score", "Trend", "SOFA", "Lactate"].join(","),
                ...rows.map((p: any) => [p.rank, `"${p.name}"`, p.room, p.ward, `${Math.round(p.riskScore * 100)}%`, p.trend, p.sofa, p.lactate].join(",")),
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `patients-export-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click(); URL.revokeObjectURL(url);
            setToast("Patient data exported as CSV");
        } catch {
            setToast("Export failed — check backend connection");
        }
    };

    const clearDismissed = async () => {
        try {
            const token = localStorage.getItem("sepsis_token");
            const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
            await fetch(`${apiBase}/alerts/dismiss-all`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
            setToast("Dismissed alerts cleared");
        } catch { setToast("Done (local only)"); }
    };

    const logout = () => {
        localStorage.removeItem("sepsis_token");
        localStorage.removeItem("sepsis_username");
        localStorage.removeItem("sepsis_role");
        localStorage.removeItem("sepsis_name");
        localStorage.removeItem("sepsis_dept");
        window.location.href = "/";
    };

    return (
        <MainLayout>
            {toast && <Toast msg={toast} onClose={() => setToast("")} />}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: 4 }}>Settings</h1>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Manage platform preferences, AI configuration, and system options</p>
                </div>
                {saving && <div style={{ fontSize: 12, color: "#38bdf8", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#38bdf8", animation: "pulse 1s infinite" }} />
                    Saving…
                </div>}
            </div>

            {/* Profile */}
            <ProfileSection />

            {/* Theme */}
            <Section title="Appearance & Theme" icon="🎨">
                <Row label="Color Theme" sub="Controls the platform-wide color scheme">
                    <div style={{ display: "flex", gap: 6 }}>
                        {(["dark", "light", "system"] as const).map(t => (
                            <button key={t} onClick={() => handleThemeChange(t)} style={{
                                padding: "7px 14px", borderRadius: 8, border: "1px solid",
                                borderColor: theme === t ? "#38bdf8" : "var(--border)",
                                background: theme === t ? "rgba(56,189,248,0.12)" : "transparent",
                                color: theme === t ? "#38bdf8" : "var(--text-muted)",
                                fontSize: 12, fontWeight: theme === t ? 700 : 400, cursor: "pointer", transition: "all 0.15s",
                            }}>
                                {t === "dark" ? "🌙 Dark" : t === "light" ? "☀️ Light" : "💻 System"}
                            </button>
                        ))}
                    </div>
                </Row>
                {settings && (
                    <>
                        <Row label="Patient List View" sub="Default view for the Patients page">
                            <Select value={settings.ui.patientCardView} onChange={v => save({ ui: { ...settings.ui, patientCardView: v as "grid" | "table" } })}
                                options={[{ value: "grid", label: "⊞ Grid View" }, { value: "table", label: "☰ Table View" }]} />
                        </Row>
                        <Row label="Compact Mode" sub="Reduce spacing for dense information display">
                            <Toggle value={settings.ui.compactMode} onChange={v => save({ ui: { ...settings.ui, compactMode: v } })} />
                        </Row>
                    </>
                )}
            </Section>

            {/* Alerts */}
            {settings && (
                <Section title="Alerts & Notifications" icon="🔔">
                    <Row label="Critical Risk Threshold" sub="Alert triggers when sepsis risk % exceeds this value">
                        <NumberInput value={settings.alerts.criticalThreshold} min={50} max={95} unit="%" onChange={v => save({ alerts: { ...settings.alerts, criticalThreshold: v } })} />
                    </Row>
                    <Row label="Warning Threshold" sub="Warning alert when risk exceeds this value">
                        <NumberInput value={settings.alerts.warnThreshold} min={20} max={70} unit="%" onChange={v => save({ alerts: { ...settings.alerts, warnThreshold: v } })} />
                    </Row>
                    <Row label="Alert Sounds" sub="Play audio when a new critical alert fires">
                        <Toggle value={settings.alerts.soundEnabled} onChange={v => save({ alerts: { ...settings.alerts, soundEnabled: v } })} />
                    </Row>
                    <Row label="Auto-Dismiss Warnings After" sub="0 = never auto-dismiss">
                        <NumberInput value={settings.alerts.autoDismissAfterMin} min={0} max={120} unit="min" onChange={v => save({ alerts: { ...settings.alerts, autoDismissAfterMin: v } })} />
                    </Row>
                </Section>
            )}

            {/* AI Engine */}
            {settings && (
                <Section title="AI Engine Configuration" icon="🤖">
                    <Row label="Risk Sensitivity" sub="How aggressively the AI flags elevated risk">
                        <Select value={settings.ai.sensitivity} onChange={v => save({ ai: { ...settings.ai, sensitivity: v as AppSettings["ai"]["sensitivity"] } })}
                            options={[
                                { value: "conservative", label: "Conservative — fewer alerts" },
                                { value: "balanced", label: "Balanced — recommended" },
                                { value: "aggressive", label: "Aggressive — maximum vigilance" },
                            ]} />
                    </Row>
                    <Row label="Show AI Insights" sub="Display AI clinical recommendations on patient detail pages">
                        <Toggle value={settings.ai.showInsights} onChange={v => save({ ai: { ...settings.ai, showInsights: v } })} />
                    </Row>
                    <Row label="Insight Detail Level" sub="How verbose AI clinical insights are">
                        <Select value={settings.ai.insightDetailLevel} onChange={v => save({ ai: { ...settings.ai, insightDetailLevel: v as AppSettings["ai"]["insightDetailLevel"] } })}
                            options={[
                                { value: "minimal", label: "Minimal — key points only" },
                                { value: "standard", label: "Standard — clinical context" },
                                { value: "verbose", label: "Verbose — full rationale" },
                            ]} />
                    </Row>
                    <div style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.15)", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#fb923c" }}>
                        ⚠ AI risk scores are clinical decision-support tools only. Always apply clinician judgment. This system is not a substitute for direct patient assessment.
                    </div>
                </Section>
            )}

            {/* Data & Export */}
            <Section title="Data & Export" icon="📦">
                <Row label="Export Patient Data" sub="Download all active patient data as a CSV file">
                    <button onClick={exportCSV} className="btn-ghost" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        📥 Export CSV
                    </button>
                </Row>
                <Row label="Clear Dismissed Alerts" sub="Permanently delete all dismissed alert records">
                    <button onClick={clearDismissed} className="btn-ghost" style={{ fontSize: 12, color: "#fb923c", borderColor: "rgba(251,146,60,0.3)" }}>
                        🗑 Clear Dismissed
                    </button>
                </Row>
            </Section>

            {/* System */}
            <Section title="System Information" icon="ℹ️">
                <Row label="Backend Status" sub="API server connectivity">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: backendStatus === "online" ? "#22c55e" : backendStatus === "offline" ? "#f87171" : "#fb923c" }} />
                        <span style={{ fontSize: 12, color: backendStatus === "online" ? "#22c55e" : backendStatus === "offline" ? "#f87171" : "#fb923c", fontWeight: 600 }}>
                            {backendStatus === "online" ? "Online" : backendStatus === "offline" ? "Offline" : "Checking…"}
                        </span>
                    </div>
                </Row>
                {settings && (
                    <>
                        <Row label="Hospital / Facility" sub="Configured system name">
                            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>{settings.system.hospitalName}</span>
                        </Row>
                        <Row label="Timezone" sub="Server timezone">
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{settings.system.timezone}</span>
                        </Row>
                    </>
                )}
                <Row label="Platform Version" sub="SepsisGuard AI Clinical Platform">
                    <span className="badge badge-accent" style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>v1.0.0</span>
                </Row>
                {!loading && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                        <button onClick={logout} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
                            borderRadius: 8, padding: "10px 16px", color: "#f87171",
                            fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                        }}>
                            🚪 Sign Out
                        </button>
                    </div>
                )}
            </Section>
        </MainLayout>
    );
}
