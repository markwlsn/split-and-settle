import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { X, Copy, Check, Download, Share2, QrCode } from "lucide-react";

export default function QRInviteModal({ group, isOpen, onClose }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [shareSupported] = useState(() => Boolean(navigator.share));

  const inviteLink = group?.invite_code
    ? `${window.location.origin}/join/${group.invite_code}`
    : "";

  useEffect(() => {
    if (!isOpen || !canvasRef.current || !group?.invite_code) return;
    const isDark = !document.documentElement.classList.contains("light");
    QRCode.toCanvas(canvasRef.current, inviteLink, {
      width: 240,
      margin: 2,
      color: {
        dark: isDark ? "#ffffff" : "#000000",
        light: isDark ? "#111111" : "#ffffff",
      },
    });
  }, [isOpen, group, inviteLink]);

  if (!isOpen || !group) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.download = `${group.name.replace(/\s+/g, "-")}-invite.png`;
    a.href = canvasRef.current.toDataURL("image/png");
    a.click();
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Join "${group.name}" on Split & Settle`,
        text: `Use code ${group.invite_code} or tap the link to join my expense group.`,
        url: inviteLink,
      });
    } catch (_) {}
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(16px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 animate-slide-up"
        style={{ background: "var(--modal-bg)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--accent-light)" }}
            >
              <QrCode className="h-5 w-5" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h3
                id="qr-modal-title"
                className="font-bold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Invite Members
              </h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {group.name}
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

        {/* QR Code */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
          >
            <canvas ref={canvasRef} className="rounded-xl" />
          </div>

          {/* Code badge */}
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
              Invite code
            </p>
            <span
              className="font-mono text-2xl font-bold tracking-widest"
              style={{ color: "var(--text-primary)" }}
            >
              {group.invite_code}
            </span>
          </div>

          {/* Link pill */}
          <div
            className="flex items-center gap-2 w-full rounded-xl px-3 py-2"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
          >
            <span
              className="text-xs flex-1 truncate font-mono"
              style={{ color: "var(--text-secondary)" }}
            >
              {inviteLink}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition"
              style={{
                background: "var(--accent-light)",
                color: "var(--accent)",
              }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition btn-secondary"
            >
              <Download className="h-4 w-4" />
              Save QR
            </button>
            {shareSupported && (
              <button
                onClick={handleShare}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold btn-accent"
              >
                <Share2 className="h-4 w-4" />
                Share Link
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
