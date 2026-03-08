import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { login } from "../api/auth";

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isDark = theme === "dark";

  const handleLogin = async () => {
    if (!username || !password) { setError("Please enter your credentials."); return; }
    setLoading(true); setError("");
    try {
      const res = await login(username.trim(), password);
      localStorage.setItem("sepsis_token", res.token);
      localStorage.setItem("sepsis_user", JSON.stringify(res.user));
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Invalid credentials. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      ...s.bg,
      background: isDark
        ? "radial-gradient(ellipse at 20% 20%, #0d1b2e 0%, #070b14 60%)"
        : "radial-gradient(ellipse at 20% 20%, #dbeafe 0%, #f0f4f8 60%)",
    }}>
      <div style={{ ...s.orb, top: "15%", left: "20%", background: isDark ? "rgba(56,189,248,0.12)" : "rgba(56,189,248,0.18)", width: 360, height: 360 }} />
      <div style={{ ...s.orb, bottom: "10%", right: "18%", background: isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.12)", width: 280, height: 280 }} />
      <div style={{ ...s.orb, top: "60%", left: "8%", background: isDark ? "rgba(248,113,113,0.07)" : "rgba(248,113,113,0.08)", width: 200, height: 200 }} />

      <button
        style={{
          position: "absolute", top: 20, right: 20, zIndex: 20,
          display: "flex", alignItems: "center", gap: 8,
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
          borderRadius: 20, padding: "6px 12px 6px 8px",
          cursor: "pointer", color: isDark ? "#94a3b8" : "#475569",
          fontSize: 12, fontWeight: 600,
        }}
        onClick={toggle}
      >
        <span style={{ fontSize: 16 }}>{isDark ? "🌙" : "☀️"}</span>
        {isDark ? "Dark Mode" : "Light Mode"}
      </button>

      <div style={{
        ...s.card,
        background: isDark ? "rgba(13,20,34,0.85)" : "rgba(255,255,255,0.92)",
        border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.08)",
        boxShadow: isDark
          ? "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.06)"
          : "0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(14,165,233,0.1)",
      }}>
        <div style={s.logoRow}>
          <div style={s.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={s.logoText}>SepsisAI</span>
        </div>

        <h1 style={{ ...s.title, color: isDark ? "#e2e8f0" : "#0f172a" }}>Clinical Intelligence Platform</h1>
        <p style={{ ...s.subtitle, color: isDark ? "#475569" : "#64748b" }}>Sign in to access patient monitoring dashboard</p>

        {error && (
          <div style={s.errorBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        <div style={s.field}>
          <label style={{ ...s.label, color: isDark ? "#64748b" : "#475569" }}>Username</label>
          <div style={s.inputWrap}>
            <svg style={s.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input style={{
              ...s.input,
              background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.1)",
              color: isDark ? "#e2e8f0" : "#0f172a",
            }}
              placeholder="doctor / nurse / admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>
        </div>

        <div style={s.field}>
          <label style={{ ...s.label, color: isDark ? "#64748b" : "#475569" }}>Password</label>
          <div style={s.inputWrap}>
            <svg style={s.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="#64748b" strokeWidth="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input style={{
              ...s.input,
              background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.1)",
              color: isDark ? "#e2e8f0" : "#0f172a",
            }}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>
        </div>

        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <span style={s.spinner} /> Authenticating…
            </span>
          ) : "Sign In"}
        </button>

        <div style={{ textAlign: "center", fontSize: 11, color: isDark ? "#334155" : "#94a3b8", marginTop: 14 }}>
          Credentials: <strong>doctor</strong> / <strong>password123</strong> &nbsp;·&nbsp; Press Enter to sign in
        </div>

        <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: isDark ? "#475569" : "#64748b" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#38bdf8", fontWeight: 600, textDecoration: "none" }}>
            Sign up
          </Link>
        </div>

        <div style={{ ...s.statusBar, borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.06)" }}>
          <span className="live-dot" style={{ marginRight: 6 }} />
          <span style={{ color: isDark ? "#334155" : "#94a3b8", fontSize: 11 }}>Secure · TLS 1.3 · HIPAA compliant</span>
        </div>
      </div>
    </div>
  );
}

const s: any = {
  bg: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  orb: { position: "absolute", borderRadius: "50%", filter: "blur(80px)", animation: "glow-pulse 4s ease-in-out infinite", pointerEvents: "none" },
  card: { position: "relative", zIndex: 10, width: 420, padding: "44px 40px", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: 20, animation: "fadeUp 0.6s ease both" },
  logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 28 },
  logoIcon: { width: 40, height: 40, borderRadius: 10, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 20, fontWeight: 800, background: "linear-gradient(135deg, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px" },
  title: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 6 },
  subtitle: { fontSize: 13, marginBottom: 28 },
  errorBox: { display: "flex", alignItems: "center", gap: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 18 },
  field: { marginBottom: 18 },
  label: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 7, letterSpacing: "0.3px" },
  inputWrap: { position: "relative" },
  inputIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" },
  input: { width: "100%", borderRadius: 8, padding: "11px 14px 11px 38px", fontSize: 14, transition: "all 0.2s", outline: "none" },
  btn: { width: "100%", marginTop: 8, padding: "13px", background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, letterSpacing: "0.3px", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 20px rgba(14,165,233,0.35)" },
  spinner: { width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" },
  statusBar: { display: "flex", alignItems: "center", justifyContent: "center", marginTop: 28, paddingTop: 18 },
};