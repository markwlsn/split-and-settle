import React, { useState } from 'react';
import { X, Settings, RefreshCw, LogOut, Trash2, Globe, Save, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CURRENCIES } from '../utils/currency';
import { useAuth } from '../context/AuthContext';

export default function GroupSettingsModal({ isOpen, onClose, group, onGroupUpdated, onGroupDeleted, onGroupLeft }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(group.name || '');
  const [currency, setCurrency] = useState(group.currency || 'USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isCreator = group.created_by === user?.id;

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updated = await api.updateGroup(group.id, {
        name: name.trim(),
        currency,
      });
      showToast('Group settings updated!', 'success');
      onGroupUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!window.confirm('Regenerate invite code? The old code will stop working.')) return;
    setLoading(true);
    try {
      const updated = await api.updateGroup(group.id, { regenerateInviteCode: true });
      showToast(`New invite code: ${updated.invite_code}`, 'success');
      onGroupUpdated(updated);
    } catch (err) {
      setError(err.message || 'Failed to regenerate code');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    setLoading(true);
    try {
      await api.leaveGroup(group.id);
      showToast('You left the group.', 'info');
      onGroupLeft();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    const prompt = window.prompt(`Type "${group.name}" to permanently delete this group and all its receipts:`);
    if (prompt !== group.name) {
      if (prompt !== null) showToast('Group name did not match. Deletion cancelled.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.deleteGroup(group.id);
      showToast('Group deleted permanently.', 'info');
      onGroupDeleted();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Group Settings</h3>
              <p className="text-xs text-slate-400">Manage preferences and currency</p>
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

        <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Group Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none transition"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300">Invite Code</span>
              <button
                type="button"
                onClick={handleRegenerateCode}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Regenerate</span>
              </button>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-center font-mono text-base font-bold text-emerald-400">
              {group.invite_code || 'N/A'}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Membership Actions
          </span>

          {!isCreator ? (
            <button
              type="button"
              onClick={handleLeaveGroup}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Leave Group</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDeleteGroup}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Group Permanently</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
