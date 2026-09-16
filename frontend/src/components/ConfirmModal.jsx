import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  isDestructive = true,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(16px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-slide-up"
        style={{ background: "var(--modal-bg)", border: "1px solid var(--border)" }}
      >
        {/* Warning Icon */}
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            background: isDestructive ? "var(--destructive-light)" : "var(--accent-light)",
            color: isDestructive ? "var(--destructive)" : "var(--accent)",
          }}
        >
          <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
        </div>

        {/* Title & Message */}
        <div className="text-center mb-6">
          <h3 id="confirm-modal-title" className="text-base font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
            {title}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition active:scale-95 disabled:opacity-50 ${
              isDestructive
                ? "bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-600/20"
                : "btn-primary"
            }`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
