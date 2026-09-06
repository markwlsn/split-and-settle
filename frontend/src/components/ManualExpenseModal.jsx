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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-white/10 bg-neutral-900/95 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white border border-white/15">
              <FileText className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-white">Add Expense Manually</h3>
              <p className="text-xs text-neutral-400">Add an expense with itemized lines without a photo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
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
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Merchant / Description *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Costco, Tokyo Diner, Uber"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Paid By
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
              >
                <option value="">You (default)</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Itemized Lines */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Itemized Lines
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-neutral-300 hover:border-neutral-600 hover:text-white transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder={`Item ${idx + 1} name`}
                    value={item.name}
                    onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                    className="flex-1 rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-white focus:outline-none transition"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-2 text-xs text-neutral-500 font-mono">
                      {symbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                      className="w-full font-mono rounded-xl border border-neutral-800 bg-black pl-6 pr-2.5 py-2 text-xs text-white focus:border-white focus:outline-none transition"
                    />
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-14 font-mono text-center rounded-xl border border-neutral-800 bg-black px-2 py-2 text-xs text-white focus:border-white focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    disabled={items.length <= 1}
                    className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-800 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Tip Row */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Tax Amount ({symbol})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                className="w-full font-mono rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:border-white focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Tip Amount ({symbol})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-full font-mono rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:border-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* Total Preview */}
          <div className="flex items-center justify-between rounded-2xl bg-black p-4 border border-neutral-800">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Estimated Total</span>
            <span className="font-mono text-xl font-extrabold text-white">
              {symbol}{calculateTotal().toFixed(2)}
            </span>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-800 bg-neutral-950/60 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !merchantName.trim()}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black shadow-md hover:bg-neutral-200 disabled:opacity-50 transition active:scale-95"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : <Plus className="h-4 w-4" />}
            Save & Split Items
          </button>
        </div>
      </div>
    </div>
  );
}
