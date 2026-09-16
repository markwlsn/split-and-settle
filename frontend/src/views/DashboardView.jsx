import React, { useState, useEffect } from "react";
import { Users, PlusCircle, KeyRound, ChevronRight, Sparkles, Loader2, QrCode, Receipt } from "lucide-react";
import { api } from "../services/api";
import CreateGroupModal from "../components/CreateGroupModal";
import JoinGroupModal from "../components/JoinGroupModal";
import QRInviteModal from "../components/QRInviteModal";

function GroupCard({ group, onSelect, onShowQR }) {
  const members = group.group_members || [];
  const created = new Date(group.created_at);
  const ago = Math.floor((Date.now() - created) / 86400000);
  const agoLabel = ago === 0 ? "Today" : ago === 1 ? "Yesterday" : `${ago}d ago`;

  return (
    <div
      onClick={() => onSelect(group)}
      className="group relative flex cursor-pointer flex-col justify-between rounded-3xl p-5 transition active:scale-[0.98]"
      style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl transition"
            style={{ background: "var(--bg-elevated)" }}
          >
            <Users className="h-5 w-5" style={{ color: "var(--accent)" }} />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onShowQR(group); }}
            title="Invite via QR"
            className="flex items-center justify-center h-8 w-8 rounded-xl transition active:scale-90"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          >
            <QrCode className="h-4 w-4" />
          </button>
        </div>

        <h4 className="mt-4 text-base font-bold truncate" style={{ color: "var(--text-primary)" }}>
          {group.name}
        </h4>
        <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
          {members.length} {members.length === 1 ? "member" : "members"} · {group.currency || "USD"} · {agoLabel}
        </p>
      </div>

      <div
        className="mt-5 flex items-center justify-between pt-3.5 text-xs"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span className="font-medium flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
          <Receipt className="h-3.5 w-3.5" /> View Expenses
        </span>
        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" style={{ color: "var(--text-tertiary)" }} />
      </div>
    </div>
  );
}

export default function DashboardView({ onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [qrGroup, setQrGroup] = useState(null);
  const [initialJoinCode, setInitialJoinCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("join") || "";
  });

  useEffect(() => {
    if (initialJoinCode) {
      setIsJoinOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [initialJoinCode]);

  useEffect(() => {
    api.listGroups()
      .then((data) => setGroups(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="mx-auto max-w-5xl px-4 py-6 sm:px-6 pb-tab-bar"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Hero banner */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-6"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-3"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              <Sparkles className="h-3.5 w-3.5" /> AI Receipt Parser
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
              Your Groups
            </h2>
            <p className="mt-1.5 text-sm max-w-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Upload receipt photos, let Gemini Vision extract items, and settle with minimal transactions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-xs"
            >
              <KeyRound className="h-4 w-4" />
              Join with Code
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs"
            >
              <PlusCircle className="h-4 w-4 stroke-[2.2]" />
              New Group
            </button>
          </div>
        </div>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Active Groups ({groups.length})
        </h3>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: "var(--text-secondary)" }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
          <p className="text-xs font-medium">Loading your groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-3xl p-12 text-center"
          style={{ border: "1.5px dashed var(--border)", background: "var(--bg-surface)" }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
            style={{ background: "var(--bg-elevated)" }}
          >
            <Users className="h-7 w-7" style={{ color: "var(--text-secondary)" }} />
          </div>
          <h4 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>No groups yet</h4>
          <p className="mt-1 text-xs max-w-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Create a group for your trip, dinner, or household — or join a friend's group with an invite code.
          </p>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsJoinOpen(true)} className="btn-secondary flex items-center gap-2 px-4 py-2 text-xs">
              <KeyRound className="h-3.5 w-3.5" /> Join Group
            </button>
            <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2 px-4 py-2 text-xs">
              <PlusCircle className="h-3.5 w-3.5" /> Create Group
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onSelect={onSelectGroup}
              onShowQR={setQrGroup}
            />
          ))}
        </div>
      )}

      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onGroupCreated={(newGroup, openedReceiptId) => {
          setGroups([newGroup, ...groups]);
          onSelectGroup(newGroup, openedReceiptId);
        }}
      />

      <JoinGroupModal
        isOpen={isJoinOpen}
        initialCode={initialJoinCode}
        onClose={() => {
          setIsJoinOpen(false);
          setInitialJoinCode("");
        }}
        onGroupJoined={(joinedGroup) => {
          setGroups([joinedGroup, ...groups]);
          onSelectGroup(joinedGroup);
        }}
      />

      <QRInviteModal
        group={qrGroup}
        isOpen={Boolean(qrGroup)}
        onClose={() => setQrGroup(null)}
      />
    </div>
  );
}
