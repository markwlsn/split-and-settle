import React, { useState, useEffect, useRef } from "react";
import {
  X,
  KeyRound,
  QrCode,
  Camera,
  UploadCloud,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "../services/api";

function extractInviteCode(rawText) {
  if (!rawText) return "";
  const trimmed = rawText.trim();
  try {
    const url = new URL(trimmed);
    const queryCode = url.searchParams.get("join");
    if (queryCode) return queryCode.toUpperCase();

    const pathSegments = url.pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      const last = pathSegments[pathSegments.length - 1];
      if (last && last.length >= 4 && last.length <= 10) {
        return last.toUpperCase();
      }
    }
  } catch (_) {
    // Not a URL, treat as raw code
  }
  return trimmed.toUpperCase();
}

export default function JoinGroupModal({ isOpen, onClose, onGroupJoined, initialCode = "" }) {
  const [activeTab, setActiveTab] = useState("code"); // 'code' | 'scan'
  const [inviteCode, setInviteCode] = useState(initialCode || "");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scannedSuccess, setScannedSuccess] = useState("");
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialCode) {
      setInviteCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  // Clean stop for camera scanner
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Scanner stop error:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Start live camera when switching to scan tab
  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (!isOpen || activeTab !== "scan") {
        await stopScanner();
        return;
      }

      setScannerError("");
      setScannedSuccess("");

      try {
        await stopScanner();
        const html5QrCode = new Html5Qrcode("interactive-qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isMounted) return;
            const code = extractInviteCode(decodedText);
            setScannedSuccess(code);
            setInviteCode(code);
            stopScanner();
            setTimeout(() => {
              if (isMounted) setActiveTab("code");
            }, 700);
          },
          () => {
            // Frame search failure, silent
          }
        );

        if (isMounted) setIsScanning(true);
      } catch (err) {
        console.warn("Camera start failed:", err);
        if (isMounted) {
          setScannerError(
            err?.name === "NotAllowedError"
              ? "Camera permission was denied. You can still upload a QR code image."
              : "Unable to access camera on this device. Try uploading a QR image below."
          );
          setIsScanning(false);
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen, activeTab]);

  // Handle image upload scanning
  const handleImageScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerError("");
    setScannedSuccess("");
    setLoading(true);

    try {
      await stopScanner();
      const html5QrCode = new Html5Qrcode("interactive-qr-reader-hidden");
      const decodedText = await html5QrCode.scanFile(file, true);
      const code = extractInviteCode(decodedText);
      setScannedSuccess(code);
      setInviteCode(code);
      setTimeout(() => setActiveTab("code"), 600);
    } catch (err) {
      setScannerError("No valid QR code found in that image. Please try another photo.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.joinGroup(inviteCode.trim().toUpperCase(), displayName.trim() || undefined);
      onGroupJoined(res.group);
      setInviteCode("");
      setDisplayName("");
      onClose();
    } catch (err) {
      setError(err.message || "Invalid invite code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(16px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopScanner();
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-group-title"
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slide-up overflow-hidden flex flex-col"
        style={{ background: "var(--modal-bg)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              <KeyRound className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="join-group-title" className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                Join a Group
              </h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Enter an invite code or scan a QR code
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="rounded-lg p-1 transition"
            style={{ color: "var(--text-secondary)" }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher: Code vs QR Scanner */}
        <div className="flex rounded-xl p-1 mt-4" style={{ background: "var(--bg-elevated)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all"
            style={{
              background: activeTab === "code" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "code" ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: activeTab === "code" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
            }}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Enter Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("scan")}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all"
            style={{
              background: activeTab === "scan" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "scan" ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: activeTab === "scan" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
            }}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Scan QR Code</span>
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

        {/* Hidden scan div for image decoding */}
        <div id="interactive-qr-reader-hidden" className="hidden" />

        {/* TAB 1: Enter Code Form */}
        {activeTab === "code" && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 animate-fade-in">
            {scannedSuccess && (
              <div
                className="flex items-center gap-2 rounded-xl p-3 text-xs font-semibold"
                style={{
                  background: "var(--success-light)",
                  color: "var(--success)",
                  border: "1px solid var(--success-light)",
                }}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>QR Code detected: <strong>{scannedSuccess}</strong></span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Invite Code *
              </label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="e.g. TRIP26"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="input-field w-full font-mono uppercase tracking-widest text-center text-lg font-bold px-3.5 py-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Your Display Name in this Group (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Bob"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field w-full px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  stopScanner();
                  onClose();
                }}
                className="btn-secondary px-4 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || inviteCode.trim().length < 4}
                className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 stroke-[2.2]" />
                )}
                Join Group
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Live Camera QR Scanner */}
        {activeTab === "scan" && (
          <div className="mt-4 space-y-4 animate-fade-in flex flex-col items-center">
            {scannerError ? (
              <div
                className="w-full flex items-start gap-2.5 rounded-2xl p-3.5 text-xs"
                style={{
                  background: "var(--destructive-light)",
                  color: "var(--destructive)",
                  border: "1px solid var(--destructive-light)",
                }}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{scannerError}</p>
                </div>
              </div>
            ) : null}

            {/* Viewfinder Frame */}
            <div
              className="relative w-full aspect-square max-w-[280px] rounded-3xl overflow-hidden flex items-center justify-center"
              style={{
                background: "var(--bg-elevated)",
                border: "2px solid var(--border)",
              }}
            >
              <div id="interactive-qr-reader" className="w-full h-full object-cover" />

              {!isScanning && !scannerError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent)" }} />
                  <span className="text-xs">Starting camera...</span>
                </div>
              )}
            </div>

            <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
              Point your camera at a friend's Split &amp; Settle QR code
            </p>

            {/* Secondary fallback: Upload QR photo */}
            <div className="flex items-center gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="btn-secondary flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Upload QR Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageScan}
              />

              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className="btn-secondary flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold"
              >
                <KeyRound className="h-4 w-4" />
                <span>Enter Manually</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
