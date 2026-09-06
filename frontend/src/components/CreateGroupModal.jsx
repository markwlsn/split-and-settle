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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="create-group-title">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15">
              <Users className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="create-group-title" className="font-bold text-white">Create New Group</h3>
              <p className="text-xs text-neutral-400">Share receipts & split costs with friends</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
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
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Group Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tokyo Trip, Friday Dinner, Apartment 4B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Your Display Name in this Group (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Alice"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/20 transition"
            />
          </div>

          {/* Optional Initial Receipt Upload */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-white" />
                <span>Attach First Receipt (Optional)</span>
              </label>
              <span className="text-[11px] text-neutral-400 font-medium">Auto-detects items & currency</span>
            </div>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-black/60 p-5 cursor-pointer hover:border-neutral-600 hover:bg-black transition group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-neutral-400 border border-neutral-800 group-hover:text-white group-hover:border-neutral-600 transition mb-2">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-neutral-300 group-hover:text-white transition">
                  Click or drag receipt photo here
                </p>
                <p className="mt-1 text-[11px] text-neutral-500">Supports JPG, PNG, WEBP</p>
              </div>
            ) : (
              <div className="relative rounded-2xl border border-neutral-800 bg-black p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="h-16 w-16 rounded-xl object-cover border border-neutral-800"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{receiptFile.name}</p>
                    <p className="text-[11px] text-neutral-400">
                      {(receiptFile.size / 1024).toFixed(1)} KB • Ready for Gemini scan
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-red-400 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
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

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black shadow-md hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  <span>{loadingStep || 'Creating...'}</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 stroke-[2.2]" />
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
