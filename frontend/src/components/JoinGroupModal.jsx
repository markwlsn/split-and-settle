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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15">
              <KeyRound className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-white">Join a Group</h3>
              <p className="text-xs text-neutral-400">Enter a 6-character group invite code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
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
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Invite Code *
            </label>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="e.g. TRIP26"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full font-mono uppercase tracking-widest text-center text-lg font-bold rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-white placeholder-neutral-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Your Display Name in this Group (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Bob"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || inviteCode.trim().length < 4}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black shadow-md hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : <ArrowRight className="h-4 w-4 stroke-[2.2]" />}
              Join Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
