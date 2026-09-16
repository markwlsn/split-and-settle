import React, { useState, useRef } from "react";
import { X, UploadCloud, Camera, Loader2, Sparkles } from "lucide-react";
import { api } from "../services/api";

export default function ReceiptUploadModal({ isOpen, onClose, groupId, onReceiptUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith("image/")) {
        setError("Please select an image file (JPEG, PNG, WEBP, HEIC)");
        return;
      }
      setFile(selected);
      setError("");
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selected);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type.startsWith("image/")) {
      setFile(dropped);
      setError("");
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(dropped);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const receipt = await api.uploadReceipt(groupId, file);
      onReceiptUploaded(receipt);
      setFile(null);
      setPreview(null);
      onClose();
    } catch (err) {
      setError(err.message || "Upload failed");
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
      aria-labelledby="upload-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-slide-up"
        style={{ background: "var(--modal-bg)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              <Camera className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="upload-modal-title" className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                Upload Receipt Photo
              </h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Gemini Vision will automatically extract line items
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition"
            style={{ color: "var(--text-secondary)" }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div
            className="mt-4 rounded-xl p-3 text-xs font-medium"
            style={{
              background: "var(--destructive-light)",
              color: "var(--destructive)",
              border: "1px solid var(--destructive-light)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl p-6 transition"
            style={{
              border: `2px dashed ${preview ? "var(--accent)" : "var(--border)"}`,
              background: "var(--bg-elevated)",
            }}
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
                  style={{ border: "1px solid var(--border)" }}
                />
                <p className="mt-2 text-xs font-semibold" style={{ color: "var(--accent)" }}>
                  Tap to change photo
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl transition mb-3"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                >
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Click to select photo or drag &amp; drop
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Supports JPG, PNG, WEBP, HEIC (Max 10MB)
                </p>
              </div>
            )}
          </div>

          <div
            className="flex items-center gap-2 rounded-xl p-3 text-xs"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <Sparkles className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
            <span>Encrypted in memory &amp; processed with strict PII privacy rules.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-4 py-2.5 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4 stroke-[2.2]" />
              )}
              Upload &amp; Scan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
