import { useMemo } from "react";
import {
  Pill, FileText, Package, AlertTriangle, ShieldAlert, Activity, ArrowRight,
  TrendingUp, Search, Plus, CheckCircle2,
} from "lucide-react";
import { useApp, computeAlerts } from "@/lib/store";
import { KpiCard, PageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { BarChart, DonutChart, ProgressBar } from "@/components/Charts";
import { isToday, patientFullName, relativeTime, currency, formatDate, daysUntil } from "@/lib/format";
import { MED_CATALOG } from "@/lib/medications";
import type { Route } from "@/components/Sidebar";

export default function PharmacyDashboard({ onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const { prescriptions, dispenses, inventory, controlled, purchaseOrders, activity, patients } = useApp();

  const todaysRx = prescriptions.filter((p) => p.date === new Date().toISOString().slice(0, 10));
  const pendingRx = prescriptions.filter((p) => p.status === "Pending");
  const todaysDispenses = dispenses.filter((d) => isToday(d.date));
  const lowStock = inventory.filter((i) => i.quantity <= i.reorderLevel);
  const expired = inventory.filter((i) => daysUntil(i.expiryDate) < 0);
  const controlledAlerts = controlled.filter((c) => c.runningBalance <= 10);
  const alerts = computeAlerts(inventory).filter((a) => !a.acknowledged);

  const rxTrend = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({ label: d.toLocaleDateString("en-GB", { weekday: "short" }), value: prescriptions.filter((p) => p.date === iso).length });
    }
    return days;
  }, [prescriptions]);

  const categoryDonut = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach((i) => { counts[i.category] = (counts[i.category] ?? 0) + i.quantity; });
    const palette: Record<string, string> = {
      Antibiotic: "#0d9488", Analgesic: "#3b82f6", Antihypertensive: "#8b5cf6",
      Antidiabetic: "#f59e0b", Antimalarial: "#10b981", Cardiac: "#ef4444",
      Respiratory: "#06b6d4", Gastrointestinal: "#ec4899", Vitamin: "#84cc16",
    };
    return Object.entries(counts).map(([label, value]) => ({ label, value, color: palette[label] ?? "#64748b" })).slice(0, 8);
  }, [inventory]);

  const inventoryValue = inventory.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy Dashboard"
        subtitle="SFHC EHR Pharmacy — prescriptions, dispensing, inventory & controlled drugs."
        icon={<Pill size={20} />}
        actions={
          <>
            <button className="btn-secondary btn-sm" onClick={() => onNavigate("prescriptions")}>
              <Search size={14} /> Find Prescription
            </button>
            <button className="btn-primary btn-sm" onClick={() => onNavigate("prescriptions")}>
              <Plus size={14} /> New Prescription
            </button>
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Rx Today" value={todaysRx.length} icon={<FileText size={20} />} tone="blue" hint={`${prescriptions.length} total`} />
        <KpiCard label="Dispensed" value={todaysDispenses.length} icon={<CheckCircle2 size={20} />} tone="green" hint={`${dispenses.length} all-time`} />
        <KpiCard label="Pending Rx" value={pendingRx.length} icon={<Pill size={20} />} tone="amber" hint="Awaiting review" />
        <KpiCard label="Low Stock" value={lowStock.length} icon={<Package size={20} />} tone="rose" hint={`${inventory.length} items tracked`} />
        <KpiCard label="Expired" value={expired.length} icon={<AlertTriangle size={20} />} tone="rose" hint="Dispose safely" />
        <KpiCard label="Controlled Alerts" value={controlledAlerts.length} icon={<ShieldAlert size={20} />} tone="violet" hint="Low running balance" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="card-header">
            <p className="card-title">Prescriptions — Last 7 Days</p>
            <TrendingUp size={16} className="text-teal-600" />
          </div>
          <div className="card-body">
            <BarChart data={rxTrend} color="#0d9488" />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <p className="card-title">Inventory by Category</p>
            <Package size={16} className="text-slate-400" />
          </div>
          <div className="card-body flex justify-center">
            {categoryDonut.length > 0 ? <DonutChart data={categoryDonut} /> : <p className="text-sm text-slate-500">No inventory</p>}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="card-header"><p className="card-title">Quick Actions</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-5">
          {[
            { label: "New Prescription", icon: <FileText size={18} />, route: "prescriptions" as Route, tone: "bg-teal-50 text-teal-600" },
            { label: "Dispense", icon: <Pill size={18} />, route: "dispensing" as Route, tone: "bg-blue-50 text-blue-600" },
            { label: "Add Stock", icon: <Package size={18} />, route: "inventory" as Route, tone: "bg-amber-50 text-amber-600" },
            { label: "Purchase Order", icon: <FileText size={18} />, route: "purchase-orders" as Route, tone: "bg-violet-50 text-violet-600" },
            { label: "Controlled Register", icon: <ShieldAlert size={18} />, route: "controlled-drugs" as Route, tone: "bg-rose-50 text-rose-600" },
            { label: "Stock Alerts", icon: <AlertTriangle size={18} />, route: "stock-alerts" as Route, tone: "bg-amber-50 text-amber-600" },
          ].map((a) => (
            <button key={a.label} onClick={() => onNavigate(a.route)} className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 hover:border-teal-400 hover:bg-teal-50/40 transition-colors animate-fade-in">
              <div className={`rounded-xl p-2.5 ${a.tone}`}>{a.icon}</div>
              <span className="text-xs font-medium text-slate-700 text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending prescriptions */}
        <div className="card">
          <div className="card-header">
            <p className="card-title">Pending Prescriptions</p>
            <button className="text-xs text-teal-600 hover:underline inline-flex items-center gap-1" onClick={() => onNavigate("prescriptions")}>All <ArrowRight size={12} /></button>
          </div>
          {pendingRx.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={28} />} title="All reviewed" description="No pending prescriptions." />
          ) : (
            <div className="divide-y divide-slate-50">
              {pendingRx.slice(0, 5).map((rx) => {
                const p = patients.find((pt) => pt.id === rx.patientId);
                return (
                  <button key={rx.id} onClick={() => onNavigate("dispensing", { rxId: rx.id })} className="w-full px-5 py-3 flex items-center gap-3 hover:bg-slate-50/60 text-left">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Pill size={16} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{p ? patientFullName(p) : "—"}</p>
                      <p className="text-xs text-slate-500 truncate">{rx.diagnosis} · {rx.lines.length} item(s)</p>
                    </div>
                    <StatusBadge status={rx.status} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="card">
          <div className="card-header">
            <p className="card-title">Low Stock Items</p>
            <button className="text-xs text-teal-600 hover:underline inline-flex items-center gap-1" onClick={() => onNavigate("inventory")}>All <ArrowRight size={12} /></button>
          </div>
          {lowStock.length === 0 ? (
            <EmptyState icon={<Package size={28} />} title="Stock healthy" description="All items above reorder level." />
          ) : (
            <div className="divide-y divide-slate-50">
              {lowStock.slice(0, 5).map((i) => (
                <div key={i.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900 truncate">{i.drugName}</p>
                    <span className={`badge-${i.quantity <= 0 ? "rose" : "amber"}`}>{i.quantity <= 0 ? "Out" : `${i.quantity} left`}</span>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={i.quantity} max={Math.max(i.reorderLevel * 2, 1)} tone={i.quantity <= 0 ? "rose" : "amber"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent dispensing */}
        <div className="card">
          <div className="card-header">
            <p className="card-title">Recent Dispensing</p>
            <button className="text-xs text-teal-600 hover:underline inline-flex items-center gap-1" onClick={() => onNavigate("dispensing")}>All <ArrowRight size={12} /></button>
          </div>
          {dispenses.length === 0 ? (
            <EmptyState icon={<Pill size={28} />} title="No dispensing yet" />
          ) : (
            <div className="divide-y divide-slate-50">
              {dispenses.slice(0, 5).map((d) => {
                const p = patients.find((pt) => pt.id === d.patientId);
                return (
                  <div key={d.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Activity size={16} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{d.medicationName}</p>
                      <p className="text-xs text-slate-500 truncate">{p ? patientFullName(p) : "—"} · Qty {d.quantityDispensed}</p>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(d.date)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Activity + inventory snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="card-header"><p className="card-title">Recent Activity</p></div>
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <div className="divide-y divide-slate-50">
              {activity.slice(0, 6).map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><Activity size={14} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{a.title}</p>
                    <p className="text-xs text-slate-500 truncate">{a.description}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{relativeTime(a.at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-header"><p className="card-title">Inventory Snapshot</p></div>
          <div className="card-body space-y-3 text-sm">
            <Row label="Total items" value={inventory.length} />
            <Row label="Low / out of stock" value={lowStock.length} />
            <Row label="Expired" value={expired.length} />
            <Row label="Active alerts" value={alerts.length} />
            <Row label="Controlled drugs" value={controlled.length} />
            <Row label="Pending POs" value={purchaseOrders.filter((p) => p.status === "Submitted" || p.status === "Approved").length} />
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">Inventory value</p>
              <p className="text-xl font-semibold text-slate-900 tabular-nums">{currency(inventoryValue)}</p>
            </div>
            <div className="pt-2">
              <p className="text-xs text-slate-500">Catalogue medications</p>
              <p className="text-sm font-medium text-slate-700">{MED_CATALOG.length} drugs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}
