import MainLayout from "../layouts/MainLayout";
import { useState, useEffect } from "react";
import { getSummary, getHourlyRisk, getHourlyAlerts, getRiskDistribution, getLeaderboard } from "../api/analytics";
import type { AnalyticsSummary } from "../api/analytics";

function BarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
    const max = Math.max(...data) || 1;
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
            {data.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4, height: "100%" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                        <div title={`${labels[i]}: ${v}`} style={{
                            width: "100%", height: `${(v / max) * 100}%`,
                            background: `linear-gradient(to top, ${color}cc, ${color}44)`,
                            borderRadius: "4px 4px 0 0", transition: "height 0.8s ease",
                            minHeight: 4, border: `1px solid ${color}33`,
                        }} />
                    </div>
                    <span style={{ fontSize: 9, color: "var(--text-faint)", whiteSpace: "nowrap" as const }}>{labels[i]}</span>
                </div>
            ))}
        </div>
    );
}

function DonutSegments({ segments, total }: { segments: { value: number; color: string; label: string }[]; total: number }) {
    const r = 46, cx = 60, cy = 60, stroke = 14;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    const tot = total || 1;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <svg width={120} height={120} viewBox="0 0 120 120">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
                {segments.map((s, i) => {
                    const pct = s.value / tot;
                    const dashArray = `${pct * circumference} ${circumference}`;
                    const rotation = offset * 360 - 90;
                    offset += pct;
                    return (
                        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
                            strokeWidth={stroke} strokeDasharray={dashArray} strokeDashoffset={0}
                            style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
                            strokeLinecap="round" />
                    );
                })}
                <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight={800} fill="var(--text-primary)">{tot}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="var(--text-muted)">PATIENTS</text>
            </svg>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {segments.map(s => (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginLeft: "auto" }}>{s.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Analytics() {
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [hourlyRisk, setHourlyRisk] = useState<{ hour: string; avgRisk: number }[]>([]);
    const [hourlyAlerts, setHourlyAlerts] = useState<{ hour: string; count: number }[]>([]);
    const [distribution, setDistribution] = useState<{ label: string; value: number; color: string; pct: number }[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getSummary(), getHourlyRisk(), getHourlyAlerts(), getRiskDistribution(), getLeaderboard()])
            .then(([sum, hr, ha, dist, lb]) => {
                setSummary(sum);
                setHourlyRisk(hr);
                setHourlyAlerts(ha);
                setDistribution(dist);
                setLeaderboard(lb);
            })
            .catch(e => console.error("Analytics load failed:", e))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <MainLayout>
            <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)", fontSize: 14 }}>
                <span style={{ fontSize: 32 }}>📊</span><br />Loading analytics from database…
            </div>
        </MainLayout>
    );

    const kpis = [
        { label: "Avg Risk Score", value: summary ? `${summary.avgRiskScore}%` : "—", color: "#fb923c", icon: "📊" },
        { label: "Active Alerts", value: summary ? String(summary.activeAlerts) : "—", color: "#f87171", icon: "🔔" },
        { label: "Patients Improving", value: summary ? String(summary.improvingCount) : "—", color: "#34d399", icon: "📉" },
        { label: "AI Accuracy", value: summary ? `${summary.aiAccuracy}%` : "—", color: "#a78bfa", icon: "🤖" },
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px", marginBottom: 4 }}>Analytics</h1>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Clinical performance metrics · Live · All Wards</p>
                </div>
                <button className="btn-ghost" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }} onClick={() => {
                    const rows = leaderboard;
                    if (!rows.length) return;
                    const csv = [
                        ["Rank", "Name", "Room", "Ward", "Risk Score", "Trend", "SOFA"].join(","),
                        ...rows.map((p: any) => [p.rank, `"${p.name}"`, p.room, p.ward, `${Math.round(p.riskScore * 100)}%`, p.trend, p.sofa].join(",")),
                    ].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click(); URL.revokeObjectURL(url);
                }}>
                    📥 Export CSV
                </button>
            </div>

            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                {kpis.map((k, i) => (
                    <div key={k.label} className="stat-card" style={{ animationDelay: `${i * 0.08}s`, borderTop: `2px solid ${k.color}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                            <span style={{ fontSize: 22 }}>{k.icon}</span>
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: k.color, fontFamily: "JetBrains Mono, monospace" }}>{k.value}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Summary stats row */}
            {summary && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                    {[
                        { label: "Critical Patients", value: summary.criticalCount, color: "#f87171" },
                        { label: "Moderate Patients", value: summary.moderateCount, color: "#fb923c" },
                        { label: "Avg SOFA Score", value: summary.avgSofa, color: "#a78bfa" },
                        { label: "Avg Lactate (mmol/L)", value: summary.avgLactate, color: "#38bdf8" },
                    ].map(item => (
                        <div key={item.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: item.color, fontFamily: "JetBrains Mono, monospace" }}>{item.value}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{item.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: 16, marginBottom: 16 }}>
                <div style={s.panel}>
                    <div style={s.panelHdr}>
                        <span style={s.panelT}>Average Risk Score (Hourly)</span>
                        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>Past 12h</span>
                    </div>
                    <BarChart
                        data={hourlyRisk.map(h => Math.round(h.avgRisk * 100))}
                        labels={hourlyRisk.map(h => h.hour.slice(0, 5))}
                        color="#fb923c"
                    />
                </div>
                <div style={s.panel}>
                    <div style={s.panelHdr}>
                        <span style={s.panelT}>Alerts Generated (Hourly)</span>
                        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>Past 12h</span>
                    </div>
                    <BarChart
                        data={hourlyAlerts.map(h => h.count)}
                        labels={hourlyAlerts.map(h => h.hour.slice(0, 5))}
                        color="#f87171"
                    />
                </div>
                <div style={s.panel}>
                    <div style={s.panelHdr}><span style={s.panelT}>Risk Distribution</span></div>
                    <DonutSegments
                        segments={distribution.map(d => ({ value: d.value, color: d.color, label: `${d.label} (${d.pct}%)` }))}
                        total={summary?.totalPatients || 0}
                    />
                </div>
            </div>

            {/* Leaderboard */}
            <div style={s.panel}>
                <div style={s.panelHdr}>
                    <span style={s.panelT}>Patient Risk Leaderboard</span>
                    <span style={{ fontSize: 11, color: "var(--text-faint)" }}>Sorted by risk score · From database</span>
                </div>
                <table style={s.table}>
                    <thead>
                        <tr>{["Rank", "Patient", "Room", "Ward", "Risk Score", "Trend", "SOFA", "Status"].map(h => (
                            <th key={h} style={s.th}>{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((p: any) => {
                            let color = "#34d399", cls = "badge badge-safe", label = "Low";
                            if (p.riskScore > 0.7) { color = "#f87171"; cls = "badge badge-critical"; label = "Critical"; }
                            else if (p.riskScore > 0.4) { color = "#fb923c"; cls = "badge badge-warn"; label = "Moderate"; }
                            const ti = p.trend === "rising" ? { icon: "↑", c: "#f87171" } : p.trend === "falling" ? { icon: "↓", c: "#34d399" } : { icon: "→", c: "#64748b" };
                            return (
                                <tr key={p.id} style={s.tr}>
                                    <td style={s.td}>
                                        <span style={{ ...s.rank, background: p.rank <= 2 ? `${color}22` : "rgba(255,255,255,0.03)", color: p.rank <= 2 ? color : "#334155" }}>#{p.rank}</span>
                                    </td>
                                    <td style={s.td}><span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{p.name}</span></td>
                                    <td style={s.td}><span style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.room}</span></td>
                                    <td style={s.td}><span style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.ward}</span></td>
                                    <td style={s.td}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div className="progress-wrap" style={{ width: 60, flex: "none" }}>
                                                <div className="progress-fill" style={{ width: `${p.riskScore * 100}%`, background: color }} />
                                            </div>
                                            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color }}>{Math.round(p.riskScore * 100)}%</span>
                                        </div>
                                    </td>
                                    <td style={s.td}><span style={{ fontSize: 14, fontWeight: 700, color: ti.c }}>{ti.icon}</span></td>
                                    <td style={s.td}><span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.sofa}</span></td>
                                    <td style={s.td}><span className={cls}>{label}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </MainLayout>
    );
}

const s: any = {
    panel: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" },
    panelHdr: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    panelT: { fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { fontSize: 10, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.8px", textTransform: "uppercase" as const, padding: "8px 12px 12px", textAlign: "left" as const, borderBottom: "1px solid var(--border)" },
    tr: { borderBottom: "1px solid var(--border)", transition: "background 0.15s" },
    td: { padding: "11px 12px", verticalAlign: "middle" as const },
    rank: { fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 },
};
