import React, { useState, useRef } from 'react';
import { X, UploadCloud, Camera, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function ReceiptUploadModal({ isOpen, onClose, groupId, onReceiptUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        setError('Please select an image file (JPEG, PNG, WEBP, HEIC)');
        return;
      }
      setFile(selected);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selected);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith('image/')) {
      setFile(dropped);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(dropped);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const receipt = await api.uploadReceipt(groupId, file);
      onReceiptUploaded(receipt);
      setFile(null);
      setPreview(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Upload Receipt Photo</h3>
              <p className="text-xs text-slate-400">Gemini Vision will automatically extract line items</p>
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
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition ${
              preview
                ? 'border-emerald-500/50 bg-slate-950'
                : 'border-slate-800 bg-slate-950/60 hover:border-emerald-500/40 hover:bg-slate-950'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {preview ? (
              <div className="relative flex flex-col items-center">
                <img
                  src={preview}
                  alt="Receipt Preview"
                  className="max-h-60 rounded-xl object-contain shadow-lg"
                />
                <p className="mt-2 text-xs font-medium text-emerald-400">
                  Tap to change photo
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-200">
                  Click to select photo or drag & drop
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Supports JPG, PNG, WEBP, HEIC (Max 10MB)
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 p-3 text-xs text-emerald-400 border border-emerald-500/10">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Encrypted in memory & processed with strict PII privacy rules.</span>
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
              disabled={loading || !file}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Upload & Scan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
