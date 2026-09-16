import React, { useState } from "react";
import { X, ShieldCheck, Scale, Lock, Eye, Database, FileText, CheckCircle2 } from "lucide-react";

export default function TermsModal({
  isOpen,
  onClose,
  initialTab = "terms",
  onAccept,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (onAccept) onAccept();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-slide-up flex flex-col max-h-[85vh]"
        style={{ background: "var(--modal-bg)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              {activeTab === "terms" ? <Scale className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <h2 id="terms-modal-title" className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {activeTab === "terms" ? "Terms of Service" : "Privacy Policy"}
              </h2>
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                Last updated: September 2026 · Split &amp; Settle
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl transition cursor-pointer hover:opacity-80"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="flex rounded-xl p-1 my-3.5 shrink-0" style={{ background: "var(--bg-elevated)" }}>
          {[
            { id: "terms", label: "Terms of Service", icon: FileText },
            { id: "privacy", label: "Privacy & Data Policy", icon: ShieldCheck },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: activeTab === id ? "var(--bg-surface)" : "transparent",
                color: activeTab === id ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: activeTab === id ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
              }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: activeTab === id ? "var(--accent)" : "inherit" }} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {activeTab === "terms" ? (
            <div className="space-y-4 animate-fade-in">
              <section className="rounded-2xl p-3.5 space-y-1.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  <Scale className="h-4 w-4 text-blue-500" />
                  <span>1. Agreement to Terms</span>
                </div>
                <p>
                  By creating an account, accessing, or using Split &amp; Settle, you confirm that you are at least 13 years of age and legally capable of entering into binding agreements. These terms govern your use of our group expense management, receipt digitization, and debt calculation tools.
                </p>
              </section>

              <section className="rounded-2xl p-3.5 space-y-1.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  <Eye className="h-4 w-4 text-emerald-500" />
                  <span>2. Purpose &amp; Financial Non-Agency</span>
                </div>
                <p>
                  Split &amp; Settle is strictly an organizational ledger application. We do <strong style={{ color: "var(--text-primary)" }}>not</strong> act as a bank, financial institution, fiduciary, or licensed money transmitter. Calculations and settlement recommendations are mathematical aids; actual transfers of money happen outside the app between members.
                </p>
              </section>

              <section className="rounded-2xl p-3.5 space-y-1.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  <Lock className="h-4 w-4 text-purple-500" />
                  <span>3. User Conduct &amp; Account Security</span>
                </div>
                <p>
                  You agree to provide true and verifiable information (full name, username, contact number, and email). You are responsible for safeguarding your password and session tokens. Uploading fraudulent receipts or harassing other group members is strictly prohibited.
                </p>
              </section>

              <section className="rounded-2xl p-3.5 space-y-1.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  <Database className="h-4 w-4 text-amber-500" />
                  <span>4. Governing Law &amp; Jurisdiction</span>
                </div>
                <p>
                  These Terms of Service are governed by and construed in accordance with applicable electronic commerce, consumer protection, and privacy laws (including Republic Act No. 8792 Electronic Commerce Act and international consumer protection guidelines).
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <section className="rounded-2xl p-3.5 space-y-1.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  <Database className="h-4 w-4 text-blue-500" />
                  <span>1. Information We Collect</span>
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Account Identity:</strong> Your Full Name, unique Username, Email address, and Phone number to verify logins and identify you to fellow group members.</li>
                  <li><strong>Receipt Imagery:</strong> Photographs of paper receipts or digital invoices uploaded for expense itemization.</li>
                  <li><strong>Ledger Records:</strong> Line items, currency designations, participant splits, and debt repayment settlement marks.</li>
                </ul>
              </section>

              <section className="rounded-2xl p-3.5 space-y-1.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  <Eye className="h-4 w-4 text-emerald-500" />
                  <span>2. How Data is Handled &amp; AI Vision Processing</span>
                </div>
                <p>
                  Receipt photos are transmitted over encrypted TLS connections to Google Gemini Vision API strictly for optical character recognition (OCR) and line-item extraction.
                </p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ We never sell, rent, or monetize your personal information or receipt data to advertising brokers.
                </p>
              </section>

              <section className="rounded-2xl p-3.5 space-y-1.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  <Lock className="h-4 w-4 text-purple-500" />
                  <span>3. Security &amp; Row-Level Protection</span>
                </div>
                <p>
                  Your credentials and expense histories are stored in enterprise-grade PostgreSQL infrastructure managed by Supabase, protected by Row-Level Security (RLS). Passwords are cryptographically salted and hashed.
                </p>
              </section>

              <section className="rounded-2xl p-3.5 space-y-1.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                  <span>4. Your Rights Under Data Privacy Laws</span>
                </div>
                <p>
                  In compliance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>, <strong>GDPR</strong>, and <strong>CCPA</strong>:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>You have the right to request a full copy of your ledger and transaction history.</li>
                  <li>You can revoke your session across all devices at any time via the Security profile settings.</li>
                  <li>You have the right to erasure (account and receipt deletion).</li>
                </ul>
              </section>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-2 border-t flex items-center gap-3 shrink-0" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 py-2.5 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>I Understand &amp; Agree</span>
          </button>
        </div>
      </div>
    </div>
  );
}
