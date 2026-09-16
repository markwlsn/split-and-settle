import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import TermsModal from "../components/TermsModal";
import {
  Receipt,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertCircle,
  User,
  AtSign,
  Phone,
  Mail,
  Lock,
} from "lucide-react";

const AVATAR_COLORS = [
  "#0a84ff", "#30d158", "#bf5af2", "#ff375f", "#ff9f0a", "#5ac8fa", "#ff453a", "#5e5ce6",
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

function ValidatedInput({
  label,
  type = "text",
  required = false,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  successMessage,
  icon: Icon,
  rightElement,
  autoComplete,
}) {
  const isTouched = !!touched;
  const isInvalid = isTouched && !!error;
  const isValid = isTouched && !error && value && value.trim().length > 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between min-h-[16px]">
        <label className="block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
          {label} {required && <span style={{ color: "var(--destructive)" }}>*</span>}
        </label>
        {isInvalid ? (
          <span
            className="text-[10px] font-semibold flex items-center gap-1 animate-fade-in"
            style={{ color: "var(--destructive)" }}
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </span>
        ) : isValid && successMessage ? (
          <span
            className="text-[10px] font-semibold flex items-center gap-1 animate-fade-in text-emerald-600 dark:text-emerald-400"
          >
            <Check className="h-3 w-3 stroke-[2.5] shrink-0" />
            {successMessage}
          </span>
        ) : null}
      </div>

      <div className="relative flex items-center">
        {Icon && (
          <div
            className="absolute left-3.5 flex items-center pointer-events-none transition-colors"
            style={{
              color: isInvalid
                ? "var(--destructive)"
                : isValid
                ? "var(--success)"
                : "var(--text-tertiary)",
            }}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          className={`w-full rounded-xl py-2.5 text-sm transition-all duration-200 outline-none ${
            Icon ? "pl-10" : "pl-3.5"
          } ${rightElement ? "pr-12" : "pr-9"}`}
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: isInvalid
              ? "1px solid var(--destructive)"
              : isValid
              ? "1px solid var(--success)"
              : "1px solid var(--border)",
            boxShadow: isInvalid
              ? "0 0 0 3.5px var(--destructive-light)"
              : isValid
              ? "0 0 0 3.5px var(--success-light)"
              : undefined,
          }}
        />
        {rightElement ? (
          <div className="absolute right-3 flex items-center gap-1.5">
            {isTouched && (
              isInvalid ? (
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              ) : isValid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : null
            )}
            {rightElement}
          </div>
        ) : (
          isTouched && (
            <div className="absolute right-3 pointer-events-none flex items-center animate-fade-in">
              {isInvalid ? (
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              ) : isValid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : null}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function AuthView() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // registration steps: 1=credentials, 2=profile

  // Form Fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsInitialTab, setTermsInitialTab] = useState("terms");

  const openTerms = (tab = "terms") => {
    setTermsInitialTab(tab);
    setShowTermsModal(true);
  };

  // Field Touched Tracking
  const [touched, setTouched] = useState({
    name: false,
    username: false,
    phone: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Avatar Color (Step 2)
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getInitials(n) {
    if (!n) return "?";
    return n.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2);
  }

  // --- Real-time Validation Rules ---
  const nameError = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return "Full name is required";
    if (trimmed.length < 2) return "At least 2 characters";
    return "";
  }, [name]);

  const usernameError = useMemo(() => {
    const trimmed = username.trim();
    if (!trimmed) return "Username is required";
    if (trimmed.length < 3) return "At least 3 characters";
    if (trimmed.length > 30) return "Max 30 characters";
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) return "Letters, numbers, _ & . only";
    return "";
  }, [username]);

  const phoneError = useMemo(() => {
    const trimmed = phone.trim();
    if (!trimmed) return "Phone number is required";
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly.length < 8) return "Min. 8 digits required";
    if (!/^[+0-9\s\-()]+$/.test(trimmed)) return "Invalid phone characters";
    return "";
  }, [phone]);

  const emailError = useMemo(() => {
    const trimmed = email.trim();
    if (!trimmed) return "Email address is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email";
    return "";
  }, [email]);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "Enter password", color: "var(--text-tertiary)" };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak", color: "#ff453a" };
      case 2:
        return { score: 2, label: "Fair", color: "#ff9f0a" };
      case 3:
        return { score: 3, label: "Good", color: "#0a84ff" };
      case 4:
        return { score: 4, label: "Strong", color: "#30d158" };
      default:
        return { score: 1, label: "Weak", color: "#ff453a" };
    }
  }, [password]);

  const passwordError = useMemo(() => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Min. 6 characters required";
    return "";
  }, [password]);

  const confirmPasswordError = useMemo(() => {
    if (!confirmPassword) return "Please confirm password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  }, [confirmPassword, password]);

  const handleNextStep = (e) => {
    e.preventDefault();
    setError("");
    setTouched({
      name: true,
      username: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (nameError) { setError(nameError); return; }
    if (usernameError) { setError(usernameError); return; }
    if (emailError) { setError(emailError); return; }
    if (phoneError) { setError(phoneError); return; }
    if (passwordError) { setError(passwordError); return; }
    if (confirmPasswordError) { setError(confirmPasswordError); return; }
    if (!agreedToTerms) { setError("Please agree to the Terms of Service to continue"); return; }

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(
          email.trim(),
          password,
          name.trim(),
          phone.trim() || undefined,
          username.trim() || undefined,
          {
            avatar_color: avatarColor,
            username: username.trim(),
          }
        );
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
    setConfirmPassword("");
    setName("");
    setUsername("");
    setPhone("");
    setAgreedToTerms(false);
    setTouched({
      name: false,
      username: false,
      phone: false,
      email: false,
      password: false,
      confirmPassword: false,
    });
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--bg-base)" }}
    >
      <div className={`w-full ${isLogin ? "max-w-sm" : "max-w-md"} transition-all duration-300 animate-fade-in`}>

        {/* Logo */}
        <div className="mb-6 text-center">
          <div
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl mb-3 transition-transform hover:scale-105"
            style={{ background: "var(--btn-primary-bg)" }}
          >
            <Receipt className="h-7 w-7" style={{ color: "var(--btn-primary-text)" }} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Split &amp; Settle
          </h1>
          <p className="mt-1 text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
            AI-powered receipt splitting &amp; expense sharing
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-5 sm:p-6 shadow-2xl"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {/* Segmented tabs */}
          <div
            className="flex rounded-xl p-1 mb-5"
            style={{ background: "var(--bg-elevated)" }}
          >
            {[{ id: true, label: "Sign In" }, { id: false, label: "Create Account" }].map(({ id, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => switchMode(id)}
                className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer"
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

          {/* Error Banner */}
          {error && (
            <div
              className="mb-4 rounded-xl p-3 text-xs font-medium flex items-center gap-2 animate-fade-in"
              style={{
                background: "var(--destructive-light)",
                color: "var(--destructive)",
                border: "1px solid var(--destructive-light)",
              }}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {isLogin && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <ValidatedInput
                label="Email"
                type="email"
                required
                icon={Mail}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); markTouched("email"); }}
                onBlur={() => markTouched("email")}
                touched={touched.email}
                error={emailError}
                successMessage="Valid format"
                autoComplete="email"
              />

              <ValidatedInput
                label="Password"
                type={showPassword ? "text" : "password"}
                required
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="rounded-lg p-1 transition cursor-pointer"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 flex w-full items-center justify-center gap-2 py-3 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── REGISTER STEP 1 — Credentials with Real-Time Validation ── */}
          {!isLogin && step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-3.5 animate-fade-in">
              {/* Row 1: Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ValidatedInput
                  label="Full Name"
                  required
                  icon={User}
                  placeholder="e.g. Sarah Miller"
                  value={name}
                  onChange={(e) => { setName(e.target.value); markTouched("name"); }}
                  onBlur={() => markTouched("name")}
                  touched={touched.name}
                  error={nameError}
                  successMessage="Looks good"
                  autoComplete="name"
                />

                <ValidatedInput
                  label="Username"
                  required
                  icon={AtSign}
                  placeholder="e.g. sarahm"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); markTouched("username"); }}
                  onBlur={() => markTouched("username")}
                  touched={touched.username}
                  error={usernameError}
                  successMessage="Available"
                  autoComplete="username"
                />
              </div>

              {/* Row 2: Email & Phone No. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ValidatedInput
                  label="Email"
                  type="email"
                  required
                  icon={Mail}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); markTouched("email"); }}
                  onBlur={() => markTouched("email")}
                  touched={touched.email}
                  error={emailError}
                  successMessage="Valid email"
                  autoComplete="email"
                />

                <ValidatedInput
                  label="Phone No."
                  type="tel"
                  required
                  icon={Phone}
                  placeholder="+1 555-0123"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); markTouched("phone"); }}
                  onBlur={() => markTouched("phone")}
                  touched={touched.phone}
                  error={phoneError}
                  successMessage="Valid number"
                  autoComplete="tel"
                />
              </div>

              {/* Row 3: Password */}
              <div className="space-y-2">
                <ValidatedInput
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  required
                  icon={Lock}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); markTouched("password"); }}
                  onBlur={() => markTouched("password")}
                  touched={touched.password}
                  error={passwordError}
                  successMessage={password.length >= 8 ? "Strong" : "Meets min. length"}
                  autoComplete="new-password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="rounded-lg p-1 transition cursor-pointer"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div
                    className="rounded-2xl p-2.5 space-y-2 animate-fade-in"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span style={{ color: "var(--text-secondary)" }}>Password Strength</span>
                      <span
                        className="font-bold transition-colors duration-200"
                        style={{ color: passwordStrength.color }}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>

                    {/* 4-tier segmented bar */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className="h-1.5 rounded-full transition-all duration-300"
                          style={{
                            background: bar <= passwordStrength.score ? passwordStrength.color : "var(--border)",
                          }}
                        />
                      ))}
                    </div>

                    {/* Real-time criteria pills */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                          password.length >= 8
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "text-[var(--text-tertiary)] border border-[var(--border)]"
                        }`}
                      >
                        {password.length >= 8 ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : "○"} 8+ chars
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                          /[a-z]/.test(password) && /[A-Z]/.test(password)
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "text-[var(--text-tertiary)] border border-[var(--border)]"
                        }`}
                      >
                        {/[a-z]/.test(password) && /[A-Z]/.test(password) ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : "○"} Aa case
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                          /[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password)
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "text-[var(--text-tertiary)] border border-[var(--border)]"
                        }`}
                      >
                        {/[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password) ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : "○"} 123 / symbol
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 4: Confirm Password (enter password again) */}
              <ValidatedInput
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                required
                icon={Lock}
                placeholder="Enter password again"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); markTouched("confirmPassword"); }}
                onBlur={() => markTouched("confirmPassword")}
                touched={touched.confirmPassword}
                error={confirmPasswordError}
                successMessage="Passwords match"
                autoComplete="new-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="rounded-lg p-1 transition cursor-pointer"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              {/* Terms of service checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="peer sr-only"
                  />
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
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openTerms("terms");
                    }}
                    className="cursor-pointer font-semibold underline underline-offset-2 hover:opacity-80 transition"
                    style={{ color: "var(--accent)" }}
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openTerms("privacy");
                    }}
                    className="cursor-pointer font-semibold underline underline-offset-2 hover:opacity-80 transition"
                    style={{ color: "var(--accent)" }}
                  >
                    Privacy Policy
                  </button>
                </span>
              </label>

              <button
                type="submit"
                className="btn-primary mt-3 flex w-full items-center justify-center gap-2 py-3 cursor-pointer shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* ── REGISTER STEP 2 — Avatar Picker ── */}
          {!isLogin && step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold cursor-pointer flex items-center gap-1"
                  style={{ color: "var(--accent)" }}
                >
                  ← Back to details
                </button>
                <div className="flex gap-1.5 ml-auto">
                  {[1, 2].map((s) => <StepDot key={s} active={step === s} done={step > s} />)}
                </div>
              </div>

              {/* Avatar preview */}
              <div className="flex flex-col items-center gap-2 text-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-3xl text-white text-2xl font-bold shadow-xl transition-transform hover:scale-105"
                  style={{ background: avatarColor }}
                >
                  {getInitials(name)}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{name}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>@{username}</p>
                </div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Choose an avatar color for your profile and group splits
                </p>
              </div>

              {/* Color grid */}
              <div className="grid grid-cols-8 gap-2.5">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className="h-9 w-9 rounded-full transition-transform hover:scale-110 active:scale-95 relative cursor-pointer"
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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
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

      {/* Terms & Privacy Policy Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        initialTab={termsInitialTab}
        onAccept={() => setAgreedToTerms(true)}
      />
    </div>
  );
}
