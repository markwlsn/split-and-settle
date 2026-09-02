import React, { useState, useEffect } from 'react';
import {
  Users,
  PlusCircle,
  KeyRound,
  ChevronRight,
  Receipt,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import CreateGroupModal from '../components/CreateGroupModal';
import JoinGroupModal from '../components/JoinGroupModal';

export default function DashboardView({ onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchGroups = async () => {
    try {
      const data = await api.listGroups();
      setGroups(data || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCopyCode = (e, code) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 mb-3">
              <Sparkles className="h-3.5 w-3.5" /> AI Receipt Parser
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
              Your Expense Groups
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-w-lg">
              Upload receipt photos, let Gemini Vision extract items, and settle up balances with minimal transactions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 shadow-md hover:bg-slate-800 hover:border-slate-600 transition active:scale-95"
            >
              <KeyRound className="h-4 w-4 text-teal-400" />
              <span>Join with Code</span>
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 transition active:scale-95"
            >
              <PlusCircle className="h-4 w-4 stroke-[2.5]" />
              <span>New Group</span>
            </button>
          </div>
        </div>
      </div>

      {/* Groups Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Active Groups ({groups.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-xs font-medium">Loading your groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-slate-500 border border-slate-800 mb-4">
              <Users className="h-7 w-7" />
            </div>
            <h4 className="text-base font-bold text-slate-200">No groups yet</h4>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mb-6">
              Create a group for your trip, dinner, or household, or join a friend's group with an invite code.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsJoinOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                <KeyRound className="h-3.5 w-3.5 text-teal-400" />
                Join Group
              </button>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Create Group
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const members = group.group_members || [];
              return (
                <div
                  key={group.id}
                  onClick={() => onSelectGroup(group)}
                  className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm transition hover:border-emerald-500/40 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-500/5 active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                        <Users className="h-5 w-5" />
                      </div>
                      
                      {group.invite_code && (
                        <button
                          onClick={(e) => handleCopyCode(e, group.invite_code)}
                          title="Copy invite code"
                          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] font-mono font-bold text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400 transition"
                        >
                          <span>{group.invite_code}</span>
                          {copiedCode === group.invite_code ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>

                    <h4 className="mt-3.5 text-base font-bold text-slate-100 group-hover:text-emerald-400 transition">
                      {group.name}
                    </h4>
                    <p className="mt-1 text-xs text-slate-400">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-3.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium group-hover:text-slate-200">
                      View Expenses
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-0.5 group-hover:text-emerald-400 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onGroupCreated={(newGroup, openedReceiptId) => {
          setGroups([newGroup, ...groups]);
          onSelectGroup(newGroup, openedReceiptId);
        }}
      />

      <JoinGroupModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onGroupJoined={(joinedGroup) => {
          setGroups([joinedGroup, ...groups]);
          onSelectGroup(joinedGroup);
        }}
      />
    </div>
  );
}
