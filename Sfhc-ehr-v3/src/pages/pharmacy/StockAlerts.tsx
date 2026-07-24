import { useMemo, useState } from "react";
import { Bell, AlertTriangle, Package, CheckCircle2 } from "lucide-react";
import { useApp, computeAlerts } from "@/lib/store";
import { PageHeader, EmptyState, Pagination, KpiCard } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { StockAlertKind } from "@/lib/types";

const PAGE_SIZE = 10;
const KIND_LABELS: Record<StockAlertKind, string> = {
  "Low-Stock": "Low Stock",
  "Out-of-Stock": "Out of Stock",
  "Expiring-Soon": "Expiring Soon",
  "Expired": "Expired",
};

export default function StockAlerts() {
  const { inventory, acknowledgeAlert } = useApp();
  const [filter, setFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const alerts = useMemo(() => computeAlerts(inventory).sort((a, b) => {
    const order = { danger: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  }), [inventory]);

  const filtered = filter ? alerts.filter((a) => a.kind === filter) : alerts;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    low: alerts.filter((a) => a.kind === "Low-Stock").length,
    out: alerts.filter((a) => a.kind === "Out-of-Stock").length,
    expiring: alerts.filter((a) => a.kind === "Expiring-Soon").length,
    expired: alerts.filter((a) => a.kind === "Expired").length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Alerts"
        subtitle="Automatically flagged inventory issues: low stock, out of stock, expiring soon, and expired."
        icon={<Bell size={20} />}
        actions={
          <select className="select w-44" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
            <option value="">All alerts</option>
            <option value="Low-Stock">Low Stock</option>
            <option value="Out-of-Stock">Out of Stock</option>
            <option value="Expiring-Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Low Stock" value={counts.low} icon={<AlertTriangle size={20} />} tone="amber" />
        <KpiCard label="Out of Stock" value={counts.out} icon={<Package size={20} />} tone="rose" />
        <KpiCard label="Expiring Soon" value={counts.expiring} icon={<AlertTriangle size={20} />} tone="amber" />
        <KpiCard label="Expired" value={counts.expired} icon={<AlertTriangle size={20} />} tone="rose" />
      </div>

      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={28} />} title="No alerts" description="Inventory levels are healthy." />
        ) : (
          <div className="divide-y divide-slate-100">
            {pageItems.map((a) => (
              <div key={a.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/60">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.severity === "danger" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                  <AlertTriangle size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900">{a.drugName}</p>
                    <span className={`badge-${a.severity === "danger" ? "rose" : "amber"}`}>{KIND_LABELS[a.kind]}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{a.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Generated {formatDate(a.createdAt)}</p>
                </div>
                {!a.acknowledged ? (
                  <button className="btn-secondary btn-sm" onClick={() => acknowledgeAlert(a.id)}><CheckCircle2 size={14} /> Acknowledge</button>
                ) : (
                  <span className="badge-green"><CheckCircle2 size={11} /> Acknowledged</span>
                )}
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>
    </div>
  );
}
