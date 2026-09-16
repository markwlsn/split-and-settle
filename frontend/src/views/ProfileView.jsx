import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, LogOut, User, Palette, ChevronRight, ArrowLeft, ShieldCheck, Mail, Laptop, ShieldAlert, Bug, MessageSquare, Sparkles, Shield, Activity } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import FeedbackModal from "../components/FeedbackModal";

const AVATAR_COLORS = [
  { id: "blue",   bg: "#0a84ff", label: "Ocean" },
  { id: "green",  bg: "#30d158", label: "Mint" },
  { id: "purple", bg: "#bf5af2", label: "Grape" },
  { id: "pink",   bg: "#ff375f", label: "Coral" },
  { id: "orange", bg: "#ff9f0a", label: "Amber" },
  { id: "teal",   bg: "#5ac8fa", label: "Sky" },
  { id: "red",    bg: "#ff453a", label: "Rose" },
  { id: "indigo", bg: "#5e5ce6", label: "Indigo" },
];

function getInitials(name) {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ProfileView({ onBack, onOpenAdmin }) {
  const { user, logout, logoutAll, updateUser, isAdmin, toggleAdminRole } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const [avatarColor, setAvatarColor] = useState(
    user?.user_metadata?.avatar_color || AVATAR_COLORS[0].bg
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSignOutAllModal, setShowSignOutAllModal] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackInitialTab, setFeedbackInitialTab] = useState("bug");

  const openFeedback = (tab = "bug") => {
    setFeedbackInitialTab(tab);
    setShowFeedbackModal(true);
  };

  const handleSignOutAll = async () => {
    setSigningOutAll(true);
    try {
      await logoutAll();
    } catch (err) {
      console.error("Failed to sign out of all devices:", err);
    } finally {
      setSigningOutAll(false);
      setShowSignOutAllModal(false);
    }
  };

  const handleColorSelect = (bg) => {
    setAvatarColor(bg);
    setShowColorPicker(false);
    if (user && updateUser) {
      updateUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          avatar_color: bg,
        },
      });
    }
  };

  const Row = ({ icon: Icon, label, value, onClick, danger }) => (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 transition text-left ${onClick ? "active:opacity-70 cursor-pointer" : "cursor-default"}`}
      style={{ color: danger ? "var(--destructive)" : "var(--text-primary)" }}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
        style={{
          background: danger ? "var(--destructive-light)" : "var(--bg-elevated)",
        }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-1 items-center justify-between min-w-0 gap-3">
        <span className="text-sm font-medium truncate">{label}</span>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {value && (
            <span className="text-xs sm:text-sm font-normal text-right truncate" style={{ color: "var(--text-secondary)" }}>
              {value}
            </span>
          )}
          {onClick && !danger && (
            <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--text-tertiary)" }} />
          )}
        </div>
      </div>
    </button>
  );

  return (
    <div
      className="min-h-screen pb-tab-bar"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-8 animate-fade-in">

        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between mb-8 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 hover:opacity-85"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Groups</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Account Settings
            </span>
          </div>
        </div>

        {/* Responsive Desktop Grid: 1/3 Profile Card, 2/3 Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Left Column: Identity Card */}
          <div className="md:col-span-1">
            <div
              className="rounded-3xl p-6 flex flex-col items-center text-center shadow-sm sticky top-24"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <div
                className="flex h-24 w-24 items-center justify-center rounded-3xl shadow-xl text-white text-3xl font-bold mb-4 transition-transform hover:scale-105"
                style={{ background: avatarColor }}
              >
                {getInitials(displayName)}
              </div>
              <h2 className="text-lg font-bold truncate max-w-full" style={{ color: "var(--text-primary)" }}>
                {displayName}
              </h2>
              <p className="text-xs mt-1 truncate max-w-full" style={{ color: "var(--text-secondary)" }}>
                {user?.email}
              </p>

              {isAdmin ? (
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold mt-4"
                  style={{ background: "rgba(10, 132, 255, 0.15)", color: "var(--accent)", border: "1px solid rgba(10, 132, 255, 0.25)" }}
                >
                  <Shield className="h-3.5 w-3.5 text-blue-500" />
                  <span>System Administrator</span>
                </div>
              ) : (
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold mt-4"
                  style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Verified Member</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Settings Sections */}
          <div className="md:col-span-2 space-y-6">

            {/* Appearance Section */}
            <section>
              <p
                className="px-1 mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-secondary)" }}
              >
                Appearance
              </p>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                {/* Theme toggle row */}
                <div className="flex w-full items-center gap-3 px-4 py-3.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    {isDark ? (
                      <Moon className="h-4 w-4" style={{ color: "var(--text-primary)" }} />
                    ) : (
                      <Sun className="h-4 w-4" style={{ color: "var(--warning)" }} />
                    )}
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      Theme Mode
                    </span>
                    {/* Toggle pill */}
                    <button
                      onClick={toggleTheme}
                      className="flex items-center rounded-full p-1 transition"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        gap: 2,
                      }}
                      aria-label="Toggle theme"
                    >
                      {["dark", "light"].map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                          style={{
                            background: theme === t ? "var(--accent)" : "transparent",
                            color: theme === t ? "var(--accent-text)" : "var(--text-secondary)",
                          }}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </span>
                      ))}
                    </button>
                  </div>
                </div>

                <div style={{ height: 1, background: "var(--border)", margin: "0 16px" }} />

                {/* Avatar color row */}
                <button
                  onClick={() => setShowColorPicker((v) => !v)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 transition active:opacity-70"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    <Palette className="h-4 w-4" style={{ color: "var(--text-primary)" }} />
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      Avatar Accent Color
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-5 w-5 rounded-full shadow-sm"
                        style={{ background: avatarColor }}
                      />
                      <ChevronRight
                        className="h-4 w-4 transition-transform"
                        style={{
                          color: "var(--text-tertiary)",
                          transform: showColorPicker ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                      />
                    </div>
                  </div>
                </button>

                {showColorPicker && (
                  <div className="px-4 pb-4 pt-1 grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                    {AVATAR_COLORS.map(({ id, bg, label }) => (
                      <button
                        key={id}
                        onClick={() => handleColorSelect(bg)}
                        title={label}
                        className="relative h-10 w-full sm:h-9 sm:w-9 rounded-2xl sm:rounded-full transition-transform hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm"
                        style={{ background: bg }}
                      >
                        {avatarColor === bg && (
                          <span className="text-white text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Account Info Section */}
            <section>
              <p
                className="px-1 mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-secondary)" }}
              >
                Account Details
              </p>
              <div
                className="rounded-2xl overflow-hidden divide-y"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  "--tw-divide-opacity": 1,
                }}
              >
                <Row icon={User} label="Display Name" value={displayName} />
                <Row icon={Mail} label="Email Address" value={user?.email} />
              </div>
            </section>

            {/* Support & Feedback Section */}
            <section>
              <p
                className="px-1 mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-secondary)" }}
              >
                Support &amp; Feedback
              </p>
              <div
                className="rounded-2xl overflow-hidden divide-y"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  "--tw-divide-opacity": 1,
                }}
              >
                <Row
                  icon={Bug}
                  label="Report a Bug or Issue"
                  value="Get Help"
                  onClick={() => openFeedback("bug")}
                />
                <Row
                  icon={Sparkles}
                  label="Request an Improvement"
                  value="Suggest"
                  onClick={() => openFeedback("improvement")}
                />
                <Row
                  icon={MessageSquare}
                  label="Rate Satisfaction &amp; Review"
                  value="Survey"
                  onClick={() => openFeedback("survey")}
                />
              </div>
            </section>

            {/* System Administration & Security Section */}
            <section>
              <p
                className="px-1 mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-secondary)" }}
              >
                System Administration
              </p>
              <div
                className="rounded-2xl overflow-hidden divide-y"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  "--tw-divide-opacity": 1,
                }}
              >
                <Row
                  icon={Shield}
                  label="Admin Command Space"
                  value={isAdmin ? "Launch Console" : "Enable Admin Mode"}
                  onClick={isAdmin ? onOpenAdmin : toggleAdminRole}
                />
                <div className="flex items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                      style={{
                        background: isAdmin ? "rgba(10, 132, 255, 0.15)" : "var(--bg-elevated)",
                        color: isAdmin ? "var(--accent)" : "var(--text-secondary)",
                      }}
                    >
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        Admin Role Simulation
                      </span>
                      <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {isAdmin ? "Administrator Privileges Active" : "Regular Member Account"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAdminRole}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer"
                    style={{
                      background: isAdmin ? "var(--accent)" : "var(--bg-elevated)",
                      color: isAdmin ? "#fff" : "var(--text-primary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span>{isAdmin ? "Admin Active" : "Toggle Admin"}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Session & Security Section */}
            <section>
              <p
                className="px-1 mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-secondary)" }}
              >
                Session &amp; Security
              </p>
              <div
                className="rounded-2xl overflow-hidden divide-y"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  "--tw-divide-opacity": 1,
                }}
              >
                {/* Current Device / Single Sign Out */}
                <div className="flex items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                      style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                    >
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          Current Session
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      </div>
                      <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        Sign out of this device only
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>

                {/* All Devices / Global Sign Out */}
                <div className="flex items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                      style={{ background: "var(--destructive-light)", color: "var(--destructive)" }}
                    >
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        All Devices
                      </span>
                      <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        Invalidate logins on all browsers &amp; devices
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSignOutAllModal(true)}
                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
                    style={{
                      background: "var(--destructive-light)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "var(--destructive)",
                    }}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Sign Out Everywhere</span>
                  </button>
                </div>
              </div>
            </section>

            <p className="text-center text-xs pt-2" style={{ color: "var(--text-tertiary)" }}>
              Split &amp; Settle v1.0 · Apple HIG SaaS Web Design
            </p>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showSignOutAllModal}
        onClose={() => !signingOutAll && setShowSignOutAllModal(false)}
        onConfirm={handleSignOutAll}
        title="Sign out of all devices?"
        message="This will immediately invalidate active sessions across all devices and browsers. You will need to sign back in everywhere."
        confirmText="Sign Out Everywhere"
        loading={signingOutAll}
        isDestructive
      />

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        initialTab={feedbackInitialTab}
      />
    </div>
  );
}
