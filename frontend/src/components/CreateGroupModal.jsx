import React, { useState, useRef } from "react";
import { X, Users, PlusCircle, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      setLoadingStep("Creating group...");
      const group = await api.createGroup(name.trim(), displayName.trim() || undefined, "USD");

      let openedReceiptId = null;

      if (receiptFile) {
        setLoadingStep("Uploading receipt...");
        const uploadedReceipt = await api.uploadReceipt(group.id, receiptFile);

        setLoadingStep("Scanning receipt with Gemini Vision...");
        try {
          const parsedRes = await api.parseReceipt(uploadedReceipt.id);
          openedReceiptId = uploadedReceipt.id;
          
          if (parsedRes.detectedCurrency) {
            group.currency = parsedRes.detectedCurrency;
            showToast(`Auto-detected ${parsedRes.detectedCurrency} currency!`, "success");
          }
        } catch (aiErr) {
          console.warn("Initial AI scan warning:", aiErr);
          openedReceiptId = uploadedReceipt.id;
        }
      }

      showToast(`Group "${group.name}" created!`, "success");
      onGroupCreated(group, openedReceiptId);
      
      setName("");
      setDisplayName("");
      handleRemoveFile();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create group");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(16px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-group-title"
    >
      <div
        className="w-full max-w-lg rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up"
        style={{ background: "var(--modal-bg)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between pb-4 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              <Users className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="create-group-title" className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                Create New Group
              </h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Share receipts &amp; split costs with friends
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Group Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tokyo Trip, Friday Dinner, Apartment 4B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="input-field w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Your Display Name in this Group (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Alice"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              className="input-field w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          {/* Optional Initial Receipt Upload */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                <span>Attach First Receipt (Optional)</span>
              </label>
              <span className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                Auto-detects items &amp; currency
              </span>
            </div>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl p-5 cursor-pointer transition group"
                style={{
                  border: "1.5px dashed var(--border)",
                  background: "var(--bg-elevated)",
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition mb-2"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                >
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  Click or drag receipt photo here
                </p>
                <p className="mt-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  Supports JPG, PNG, WEBP, HEIC
                </p>
              </div>
            ) : (
              <div
                className="relative rounded-2xl p-3"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="h-16 w-16 rounded-xl object-cover"
                    style={{ border: "1px solid var(--border)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                      {receiptFile.name}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      {(receiptFile.size / 1024).toFixed(1)} KB • Ready for Gemini scan
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="rounded-lg p-1.5 transition"
                    style={{ color: "var(--text-tertiary)" }}
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

          <div className="flex items-center justify-end gap-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary px-4 py-2.5 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{loadingStep || "Creating..."}</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 stroke-[2.2]" />
                  <span>Create Group {receiptFile ? "& Scan" : ""}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
