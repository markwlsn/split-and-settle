import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function SettleUpModal({ isOpen, onClose, groupId, members, defaultRecipientId, defaultAmount, onPaymentRecorded }) {
  const [toUser, setToUser] = useState(defaultRecipientId || '');
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!toUser || isNaN(numAmount) || numAmount <= 0) {
      setError('Please select a recipient and enter a valid positive amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.recordPayment(groupId, toUser, numAmount);
      onPaymentRecorded(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Payment recording failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Record a Settlement</h3>
              <p className="text-xs text-slate-400">Mark a payment you sent to a group member</p>
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
              Who did you pay? *
            </label>
            <select
              required
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            >
              <option value="" disabled>Select member</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Amount Paid ($) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3.5 py-2.5 text-sm font-mono font-bold text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
            💡 Recording a payment will automatically update the minimum settlement transactions for the entire group.
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
              disabled={loading || !toUser || !amount}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
