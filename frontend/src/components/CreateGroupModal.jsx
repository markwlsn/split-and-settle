import React, { useState, useRef } from 'react';
import { X, Users, PlusCircle, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      setLoadingStep('Creating group...');
      // Initial default is USD, will be auto-updated if Gemini detects currency from receipt
      const group = await api.createGroup(name.trim(), displayName.trim() || undefined, 'USD');

      let openedReceiptId = null;

      if (receiptFile) {
        setLoadingStep('Uploading receipt...');
        const uploadedReceipt = await api.uploadReceipt(group.id, receiptFile);

        setLoadingStep('Scanning receipt & detecting currency...');
        try {
          const parsedRes = await api.parseReceipt(uploadedReceipt.id);
          openedReceiptId = uploadedReceipt.id;
          
          if (parsedRes.detectedCurrency) {
            group.currency = parsedRes.detectedCurrency;
            showToast(`Auto-detected ${parsedRes.detectedCurrency} currency from receipt!`, 'success');
          }
        } catch (aiErr) {
          console.warn('Initial AI scan error, but group was created:', aiErr);
          openedReceiptId = uploadedReceipt.id;
        }
      }

      showToast(`Group "${group.name}" created successfully!`, 'success');
      onGroupCreated(group, openedReceiptId);
      
      // Reset form
      setName('');
      setDisplayName('');
      handleRemoveFile();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Create New Group</h3>
              <p className="text-xs text-slate-400">Share receipts & split costs with friends</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Group Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tokyo Trip, Friday Dinner, Apartment 4B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Display Name in this Group (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Alice"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Optional Initial Receipt Upload */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Attach First Receipt (Optional)</span>
              </label>
              <span className="text-[11px] text-emerald-400/90 font-medium">Auto-detects items & currency</span>
            </div>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-5 cursor-pointer hover:border-emerald-500/40 hover:bg-slate-950 transition group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 border border-slate-800 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition mb-2">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-slate-300 group-hover:text-emerald-300 transition">
                  Click or drag receipt photo here
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Gemini AI extracts items and automatically sets the currency
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="h-12 w-12 rounded-xl object-cover border border-slate-800"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-200 truncate max-w-[220px]">
                      {receiptFile?.name}
                    </p>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Will auto-detect items & currency</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={loading}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{loadingStep || 'Creating...'}</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Group {receiptFile ? '& Scan Receipt' : ''}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
