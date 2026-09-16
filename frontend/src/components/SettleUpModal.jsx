import React, { useState } from "react";
import { X, DollarSign, Loader2 } from "lucide-react";
import { api } from "../services/api";

export default function SettleUpModal({
  isOpen,
  onClose,
  groupId,
  members,
  defaultRecipientId,
  defaultAmount,
  onPaymentRecorded,
}) {
  const [toUser, setToUser] = useState(defaultRecipientId || "");
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!toUser || isNaN(numAmount) || numAmount <= 0) {
      setError("Please select a recipient and enter a valid positive amount.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.recordPayment(groupId, toUser, numAmount);
      onPaymentRecorded(res);
      onClose();
    } catch (err) {
      setError(err.message || "Payment recording failed");
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
      aria-labelledby="settle-up-title"
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
              <DollarSign className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="settle-up-title" className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                Record a Settlement
              </h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Mark a payment you sent to a group member
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
              Who did you pay? *
            </label>
            <select
              required
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
              className="input-field w-full px-3.5 py-2.5 text-sm"
            >
              <option value="">Select recipient...</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Amount Paid *
            </label>
            <div className="relative">
              <span
                className="absolute left-3.5 top-2.5 text-sm font-mono"
                style={{ color: "var(--text-tertiary)" }}
              >
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field w-full font-mono pl-8 pr-3.5 py-2.5 text-sm"
              />
            </div>
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
              disabled={loading || !toUser || !amount}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
