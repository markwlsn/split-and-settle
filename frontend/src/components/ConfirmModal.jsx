import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-xl">
        {/* Warning Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
        </div>

        {/* Title & Message */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold tracking-tight text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition active:scale-95 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition active:scale-95 disabled:opacity-50 ${
              isDestructive
                ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
