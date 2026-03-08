interface AlertBannerProps {
  message: string;
  show: boolean;
  onDismiss?: () => void;
  level?: "critical" | "warning" | "info";
}

const levelColors: Record<string, string> = {
  critical: "#dc2626",
  warning: "#d97706",
  info: "#2563eb",
};

function AlertBanner({ message, show, onDismiss, level = "critical" }: AlertBannerProps) {
  if (!show) return null;

  const bg = levelColors[level] ?? levelColors.critical;
  const icon = level === "critical" ? "🚨" : level === "warning" ? "⚠️" : "ℹ️";

  return (
    <div style={{ ...styles.banner, background: bg, boxShadow: `0 4px 12px ${bg}55` }}>
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <span style={{ flex: 1, fontWeight: 600 }}>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={styles.dismiss}>
          ✕
        </button>
      )}
    </div>
  );
}

const styles: any = {
  banner: {
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    animation: "pulse 1.5s infinite",
  },
  dismiss: {
    background: "transparent",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    padding: "0 4px",
  },
};

export default AlertBanner;
