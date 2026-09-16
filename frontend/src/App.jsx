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
import { Loader2, Receipt, ChevronLeft, Sparkles } from 'lucide-react';

function InGroupHeader({ title, subtitle, onBack }) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-3 px-4 h-14"
      style={{
        background: 'var(--tab-bar-bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <button
        onClick={onBack}
        className="flex items-center justify-center h-8 w-8 rounded-xl transition active:scale-90"
        style={{ background: 'var(--bg-elevated)' }}
        aria-label="Go back"
      >
        <ChevronLeft className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
        {subtitle && (
          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        )}
      </div>
    </header>
  );
}

function DashboardHeader() {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-5 h-14"
      style={{
        background: 'var(--tab-bar-bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: 'var(--btn-primary-bg)' }}
        >
          <Receipt className="h-4 w-4" style={{ color: 'var(--btn-primary-text)' }} />
        </div>
        <span className="font-bold tracking-tight text-sm" style={{ color: 'var(--text-primary)' }}>
          Split &amp; Settle
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
        >
          <Sparkles className="h-2.5 w-2.5" /> AI
        </span>
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
      case 'groups':   return <><DashboardHeader /><DashboardView onSelectGroup={(g, rid) => { setSelectedGroup(g); if (rid) setSelectedReceiptId(rid); }} /></>;
      case 'activity': return <><DashboardHeader /><ActivityView /></>;
      case 'balances': return <><DashboardHeader /><GlobalBalancesView /></>;
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

