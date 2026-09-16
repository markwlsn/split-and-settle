import React, { useState } from "react";
import { X, Plus, Trash2, FileText, Loader2 } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrencySymbol } from "../utils/currency";

const CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transport",
  "Entertainment",
  "Lodging",
  "Utilities",
  "Shopping",
  "Other",
];

export default function ManualExpenseModal({
  isOpen,
  onClose,
  groupId,
  members,
  currency = "USD",
  onExpenseCreated,
}) {
  const { showToast } = useToast();
  const [merchantName, setMerchantName] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidBy, setPaidBy] = useState("");
  const [notes, setNotes] = useState("");
  const [taxAmount, setTaxAmount] = useState("0");
  const [tipAmount, setTipAmount] = useState("0");
  const [items, setItems] = useState([{ name: "", price: "", quantity: 1 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const symbol = getCurrencySymbol(currency);

  const handleAddItemRow = () => {
    setItems([...items, { name: "", price: "", quantity: 1 }]);
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
      setError("Merchant or Expense Name is required");
      return;
    }

    const validItems = items
      .map((item) => ({
        name: item.name.trim(),
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity, 10) || 1,
      }))
      .filter((item) => item.name && item.price > 0);

    if (validItems.length === 0) {
      setError("Please provide at least one valid item with a name and price > 0");
      return;
    }

    setLoading(true);
    setError("");

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
      showToast(`Expense "${merchantName}" created!`, "success");
      onExpenseCreated(res.receipt);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create expense");
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
      aria-labelledby="manual-expense-title"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
        style={{ background: "var(--modal-bg)", border: "1px solid var(--border)" }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              <FileText className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="manual-expense-title" className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                Add Expense Manually
              </h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Itemize costs without needing a photo
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div
              className="rounded-xl p-3.5 text-xs font-medium"
              style={{
                background: "var(--destructive-light)",
                color: "var(--destructive)",
                border: "1px solid var(--destructive-light)",
              }}
            >
              {error}
            </div>
          )}

          {/* Top metadata grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Merchant / Description *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Costco, Tokyo Diner, Uber"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="input-field w-full px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field w-full px-3.5 py-2.5 text-sm"
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
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Date
              </label>
              <input
                type="date"
                required
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="input-field w-full px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Paid By
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="input-field w-full px-3.5 py-2.5 text-sm"
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
          <div className="space-y-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Itemized Lines
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="btn-secondary flex items-center gap-1 px-2.5 py-1 text-xs font-semibold"
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
                    onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                    className="input-field flex-1 px-3 py-2 text-xs"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-2 text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                      {symbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                      className="input-field w-full font-mono pl-6 pr-2.5 py-2 text-xs"
                    />
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    className="input-field w-14 font-mono text-center px-2 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    disabled={items.length <= 1}
                    className="rounded-lg p-2 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Tip Row */}
          <div className="grid grid-cols-2 gap-4 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                Tax Amount ({symbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                className="input-field w-full font-mono px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                Tip Amount ({symbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="input-field w-full font-mono px-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Total Preview */}
          <div
            className="flex items-center justify-between rounded-2xl p-4"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Estimated Total
            </span>
            <span className="font-mono text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>
              {symbol}{calculateTotal().toFixed(2)}
            </span>
          </div>
        </form>

        {/* Modal Footer */}
        <div
          className="flex items-center justify-end gap-3 p-4"
          style={{ borderTop: "1px solid var(--border)", background: "var(--bg-elevated)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 py-2.5 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !merchantName.trim()}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save &amp; Split Items
          </button>
        </div>
      </div>
    </div>
  );
}
