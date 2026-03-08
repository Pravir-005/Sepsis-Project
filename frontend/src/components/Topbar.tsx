function Topbar() {
  const time = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={styles.topbar}>
      <div>
        <div style={styles.title}>ICU Dashboard</div>
        <div style={styles.subtitle}>Govt. Rajaji Hospital · ICU Unit</div>
      </div>
      <div style={styles.right}>
        <div style={styles.clock}>{time}</div>
        <div style={styles.userBadge}>DR</div>
        <span style={{ fontSize: "13px", color: "#475569" }}>Dr. Ramkumar</span>
      </div>
    </div>
  );
}

const styles: any = {
  topbar: {
    background: "white",
    padding: "12px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
    flexShrink: 0,
  },
  title: {
    fontWeight: 700,
    fontSize: "16px",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "2px",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  clock: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "5px 10px",
    borderRadius: "6px",
  },
  userBadge: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "12px",
  },
};

export default Topbar;
