import React, { useState, useEffect, useRef } from 'react';
import {
  Receipt,
  DollarSign,
  Activity,
  BarChart3,
  UploadCloud,
  Plus,
  ArrowLeft,
  Users,
  Copy,
  Check,
  Calendar,
  Sparkles,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  PieChart,
  Tag,
  Loader2,
  Settings,
  FileText,
  Download,
  Share2,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatMoney, getCurrencySymbol, CURRENCIES } from '../utils/currency';
import ReceiptUploadModal from '../components/ReceiptUploadModal';
import ManualExpenseModal from '../components/ManualExpenseModal';
import GroupSettingsModal from '../components/GroupSettingsModal';
import SettleUpModal from '../components/SettleUpModal';
import ActivityFeed from '../components/ActivityFeed';

export default function GroupDetailView({ group, onBack, onSelectReceipt }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('receipts');
  const [groupDetails, setGroupDetails] = useState(group);
  const [members, setMembers] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [activities, setActivities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick Currency Switcher State
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const currencyMenuRef = useRef(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settleRecipient, setSettleRecipient] = useState(null);
  const [settleAmount, setSettleAmount] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const currency = groupDetails.currency || 'USD';
  const symbol = getCurrencySymbol(currency);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const [details, membersList, settlementsData, activityData, analyticsData] =
        await Promise.all([
          api.getGroupDetails(group.id),
          api.listMembers(group.id),
          api.listSettlements(group.id),
          api.getGroupActivity(group.id),
          api.getGroupAnalytics(group.id),
        ]);

      setGroupDetails(details);
      setMembers(membersList || []);
      setSettlements(settlementsData.settlements || []);
      setPaymentHistory(settlementsData.paymentHistory || []);
      setActivities(activityData || []);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading group details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupData();
  }, [group.id]);

  // Click outside to close currency dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target)) {
        setIsCurrencyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickCurrencyChange = async (newCode) => {
    setIsCurrencyDropdownOpen(false);
    if (newCode === currency) return;

    try {
      const updated = await api.updateGroup(group.id, { currency: newCode });
      setGroupDetails({ ...groupDetails, currency: newCode });
      showToast(`Currency switched to ${newCode} (${getCurrencySymbol(newCode)})`, 'success');
      loadGroupData();
    } catch (err) {
      showToast(err.message || 'Failed to update currency', 'error');
    }
  };

  const handleCopyInvite = () => {
    if (!groupDetails.invite_code) return;
    navigator.clipboard.writeText(groupDetails.invite_code);
    setCopiedCode(true);
    showToast(`Invite code ${groupDetails.invite_code} copied!`, 'info');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getMemberName = (userId) => {
    const member = members.find((m) => m.user_id === userId);
    return member ? member.display_name : 'Member';
  };

  const handleExportCSV = () => {
    const rows = [
      ['Merchant/Expense', 'Date', 'Category', 'Paid By', `Amount (${currency})`, 'Status'],
      ...(groupDetails.receipts || []).map((r) => [
        `"${r.merchant_name || 'Receipt'}"`,
        r.receipt_date || new Date(r.created_at).toLocaleDateString(),
        r.category || 'Other',
        `"${getMemberName(r.paid_by)}"`,
        (parseFloat(r.total_amount) || 0).toFixed(2),
        r.status,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${groupDetails.name.replace(/\s+/g, '_')}_expenses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Expenses exported to CSV!', 'success');
  };

  const handleCopySummary = () => {
    let summary = `📊 *${groupDetails.name}* Expense Summary\n`;
    summary += `Total Group Spend: ${formatMoney(analytics?.totalSpent || 0, currency)}\n\n`;

    if (settlements.length === 0) {
      summary += `✅ All settled up! No outstanding balances.\n`;
    } else {
      summary += `💸 *Settlements to Settle Up:*\n`;
      settlements.forEach((s) => {
        summary += `• ${getMemberName(s.from_user)} pays ${getMemberName(s.to_user)}: ${formatMoney(s.amount, currency)}\n`;
      });
    }

    navigator.clipboard.writeText(summary);
    showToast('Summary copied to clipboard!', 'success');
  };

  const receiptsList = groupDetails.receipts || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-fadeIn">
      {/* Top Bar / Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>All Groups</span>
        </button>

        <div className="flex items-center gap-2">
          {groupDetails.invite_code && (
            <button
              onClick={handleCopyInvite}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono font-bold text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400 transition"
            >
              <span className="text-slate-500 font-sans text-[11px]">Code:</span>
              <span className="text-emerald-400">{groupDetails.invite_code}</span>
              {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}

          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Group settings"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Group Header Banner */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl mb-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-100">
                {groupDetails.name}
              </h2>

              {/* Quick Currency Selector Button */}
              <div className="relative" ref={currencyMenuRef}>
                <button
                  onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                  title="Change group currency"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/90 px-2.5 py-1 text-xs font-mono font-bold text-emerald-400 hover:border-emerald-500/40 hover:bg-slate-800 transition active:scale-95 shadow-sm"
                >
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  <span>{symbol} {currency}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isCurrencyDropdownOpen && (
                  <div className="absolute left-0 mt-2 z-40 w-56 rounded-2xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl animate-slideDown">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Switch Group Currency
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-0.5">
                      {CURRENCIES.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => handleQuickCurrencyChange(c.code)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                            currency === c.code
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="font-mono font-bold text-emerald-400 ml-2">{c.symbol}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-1 text-xs text-slate-300 border border-slate-800">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span>{members.length} Members:</span>
                <span className="text-slate-400 truncate max-w-xs">
                  {members.map((m) => m.display_name).join(', ')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsManualOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition active:scale-95"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span>+ Expense</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 transition active:scale-95"
            >
              <UploadCloud className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Upload Photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
            activeTab === 'receipts'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Expenses & Receipts ({receiptsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
            activeTab === 'balances'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Balances & Settle</span>
          {settlements.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-extrabold text-emerald-400">
              {settlements.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
            activeTab === 'activity'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Activity Feed</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition ${
            activeTab === 'analytics'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Analytics & Export</span>
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
          <p className="text-xs font-medium">Loading group details...</p>
        </div>
      ) : activeTab === 'receipts' ? (
        <div>
          {receiptsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-slate-500 border border-slate-800 mb-4">
                <Receipt className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-slate-200">No expenses recorded yet</h4>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mb-6">
                Upload a receipt photo to scan with Gemini Vision or add an expense manually.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsManualOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  <FileText className="h-4 w-4 text-emerald-400" />
                  Add Manually
                </button>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  <UploadCloud className="h-4 w-4" />
                  Upload Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>All Expenses</span>
                <span>Click to View / Split</span>
              </div>

              {receiptsList.map((r) => {
                const isConfirmed = r.status === 'confirmed';
                return (
                  <div
                    key={r.id}
                    onClick={() => onSelectReceipt(r.id)}
                    className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-emerald-500/40 hover:bg-slate-900 hover:shadow-lg active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-emerald-400 border border-slate-800 group-hover:border-emerald-500/30">
                        {r.image_path ? <Receipt className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 group-hover:text-emerald-400 transition">
                            {r.merchant_name || 'Receipt'}
                          </h4>
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                            {r.category || 'Other'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {r.receipt_date || new Date(r.created_at).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>Paid by <strong className="text-slate-300 font-medium">{getMemberName(r.paid_by)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-mono text-base font-extrabold text-slate-100">
                          {formatMoney(r.total_amount, currency)}
                        </span>
                        <div>
                          {isConfirmed ? (
                            <span className="text-[11px] font-bold text-emerald-400">Confirmed</span>
                          ) : (
                            <span className="text-[11px] font-bold text-sky-400">Open to Split</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'balances' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Settlement Optimization (Minimum Payments)
            </h3>
            <button
              onClick={() => setIsSettleOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Record a Payment</span>
            </button>
          </div>

          {settlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/30 p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-3">
                <Check className="h-6 w-6 stroke-[3]" />
              </div>
              <h4 className="font-bold text-slate-200">All Settled Up!</h4>
              <p className="mt-1 text-xs text-slate-500">
                No outstanding debts in this group. Confirm receipts to recompute balances.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {settlements.map((s, idx) => {
                const fromName = getMemberName(s.from_user);
                const toName = getMemberName(s.to_user);
                const isCurrentUserDebtor = s.from_user === user?.id;

                return (
                  <div
                    key={s.id || idx}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 font-bold text-emerald-400 border border-slate-800">
                        {fromName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                          <span>{fromName}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                          <span>{toName}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {isCurrentUserDebtor ? 'You owe' : `${fromName} owes`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-extrabold text-emerald-400">
                        {formatMoney(s.amount, currency)}
                      </span>
                      {isCurrentUserDebtor && (
                        <button
                          onClick={() => {
                            setSettleRecipient(s.to_user);
                            setSettleAmount(s.amount);
                            setIsSettleOpen(true);
                          }}
                          className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
                Payment History
              </h3>
              <div className="space-y-2">
                {paymentHistory.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/30 px-4 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="font-semibold text-emerald-400">{getMemberName(p.from_user)}</span>
                      <span>paid</span>
                      <span className="font-semibold text-emerald-400">{getMemberName(p.to_user)}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-200">
                      {formatMoney(p.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'activity' ? (
        <ActivityFeed activities={activities} />
      ) : activeTab === 'analytics' ? (
        <div className="space-y-6">
          {/* Top Actions for Export */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Spending Analytics
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
              >
                <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copy Summary</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
              >
                <Download className="h-3.5 w-3.5 text-teal-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <span className="text-xs font-medium text-slate-400">Total Group Spend</span>
              <p className="mt-2 font-mono text-2xl font-extrabold text-slate-100">
                {formatMoney(analytics?.totalSpent || 0, currency)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <span className="text-xs font-medium text-slate-400">Expenses Count</span>
              <p className="mt-2 font-mono text-2xl font-extrabold text-slate-100">
                {analytics?.receiptCount || 0}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <span className="text-xs font-medium text-slate-400">Avg. Spend per Expense</span>
              <p className="mt-2 font-mono text-2xl font-extrabold text-slate-100">
                {formatMoney(analytics?.averageReceiptAmount || 0, currency)}
              </p>
            </div>
          </div>

          {/* Category Breakdown */}
          {analytics?.categoryBreakdown && Object.keys(analytics.categoryBreakdown).length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-4">
                <PieChart className="h-4 w-4 text-emerald-400" />
                <span>Spending by Category</span>
              </h4>
              <div className="space-y-3">
                {Object.entries(analytics.categoryBreakdown).map(([cat, amount]) => {
                  const percent = analytics.totalSpent > 0 ? (amount / analytics.totalSpent) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-300">{cat}</span>
                        <span className="font-mono text-slate-400">
                          {formatMoney(amount, currency)} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Member Breakdown Table */}
          {analytics?.memberStats && analytics.memberStats.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-4">
                <Users className="h-4 w-4 text-teal-400" />
                <span>Member Consumption vs Paid</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="pb-2 font-semibold">Member</th>
                      <th className="pb-2 font-semibold">Total Paid ({symbol})</th>
                      <th className="pb-2 font-semibold">Total Consumed ({symbol})</th>
                      <th className="pb-2 font-semibold text-right">Net Balance ({symbol})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {analytics.memberStats.map((stat) => (
                      <tr key={stat.userId}>
                        <td className="py-2.5 font-sans font-medium text-slate-200">
                          {stat.displayName}
                        </td>
                        <td className="py-2.5 text-slate-300">
                          {formatMoney(stat.totalPaid, currency)}
                        </td>
                        <td className="py-2.5 text-slate-300">
                          {formatMoney(stat.totalConsumed, currency)}
                        </td>
                        <td
                          className={`py-2.5 text-right font-bold ${
                            stat.netBalance > 0
                              ? 'text-emerald-400'
                              : stat.netBalance < 0
                              ? 'text-red-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {stat.netBalance > 0 ? `+${formatMoney(stat.netBalance, currency)}` : `${formatMoney(stat.netBalance, currency)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <ReceiptUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        groupId={group.id}
        onReceiptUploaded={(receipt) => {
          loadGroupData();
          onSelectReceipt(receipt.id);
        }}
      />

      <ManualExpenseModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        groupId={group.id}
        members={members}
        currency={currency}
        onExpenseCreated={(receipt) => {
          loadGroupData();
          onSelectReceipt(receipt.id);
        }}
      />

      <GroupSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        group={groupDetails}
        onGroupUpdated={(updated) => {
          setGroupDetails({ ...groupDetails, ...updated });
        }}
        onGroupDeleted={() => {
          onBack();
        }}
        onGroupLeft={() => {
          onBack();
        }}
      />

      <SettleUpModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        groupId={group.id}
        members={members.filter((m) => m.user_id !== user?.id)}
        defaultRecipientId={settleRecipient}
        defaultAmount={settleAmount}
        onPaymentRecorded={() => {
          loadGroupData();
        }}
      />
    </div>
  );
}
