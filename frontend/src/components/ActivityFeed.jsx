import React from 'react';
import {
  FileText,
  DollarSign,
  UserPlus,
  CheckCircle,
  Sparkles,
  Layers,
  Clock,
  Trash2,
} from 'lucide-react';

export default function ActivityFeed({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/30 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-slate-500">
          <Clock className="h-6 w-6" />
        </div>
        <h4 className="mt-3 text-sm font-semibold text-slate-300">No activity yet</h4>
        <p className="mt-1 text-xs text-slate-500 max-w-xs">
          Activity will appear here when members upload receipts, split items, or record payments.
        </p>
      </div>
    );
  }

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'RECEIPT_UPLOADED':
        return <FileText className="h-4 w-4 text-sky-400" />;
      case 'RECEIPT_PARSED':
        return <Sparkles className="h-4 w-4 text-emerald-400" />;
      case 'RECEIPT_CONFIRMED':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'RECEIPT_DELETED':
        return <Trash2 className="h-4 w-4 text-red-400" />;
      case 'PAYMENT_RECORDED':
        return <DollarSign className="h-4 w-4 text-teal-400" />;
      case 'AUTO_SPLIT_APPLIED':
        return <Layers className="h-4 w-4 text-amber-400" />;
      case 'MEMBER_JOINED':
      case 'MEMBER_ADDED':
      case 'GROUP_CREATED':
      default:
        return <UserPlus className="h-4 w-4 text-emerald-400" />;
    }
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {activities.map((item) => (
        <div key={item.id} className="relative flex items-start gap-3.5 group">
          <div className="absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border border-slate-700 shadow-sm ring-4 ring-slate-950">
            {getActionIcon(item.action_type)}
          </div>

          <div className="flex-1 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 transition group-hover:border-slate-700 group-hover:bg-slate-900/70">
            <p className="text-xs font-medium text-slate-200">
              {item.description}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{formatTime(item.created_at)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
