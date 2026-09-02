import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Receipt,
  Users,
  Check,
  CheckCircle2,
  Trash2,
  Plus,
  Edit2,
  Image as ImageIcon,
  ExternalLink,
  Layers,
  DollarSign,
  Calendar,
  Tag,
  Loader2,
  AlertCircle,
  Copy,
  UserPlus,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatMoney, getCurrencySymbol } from '../utils/currency';

export default function ReceiptSplitView({ receiptId, onBack, onConfirmed, currency: initialCurrency = 'USD' }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [receipt, setReceipt] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [showImage, setShowImage] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Add Item Inline State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');

  const currency = group?.currency || initialCurrency || 'USD';
  const symbol = getCurrencySymbol(currency);

  const loadReceiptData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getReceipt(receiptId);
      setReceipt(data);

      const [groupData, membersList] = await Promise.all([
        api.getGroupDetails(data.group_id),
        api.listMembers(data.group_id),
      ]);

      setGroup(groupData);
      setMembers(membersList || []);
    } catch (err) {
      setError(err.message || 'Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceiptData();
  }, [receiptId]);

  const handleCopyInvite = () => {
    if (!group?.invite_code) return;
    navigator.clipboard.writeText(group.invite_code);
    setCopiedCode(true);
    showToast(`Invite code ${group.invite_code} copied!`, 'info');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleParse = async () => {
    setParsing(true);
    setError('');
    try {
      const res = await api.parseReceipt(receiptId);
      setReceipt((prev) => ({
        ...prev,
        ...res.receipt,
        receipt_items: res.items.map((i) => ({ ...i, item_shares: [] })),
      }));

      if (res.detectedCurrency) {
        showToast(
          `✅ Gemini detected ${res.detectedCurrency} currency — group currency updated automatically!`,
          'success'
        );
        if (group) setGroup({ ...group, currency: res.detectedCurrency });
      } else {
        showToast('Receipt scanned successfully with Gemini Vision!', 'success');
      }
    } catch (err) {
      setError(err.message || 'AI parsing failed');
      showToast(err.message || 'AI parsing failed', 'error');
    } finally {
      setParsing(false);
    }
  };

  const handleFetchImageUrl = async () => {
    if (imageUrl) {
      setShowImage(!showImage);
      return;
    }
    try {
      const res = await api.getReceiptImageUrl(receiptId);
      setImageUrl(res.signedUrl);
      setShowImage(true);
    } catch (err) {
      showToast('Could not load image URL', 'error');
    }
  };

  const handleAutoSplitAll = async () => {
    if (members.length <= 1) {
      showToast('Invite at least 1 other member to the group to split expenses!', 'info');
      return;
    }

    try {
      setError('');
      await api.autoSplitReceipt(receiptId, 'EQUAL_ALL');
      await loadReceiptData();
      showToast(`All items split equally among ${members.length} members!`, 'success');
    } catch (err) {
      setError(err.message || 'Auto split failed');
      showToast(err.message || 'Auto split failed', 'error');
    }
  };

  const handleToggleMemberItemShare = async (item, memberId) => {
    const currentShares = item.item_shares || [];
    const isShared = currentShares.some((s) => s.user_id === memberId);

    let nextUserIds;
    if (isShared) {
      nextUserIds = currentShares
        .filter((s) => s.user_id !== memberId)
        .map((s) => s.user_id);
      if (nextUserIds.length === 0) return;
    } else {
      nextUserIds = [...currentShares.map((s) => s.user_id), memberId];
    }

    const itemPrice = parseFloat(item.price);
    const count = nextUserIds.length;
    const baseAmount = Math.round((itemPrice / count) * 100) / 100;

    let remainder = Math.round((itemPrice - baseAmount * count) * 100) / 100;
    const payloadShares = nextUserIds.map((uId, idx) => {
      let share = baseAmount;
      if (remainder > 0 && idx === 0) {
        share = Math.round((share + remainder) * 100) / 100;
      }
      return {
        userId: uId,
        shareAmount: share,
      };
    });

    try {
      await api.setItemShares(receiptId, item.id, payloadShares);
      await loadReceiptData();
    } catch (err) {
      showToast(err.message || 'Failed to update share', 'error');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    const p = parseFloat(newItemPrice);
    if (!newItemName.trim() || isNaN(p) || p <= 0) {
      showToast('Enter valid item name and price', 'error');
      return;
    }

    try {
      await api.addItem(receiptId, {
        name: newItemName.trim(),
        price: p,
        quantity: parseInt(newItemQty, 10) || 1,
      });
      showToast(`Added "${newItemName}"`, 'success');
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQty('1');
      setIsAddingItem(false);
      await loadReceiptData();
    } catch (err) {
      showToast(err.message || 'Failed to add item', 'error');
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Delete item "${itemName}"?`)) return;
    try {
      await api.deleteItem(receiptId, itemId);
      showToast(`Deleted "${itemName}"`, 'info');
      await loadReceiptData();
    } catch (err) {
      showToast(err.message || 'Failed to delete item', 'error');
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setError('');
    try {
      await api.confirmReceipt(receiptId);
      showToast('Receipt confirmed! Group debts recalculated.', 'success');
      if (onConfirmed) onConfirmed();
      setTimeout(() => {
        onBack();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to confirm receipt');
      showToast(err.message || 'Failed to confirm receipt', 'error');
    } finally {
      setConfirming(false);
    }
  };

  const handleDeleteReceipt = async () => {
    if (!window.confirm('Permanently delete this receipt and re-balance debts?')) return;
    try {
      await api.deleteReceipt(receiptId);
      showToast('Receipt deleted.', 'info');
      onBack();
    } catch (err) {
      showToast(err.message || 'Failed to delete receipt', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-medium">Loading receipt inspector...</p>
      </div>
    );
  }

  if (!receipt) return null;

  const items = receipt.receipt_items || [];
  const isConfirmed = receipt.status === 'confirmed';
  const isParsed = receipt.status === 'parsed' || receipt.status === 'confirmed';
  const hasImage = !!receipt.image_path;
  const isSoloMember = members.length <= 1;

  const itemsSum = items.reduce((acc, i) => acc + (parseFloat(i.price) || 0) * (i.quantity || 1), 0);
  const totalAmount = receipt.total_amount || itemsSum;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Group</span>
        </button>

        <div className="flex items-center gap-2">
          {group?.invite_code && (
            <button
              onClick={handleCopyInvite}
              title="Copy group invite code"
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono font-bold text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400 transition"
            >
              <span className="text-slate-500 font-sans text-[11px]">Invite:</span>
              <span className="text-emerald-400">{group.invite_code}</span>
              {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}

          {hasImage && (
            <button
              onClick={handleFetchImageUrl}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-700 transition"
            >
              <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span>{showImage ? 'Hide Photo' : 'View Photo'}</span>
            </button>
          )}

          {!isConfirmed && (
            <button
              onClick={handleDeleteReceipt}
              title="Delete receipt"
              className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Image Preview Drawer */}
      {showImage && imageUrl && (
        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-4 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <span className="text-xs font-semibold text-slate-400">Receipt Photo (15-min Expiring Token)</span>
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
            >
              <span>Open original</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex justify-center bg-slate-900/40 rounded-2xl p-4">
            <img
              src={imageUrl}
              alt="Receipt"
              className="max-h-96 rounded-xl object-contain shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Solo Member Invite Banner */}
      {isSoloMember && !isConfirmed && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">You're currently the only member in this group</p>
              <p className="text-[11px] text-slate-400">
                Share invite code <strong className="font-mono text-emerald-400">{group?.invite_code || '...'}</strong> so friends can join and split this bill with you!
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyInvite}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30 transition shrink-0"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copy Code ({group?.invite_code})</span>
          </button>
        </div>
      )}

      {/* Receipt Info Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl mb-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-md bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                <Tag className="h-3 w-3 mr-1 text-emerald-400" />
                {receipt.category || 'Other'}
              </span>

              {isConfirmed ? (
                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  <Check className="h-3 w-3 mr-1 stroke-[3]" /> Confirmed
                </span>
              ) : isParsed ? (
                <span className="inline-flex items-center rounded-md bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
                  Ready to Split
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                  Pending Scan
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              {receipt.merchant_name || 'Receipt Inspector'}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{receipt.receipt_date || new Date(receipt.created_at).toLocaleDateString()}</span>
              </span>
              {receipt.notes && (
                <span className="text-slate-500">Note: {receipt.notes}</span>
              )}
            </div>
          </div>

          <div className="flex items-baseline gap-2 bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-500 font-semibold">TOTAL</span>
            <span className="font-mono text-2xl font-black text-emerald-400">
              {formatMoney(totalAmount, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Action Banner if Pending AI Scan */}
      {!isParsed && hasImage && (
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 p-8 text-center shadow-xl mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 animate-pulse-glow">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">
            Extract Line Items with Gemini AI
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto mb-6">
            Gemini Vision will identify purchased items, prices, and totals with automated privacy redaction.
          </p>
          <button
            onClick={handleParse}
            disabled={parsing}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 transition active:scale-95"
          >
            {parsing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing Receipt with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 stroke-[2.5]" />
                <span>Scan Receipt Items Now</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Itemization & Split Matrix */}
      {isParsed && (
        <div className="space-y-6">
          {/* Quick Actions Bar */}
          {!isConfirmed && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <span className="text-xs font-semibold text-slate-300">
                Split Helper Tools:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoSplitAll}
                  disabled={isSoloMember}
                  title={isSoloMember ? 'Invite other members to split equally' : 'Split all items equally among members'}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                    isSoloMember
                      ? 'border-slate-800 bg-slate-950 text-slate-500 cursor-not-allowed opacity-60'
                      : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:border-emerald-500/30'
                  }`}
                >
                  <Layers className={`h-3.5 w-3.5 ${isSoloMember ? 'text-slate-500' : 'text-emerald-400'}`} />
                  <span>Split All Equally {isSoloMember ? '(Needs 2+ Members)' : ''}</span>
                </button>

                <button
                  onClick={() => setIsAddingItem(!isAddingItem)}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          )}

          {/* Inline Add Item Form */}
          {isAddingItem && !isConfirmed && (
            <form onSubmit={handleAddItem} className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-4 space-y-3 animate-slideDown">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Add Line Item</span>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="Item description"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder={`Price (${symbol})`}
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full font-mono rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    className="w-16 font-mono text-center rounded-xl border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none transition"
                  />
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Items Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Itemized Breakdown ({items.length})
              </h3>
              <span className="text-xs text-slate-400">
                {isSoloMember ? '1 member in group' : 'Tap member pills to toggle shares'}
              </span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {items.map((item) => {
                const itemPrice = parseFloat(item.price);
                const shares = item.item_shares || [];
                const sharerIds = shares.map((s) => s.user_id);

                return (
                  <div key={item.id} className="p-5 hover:bg-slate-900/80 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{item.name}</span>
                        {item.quantity > 1 && (
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                            x{item.quantity}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base font-extrabold text-slate-100">
                          {formatMoney(itemPrice * (item.quantity || 1), currency)}
                        </span>
                        {!isConfirmed && (
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            title="Delete item"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Member Share Selector Pills */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 mr-1">
                        Split with:
                      </span>
                      {members.map((member) => {
                        const isSelected = sharerIds.includes(member.user_id);
                        const memberShareObj = shares.find((s) => s.user_id === member.user_id);

                        return (
                          <button
                            key={member.user_id}
                            disabled={isConfirmed}
                            onClick={() => handleToggleMemberItemShare(item, member.user_id)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95 ${
                              isSelected
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            <span>{member.display_name}</span>
                            {isSelected && memberShareObj && (
                              <span className="font-mono text-[10px] opacity-80">
                                ({formatMoney(memberShareObj.share_amount, currency)})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirm & Recalculate Button */}
          {!isConfirmed && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 transition active:scale-95"
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Recalculating Debts...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                    <span>Confirm & Recalculate Group Debts</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
