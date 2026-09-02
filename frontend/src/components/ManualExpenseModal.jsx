import React, { useState } from 'react';
import { X, Plus, Trash2, DollarSign, Tag, Calendar, User, FileText, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { getCurrencySymbol } from '../utils/currency';

const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Entertainment',
  'Lodging',
  'Utilities',
  'Shopping',
  'Other',
];

export default function ManualExpenseModal({ isOpen, onClose, groupId, members, currency = 'USD', onExpenseCreated }) {
  const { showToast } = useToast();
  const [merchantName, setMerchantName] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState('');
  const [notes, setNotes] = useState('');
  const [taxAmount, setTaxAmount] = useState('0');
  const [tipAmount, setTipAmount] = useState('0');
  const [items, setItems] = useState([
    { name: '', price: '', quantity: 1 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const symbol = getCurrencySymbol(currency);

  const handleAddItemRow = () => {
    setItems([...items, { name: '', price: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const calculateTotal = () => {
    const itemsSum = items.reduce((sum, item) => {
      const p = parseFloat(item.price) || 0;
      const q = parseInt(item.quantity, 10) || 1;
      return sum + p * q;
    }, 0);
    const tax = parseFloat(taxAmount) || 0;
    const tip = parseFloat(tipAmount) || 0;
    return itemsSum + tax + tip;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!merchantName.trim()) {
      setError('Please enter a merchant or expense title');
      return;
    }

    const validItems = items.map((i) => ({
      name: i.name.trim() || 'Item',
      price: parseFloat(i.price) || 0,
      quantity: parseInt(i.quantity, 10) || 1,
    }));

    if (validItems.some((i) => i.price <= 0)) {
      setError('All items must have a positive price greater than 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        merchantName: merchantName.trim(),
        receiptDate,
        category,
        notes: notes.trim() || undefined,
        paidBy: paidBy || undefined,
        taxAmount: parseFloat(taxAmount) || 0,
        tipAmount: parseFloat(tipAmount) || 0,
        items: validItems,
      };

      const res = await api.createManualExpense(groupId, payload);
      showToast(`Expense "${merchantName}" created!`, 'success');
      onExpenseCreated(res.receipt);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Add Expense Manually</h3>
              <p className="text-xs text-slate-400">Add an expense with itemized lines without a photo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-medium text-red-400">
              {error}
            </div>
          )}

          {/* Top metadata grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Merchant / Expense Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Costco, AirBnB, Tokyo Metro"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Who Paid?
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              >
                <option value="">You (Default)</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Itemized Lines ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-bold text-emerald-400 hover:border-emerald-500/30 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Line</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder={`Item #${idx + 1} name`}
                    value={item.name}
                    onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />

                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-2 text-xs font-semibold text-slate-500">{symbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                      className="w-full font-mono rounded-xl border border-slate-800 bg-slate-950 pl-6 pr-2.5 py-2 text-xs font-bold text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>

                  <input
                    type="number"
                    min="1"
                    title="Quantity"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-14 font-mono text-center rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Tip Row */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tax Amount ({symbol})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                className="w-full font-mono rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tip Amount ({symbol})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-full font-mono rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Total Preview */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-950 p-4 border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Total</span>
            <span className="font-mono text-xl font-extrabold text-emerald-400">
              {symbol}{calculateTotal().toFixed(2)}
            </span>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-950/60 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !merchantName.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 transition active:scale-95"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save & Split Items
          </button>
        </div>
      </div>
    </div>
  );
}
