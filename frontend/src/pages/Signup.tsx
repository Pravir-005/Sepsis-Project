import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { signup } from "../api/auth";

export default function Signup() {
    const navigate = useNavigate();
    const { theme, toggle } = useTheme();
    const isDark = theme === "dark";

    const [form, setForm] = useState({
        name: "",
        username: "",
        password: "",
        confirmPassword: "",
        role: "nurse" as "doctor" | "nurse" | "admin",
        department: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSignup = async () => {
        setError("");
        if (!form.name || !form.username || !form.password || !form.confirmPassword || !form.department) {
            setError("All fields are required.");
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        try {
            const res = await signup(form);
            localStorage.setItem("sepsis_token", res.token);
            localStorage.setItem("sepsis_user", JSON.stringify(res.user));
            navigate("/dashboard");
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Signup failed. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        ...s.input,
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.1)",
        color: isDark ? "#e2e8f0" : "#0f172a",
    };
    const labelStyle = { ...s.label, color: isDark ? "#64748b" : "#475569" };

    return (
        <div style={{
            ...s.bg,
            background: isDark
                ? "radial-gradient(ellipse at 80% 20%, #0d1b2e 0%, #070b14 60%)"
                : "radial-gradient(ellipse at 80% 20%, #dbeafe 0%, #f0f4f8 60%)",
        }}>
            {/* Orbs */}
            <div style={{ ...s.orb, top: "10%", right: "18%", background: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.14)", width: 380, height: 380 }} />
            <div style={{ ...s.orb, bottom: "12%", left: "12%", background: isDark ? "rgba(56,189,248,0.10)" : "rgba(56,189,248,0.15)", width: 280, height: 280 }} />
            <div style={{ ...s.orb, top: "55%", right: "6%", background: isDark ? "rgba(248,113,113,0.06)" : "rgba(248,113,113,0.08)", width: 180, height: 180 }} />

            {/* Theme toggle */}
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

            {/* Card */}
            <div style={{
                ...s.card,
                background: isDark ? "rgba(13,20,34,0.88)" : "rgba(255,255,255,0.93)",
                border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.08)",
                boxShadow: isDark
                    ? "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.06)"
                    : "0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(99,102,241,0.1)",
            }}>
                {/* Logo */}
                <div style={s.logoRow}>
                    <div style={s.logoIcon}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span style={{ ...s.logoText, background: "linear-gradient(135deg, #818cf8, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SepsisAI</span>
                </div>

                <h1 style={{ ...s.title, color: isDark ? "#e2e8f0" : "#0f172a" }}>Create Your Account</h1>
                <p style={{ ...s.subtitle, color: isDark ? "#475569" : "#64748b" }}>Join the clinical intelligence platform</p>

                {/* Error */}
                {error && (
                    <div style={s.errorBox}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="2" />
                            <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Two-column row: Full Name + Username */}
                <div style={s.row}>
                    <div style={{ ...s.field, flex: 1 }}>
                        <label style={labelStyle}>Full Name</label>
                        <div style={s.inputWrap}>
                            <svg style={s.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                                    stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <input style={inputStyle} placeholder="Dr. Jane Smith" value={form.name} onChange={set("name")} onKeyDown={e => e.key === "Enter" && handleSignup()} />
                        </div>
                    </div>
                    <div style={{ ...s.field, flex: 1 }}>
                        <label style={labelStyle}>Username</label>
                        <div style={s.inputWrap}>
                            <svg style={s.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                                    stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <input style={inputStyle} placeholder="janesmith" value={form.username} onChange={set("username")} onKeyDown={e => e.key === "Enter" && handleSignup()} />
                        </div>
                    </div>
                </div>

                {/* Two-column row: Password + Confirm Password */}
                <div style={s.row}>
                    <div style={{ ...s.field, flex: 1 }}>
                        <label style={labelStyle}>Password</label>
                        <div style={s.inputWrap}>
                            <svg style={s.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#64748b" strokeWidth="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <input style={inputStyle} type="password" placeholder="••••••••" value={form.password} onChange={set("password")} onKeyDown={e => e.key === "Enter" && handleSignup()} />
                        </div>
                    </div>
                    <div style={{ ...s.field, flex: 1 }}>
                        <label style={labelStyle}>Confirm Password</label>
                        <div style={s.inputWrap}>
                            <svg style={s.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#64748b" strokeWidth="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <input style={inputStyle} type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set("confirmPassword")} onKeyDown={e => e.key === "Enter" && handleSignup()} />
                        </div>
                    </div>
                </div>

                {/* Two-column row: Role + Department */}
                <div style={s.row}>
                    <div style={{ ...s.field, flex: 1 }}>
                        <label style={labelStyle}>Role</label>
                        <div style={s.inputWrap}>
                            <svg style={s.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                                    stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <select style={{ ...inputStyle, appearance: "none" as any, cursor: "pointer" } as React.CSSProperties} value={form.role} onChange={set("role")}>
                                <option value="doctor">Doctor</option>
                                <option value="nurse">Nurse</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ ...s.field, flex: 1 }}>
                        <label style={labelStyle}>Department</label>
                        <div style={s.inputWrap}>
                            <svg style={s.inputIcon} width="15" height="15" viewBox="0 0 24 24" fill="none">
                                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points="9 22 9 12 15 12 15 22" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <input style={inputStyle} placeholder="ICU / General / CCU" value={form.department} onChange={set("department")} onKeyDown={e => e.key === "Enter" && handleSignup()} />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <button style={{ ...s.btn, opacity: loading ? 0.7 : 1, background: "linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }} onClick={handleSignup} disabled={loading}>
                    {loading ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                            <span style={s.spinner} /> Creating account…
                        </span>
                    ) : "Create Account"}
                </button>

                {/* Link to login */}
                <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: isDark ? "#475569" : "#64748b" }}>
                    Already have an account?{" "}
                    <Link to="/" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>
                        Sign in
                    </Link>
                </div>

                {/* Status bar */}
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
    card: { position: "relative", zIndex: 10, width: 520, padding: "44px 40px", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: 20, animation: "fadeUp 0.6s ease both" },
    logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24 },
    logoIcon: { width: 40, height: 40, borderRadius: 10, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" },
    logoText: { fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" },
    title: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 6 },
    subtitle: { fontSize: 13, marginBottom: 22 },
    errorBox: { display: "flex", alignItems: "center", gap: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16 },
    row: { display: "flex", gap: 14 },
    field: { marginBottom: 16 },
    label: { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: "0.3px" },
    inputWrap: { position: "relative" },
    inputIcon: { position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" },
    input: { width: "100%", borderRadius: 8, padding: "10px 13px 10px 34px", fontSize: 13, transition: "all 0.2s", outline: "none", boxSizing: "border-box" },
    btn: { width: "100%", marginTop: 4, padding: "13px", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, letterSpacing: "0.3px", cursor: "pointer", transition: "all 0.2s" },
    spinner: { width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" },
    statusBar: { display: "flex", alignItems: "center", justifyContent: "center", marginTop: 24, paddingTop: 16 },
};
