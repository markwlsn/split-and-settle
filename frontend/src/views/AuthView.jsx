import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Receipt, Sparkles, ArrowRight, ShieldCheck, Zap, Loader2, Eye, EyeOff, Check } from "lucide-react";

const AVATAR_COLORS = [
  "#0a84ff","#30d158","#bf5af2","#ff375f","#ff9f0a","#5ac8fa","#ff453a","#5e5ce6",
];

function StepDot({ active, done }) {
  return (
    <div
      className="h-2 w-2 rounded-full transition-all"
      style={{
        background: done ? "var(--success)" : active ? "var(--accent)" : "var(--border-strong)",
        width: active ? 20 : 8,
      }}
    />
  );
}

export default function AuthView() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // registration steps: 1=credentials, 2=profile

  // Step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Step 2
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getInitials(n) {
    if (!n) return "?";
    return n.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2);
  }

  const handleNextStep = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Full name is required"); return; }
    if (!email.trim()) { setError("Email is required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (!agreedToTerms) { setError("Please agree to the Terms of Service to continue"); return; }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name.trim(), undefined, { avatar_color: avatarColor });
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    setStep(1);
    setError("");
    setEmail("");
    setPassword("");
    setName("");
    setAgreedToTerms(false);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="w-full max-w-sm animate-fade-in">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div
            className="inline-flex h-16 w-16 items-center justify-center rounded-3xl shadow-2xl mb-4 transition-transform hover:scale-105"
            style={{ background: "var(--btn-primary-bg)" }}
          >
            <Receipt className="h-8 w-8" style={{ color: "var(--btn-primary-text)" }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Split &amp; Settle
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            AI-powered receipt splitting
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-6 shadow-2xl"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {/* Segmented tabs */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: "var(--bg-elevated)" }}
          >
            {[{ id: true, label: "Sign In" }, { id: false, label: "Create Account" }].map(({ id, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => switchMode(id)}
                className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
                style={{
                  background: isLogin === id ? "var(--bg-surface)" : "transparent",
                  color: isLogin === id ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: isLogin === id ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 rounded-xl p-3 text-xs font-medium"
              style={{ background: "var(--destructive-light)", color: "var(--destructive)", border: "1px solid var(--destructive-light)" }}
            >
              {error}
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {isLogin && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Email
                </label>
                <input
                  type="email" required
                  placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} required
                    placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input-field w-full pl-3.5 pr-10 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 rounded-lg p-1 transition"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary mt-2 flex w-full items-center justify-center gap-2 py-3">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {/* ── REGISTER STEP 1 — Credentials ── */}
          {!isLogin && step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Full Name *
                </label>
                <input
                  type="text" required
                  placeholder="e.g. Sarah Miller"
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="input-field w-full px-3.5 py-2.5 text-sm"
                />
                <p className="mt-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  Helps group members recognise who paid or owes money.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Email *</label>
                <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field w-full px-3.5 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Password *</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required minLength={6} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field w-full pl-3.5 pr-10 py-2.5 text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 rounded-lg p-1" style={{ color: "var(--text-secondary)" }}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <div className="relative flex items-center mt-0.5">
                  <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="peer sr-only" />
                  <div
                    className="h-4 w-4 rounded-md flex items-center justify-center transition"
                    style={{
                      background: agreedToTerms ? "var(--accent)" : "var(--bg-elevated)",
                      border: `1.5px solid ${agreedToTerms ? "var(--accent)" : "var(--border-strong)"}`,
                    }}
                  >
                    {agreedToTerms && <Check className="h-3 w-3 text-white stroke-[3]" />}
                  </div>
                </div>
                <span className="text-xs leading-tight" style={{ color: "var(--text-secondary)" }}>
                  I agree to the <span style={{ color: "var(--accent)" }} className="cursor-pointer">Terms of Service</span> and <span style={{ color: "var(--accent)" }} className="cursor-pointer">Privacy Policy</span>
                </span>
              </label>
              <button type="submit" className="btn-primary mt-2 flex w-full items-center justify-center gap-2 py-3">
                <span>Continue</span><ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* ── REGISTER STEP 2 — Avatar picker ── */}
          {!isLogin && step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold" style={{ color: "var(--accent)" }}>← Back</button>
                <div className="flex gap-1.5 ml-auto">
                  {[1, 2].map((s) => <StepDot key={s} active={step === s} done={step > s} />)}
                </div>
              </div>

              {/* Avatar preview */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-3xl text-white text-2xl font-bold shadow-xl"
                  style={{ background: avatarColor }}
                >
                  {getInitials(name)}
                </div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Choose your avatar color</p>
              </div>

              {/* Color grid */}
              <div className="grid grid-cols-8 gap-2.5">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className="h-9 w-9 rounded-full transition-transform hover:scale-110 active:scale-95 relative"
                    style={{ background: color }}
                  >
                    {avatarColor === color && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white stroke-[3]" />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-3">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Create Account</span><ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}
        </div>

        {/* Feature pills */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          {[
            { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Gemini Vision" },
            { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Privacy First" },
            { icon: <Zap className="h-3.5 w-3.5" />, label: "Auto Settle" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-2xl p-3 gap-1"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <span style={{ color: "var(--accent)" }}>{icon}</span>
              <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
