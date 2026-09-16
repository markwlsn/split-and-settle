import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, LogOut, User, Palette, ChevronRight } from "lucide-react";

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

export default function ProfileView() {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const [avatarColor, setAvatarColor] = useState(
    user?.user_metadata?.avatar_color || AVATAR_COLORS[0].bg
  );
  const [showColorPicker, setShowColorPicker] = useState(false);

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
      className="flex w-full items-center gap-3 px-4 py-3.5 transition active:opacity-70"
      style={{ color: danger ? "var(--destructive)" : "var(--text-primary)" }}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{
          background: danger ? "var(--destructive-light)" : "var(--bg-elevated)",
        }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-1 items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {value && (
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {value}
          </span>
        )}
        {onClick && !danger && (
          <ChevronRight className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
        )}
      </div>
    </button>
  );

  return (
    <div
      className="min-h-screen pb-tab-bar"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="mx-auto max-w-lg px-4 pt-8 animate-fade-in">

        {/* Avatar hero */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-3xl shadow-xl text-white text-3xl font-bold"
            style={{ background: avatarColor }}
          >
            {getInitials(displayName)}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {displayName}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Appearance section */}
        <section className="mb-4">
          <p
            className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            Appearance
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
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
                  Appearance
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

            {/* Avatar color */}
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
                  Avatar Color
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-full"
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
              <div className="px-4 pb-4 grid grid-cols-8 gap-2">
                {AVATAR_COLORS.map(({ id, bg, label }) => (
                  <button
                    key={id}
                    onClick={() => handleColorSelect(bg)}
                    title={label}
                    className="relative h-8 w-8 rounded-full transition-transform hover:scale-110 active:scale-95"
                    style={{ background: bg }}
                  >
                    {avatarColor === bg && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Account section */}
        <section className="mb-4">
          <p
            className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            Account
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
          </div>
        </section>

        {/* Danger zone */}
        <section className="mb-8">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <Row icon={LogOut} label="Sign Out" danger onClick={logout} />
          </div>
        </section>

        <p
          className="text-center text-xs pb-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          Split &amp; Settle v1.0 · Made with Gemini Vision AI
        </p>
      </div>
    </div>
  );
}
