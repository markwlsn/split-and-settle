import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import GroupDetailView from './views/GroupDetailView';
import ReceiptSplitView from './views/ReceiptSplitView';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-400">
      <Navbar
        onNavigateHome={() => {
          setSelectedReceiptId(null);
          setSelectedGroup(null);
        }}
        activeGroup={selectedGroup}
      />

      <main className="pb-16">
        {selectedReceiptId ? (
          <ReceiptSplitView
            receiptId={selectedReceiptId}
            currency={selectedGroup?.currency || 'USD'}
            onBack={() => setSelectedReceiptId(null)}
            onConfirmed={() => {
              // Confirmation callback
            }}
          />
        ) : selectedGroup ? (
          <GroupDetailView
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
            onSelectReceipt={(receiptId) => setSelectedReceiptId(receiptId)}
          />
        ) : (
          <DashboardView
            onSelectGroup={(group, receiptId) => {
              setSelectedGroup(group);
              if (receiptId) {
                setSelectedReceiptId(receiptId);
              }
            }}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
