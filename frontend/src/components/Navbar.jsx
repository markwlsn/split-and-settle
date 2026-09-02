import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Receipt, LogOut, Users, Sparkles } from 'lucide-react';

export default function Navbar({ onNavigateHome, activeGroup }) {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/30">
              <Receipt className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-slate-100">
                <span>Split & Settle</span>
                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" /> AI
                </span>
              </div>
            </div>
          </button>

          {activeGroup && (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-slate-600">/</span>
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-800">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span className="max-w-[160px] truncate">{activeGroup.name}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-full bg-slate-900 py-1 pl-1.5 pr-3 border border-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              {getInitials(displayName)}
            </div>
            <span className="hidden text-xs font-medium text-slate-300 sm:inline">
              {displayName}
            </span>
          </div>

          <button
            onClick={logout}
            title="Log out"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 text-slate-400 transition hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
