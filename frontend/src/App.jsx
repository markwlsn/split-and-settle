import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import BottomTabBar from "./components/BottomTabBar";
import AuthView from "./views/AuthView";
import DashboardView from "./views/DashboardView";
import GroupDetailView from "./views/GroupDetailView";
import ReceiptSplitView from "./views/ReceiptSplitView";
import ProfileView from "./views/ProfileView";
import AdminView from "./views/AdminView";
import { Loader2, Receipt, ChevronLeft, Sparkles, Sun, Moon, Users, Bell, Scale, Shield } from "lucide-react";

function InGroupHeader({ title, subtitle, onBack }) {
  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: "var(--tab-bar-bg)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onBack}
          className="flex items-center justify-center h-9 w-9 rounded-xl transition active:scale-90"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{title}</p>
          {subtitle && (
            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}

function DashboardHeader({ activeTab, onTabChange, onOpenProfile, onOpenAdmin }) {
  const { user, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const avatarColor = user?.user_metadata?.avatar_color || "#0a84ff";

  function getInitials(n) {
    if (!n) return "U";
    return n.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2);
  }

  const DESKTOP_NAV = [
    { id: "groups",   label: "Groups",   Icon: Users },
    { id: "activity", label: "Activity", Icon: Bell },
    { id: "balances", label: "Balances", Icon: Scale },
  ];

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: "var(--tab-bar-bg)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="mx-auto flex h-16 sm:h-18 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand */}
        <div
          onClick={() => onTabChange("groups")}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm transition-transform hover:scale-105"
            style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
          >
            <Receipt className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base sm:text-lg" style={{ color: "var(--text-primary)" }}>
                Split &amp; Settle
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                  border: "1px solid var(--accent-light)",
                }}
              >
                <Sparkles className="h-2.5 w-2.5" /> AI
              </span>
            </div>
            <p className="hidden text-[11px] sm:block" style={{ color: "var(--text-secondary)" }}>
              Intelligent group expense sharing
            </p>
          </div>
        </div>

        {/* Center: Desktop Navigation Bar (hidden on mobile, visible on desktop) */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          {DESKTOP_NAV.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{
                  background: isActive ? "var(--bg-surface)" : "transparent",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: isActive ? "var(--accent)" : "inherit" }} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Quick Theme Switcher & Profile Chip */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              title="Open Admin Command Space"
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-95 hover:opacity-90 cursor-pointer shadow-sm"
              style={{
                background: activeTab === "admin" ? "var(--accent)" : "rgba(10, 132, 255, 0.12)",
                color: activeTab === "admin" ? "#fff" : "var(--accent)",
                border: "1px solid var(--accent-light)",
              }}
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin Space</span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition active:scale-90"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            {isDark ? <Sun className="h-4 w-4" style={{ color: "var(--warning)" }} /> : <Moon className="h-4 w-4" style={{ color: "var(--text-primary)" }} />}
          </button>

          <button
            onClick={onOpenProfile}
            title="View Profile"
            className="flex items-center gap-2 rounded-2xl p-1 pr-3 transition hover:opacity-90 active:scale-95"
            style={{
              background: activeTab === "profile" ? "var(--accent-light)" : "var(--bg-elevated)",
              border: `1px solid ${activeTab === "profile" ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm"
              style={{ background: avatarColor }}
            >
              {getInitials(displayName)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold max-w-[120px] truncate" style={{ color: "var(--text-primary)" }}>
                {displayName}
              </p>
              <p className="text-[10px] leading-none" style={{ color: "var(--text-secondary)" }}>
                Profile
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

function ActivityView() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 pb-tab-bar text-center">
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl text-3xl mb-4 shadow-sm"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        🔔
      </div>
      <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
        Activity Audit Feed
      </h3>
      <p className="mt-1.5 text-xs max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
        Recent member joins, receipt scans, split calculations, and recorded settlements across all your groups will be logged here.
      </p>
    </div>
  );
}

function GlobalBalancesView() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 pb-tab-bar text-center">
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl text-3xl mb-4 shadow-sm"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        ⚖️
      </div>
      <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
        Cross-Group Balances
      </h3>
      <p className="mt-1.5 text-xs max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
        Summary of who owes you and who you owe across all active groups will appear here. Open any individual group to view itemized settlements.
      </p>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (
          parsed?.user_metadata?.role === "admin" ||
          parsed?.app_metadata?.role === "admin" ||
          parsed?.email?.toLowerCase() === "markwilsongeronilla01@gmail.com"
        ) {
          return "admin";
        }
      } catch (e) {}
    }
    return "groups";
  });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);

  // Automatically land on the admin space when authenticated as admin
  useEffect(() => {
    if (isAdmin) {
      setActiveTab((prev) => (prev === "groups" ? "admin" : prev));
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthView />;

  if (selectedReceiptId) {
    return (
      <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
        <InGroupHeader
          title="Receipt Details"
          subtitle={selectedGroup?.name}
          onBack={() => setSelectedReceiptId(null)}
        />
        <ReceiptSplitView
          receiptId={selectedReceiptId}
          currency={selectedGroup?.currency || "USD"}
          onBack={() => setSelectedReceiptId(null)}
          onConfirmed={() => {}}
        />
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
        <InGroupHeader
          title={selectedGroup.name}
          subtitle="Expense Group"
          onBack={() => setSelectedGroup(null)}
        />
        <GroupDetailView
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
          onSelectReceipt={(id) => setSelectedReceiptId(id)}
        />
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "groups":
        return (
          <>
            <DashboardHeader
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onOpenProfile={() => setActiveTab("profile")}
              onOpenAdmin={() => setActiveTab("admin")}
            />
            <DashboardView
              onSelectGroup={(g, rid) => {
                setSelectedGroup(g);
                if (rid) setSelectedReceiptId(rid);
              }}
            />
          </>
        );
      case "activity":
        return (
          <>
            <DashboardHeader
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onOpenProfile={() => setActiveTab("profile")}
              onOpenAdmin={() => setActiveTab("admin")}
            />
            <ActivityView />
          </>
        );
      case "balances":
        return (
          <>
            <DashboardHeader
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onOpenProfile={() => setActiveTab("profile")}
              onOpenAdmin={() => setActiveTab("admin")}
            />
            <GlobalBalancesView />
          </>
        );
      case "profile":
        return (
          <>
            <DashboardHeader
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onOpenProfile={() => setActiveTab("profile")}
              onOpenAdmin={() => setActiveTab("admin")}
            />
            <ProfileView
              onBack={() => setActiveTab("groups")}
              onOpenAdmin={() => setActiveTab("admin")}
            />
          </>
        );
      case "admin":
        return (
          <AdminView
            onBack={() => setActiveTab("groups")}
            onOpenUserApp={() => setActiveTab("groups")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      <div className="animate-fade-in">{renderTab()}</div>
      {activeTab !== "admin" && (
        <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
