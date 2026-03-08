import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: "🏥", path: "/dashboard" },
  { label: "Patients", icon: "👤", path: "/patients" },
  { label: "Alerts", icon: "🚨", path: "/alerts" },
  { label: "Analytics", icon: "📊", path: "/analytics" },
  { label: "Settings", icon: "⚙️", path: "/settings" },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={styles.sidebar}>
      <div style={styles.brand}>
        <span style={{ fontSize: "22px" }}>🫀</span>
        <div>
          <div style={styles.brandName}>SepsisGuard</div>
          <div style={styles.brandSub}>AI Clinical Platform</div>
        </div>
      </div>

      <nav style={{ marginTop: "20px" }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navItem,
                background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                borderLeft: isActive ? "3px solid #60a5fa" : "3px solid transparent",
              }}
            >
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={styles.statusBadge}>
        <span style={styles.dot}></span>
        <span style={{ fontSize: "11px", color: "#86efac" }}>AI Engine Active</span>
      </div>
    </div>
  );
}

const styles: any = {
  sidebar: {
    width: "240px",
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    padding: "0",
    flexShrink: 0,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "20px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  brandName: {
    color: "white",
    fontWeight: 700,
    fontSize: "15px",
  },
  brandSub: {
    color: "#64748b",
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  navItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    color: "#94a3b8",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left" as const,
    transition: "all 0.15s",
    borderRadius: "0",
  },
  statusBadge: {
    marginTop: "auto",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#22c55e",
    display: "inline-block",
  },
};

export default Sidebar;
