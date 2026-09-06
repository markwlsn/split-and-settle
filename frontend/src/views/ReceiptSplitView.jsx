import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
  ImageIcon,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Tag,
  Calendar,
  UserPlus,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatMoney, getCurrencySymbol } from '../utils/currency';
import ConfirmModal from '../components/ConfirmModal';

export default function ReceiptSplitView({ receiptId, currency = 'USD', onBack, onConfirmed }) {
  const { showToast } = useToast();
  const [receipt, setReceipt] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [showImage, setShowImage] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Custom Deletion Modals
  const [showDeleteReceiptModal, setShowDeleteReceiptModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadReceiptData = async () => {
    try {
      setError('');
      const data = await api.getReceiptDetails(receiptId);
      setReceipt(data);

      if (data.group_id) {
        const groupData = await api.getGroupDetails(data.group_id);
        setGroup(groupData.group);
        setMembers(groupData.members || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load receipt details');
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

  const handleParseReceipt = async () => {
    setParsing(true);
    setError('');
    try {
      const res = await api.parseReceipt(receiptId);
      await loadReceiptData();
      if (res.detectedCurrency && res.detectedCurrency !== currency) {
        showToast(`Gemini detected currency: ${res.detectedCurrency}! Group updated.`, 'success');
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

    const sharesPayload = nextUserIds.map((userId) => ({
      userId,
      shareAmount: baseAmount,
    }));

    try {
      await api.updateItemShares(receiptId, item.id, sharesPayload);
      await loadReceiptData();
    } catch (err) {
      showToast(err.message || 'Failed to update item assignment', 'error');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) return;

    try {
      await api.addItem(receiptId, {
        name: newItemName.trim(),
        price: parseFloat(newItemPrice),
        quantity: parseInt(newItemQty, 10) || 1,
      });
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQty(1);
      setIsAddingItem(false);
      showToast('Item added', 'success');
      await loadReceiptData();
    } catch (err) {
      showToast(err.message || 'Failed to add item', 'error');
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await api.deleteItem(receiptId, itemToDelete.id);
      showToast(`Deleted "${itemToDelete.name}"`, 'info');
      setItemToDelete(null);
      await loadReceiptData();
    } catch (err) {
      showToast(err.message || 'Failed to delete item', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirm = async () => {
    if (members.length <= 1) {
      showToast('Splitting requires 2 or more group members.', 'info');
      return;
    }
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

  const confirmDeleteReceipt = async () => {
    setDeleting(true);
    try {
      await api.deleteReceipt(receiptId);
      showToast('Receipt deleted.', 'info');
      setShowDeleteReceiptModal(false);
      onBack();
    } catch (err) {
      showToast(err.message || 'Failed to delete receipt', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
        <Loader2 className="h-8 w-8 animate-spin text-white mb-3" />
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
  const symbol = getCurrencySymbol(currency);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 animate-fadeIn selection:bg-white selection:text-black">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Group</span>
        </button>

        <div className="flex items-center gap-2">
          {group?.invite_code && (
            <button
              onClick={handleCopyInvite}
              title="Copy group invite code"
              className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-mono font-bold text-neutral-300 hover:border-neutral-600 hover:text-white transition"
            >
              <span className="text-neutral-500 font-sans text-[11px]">Invite:</span>
              <span className="text-white">{group.invite_code}</span>
              {copiedCode ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}

          {hasImage && (
            <button
              onClick={handleFetchImageUrl}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:border-neutral-600 hover:text-white transition"
            >
              <ImageIcon className="h-3.5 w-3.5 text-neutral-400" />
              <span>{showImage ? 'Hide Photo' : 'View Photo'}</span>
            </button>
          )}

          {!isConfirmed && (
            <button
              onClick={() => setShowDeleteReceiptModal(true)}
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
        <div className="mb-6 overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 p-4 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
            <span className="text-xs font-semibold text-neutral-400">Receipt Photo</span>
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-white hover:underline"
            >
              <span>Open original</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex justify-center bg-neutral-900/50 rounded-2xl p-4">
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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15 shrink-0">
              <UserPlus className="h-4 w-4 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">You're currently the only member in this group</p>
              <p className="text-[11px] text-neutral-400">
                Share invite code <strong className="font-mono text-white">{group?.invite_code || '...'}</strong> so friends can join and split this bill with you!
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyInvite}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white text-black px-3.5 py-1.5 text-xs font-semibold hover:bg-neutral-200 transition shrink-0 active:scale-95"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copy Code ({group?.invite_code})</span>
          </button>
        </div>
      )}

      {/* Receipt Info Card */}
      <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur-xl mb-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-md bg-neutral-800 px-2.5 py-0.5 text-xs font-semibold text-neutral-300">
                <Tag className="h-3 w-3 mr-1 text-neutral-400" />
                {receipt.category || 'Other'}
              </span>

              {isConfirmed ? (
                <span className="inline-flex items-center rounded-md bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white border border-white/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Confirmed & Settled
                </span>
              ) : isParsed ? (
                <span className="inline-flex items-center rounded-md bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-neutral-200 border border-white/15">
                  Ready to Split
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-neutral-800 px-2.5 py-0.5 text-xs font-semibold text-neutral-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Scan
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white">
              {receipt.merchant_name || 'Receipt Inspector'}
            </h2>

            <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
              {receipt.receipt_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{receipt.receipt_date}</span>
                </div>
              )}
              {receipt.paid_by_name && (
                <div>
                  Paid by: <span className="font-semibold text-white">{receipt.paid_by_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 border-neutral-800 pt-3 sm:pt-0">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Total</span>
            <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {formatMoney(totalAmount, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* AI Extraction Trigger Hero (if not parsed yet) */}
      {!isParsed && hasImage && (
        <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900 to-black p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black shadow-xl shadow-white/10">
            <Sparkles className="h-7 w-7 stroke-[2.2]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            Extract Line Items with Gemini AI
          </h3>
          <p className="mx-auto max-w-md text-xs text-neutral-400 mb-6 leading-relaxed">
            Gemini Vision will identify purchased items, prices, and totals with automated privacy redaction.
          </p>

          <button
            onClick={handleParseReceipt}
            disabled={parsing}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-black shadow-lg shadow-white/10 hover:bg-neutral-200 disabled:opacity-50 transition active:scale-95"
          >
            {parsing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-black" />
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
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
              <span className="text-xs font-semibold text-neutral-300">
                Split Helper Tools:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoSplitAll}
                  disabled={isSoloMember}
                  title={isSoloMember ? 'Invite other members to split equally' : 'Split all items equally among members'}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                    isSoloMember
                      ? 'border-neutral-800 bg-neutral-900 text-neutral-500 cursor-not-allowed opacity-60'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  <Layers className={`h-3.5 w-3.5 ${isSoloMember ? 'text-neutral-500' : 'text-white'}`} />
                  <span>Split All Equally {isSoloMember ? '(Needs 2+ Members)' : ''}</span>
                </button>

                <button
                  onClick={() => setIsAddingItem(!isAddingItem)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          )}

          {/* Inline Add Item Form */}
          {isAddingItem && !isConfirmed && (
            <form onSubmit={handleAddItem} className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 animate-fadeIn">
              <div className="text-xs font-bold text-white mb-3">Add Custom Item</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div className="sm:col-span-1">
                  <input
                    type="text"
                    required
                    placeholder="Item description"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:border-white focus:outline-none transition"
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
                    className="w-full font-mono rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:border-white focus:outline-none transition"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    className="w-16 font-mono text-center rounded-xl border border-neutral-800 bg-black px-2 py-2 text-xs text-white focus:border-white focus:outline-none transition"
                  />
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(false)}
                    className="rounded-xl border border-neutral-800 px-3 py-2 text-xs text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Items Breakdown Table */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/50 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
              <h3 className="text-sm font-bold tracking-tight text-white">
                Itemized Breakdown ({items.length})
              </h3>
              <span className="text-xs text-neutral-400">
                {members.length} {members.length === 1 ? 'member' : 'members'} in group
              </span>
            </div>

            <div className="divide-y divide-neutral-800/60">
              {items.map((item) => {
                const itemShares = item.item_shares || [];
                const assignedCount = itemShares.length;

                return (
                  <div key={item.id} className="p-4 sm:p-5 hover:bg-neutral-900/80 transition">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="font-semibold text-sm text-white">
                          {item.name}
                        </div>
                        {item.original_name && item.original_name !== item.name && (
                          <div className="text-[11px] text-neutral-400">
                            Orig: {item.original_name}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-white">
                          {formatMoney(item.price, currency)}
                        </span>
                        {!isConfirmed && (
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="rounded-lg p-1 text-neutral-500 hover:text-red-400 transition"
                            title="Delete line item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Member Allocation Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-neutral-500 mr-1">Split with:</span>
                      {members.map((member) => {
                        const isSelected = itemShares.some((s) => s.user_id === member.user_id);
                        const memberShareObj = itemShares.find((s) => s.user_id === member.user_id);

                        return (
                          <button
                            key={member.user_id}
                            type="button"
                            disabled={isConfirmed}
                            onClick={() => handleToggleMemberItemShare(item, member.user_id)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95 ${
                              isSelected
                                ? 'bg-white text-black shadow-sm font-bold'
                                : 'bg-black text-neutral-500 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-300'
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

          {/* Confirm & Recalculate Button Section with Solo Member Guard */}
          {!isConfirmed && (
            <div className="flex flex-col items-end gap-2 pt-2">
              <button
                onClick={handleConfirm}
                disabled={confirming || isSoloMember}
                title={isSoloMember ? 'Requires 2 or more members to split debts' : 'Confirm and recalculate group debts'}
                className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition active:scale-95 ${
                  isSoloMember
                    ? 'border border-neutral-800 bg-neutral-900 text-neutral-500 cursor-not-allowed opacity-60 shadow-none'
                    : 'bg-white text-black hover:bg-neutral-200 shadow-xl shadow-white/10'
                }`}
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    <span>Recalculating Debts...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className={`h-4 w-4 stroke-[2.5] ${isSoloMember ? 'text-neutral-500' : 'text-black'}`} />
                    <span>Confirm & Recalculate Group Debts {isSoloMember ? '(Needs 2+ Members)' : ''}</span>
                  </>
                )}
              </button>
              {isSoloMember && (
                <p className="text-[11px] text-neutral-500">
                  ⚠️ At least 2 members are required in this group to calculate and settle group debts.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDeleteItem}
        title={`Delete "${itemToDelete?.name}"?`}
        message="Are you sure you want to delete this line item from the receipt breakdown?"
        confirmText="Delete Item"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleting}
      />

      {/* Delete Receipt Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteReceiptModal}
        onClose={() => setShowDeleteReceiptModal(false)}
        onConfirm={confirmDeleteReceipt}
        title="Delete Receipt?"
        message="Permanently delete this receipt and all its split calculations? Group debt balances will be recalculated."
        confirmText="Delete Receipt"
        cancelText="Keep Receipt"
        isDestructive={true}
        loading={deleting}
      />
    </div>
  );
}
