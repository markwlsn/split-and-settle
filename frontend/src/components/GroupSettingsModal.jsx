import React, { useState } from 'react';
import { Settings, X, Save, RefreshCw, Trash2, LogOut } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CURRENCIES } from '../utils/currency';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';

export default function GroupSettingsModal({ isOpen, onClose, group, onGroupUpdated, onGroupDeleted, onGroupLeft }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(group?.name || '');
  const [currency, setCurrency] = useState(group?.currency || 'USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  if (!isOpen || !group) return null;

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
      setShowLeaveModal(false);
    }
  };

  const handleDeleteGroup = async () => {
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
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                <Settings className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-bold text-white">Group Settings</h3>
                <p className="text-xs text-neutral-400">Manage preferences and currency</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
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
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Group Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.symbol} {c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-neutral-300">Invite Code</span>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Regenerate</span>
                </button>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-black p-2.5 text-center font-mono text-base font-bold text-white tracking-wider">
                {group.invite_code || 'N/A'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition active:scale-95"
              >
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="mt-6 pt-5 border-t border-neutral-800 space-y-2">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Membership Actions
            </span>

            {!isCreator ? (
              <button
                type="button"
                onClick={() => setShowLeaveModal(true)}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 text-xs font-bold text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Leave Group</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteGroup}
        title={`Delete "${group.name}"?`}
        message="This will permanently delete this group, along with all uploaded receipts, split ledgers, and debt history. This action cannot be undone."
        confirmText="Delete Group"
        cancelText="Keep Group"
        isDestructive={true}
        loading={loading}
      />

      {/* Leave Confirmation Modal */}
      <ConfirmModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeaveGroup}
        title={`Leave "${group.name}"?`}
        message="Are you sure you want to leave this group? You will need an invite code to join again."
        confirmText="Leave Group"
        cancelText="Cancel"
        isDestructive={true}
        loading={loading}
      />
    </>
  );
}
