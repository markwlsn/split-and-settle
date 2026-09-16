import React, { useState, useEffect } from "react";
import { X, KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { api } from "../services/api";

export default function JoinGroupModal({ isOpen, onClose, onGroupJoined, initialCode = "" }) {
  const [inviteCode, setInviteCode] = useState(initialCode || "");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialCode) {
      setInviteCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.joinGroup(inviteCode.trim().toUpperCase(), displayName.trim() || undefined);
      onGroupJoined(res.group);
      setInviteCode("");
      setDisplayName("");
      onClose();
    } catch (err) {
      setError(err.message || "Invalid invite code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(16px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-group-title"
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
              <KeyRound className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="join-group-title" className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                Join a Group
              </h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Enter a 6-character group invite code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition"
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Invite Code *
            </label>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="e.g. TRIP26"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="input-field w-full font-mono uppercase tracking-widest text-center text-lg font-bold px-3.5 py-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Your Display Name in this Group (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Bob"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-4 py-2.5 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || inviteCode.trim().length < 4}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 stroke-[2.2]" />
              )}
              Join Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
