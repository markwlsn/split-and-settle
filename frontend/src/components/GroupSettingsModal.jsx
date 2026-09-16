import React, { useState } from "react";
import { Settings, X, Save, RefreshCw, Trash2, LogOut } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { CURRENCIES } from "../utils/currency";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";

export default function GroupSettingsModal({
  isOpen,
  onClose,
  group,
  onGroupUpdated,
  onGroupDeleted,
  onGroupLeft,
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(group?.name || "");
  const [currency, setCurrency] = useState(group?.currency || "USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  if (!isOpen || !group) return null;

  const isCreator = Boolean(user?.id && group?.created_by === user.id);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const updated = await api.updateGroup(group.id, {
        name: name.trim(),
        currency,
      });
      showToast("Group settings updated!", "success");
      onGroupUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update group");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    setLoading(true);
    try {
      const updated = await api.updateGroup(group.id, { regenerateInviteCode: true });
      showToast(`New invite code: ${updated.invite_code}`, "success");
      onGroupUpdated(updated);
    } catch (err) {
      setError(err.message || "Failed to regenerate code");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (isCreator) {
      showToast("Group creators cannot leave the group. You may delete it instead.", "error");
      setShowLeaveModal(false);
      return;
    }
    setLoading(true);
    try {
      await api.leaveGroup(group.id);
      showToast("You left the group.", "info");
      onGroupLeft();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to leave group");
    } finally {
      setLoading(false);
      setShowLeaveModal(false);
    }
  };

  const handleDeleteGroup = async () => {
    setLoading(true);
    try {
      await api.deleteGroup(group.id);
      showToast("Group deleted permanently.", "info");
      onGroupDeleted();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to delete group");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "var(--bg-overlay)", backdropFilter: "blur(16px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-settings-title"
      >
        <div
          className="w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slide-up"
          style={{ background: "var(--modal-bg)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}
              >
                <Settings className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 id="group-settings-title" className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  Group Settings
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Manage preferences and currency
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 transition"
              style={{ color: "var(--text-secondary)" }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div
              className="mt-4 rounded-xl p-3 text-xs font-medium"
              style={{
                background: "var(--destructive-light)",
                color: "var(--destructive)",
                border: "1px solid var(--destructive-light)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Group Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input-field w-full px-3.5 py-2.5 text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.symbol} {c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>Invite Code</span>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  className="flex items-center gap-1 text-[11px] font-medium transition"
                  style={{ color: "var(--accent)" }}
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Regenerate</span>
                </button>
              </div>
              <div
                className="rounded-xl p-2.5 text-center font-mono text-base font-bold tracking-wider"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                {group.invite_code || "N/A"}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
              >
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="mt-6 pt-5 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              {isCreator ? "Owner Actions" : "Membership Actions"}
            </span>

            {!isCreator ? (
              <button
                type="button"
                onClick={() => setShowLeaveModal(true)}
                disabled={loading}
                className="btn-secondary flex w-full items-center justify-center gap-2 py-2.5 text-xs font-bold"
              >
                <LogOut className="h-4 w-4" />
                <span>Leave Group</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition"
                style={{
                  background: "var(--destructive-light)",
                  color: "var(--destructive)",
                  border: "1px solid var(--destructive-light)",
                }}
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
