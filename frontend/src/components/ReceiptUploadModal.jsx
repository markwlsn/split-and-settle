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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15">
              <Camera className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-white">Upload Receipt Photo</h3>
              <p className="text-xs text-neutral-400">Gemini Vision will automatically extract line items</p>
            </div>
          </div>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition ${
              preview
                ? 'border-white/40 bg-black'
                : 'border-neutral-800 bg-black/60 hover:border-neutral-600 hover:bg-black'
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
                <p className="mt-2 text-xs font-medium text-white">
                  Tap to change photo
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-neutral-400 group-hover:text-white group-hover:bg-neutral-800 transition">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">
                  Click to select photo or drag & drop
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Supports JPG, PNG, WEBP, HEIC (Max 10MB)
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-xs text-neutral-300 border border-white/10">
            <Sparkles className="h-4 w-4 shrink-0 text-white" />
            <span>Encrypted in memory & processed with strict PII privacy rules.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black shadow-md hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : <UploadCloud className="h-4 w-4 stroke-[2.2]" />}
              Upload & Scan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
