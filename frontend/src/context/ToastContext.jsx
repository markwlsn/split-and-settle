import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4 sm:p-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slideUp ${
              toast.type === 'error'
                ? 'border-red-500/30 bg-red-950/90 text-red-200 shadow-red-950/50'
                : toast.type === 'info'
                ? 'border-sky-500/30 bg-sky-950/90 text-sky-200 shadow-sky-950/50'
                : 'border-emerald-500/30 bg-slate-900/95 text-emerald-300 shadow-black/80'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-400" />
              ) : toast.type === 'info' ? (
                <Info className="h-4 w-4 text-sky-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              )}
            </div>

            <p className="flex-1 text-xs font-semibold leading-relaxed text-slate-100">
              {toast.message}
            </p>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
