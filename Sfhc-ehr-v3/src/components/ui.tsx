import { type ReactNode } from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";

// ----------------------------------------------------------------------------
// Status badge helper
// ----------------------------------------------------------------------------

type BadgeTone = "teal" | "blue" | "amber" | "rose" | "slate" | "green" | "violet";

export function StatusBadge({ status, tone }: { status: string; tone?: BadgeTone }) {
  const map: Record<string, BadgeTone> = {
    Pending: "amber",
    Reviewed: "blue",
    Dispensed: "green",
    Completed: "green",
    Cancelled: "rose",
    "No-Show": "slate",
    Scheduled: "blue",
    "Checked-In": "violet",
    "In-Progress": "violet",
    Ordered: "amber",
    "Sample-Collected": "blue",
    Received: "blue",
    Prepared: "violet",
    Verified: "teal",
    Draft: "slate",
    Submitted: "blue",
    Approved: "teal",
    Normal: "green",
    Abnormal: "amber",
    Critical: "rose",
    Active: "green",
    Low: "amber",
    High: "rose",
    Unpaid: "rose",
    "Partially-Paid": "amber",
    Paid: "green",
    Overdue: "rose",
    Refunded: "violet",
    "Under Review": "violet",
    Rejected: "rose",
    // M8: Inventory statuses
    Inactive: "slate",
    Discontinued: "slate",
    "Out-of-Stock": "rose",
    "Low-Stock": "amber",
    "Expiring-Soon": "amber",
    Expired: "rose",
    Overstock: "blue",
    "Reorder-Required": "amber",
    // M8: Asset statuses
    "In Service": "green",
    "Under Maintenance": "amber",
    Decommissioned: "slate",
    "In Storage": "slate",
    Excellent: "green",
    Fair: "amber",
    Poor: "rose",
    Damaged: "rose",
    // M8: Stock movement types
    Issued: "blue",
    Transferred: "violet",
    Returned: "teal",
    Adjusted: "slate",
    // M8: Contract statuses
    Suspended: "rose",
    // M9: Staff statuses
    "On Leave": "amber",
    Terminated: "rose",
    Probation: "amber",
    // M9: Attendance
    Present: "green",
    Absent: "rose",
    "Half-Day": "amber",
    Remote: "blue",
    // M9: Shift types
    Morning: "blue",
    Afternoon: "amber",
    Night: "violet",
    "On-Call": "teal",
    // M9: Admin roles
    Administrator: "rose",
    Physician: "teal",
    "Medical Laboratory Scientist": "blue",
    Pharmacist: "teal",
    "Finance Officer": "blue",
    Receptionist: "slate",
    Nurse: "violet",
    "Inventory Officer": "amber",
    "Department Head": "violet",
    "System Auditor": "slate",
  };
  const t = tone ?? map[status] ?? "slate";
  return <span className={`badge-${t}`}>{status}</span>;
}

// ----------------------------------------------------------------------------
// Empty state
// ----------------------------------------------------------------------------

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center animate-fade-in">
      <div className="rounded-2xl bg-slate-100 p-4 text-slate-400 mb-3">
        {icon ?? <Inbox size={28} />}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Error state
// ----------------------------------------------------------------------------

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center animate-fade-in">
      <div className="rounded-2xl bg-rose-50 p-4 text-rose-500 mb-3">
        <AlertCircle size={28} />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">Something went wrong</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button className="btn-secondary btn-sm mt-4" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Loading state
// ----------------------------------------------------------------------------

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <Loader2 size={28} className="text-teal-600 animate-spin" />
      <p className="text-sm text-slate-500 mt-3">{label}</p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// KPI / Stat card
// ----------------------------------------------------------------------------

export function KpiCard({
  label,
  value,
  icon,
  tone = "teal",
  trend,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: BadgeTone;
  trend?: string;
  hint?: string;
}) {
  const toneBg: Record<BadgeTone, string> = {
    teal: "bg-teal-50 text-teal-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="card p-5 hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{label}</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1.5 tabular-nums">{value}</p>
          {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
          {trend && (
            <p className="text-xs font-medium text-teal-600 mt-1.5 inline-flex items-center gap-1">
              {trend}
            </p>
          )}
        </div>
        <div className={`shrink-0 rounded-xl p-2.5 ${toneBg[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Page header
// ----------------------------------------------------------------------------

export function PageHeader({
  title,
  subtitle,
  actions,
  icon,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 animate-fade-in">
      <div className="flex items-start gap-3">
        {icon && <div className="rounded-xl bg-teal-50 text-teal-600 p-2.5 mt-0.5">{icon}</div>}
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Search input
// ----------------------------------------------------------------------------

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9"
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Pagination
// ----------------------------------------------------------------------------

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
      <span>
        Showing <span className="font-medium text-slate-700">{from}</span>–
        <span className="font-medium text-slate-700">{to}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <button
          className="btn-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Prev
        </button>
        <span className="text-xs text-slate-500 px-2">
          Page {page} / {Math.max(1, pageCount)}
        </span>
        <button
          className="btn-secondary btn-sm"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Tabs
// ----------------------------------------------------------------------------

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number; icon?: ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            active === t.id ? "text-teal-700" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {t.icon}
          {t.label}
          {typeof t.count === "number" && (
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${active === t.id ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-600"}`}>
              {t.count}
            </span>
          )}
          {active === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-teal-600 rounded-full" />}
        </button>
      ))}
    </div>
  );
}
