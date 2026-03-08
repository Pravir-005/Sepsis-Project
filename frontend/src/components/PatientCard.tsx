import { useNavigate } from "react-router-dom";

interface PatientCardProps {
  id: number;
  name: string;
  age: number;
  room: string;
  ward: string;
  riskScore: number;
  vitals: {
    hr: number;
    bp: string;
    spo2: number;
    temp: number;
  };
  trend: "rising" | "stable" | "falling";
}

function PatientCard({ id, name, age, room, ward, riskScore, vitals, trend }: PatientCardProps) {
  const navigate = useNavigate();
  const pct = Math.round(riskScore * 100);

  let riskLabel = "Low Risk";
  let riskColor = "#16a34a";
  let riskBg = "#f0fdf4";

  if (riskScore > 0.7) {
    riskLabel = "Critical";
    riskColor = "#dc2626";
    riskBg = "#fef2f2";
  } else if (riskScore > 0.4) {
    riskLabel = "Moderate";
    riskColor = "#d97706";
    riskBg = "#fffbeb";
  }

  const trendIcon = trend === "rising" ? "↑" : trend === "falling" ? "↓" : "→";
  const trendColor = trend === "rising" ? "#dc2626" : trend === "falling" ? "#16a34a" : "#64748b";

  return (
    <div style={{ ...styles.card, borderTop: `3px solid ${riskColor}`, cursor: "pointer" }} onClick={() => navigate(`/patient/${id}`)}>
      <div style={styles.header}>
        <div>
          <div style={styles.name}>{name}</div>
          <div style={styles.meta}>Age {age} · Room {room} · {ward}</div>
        </div>
        <div
          style={{
            background: riskBg,
            color: riskColor,
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 600,
            border: `1px solid ${riskColor}33`,
          }}
        >
          {riskLabel}
        </div>
      </div>

      {/* Risk bar */}
      <div style={styles.barWrap}>
        <div
          style={{
            ...styles.barFill,
            width: `${pct}%`,
            background: riskColor,
          }}
        />
      </div>

      <div style={styles.scoreRow}>
        <span style={{ fontSize: "12px", color: "#64748b" }}>Sepsis Risk</span>
        <span style={{ fontWeight: 700, color: riskColor, fontFamily: "monospace" }}>
          {pct}% <span style={{ color: trendColor }}>{trendIcon}</span>
        </span>
      </div>

      {/* Vitals */}
      <div style={styles.vitalsRow}>
        <span style={styles.vital}>❤️ {vitals.hr} bpm</span>
        <span style={styles.vital}>🩸 {vitals.bp}</span>
        <span style={styles.vital}>🫁 {vitals.spo2}%</span>
        <span style={styles.vital}>🌡️ {vitals.temp}°C</span>
      </div>
    </div>
  );
}

const styles: any = {
  card: {
    background: "white",
    borderRadius: "10px",
    padding: "18px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
  },
  vitalsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "10px",
  },
  vital: {
    fontSize: "11px",
    color: "#64748b",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "2px 7px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  name: {
    fontWeight: 700,
    fontSize: "15px",
    color: "#0f172a",
  },
  meta: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "2px",
  },
  barWrap: {
    background: "#f1f5f9",
    borderRadius: "4px",
    height: "6px",
    overflow: "hidden",
    marginBottom: "8px",
  },
  barFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.6s ease",
  },
  scoreRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
};

export default PatientCard;
