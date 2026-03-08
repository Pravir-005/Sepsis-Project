import MainLayout from "../layouts/MainLayout";
import PatientCard from "../components/PatientCard";
import AlertBanner from "../components/AlertBanner";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getPatients } from "../api/patients";
import type { Patient } from "../api/patients";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:4000";

export default function Dashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(true);
  const [filter, setFilter] = useState<"all" | "critical" | "moderate" | "low">("all");
  const [sortBy, setSortBy] = useState<"risk" | "name" | "room">("risk");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load patients from API
  const loadPatients = useCallback(async () => {
    try {
      const res = await getPatients();
      setPatients(res.patients);
    } catch (err) {
      console.error("Failed to load patients:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Socket.IO for real-time vitals updates
  useEffect(() => {
    const token = localStorage.getItem("sepsis_token");
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("patients:initial", (data: Patient[]) => {
      setPatients(data);
      setLastUpdate(new Date());
    });

    socket.on("vitals:update", (updates: Partial<Patient>[]) => {
      setPatients(prev => prev.map(p => {
        const update = updates.find(u => u.id === p.id);
        return update ? { ...p, ...update } : p;
      }));
      setLastUpdate(new Date());
    });

    return () => { socket.disconnect(); };
  }, []);

  const critical = patients.filter(p => p.riskScore > 0.7);
  const moderate = patients.filter(p => p.riskScore > 0.4 && p.riskScore <= 0.7);
  const low = patients.filter(p => p.riskScore <= 0.4);

  const filtered = (() => {
    const list = filter === "critical" ? critical : filter === "moderate" ? moderate : filter === "low" ? low : patients;
    return [...list].sort((a, b) =>
      sortBy === "risk" ? b.riskScore - a.riskScore :
        sortBy === "name" ? a.name.localeCompare(b.name) :
          a.room.localeCompare(b.room)
    );
  })();

  const alertMsg = critical.length > 0
    ? `${critical.length} patient(s) at critical sepsis risk — Immediate intervention required`
    : "";

  const stats = [
    { label: "Total Patients", value: patients.length, color: "#38bdf8", icon: "👥", sub: "Active monitors" },
    { label: "Critical Risk", value: critical.length, color: "#f87171", icon: "🔴", sub: "> 70% sepsis score" },
    { label: "Moderate Risk", value: moderate.length, color: "#fb923c", icon: "🟠", sub: "40–70% range" },
    { label: "Low / Stable", value: low.length, color: "#34d399", icon: "🟢", sub: "< 40% score" },
  ];

  const timeAgo = `${Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s ago`;

  return (
    <MainLayout>
      <AlertBanner
        show={showAlert && critical.length > 0}
        message={alertMsg}
        onDismiss={() => setShowAlert(false)}
        level="critical"
      />

      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>ICU Monitoring Dashboard</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Real-time AI-powered sepsis risk tracking ·&nbsp;
            <span className="mono" style={{ color: "var(--text-faint)" }}>
              Updated {timeAgo}
            </span>
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn-primary" onClick={() => navigate("/patients")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13 }}>
            <span style={{ fontSize: 15 }}>+</span> Add Patient
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="live-dot" />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Live</span>
          </div>
        </div>
      </div>

      <div style={s.statsGrid}>
        {stats.map((stat, i) => (
          <div key={stat.label} className="stat-card" style={{ animationDelay: `${i * 0.08}s`, borderTop: `2px solid ${stat.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{stat.icon}</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: stat.color, fontFamily: "JetBrains Mono, monospace" }}>{stat.value}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{stat.label}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{stat.sub}</div>
            <div style={{ marginTop: 10 }}>
              <div className="progress-wrap">
                <div className="progress-fill" style={{
                  width: patients.length > 0 ? `${(stat.value / patients.length) * 100}%` : "0%",
                  background: stat.color, opacity: 0.7, transition: "width 0.8s ease",
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={s.toolbar}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
          Active Patients
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400, marginLeft: 10 }}>
            {filtered.length} shown
          </span>
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["all", "critical", "moderate", "low"] as const).map(f => (
            <button
              key={f}
              className={filter === f ? "btn-primary" : "btn-ghost"}
              style={{ padding: "6px 14px", fontSize: 12 }}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
          <select
            style={{
              background: "var(--bg-input)", border: "1px solid var(--border)",
              borderRadius: 7, color: "var(--text-secondary)",
              padding: "6px 10px", fontSize: 12, cursor: "pointer", outline: "none",
            }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="risk">Sort: Risk Score</option>
            <option value="name">Sort: Name</option>
            <option value="room">Sort: Room</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)", fontSize: 14 }}>
          <span style={{ fontSize: 24 }}>⏳</span><br />Loading patients from database…
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map(p => (
            <PatientCard
              key={p.id}
              id={p.id}
              name={p.name}
              age={p.age}
              room={p.room}
              ward={p.ward}
              riskScore={p.riskScore}
              vitals={p.vitals}
              trend={p.trend}
            />
          ))}
        </div>
      )}
    </MainLayout>
  );
}

const s: any = {
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: 4 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 },
  grid: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" },
};
