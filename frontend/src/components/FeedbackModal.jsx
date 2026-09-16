import React, { useState, useEffect } from "react";
import {
  X,
  Bug,
  Lightbulb,
  Smile,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  Laptop,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";

const SATISFACTION_LEVELS = [
  { score: 1, label: "Very Unsatisfied", emoji: "😡", color: "#ff453a" },
  { score: 2, label: "Needs Work", emoji: "🙁", color: "#ff9f0a" },
  { score: 3, label: "Neutral / Okay", emoji: "😐", color: "#ffd60a" },
  { score: 4, label: "Good Experience", emoji: "😊", color: "#30d158" },
  { score: 5, label: "Delighted!", emoji: "🤩", color: "#0a84ff" },
];

const QUICK_TAGS = [
  "Gemini Receipt Scanner",
  "Apple UI Design",
  "Debt Splitting Math",
  "QR Code Invites",
  "Multi-Currency",
  "App Performance",
];

export default function FeedbackModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("bug"); // "bug" | "improvement" | "survey" | "history"
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // Bug Report form
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugPriority, setBugPriority] = useState("medium");

  // Improvement / Feature form
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [featureCategory, setFeatureCategory] = useState("UI / Design");

  // Satisfaction survey form
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [surveyComments, setSurveyComments] = useState("");

  // History
  const [myTickets, setMyTickets] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === "history") {
      fetchHistory();
    }
  }, [isOpen, activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const tickets = await api.getMyTickets();
      setMyTickets(tickets || []);
    } catch (err) {
      console.warn("Error fetching tickets:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getSystemDiagnostics = () => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };
  };

  const handleSubmitBug = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createTicket({
        type: "bug",
        title: bugTitle.trim(),
        description: bugDescription.trim(),
        priority: bugPriority,
        metadata: {
          diagnostics: getSystemDiagnostics(),
        },
      });
      setSuccessMessage("Bug report submitted! Our team will investigate.");
      setBugTitle("");
      setBugDescription("");
      setTimeout(() => {
        setSuccessMessage("");
        setActiveTab("history");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to submit bug report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeature = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createTicket({
        type: "feature_request",
        title: featureTitle.trim(),
        description: `[Category: ${featureCategory}] ${featureDescription.trim()}`,
        priority: "medium",
        metadata: {
          category: featureCategory,
          diagnostics: getSystemDiagnostics(),
        },
      });
      setSuccessMessage("Thank you for your suggestion! We review all improvement requests.");
      setFeatureTitle("");
      setFeatureDescription("");
      setTimeout(() => {
        setSuccessMessage("");
        setActiveTab("history");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSurvey = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.createTicket({
        type: "satisfaction_survey",
        title: `User Satisfaction Rating: ${rating}/5`,
        description: surveyComments.trim() || `Rated ${rating}/5. Highlighted: ${selectedTags.join(", ") || "None"}`,
        satisfactionRating: rating,
        priority: "low",
        metadata: {
          tags: selectedTags,
          rating,
          diagnostics: getSystemDiagnostics(),
        },
      });
      setSuccessMessage("Thank you for rating Split & Settle! Your feedback drives our roadmap.");
      setSurveyComments("");
      setSelectedTags([]);
      setTimeout(() => {
        setSuccessMessage("");
        setActiveTab("history");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to submit survey");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-slide-up flex flex-col max-h-[90vh]"
        style={{ background: "var(--modal-bg)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 id="feedback-modal-title" className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Support &amp; Feedback Hub
              </h2>
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                Report issues, request improvements, or rate your experience
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

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 my-3.5 rounded-xl shrink-0" style={{ background: "var(--bg-elevated)" }}>
          {[
            { id: "bug", label: "Report Bug", icon: Bug },
            { id: "improvement", label: "Request Idea", icon: Lightbulb },
            { id: "survey", label: "Satisfaction", icon: Smile },
            { id: "history", label: "My Tickets", icon: Clock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setActiveTab(id); setError(""); setSuccessMessage(""); }}
              className="flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold transition-all cursor-pointer"
              style={{
                background: activeTab === id ? "var(--bg-surface)" : "transparent",
                color: activeTab === id ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: activeTab === id ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
              }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: activeTab === id ? "var(--accent)" : "inherit" }} />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {/* Feedback alerts */}
        {error && (
          <div
            className="mb-3 rounded-xl p-3 text-xs font-medium flex items-center gap-2 animate-fade-in"
            style={{ background: "var(--destructive-light)", color: "var(--destructive)", border: "1px solid var(--destructive-light)" }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div
            className="mb-3 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 animate-fade-in text-emerald-600 dark:text-emerald-400"
            style={{ background: "var(--success-light)", border: "1px solid var(--success-light)" }}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {/* TAB 1: Report a Bug */}
          {activeTab === "bug" && (
            <form onSubmit={handleSubmitBug} className="space-y-3.5 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                  Issue Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Receipt scanner failed on multi-line tax"
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                  className="input-field w-full px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                  Severity Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "low", label: "Low", color: "text-slate-400" },
                    { id: "medium", label: "Medium", color: "text-amber-500" },
                    { id: "high", label: "High", color: "text-orange-500" },
                    { id: "urgent", label: "Urgent", color: "text-red-500" },
                  ].map(({ id, label, color }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setBugPriority(id)}
                      className={`py-2 px-1 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        bugPriority === id ? "border-current shadow-sm" : "border-transparent opacity-70"
                      } ${color}`}
                      style={{
                        background: bugPriority === id ? "var(--bg-surface)" : "var(--bg-elevated)",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                  Detailed Steps &amp; Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="What were you doing when the bug occurred? What did you expect vs what actually happened?"
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  className="input-field w-full px-3.5 py-2.5 text-sm resize-none"
                />
              </div>

              {/* Auto diagnostics banner */}
              <div
                className="rounded-xl p-2.5 text-[11px] flex items-center gap-2"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
              >
                <Laptop className="h-4 w-4 shrink-0 text-blue-500" />
                <span>
                  Automatic diagnostics (browser, screen size, and OS) will be attached to help resolve this quickly.
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 cursor-pointer shadow-sm mt-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /><span>Submit Bug Report</span></>}
              </button>
            </form>
          )}

          {/* TAB 2: Request Improvement / Feature */}
          {activeTab === "improvement" && (
            <form onSubmit={handleSubmitFeature} className="space-y-3.5 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                  Idea Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Export split receipt to PDF invoice"
                  value={featureTitle}
                  onChange={(e) => setFeatureTitle(e.target.value)}
                  className="input-field w-full px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                  Category
                </label>
                <select
                  value={featureCategory}
                  onChange={(e) => setFeatureCategory(e.target.value)}
                  className="input-field w-full px-3 py-2 text-xs"
                >
                  <option value="UI / Design">UI &amp; Visual Design</option>
                  <option value="Receipt Scanner & AI">Gemini Receipt Scanner &amp; OCR</option>
                  <option value="Debt Splitting Math">Split Calculations &amp; Math</option>
                  <option value="Groups & Invites">Groups &amp; Member Management</option>
                  <option value="Payments & Settle">Payments &amp; Settlement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                  Why would this be useful? *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe how this improvement would help your workflow and group expenses..."
                  value={featureDescription}
                  onChange={(e) => setFeatureDescription(e.target.value)}
                  className="input-field w-full px-3.5 py-2.5 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 cursor-pointer shadow-sm mt-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /><span>Submit Suggestion</span></>}
              </button>
            </form>
          )}

          {/* TAB 3: Satisfaction Survey */}
          {activeTab === "survey" && (
            <form onSubmit={handleSubmitSurvey} className="space-y-4 animate-fade-in text-center">
              <div>
                <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                  How would you rate your experience with Split &amp; Settle?
                </p>

                {/* Rating faces */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {SATISFACTION_LEVELS.map((item) => {
                    const isSelected = rating === item.score;
                    return (
                      <button
                        key={item.score}
                        type="button"
                        onClick={() => setRating(item.score)}
                        className={`flex flex-col items-center p-2 sm:p-2.5 rounded-2xl transition-all cursor-pointer ${
                          isSelected ? "scale-110 shadow-md ring-2" : "opacity-60 hover:opacity-100"
                        }`}
                        style={{
                          background: isSelected ? "var(--bg-elevated)" : "transparent",
                          borderColor: isSelected ? item.color : "transparent",
                        }}
                      >
                        <span className="text-2xl sm:text-3xl mb-1">{item.emoji}</span>
                        <span className="text-[10px] font-semibold truncate max-w-[60px]" style={{ color: isSelected ? item.color : "var(--text-secondary)" }}>
                          {item.score}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-bold mt-2" style={{ color: SATISFACTION_LEVELS[rating - 1].color }}>
                  {SATISFACTION_LEVELS[rating - 1].label}
                </p>
              </div>

              {/* What stood out? */}
              <div className="text-left">
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                  What stood out during your experience?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "border"
                        }`}
                        style={{
                          background: isSelected ? undefined : "var(--bg-elevated)",
                          borderColor: isSelected ? undefined : "var(--border)",
                          color: isSelected ? undefined : "var(--text-secondary)",
                        }}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comments */}
              <div className="text-left">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                  Additional thoughts or feedback (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tell us what you loved or what we can do better..."
                  value={surveyComments}
                  onChange={(e) => setSurveyComments(e.target.value)}
                  className="input-field w-full px-3.5 py-2 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 cursor-pointer shadow-sm"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Smile className="h-4 w-4" /><span>Submit Satisfaction Rating</span></>}
              </button>
            </form>
          )}

          {/* TAB 4: Ticket History */}
          {activeTab === "history" && (
            <div className="space-y-3 animate-fade-in">
              {loadingHistory ? (
                <div className="py-12 text-center" style={{ color: "var(--text-secondary)" }}>
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-xs">Loading your tickets...</p>
                </div>
              ) : myTickets.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" style={{ color: "var(--text-secondary)" }} />
                  <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>No submitted tickets yet</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    Reported bugs or feature ideas will appear here with live resolution status.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myTickets.map((t) => {
                    const statusColor =
                      t.status === "resolved"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : t.status === "in_progress"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

                    return (
                      <div
                        key={t.id}
                        className="rounded-2xl p-3.5 space-y-1.5 border transition"
                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                            {t.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColor}`}>
                            {t.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                          {t.description}
                        </p>
                        {t.admin_notes && (
                          <div
                            className="mt-2 rounded-xl p-2.5 text-xs flex items-start gap-2"
                            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">Admin Resolution Note:</p>
                              <p className="text-[11px]" style={{ color: "var(--text-primary)" }}>{t.admin_notes}</p>
                            </div>
                          </div>
                        )}
                        <p className="text-[10px] pt-1" style={{ color: "var(--text-tertiary)" }}>
                          Submitted: {new Date(t.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
