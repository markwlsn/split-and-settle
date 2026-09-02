import React, { useState } from 'react';
import { X, KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function JoinGroupModal({ isOpen, onClose, onGroupJoined }) {
  const [inviteCode, setInviteCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.joinGroup(inviteCode.trim().toUpperCase(), displayName.trim() || undefined);
      onGroupJoined(res.group);
      setInviteCode('');
      setDisplayName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Join a Group</h3>
              <p className="text-xs text-slate-400">Enter a 6-character group invite code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Invite Code *
            </label>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="e.g. TRIP26"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full font-mono uppercase tracking-widest text-center text-lg font-bold rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-emerald-400 placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Display Name in this Group (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Bob"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || inviteCode.trim().length < 4}
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-teal-500/20 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Join Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
