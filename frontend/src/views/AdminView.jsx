import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  Shield,
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Users,
  Receipt,
  Sparkles,
  MessageSquare,
  Bug,
  Lock,
  ChevronRight,
  Laptop,
  Star,
  X,
  Check,
  FileText,
  AlertTriangle,
  History,
  CornerDownRight,
  LogOut,
  TrendingUp,
  Archive,
  RotateCcw,
  UserX,
} from 'lucide-react';

export default function AdminView({ onBack, onOpenUserApp }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState('tickets'); // 'tickets' | 'bills' | 'users' | 'audit'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [bills, setBills] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Ticket triage filters & modal
  const [ticketTypeFilter, setTicketTypeFilter] = useState('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [triageStatus, setTriageStatus] = useState('resolved');
  const [triagePriority, setTriagePriority] = useState('medium');
  const [triageNotes, setTriageNotes] = useState('');
  const [savingTriage, setSavingTriage] = useState(false);

  // User security & archival modal
  const [revokingUser, setRevokingUser] = useState(null);
  const [revokingLoading, setRevokingLoading] = useState(false);
  const [userFilter, setUserFilter] = useState('all'); // 'all' | 'active' | 'archived'
  const [archivingUser, setArchivingUser] = useState(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [unarchivingId, setUnarchivingId] = useState(null);

  // Bills search
  const [billSearch, setBillSearch] = useState('');

  // Initial load
  const loadAdminData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [statsRes, ticketsRes, billsRes, usersRes, auditRes] = await Promise.allSettled([
        api.getAdminStats(),
        api.getAdminTickets(),
        api.getAdminBills(),
        api.getAdminUsers(),
        api.getAdminAuditLogs(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      }
      if (ticketsRes.status === 'fulfilled' && Array.isArray(ticketsRes.value)) {
        setTickets(ticketsRes.value);
      }
      if (billsRes.status === 'fulfilled' && Array.isArray(billsRes.value)) {
        setBills(billsRes.value);
      }
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
        setUsersList(usersRes.value);
      }
      if (auditRes.status === 'fulfilled' && Array.isArray(auditRes.value)) {
        setAuditLogs(auditRes.value);
      }
    } catch (err) {
      console.warn('Error fetching admin data:', err);
      showToast('Could not sync some administrative data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Open ticket triage modal
  const handleOpenTriage = (ticket) => {
    setSelectedTicket(ticket);
    setTriageStatus(ticket.status || 'resolved');
    setTriagePriority(ticket.priority || 'medium');
    setTriageNotes(ticket.admin_notes || '');
  };

  // Submit ticket triage
  const handleSaveTriage = async (e) => {
    e?.preventDefault();
    if (!selectedTicket) return;

    setSavingTriage(true);
    try {
      const updated = await api.updateAdminTicket(selectedTicket.id, {
        status: triageStatus,
        priority: triagePriority,
        adminNotes: triageNotes,
      });

      // Update local state
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? { ...t, status: triageStatus, priority: triagePriority, admin_notes: triageNotes }
            : t
        )
      );

      // Also append to audit logs
      setAuditLogs((prev) => [
        {
          id: 'audit_' + Date.now(),
          action: 'TICKET_UPDATED',
          target_type: 'ticket',
          target_id: selectedTicket.id,
          details: { status: triageStatus, priority: triagePriority, adminNotes: triageNotes },
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      showToast(`Ticket #${selectedTicket.id.slice(0, 8)} updated to ${triageStatus}`, 'success');
      setSelectedTicket(null);
    } catch (err) {
      showToast(err.message || 'Failed to update ticket', 'error');
    } finally {
      setSavingTriage(false);
    }
  };

  // Revoke user sessions
  const handleConfirmRevoke = async () => {
    if (!revokingUser) return;
    setRevokingLoading(true);
    try {
      await api.revokeUserSessions(revokingUser.id);
      showToast(`All sessions for ${revokingUser.email} have been revoked.`, 'success');

      // Add to audit trail
      setAuditLogs((prev) => [
        {
          id: 'audit_' + Date.now(),
          action: 'USER_SESSIONS_REVOKED',
          target_type: 'user',
          target_id: revokingUser.id,
          details: { email: revokingUser.email },
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      setRevokingUser(null);
    } catch (err) {
      showToast(err.message || 'Failed to revoke sessions', 'error');
    } finally {
      setRevokingLoading(false);
    }
  };

  // Archive user (soft-delete / freeze)
  const handleConfirmArchive = async () => {
    if (!archivingUser) return;
    setArchiveLoading(true);
    try {
      await api.archiveUser(archivingUser.id, archiveReason || 'Account archived by administrator');
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === archivingUser.id
            ? { ...u, isArchived: true, archivedAt: new Date().toISOString(), archiveReason }
            : u
        )
      );
      setAuditLogs((prev) => [
        {
          id: 'audit_' + Date.now(),
          action: 'ACCOUNT_ARCHIVED',
          target_type: 'user',
          target_id: archivingUser.id,
          details: { email: archivingUser.email, reason: archiveReason },
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      showToast(`Account for ${archivingUser.email} has been safely archived.`, 'success');
      setArchivingUser(null);
      setArchiveReason('');
    } catch (err) {
      showToast(err.message || 'Failed to archive account', 'error');
    } finally {
      setArchiveLoading(false);
    }
  };

  // Restore user (unarchive)
  const handleUnarchive = async (targetUser) => {
    setUnarchivingId(targetUser.id);
    try {
      await api.unarchiveUser(targetUser.id);
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? { ...u, isArchived: false, archivedAt: null, archiveReason: null }
            : u
        )
      );
      setAuditLogs((prev) => [
        {
          id: 'audit_' + Date.now(),
          action: 'ACCOUNT_RESTORED',
          target_type: 'user',
          target_id: targetUser.id,
          details: { email: targetUser.email },
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      showToast(`Account for ${targetUser.email} has been restored successfully.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to restore account', 'error');
    } finally {
      setUnarchivingId(null);
    }
  };

  // Filtered users
  const filteredUsersList = useMemo(() => {
    return usersList.filter((u) => {
      const isAdminUser = u.role === 'admin' || u.email?.toLowerCase() === 'markwilsongeronilla01@gmail.com';
      if (userFilter === 'admins') return isAdminUser && !u.isArchived;
      if (userFilter === 'members') return !isAdminUser && !u.isArchived;
      if (userFilter === 'active') return !u.isArchived;
      if (userFilter === 'archived') return u.isArchived;
      return true;
    });
  }, [usersList, userFilter]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (ticketTypeFilter !== 'all' && t.type !== ticketTypeFilter) return false;
      if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
      if (ticketSearch) {
        const q = ticketSearch.toLowerCase();
        const matchesTitle = t.title?.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesUser = t.metadata?.user_email?.toLowerCase().includes(q) || t.metadata?.user_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesUser) return false;
      }
      return true;
    });
  }, [tickets, ticketTypeFilter, ticketStatusFilter, ticketSearch]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    if (!billSearch) return bills;
    const q = billSearch.toLowerCase();
    return bills.filter(
      (b) =>
        b.merchant_name?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        String(b.total_amount)?.includes(q)
    );
  }, [bills, billSearch]);

  // Fallback / Computed KPIs
  const totalUsers = stats?.counts?.users ?? usersList.length ?? 1;
  const totalBillsCount = stats?.counts?.receipts ?? bills.length;
  const totalVolume = stats?.financials?.totalVolume ?? bills.reduce((acc, b) => acc + (Number(b.total_amount) || 0), 0);
  const openTicketsCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const csatAvg = stats?.csat?.average ?? 5.0;

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--bg-base)' }}>
      {/* Top Admin Navigation Bar */}
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          background: 'var(--tab-bar-bg)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0a84ff 0%, #5e5ce6 100%)' }}
            >
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Admin Command Space
                </h1>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(10, 132, 255, 0.15)', color: 'var(--accent)' }}
                >
                  System Admin
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>System Operational • Zero-Trust Auth Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Refresh */}
            <button
              onClick={() => loadAdminData(true)}
              disabled={refreshing}
              title="Refresh Data"
              className="flex h-9 w-9 items-center justify-center rounded-xl transition active:scale-95 hover:opacity-85 disabled:opacity-50"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Direct Admin Sign Out */}
            <button
              onClick={logout}
              title="Sign Out of Admin Console"
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition active:scale-95 hover:opacity-85 shadow-sm"
              style={{
                background: 'rgba(255, 69, 58, 0.1)',
                border: '1px solid rgba(255, 69, 58, 0.25)',
                color: 'var(--destructive)',
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 animate-fade-in space-y-6">
        {/* Executive KPI Command Center Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Users */}
          <div
            className="rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition hover:shadow-md"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Total Accounts
              </span>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: 'rgba(10, 132, 255, 0.12)', color: 'var(--accent)' }}
              >
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {totalUsers}
              </p>
              <p className="text-[11px] mt-0.5 flex items-center gap-1 text-emerald-500 font-medium">
                <CheckCircle2 className="h-3 w-3" />
                <span>Zero-Trust Auth Protected</span>
              </p>
            </div>
          </div>

          {/* Card 2: Tracked Bills & Volume */}
          <div
            className="rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition hover:shadow-md"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Split Volume
              </span>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: 'rgba(52, 199, 89, 0.12)', color: 'var(--success)' }}
              >
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                ${Number(totalVolume).toFixed(2)}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Across {totalBillsCount} receipts tracked
              </p>
            </div>
          </div>

          {/* Card 3: Open Tickets & Triage */}
          <div
            className="rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition hover:shadow-md"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Open Issues
              </span>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{
                  background: openTicketsCount > 0 ? 'rgba(255, 159, 10, 0.15)' : 'rgba(10, 132, 255, 0.1)',
                  color: openTicketsCount > 0 ? 'var(--warning)' : 'var(--accent)',
                }}
              >
                <Bug className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {openTicketsCount}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {tickets.length} total submissions
              </p>
            </div>
          </div>

          {/* Card 4: CSAT Satisfaction */}
          <div
            className="rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition hover:shadow-md"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                User CSAT
              </span>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: 'rgba(255, 214, 10, 0.15)', color: '#ffd60a' }}
              >
                <Star className="h-4 w-4 fill-current" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {csatAvg}
                </p>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  / 5.0
                </span>
              </div>
              <p className="text-[11px] mt-0.5 text-emerald-500 font-medium">
                {stats?.csat?.totalResponses || 0} user reviews logged
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div
          className="flex items-center gap-1.5 p-1 rounded-2xl overflow-x-auto"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          {[
            { id: 'tickets', label: 'Ticket Triage Board', icon: Bug, count: openTicketsCount },
            { id: 'bills', label: 'Bills & Expense Monitor', icon: Receipt, count: bills.length },
            { id: 'users', label: 'User Directory & Sessions', icon: Users, count: totalUsers },
            { id: 'audit', label: 'Security & Audit Trail', icon: Activity, count: auditLogs.length },
          ].map(({ id, label, icon: Icon, count }) => {
            const isActive = activeSubTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSubTab(id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                style={{
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: isActive ? 'var(--accent)' : 'inherit' }} />
                <span>{label}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
                    style={{
                      background: isActive ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: TICKET TRIAGE BOARD */}
        {activeSubTab === 'tickets' && (
          <section className="space-y-4">
            {/* Filter & Search Bar */}
            <div
              className="rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex flex-wrap items-center gap-2">
                {/* Type Filter */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="font-semibold text-xs mr-1" style={{ color: 'var(--text-secondary)' }}>
                    Type:
                  </span>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'bug', label: '🐛 Bugs' },
                    { id: 'improvement', label: '💡 Ideas' },
                    { id: 'satisfaction_survey', label: '⭐ Surveys' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setTicketTypeFilter(f.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition"
                      style={{
                        background: ticketTypeFilter === f.id ? 'var(--accent)' : 'var(--bg-elevated)',
                        color: ticketTypeFilter === f.id ? '#fff' : 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 text-xs ml-0 sm:ml-2">
                  <span className="font-semibold text-xs mr-1" style={{ color: 'var(--text-secondary)' }}>
                    Status:
                  </span>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'open', label: 'Open' },
                    { id: 'in_progress', label: 'In Progress' },
                    { id: 'resolved', label: 'Resolved' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setTicketStatusFilter(s.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition"
                      style={{
                        background: ticketStatusFilter === s.id ? 'var(--bg-elevated)' : 'transparent',
                        color: ticketStatusFilter === s.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                        border: ticketStatusFilter === s.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Field */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Search tickets, email..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full rounded-xl pl-9 pr-4 py-2 text-xs transition"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Tickets Grid / List */}
            {filteredTickets.length === 0 ? (
              <div
                className="rounded-2xl p-12 text-center"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
                <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  No Tickets Found
                </h4>
                <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
                  All reported issues and user survey reviews have been resolved or filtered out.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredTickets.map((t) => {
                  const isBug = t.type === 'bug';
                  const isSurvey = t.type === 'satisfaction_survey';
                  const isImprovement = t.type === 'improvement' || t.type === 'feature_request';

                  return (
                    <div
                      key={t.id}
                      className="rounded-2xl p-4 sm:p-5 transition hover:shadow-md flex flex-col sm:flex-row gap-4 justify-between items-start"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex-1 space-y-2.5 min-w-0">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Type Badge */}
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
                            style={{
                              background: isBug
                                ? 'rgba(255, 69, 58, 0.12)'
                                : isSurvey
                                ? 'rgba(255, 214, 10, 0.15)'
                                : 'rgba(175, 82, 222, 0.12)',
                              color: isBug ? 'var(--destructive)' : isSurvey ? '#ffd60a' : '#af52de',
                            }}
                          >
                            {isBug ? <Bug className="h-3 w-3" /> : isSurvey ? <Star className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                            {t.type.replace('_', ' ')}
                          </span>

                          {/* Priority Badge */}
                          {t.priority && (
                            <span
                              className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                              style={{
                                background:
                                  t.priority === 'urgent'
                                    ? 'rgba(255, 69, 58, 0.2)'
                                    : t.priority === 'high'
                                    ? 'rgba(255, 159, 10, 0.15)'
                                    : 'var(--bg-elevated)',
                                color:
                                  t.priority === 'urgent'
                                    ? 'var(--destructive)'
                                    : t.priority === 'high'
                                    ? 'var(--warning)'
                                    : 'var(--text-secondary)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {t.priority}
                            </span>
                          )}

                          {/* Status Badge */}
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                            style={{
                              background:
                                t.status === 'resolved'
                                  ? 'rgba(52, 199, 89, 0.15)'
                                  : t.status === 'in_progress'
                                  ? 'rgba(10, 132, 255, 0.15)'
                                  : 'rgba(255, 159, 10, 0.15)',
                              color:
                                t.status === 'resolved'
                                  ? 'var(--success)'
                                  : t.status === 'in_progress'
                                  ? 'var(--accent)'
                                  : 'var(--warning)',
                            }}
                          >
                            {t.status}
                          </span>

                          <span className="text-[11px] ml-auto" style={{ color: 'var(--text-tertiary)' }}>
                            {new Date(t.created_at).toLocaleString()}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                            {t.title}
                          </h3>
                          <p className="text-xs mt-1 leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                            {t.description}
                          </p>
                        </div>

                        {/* Survey specific sentiment */}
                        {isSurvey && t.satisfaction_rating && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              User Rating:
                            </span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className="h-3.5 w-3.5"
                                  style={{
                                    color: star <= t.satisfaction_rating ? '#ffd60a' : 'var(--text-tertiary)',
                                    fill: star <= t.satisfaction_rating ? '#ffd60a' : 'transparent',
                                  }}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-bold ml-1" style={{ color: '#ffd60a' }}>
                              {t.satisfaction_rating} / 5
                            </span>
                          </div>
                        )}

                        {/* Diagnostic info pill (for bugs) */}
                        {t.metadata && Object.keys(t.metadata).length > 0 && (
                          <div
                            className="flex flex-wrap items-center gap-2 p-2 rounded-xl text-[11px]"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                          >
                            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              User Environment:
                            </span>
                            {t.metadata.user_email && (
                              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                👤 {t.metadata.user_name || t.metadata.user_email}
                              </span>
                            )}
                            {t.metadata.browser && (
                              <span className="rounded px-1.5 py-0.5 bg-black/10 dark:bg-white/10" style={{ color: 'var(--text-secondary)' }}>
                                🌐 {t.metadata.browser}
                              </span>
                            )}
                            {t.metadata.os && (
                              <span className="rounded px-1.5 py-0.5 bg-black/10 dark:bg-white/10" style={{ color: 'var(--text-secondary)' }}>
                                💻 {t.metadata.os}
                              </span>
                            )}
                            {t.metadata.screen && (
                              <span className="rounded px-1.5 py-0.5 bg-black/10 dark:bg-white/10" style={{ color: 'var(--text-secondary)' }}>
                                📱 {t.metadata.screen}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Admin Resolution Note if already added */}
                        {t.admin_notes && (
                          <div
                            className="p-2.5 rounded-xl text-xs space-y-1"
                            style={{
                              background: 'rgba(52, 199, 89, 0.08)',
                              border: '1px solid rgba(52, 199, 89, 0.25)',
                            }}
                          >
                            <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Admin Resolution Note:</span>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                              {t.admin_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
                        <button
                          onClick={() => handleOpenTriage(t)}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition active:scale-95 hover:opacity-90"
                          style={{
                            background: 'var(--accent)',
                            color: '#fff',
                            boxShadow: '0 2px 6px rgba(10, 132, 255, 0.3)',
                          }}
                        >
                          <span>Triage / Respond</span>
                          <CornerDownRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: BILLS & EXPENSE MONITOR */}
        {activeSubTab === 'bills' && (
          <section className="space-y-4">
            {/* Header & Search */}
            <div
              className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  System-Wide Expense &amp; Receipt Stream
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Transfers, OCR extractions, and item splits across all user groups.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Filter merchant, amount..."
                  value={billSearch}
                  onChange={(e) => setBillSearch(e.target.value)}
                  className="w-full rounded-xl pl-9 pr-4 py-2 text-xs"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Bills Table */}
            <div
              className="rounded-2xl overflow-hidden shadow-sm"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                    <tr>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Merchant &amp; Category
                      </th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Total Amount
                      </th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Tax / Tip
                      </th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        OCR Status
                      </th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Date Logged
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
                    {filteredBills.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                          No receipts logged in the system yet.
                        </td>
                      </tr>
                    ) : (
                      filteredBills.map((b) => (
                        <tr key={b.id} className="transition hover:bg-black/5 dark:hover:bg-white/5">
                          <td className="px-4 py-3.5 font-medium">
                            <div className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                              {b.merchant_name || 'Receipt Expense'}
                            </div>
                            <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                              🏷️ {b.category || 'Other'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            ${Number(b.total_amount || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Tax: ${Number(b.tax_amount || 0).toFixed(2)} • Tip: ${Number(b.tip_amount || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                              style={{
                                background:
                                  b.status === 'confirmed'
                                    ? 'rgba(52, 199, 89, 0.15)'
                                    : b.status === 'parsed'
                                    ? 'rgba(10, 132, 255, 0.15)'
                                    : 'rgba(255, 159, 10, 0.15)',
                                color:
                                  b.status === 'confirmed'
                                    ? 'var(--success)'
                                    : b.status === 'parsed'
                                    ? 'var(--accent)'
                                    : 'var(--warning)',
                              }}
                            >
                              {b.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                            {new Date(b.created_at || Date.now()).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: USER DIRECTORY & SESSIONS */}
        {activeSubTab === 'users' && (
          <section className="space-y-4">
            <div
              className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  User &amp; Identity Directory
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Active user accounts, role allocations, account archival, and remote session security controls.
                </p>
              </div>

              {/* User Filter (All, Admins, Members, Archived) */}
              <div className="flex items-center gap-1 text-xs flex-wrap">
                <span className="font-semibold text-xs mr-1" style={{ color: 'var(--text-secondary)' }}>
                  Filter:
                </span>
                {[
                  { id: 'all', label: `All (${usersList.length})` },
                  { id: 'admins', label: `👑 Admins (${usersList.filter((u) => (u.role === 'admin' || u.email?.toLowerCase() === 'markwilsongeronilla01@gmail.com') && !u.isArchived).length})` },
                  { id: 'members', label: `👥 Members (${usersList.filter((u) => !(u.role === 'admin' || u.email?.toLowerCase() === 'markwilsongeronilla01@gmail.com') && !u.isArchived).length})` },
                  { id: 'archived', label: `📦 Archived (${usersList.filter((u) => u.isArchived).length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setUserFilter(f.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition"
                    style={{
                      background: userFilter === f.id ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: userFilter === f.id ? '#fff' : 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredUsersList.length === 0 ? (
              <div
                className="rounded-2xl p-12 text-center"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <Users className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  No accounts in this filter
                </h4>
                <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
                  {userFilter === 'archived'
                    ? 'No accounts are currently archived. Archiving allows you to suspend accounts without wiping historical bills.'
                    : userFilter === 'admins'
                    ? 'No administrator accounts found.'
                    : userFilter === 'members'
                    ? 'No regular member accounts found.'
                    : 'No active user accounts found.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredUsersList.map((u) => {
                  const isAdminUser = u.role === 'admin' || u.email?.toLowerCase() === 'markwilsongeronilla01@gmail.com';
                  const isSelf = u.id === user?.id;
                  const isArchived = u.isArchived;

                  return (
                    <div
                      key={u.id}
                      className="rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm transition hover:shadow-md"
                      style={{
                        background: 'var(--bg-surface)',
                        border: isArchived ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border)',
                        opacity: isArchived ? 0.85 : 1,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-2xl text-white font-bold text-sm shrink-0"
                            style={{ background: isArchived ? '#64748b' : u.avatarColor || '#0a84ff' }}
                          >
                            {(u.name || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                {u.name}
                              </p>
                              {isAdminUser ? (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                  style={{ background: 'rgba(10, 132, 255, 0.15)', color: 'var(--accent)', border: '1px solid rgba(10, 132, 255, 0.3)' }}
                                >
                                  <Shield className="h-2.5 w-2.5" /> Admin
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                                >
                                  <Users className="h-2.5 w-2.5" /> Member
                                </span>
                              )}
                              {isSelf && (
                                <span
                                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25"
                                >
                                  You
                                </span>
                              )}
                              {isArchived ? (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                                >
                                  <Archive className="h-2.5 w-2.5" /> Archived
                                </span>
                              ) : (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500"
                                >
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                              {u.email}
                            </p>
                            {u.phone && (
                              <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                📞 {u.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        {u.createdAt && (
                          <span className="text-[10px] shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                            Joined {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Archival Notice if archived */}
                      {isArchived && u.archiveReason && (
                        <div
                          className="rounded-xl p-2 text-[11px] leading-tight"
                          style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                        >
                          <span className="font-semibold text-amber-600 dark:text-amber-400">Archived: </span>
                          <span style={{ color: 'var(--text-secondary)' }}>{u.archiveReason}</span>
                        </div>
                      )}

                      {/* Action buttons row */}
                      <div className="pt-1 flex items-center justify-end gap-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        {isArchived ? (
                          <button
                            onClick={() => handleUnarchive(u)}
                            disabled={unarchivingId === u.id}
                            title="Restore and reactivate this user account"
                            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition active:scale-95 hover:opacity-90"
                            style={{
                              background: 'rgba(52, 199, 89, 0.12)',
                              color: 'var(--success)',
                              border: '1px solid rgba(52, 199, 89, 0.25)',
                            }}
                          >
                            <RotateCcw className={`h-3 w-3 ${unarchivingId === u.id ? 'animate-spin' : ''}`} />
                            <span>{unarchivingId === u.id ? 'Restoring...' : 'Restore Account'}</span>
                          </button>
                        ) : (
                          <>
                            <button
                              disabled={isAdminUser || isSelf}
                              onClick={() => {
                                setArchivingUser(u);
                                setArchiveReason('');
                              }}
                              title={isAdminUser ? 'Cannot archive administrator account' : isSelf ? 'Cannot archive your own account' : 'Archive account (freeze / soft-delete)'}
                              className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{
                                background: 'rgba(245, 158, 11, 0.1)',
                                color: 'var(--warning)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                              }}
                            >
                              <Archive className="h-3 w-3" />
                              <span>Archive</span>
                            </button>

                            <button
                              onClick={() => setRevokingUser(u)}
                              title="Revoke all active sessions for this account"
                              className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition active:scale-95"
                              style={{
                                background: 'rgba(255, 69, 58, 0.1)',
                                color: 'var(--destructive)',
                                border: '1px solid rgba(255, 69, 58, 0.25)',
                              }}
                            >
                              <LogOut className="h-3 w-3" />
                              <span>Revoke Sessions</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: SECURITY & AUDIT TRAIL */}
        {activeSubTab === 'audit' && (
          <section className="space-y-4">
            <div
              className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Security &amp; Administrative Audit Trail
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Immutable chronological log of triage responses, permissions changes, and session terminations.
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl p-4 sm:p-5 space-y-3"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                  <History className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs">No administrative actions logged yet today.</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            background:
                              log.action === 'USER_SESSIONS_REVOKED'
                                ? 'rgba(255, 69, 58, 0.15)'
                                : 'rgba(10, 132, 255, 0.15)',
                            color:
                              log.action === 'USER_SESSIONS_REVOKED'
                                ? 'var(--destructive)'
                                : 'var(--accent)',
                          }}
                        >
                          {log.action}
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Target: {log.target_type} ({log.target_id?.slice(0, 8)})
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-[11px] font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>

                    <div className="text-[10px] text-right" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(log.created_at || Date.now()).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {/* MODAL 1: TICKET TRIAGE & RESOLUTION EDITOR */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  <Bug className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Triage Ticket #{selectedTicket.id.slice(0, 8)}
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    Type: {selectedTicket.type} • Created: {new Date(selectedTicket.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-full p-1 transition hover:opacity-75"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Ticket Subject Preview */}
            <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: 'var(--bg-elevated)' }}>
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {selectedTicket.title}
              </p>
              <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {selectedTicket.description}
              </p>
            </div>

            <form onSubmit={handleSaveTriage} className="space-y-4">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Set Ticket Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'open', label: 'Open' },
                    { id: 'in_progress', label: 'In Progress' },
                    { id: 'resolved', label: 'Resolved' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTriageStatus(s.id)}
                      className="py-2 rounded-xl text-xs font-semibold transition"
                      style={{
                        background: triageStatus === s.id ? 'var(--accent)' : 'var(--bg-elevated)',
                        color: triageStatus === s.id ? '#fff' : 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Priority Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['low', 'medium', 'high', 'urgent'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTriagePriority(p)}
                      className="py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition"
                      style={{
                        background: triagePriority === p ? 'var(--bg-elevated)' : 'transparent',
                        color: triagePriority === p ? 'var(--text-primary)' : 'var(--text-secondary)',
                        border: triagePriority === p ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Note Input */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Admin Resolution Note (Visible to User in their Support History)
                </label>
                <textarea
                  rows={3}
                  value={triageNotes}
                  onChange={(e) => setTriageNotes(e.target.value)}
                  placeholder="e.g., We addressed this receipt calculation issue in update v1.2. Thank you for flagging!"
                  className="w-full rounded-2xl p-3 text-xs leading-relaxed transition"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTriage}
                  className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold transition active:scale-95 disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  {savingTriage ? 'Saving...' : 'Save & Publish Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM REVOKE SESSIONS */}
      {revokingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-center"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(255, 69, 58, 0.15)', color: 'var(--destructive)' }}
            >
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Revoke All Active Sessions?
              </h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                This will immediately invalidate all refresh tokens and sign out{' '}
                <span className="font-semibold text-white">{revokingUser.email}</span> on every device.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRevokingUser(null)}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revokingLoading}
                onClick={handleConfirmRevoke}
                className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold transition active:scale-95 disabled:opacity-50"
                style={{ background: 'var(--destructive)', color: '#fff' }}
              >
                {revokingLoading ? 'Revoking...' : 'Confirm Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM ARCHIVE USER ACCOUNT */}
      {archivingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="text-center space-y-2">
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}
              >
                <Archive className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Archive User Account?
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Archiving <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{archivingUser.email}</span> will immediately freeze the account, invalidate active sessions, and prevent new logins.
              </p>
            </div>

            <div
              className="rounded-xl p-3 text-xs leading-relaxed"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                🛡️ Financial Data Preserved
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>
                Unlike permanent hard deletion, archiving preserves all past receipts, debts, and split calculations so remaining group members' balances stay accurate.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Archival Reason (Optional)
              </label>
              <input
                type="text"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="e.g. Account suspended per user request or policy violation"
                className="w-full rounded-xl p-2.5 text-xs transition"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setArchivingUser(null)}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={archiveLoading}
                onClick={handleConfirmArchive}
                className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold transition active:scale-95 disabled:opacity-50"
                style={{ background: 'var(--warning)', color: '#000' }}
              >
                {archiveLoading ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
