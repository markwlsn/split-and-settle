import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import BottomTabBar from './components/BottomTabBar';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import GroupDetailView from './views/GroupDetailView';
import ReceiptSplitView from './views/ReceiptSplitView';
import ProfileView from './views/ProfileView';
import { Loader2, Receipt, ChevronLeft, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

function InGroupHeader({ title, subtitle, onBack }) {
  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: 'var(--tab-bar-bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onBack}
          className="flex items-center justify-center h-9 w-9 rounded-xl transition active:scale-90"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
          {subtitle && (
            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}

function DashboardHeader({ onOpenProfile }) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const avatarColor = user?.user_metadata?.avatar_color || '#0a84ff';

  function getInitials(n) {
    if (!n) return 'U';
    return n.split(' ').map((x) => x[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: 'var(--tab-bar-bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="mx-auto flex h-16 sm:h-18 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm transition-transform hover:scale-105"
            style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
          >
            <Receipt className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                Split &amp; Settle
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-light)',
                }}
              >
                <Sparkles className="h-2.5 w-2.5" /> AI
              </span>
            </div>
            <p className="hidden text-[11px] sm:block" style={{ color: 'var(--text-secondary)' }}>
              Intelligent group expense sharing
            </p>
          </div>
        </div>

        {/* Right: Quick Theme Switcher & Profile Chip */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition active:scale-90"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            {isDark ? <Sun className="h-4 w-4" style={{ color: 'var(--warning)' }} /> : <Moon className="h-4 w-4" style={{ color: 'var(--text-primary)' }} />}
          </button>

          <button
            onClick={onOpenProfile}
            title="View Profile"
            className="flex items-center gap-2 rounded-2xl p-1 pr-3 transition hover:opacity-90 active:scale-95"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white text-xs font-bold shadow-sm"
              style={{ background: avatarColor }}
            >
              {getInitials(displayName)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold max-w-[120px] truncate" style={{ color: 'var(--text-primary)' }}>
                {displayName}
              </p>
              <p className="text-[10px] leading-none" style={{ color: 'var(--text-secondary)' }}>
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
    <div className="min-h-screen pb-tab-bar flex flex-col items-center justify-center gap-3" style={{ background: 'var(--bg-base)' }}>
      <div className="h-16 w-16 flex items-center justify-center rounded-3xl text-3xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>🔔</div>
      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Activity Feed</p>
      <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-secondary)' }}>Global activity across all your groups will appear here.</p>
    </div>
  );
}

function GlobalBalancesView() {
  return (
    <div className="min-h-screen pb-tab-bar flex flex-col items-center justify-center gap-3" style={{ background: 'var(--bg-base)' }}>
      <div className="h-16 w-16 flex items-center justify-center rounded-3xl text-3xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>⚖️</div>
      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Your Balances</p>
      <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-secondary)' }}>Net balances across all groups will be summarised here.</p>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('groups');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthView />;

  if (selectedReceiptId) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
        <InGroupHeader title="Receipt Details" subtitle={selectedGroup?.name} onBack={() => setSelectedReceiptId(null)} />
        <ReceiptSplitView receiptId={selectedReceiptId} currency={selectedGroup?.currency || 'USD'} onBack={() => setSelectedReceiptId(null)} onConfirmed={() => {}} />
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
        <InGroupHeader title={selectedGroup.name} subtitle="Expense Group" onBack={() => setSelectedGroup(null)} />
        <GroupDetailView group={selectedGroup} onBack={() => setSelectedGroup(null)} onSelectReceipt={(id) => setSelectedReceiptId(id)} />
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'groups':   return <><DashboardHeader onOpenProfile={() => setActiveTab('profile')} /><DashboardView onSelectGroup={(g, rid) => { setSelectedGroup(g); if (rid) setSelectedReceiptId(rid); }} /></>;
      case 'activity': return <><DashboardHeader onOpenProfile={() => setActiveTab('profile')} /><ActivityView /></>;
      case 'balances': return <><DashboardHeader onOpenProfile={() => setActiveTab('profile')} /><GlobalBalancesView /></>;
      case 'profile':  return <ProfileView />;
      default: return null;
    }
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <div className="animate-fade-in">{renderTab()}</div>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
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

