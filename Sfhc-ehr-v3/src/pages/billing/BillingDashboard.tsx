import { useMemo } from "react";
import {
  DollarSign, FileText, Clock, CheckCircle2, ShieldAlert, TrendingUp,
  Wallet, CreditCard, BarChart3, Activity,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, KpiCard, EmptyState } from "@/components/ui";
import { BarChart, LineChart, DonutChart } from "@/components/Charts";
import { currency, formatDate, isToday, patientFullName } from "@/lib/format";
import type { Route } from "@/components/Sidebar";

const CHART_COLORS = ["#0d9488", "#2563eb", "#d97706", "#db2777", "#0891b2", "#7c3aed", "#ea580c", "#16a34a"];

export default function BillingDashboard({ onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const { invoices, payments, claims, users, patients } = useApp();

  const stats = useMemo(() => {
    const revenueToday = payments.filter((p) => isToday(p.date)).reduce((s, p) => s + p.amountPaid, 0);
    const revenueThisMonth = payments
      .filter((p) => { const d = new Date(p.date); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); })
      .reduce((s, p) => s + p.amountPaid, 0);
    const outstanding = invoices.filter((i) => i.balance > 0).reduce((s, i) => s + i.balance, 0);
    const paidCount = invoices.filter((i) => i.paymentStatus === "Paid").length;
    const pendingClaims = claims.filter((c) => c.status === "Submitted" || c.status === "Under Review").length;
    const avgDailyRevenue = payments.length > 0 ? revenueThisMonth / Math.max(1, new Date().getDate()) : 0;
    const totalTransactions = payments.length;
    const collectionRate = invoices.length > 0
      ? (invoices.reduce((s, i) => s + i.amountPaid, 0) / Math.max(1, invoices.reduce((s, i) => s + i.grandTotal, 0))) * 100
      : 0;
    return { revenueToday, revenueThisMonth, outstanding, paidCount, pendingClaims, avgDailyRevenue, totalTransactions, collectionRate };
  }, [invoices, payments, claims]);

  const revenueTrend = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      const value = payments
        .filter((p) => { const pd = new Date(p.date); return pd.toDateString() === d.toDateString(); })
        .reduce((s, p) => s + p.amountPaid, 0);
      days.push({ label, value });
    }
    return days;
  }, [payments]);

  const paymentsByDept = useMemo(() => {
    const map = new Map<string, number>();
    for (const pay of payments) {
      const inv = invoices.find((i) => i.id === pay.invoiceId);
      const dept = inv?.department ?? "Other";
      map.set(dept, (map.get(dept) ?? 0) + pay.amountPaid);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [payments, invoices]);

  const insuranceVsCash = useMemo(() => {
    let insurance = 0;
    let cash = 0;
    for (const pay of payments) {
      if (pay.method === "Insurance") insurance += pay.amountPaid;
      else cash += pay.amountPaid;
    }
    return [
      { label: "Cash / Card", value: cash, color: "#0d9488" },
      { label: "Insurance", value: insurance, color: "#2563eb" },
    ];
  }, [payments]);

  const monthlyIncome = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString("en-GB", { month: "short" });
      const value = payments
        .filter((p) => { const pd = new Date(p.date); return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear(); })
        .reduce((s, p) => s + p.amountPaid, 0);
      months.push({ label, value });
    }
    return months;
  }, [payments]);

  const topServices = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of invoices) {
      map.set(inv.department, (map.get(inv.department) ?? 0) + inv.grandTotal);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [invoices]);

  const recentPayments = useMemo(() => [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5), [payments]);

  return (
    <div className="space-y-5">
      <PageHeader title="Billing Dashboard" subtitle="Revenue cycle management overview" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={<DollarSign size={18} />} label="Revenue Today" value={currency(stats.revenueToday)} tone="teal" />
        <KpiCard icon={<TrendingUp size={18} />} label="Revenue This Month" value={currency(stats.revenueThisMonth)} tone="blue" />
        <KpiCard icon={<Clock size={18} />} label="Outstanding Invoices" value={currency(stats.outstanding)} tone="amber" />
        <KpiCard icon={<CheckCircle2 size={18} />} label="Paid Invoices" value={String(stats.paidCount)} tone="teal" />
        <KpiCard icon={<ShieldAlert size={18} />} label="Pending Claims" value={String(stats.pendingClaims)} tone="rose" />
        <KpiCard icon={<BarChart3 size={18} />} label="Avg Daily Revenue" value={currency(stats.avgDailyRevenue)} tone="blue" />
        <KpiCard icon={<Wallet size={18} />} label="Outstanding Balance" value={currency(stats.outstanding)} tone="amber" />
        <KpiCard icon={<CreditCard size={18} />} label="Pending Payments" value={String(invoices.filter((i) => i.paymentStatus === "Unpaid" || i.paymentStatus === "Partially-Paid").length)} tone="rose" />
        <KpiCard icon={<Activity size={18} />} label="Collection Rate" value={`${stats.collectionRate.toFixed(1)}%`} tone="teal" />
        <KpiCard icon={<FileText size={18} />} label="Total Transactions" value={String(stats.totalTransactions)} tone="blue" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header"><p className="card-title">Revenue Trend (14 days)</p></div>
          <div className="card-body"><LineChart data={revenueTrend} height={220} formatValue={(v) => `$${v.toFixed(0)}`} /></div>
        </div>

        <div className="card">
          <div className="card-header"><p className="card-title">Payments by Department</p></div>
          <div className="card-body"><BarChart data={paymentsByDept} height={220} color="#2563eb" formatValue={(v) => `$${v.toFixed(0)}`} /></div>
        </div>

        <div className="card">
          <div className="card-header"><p className="card-title">Insurance vs Cash Payments</p></div>
          <div className="card-body flex items-center justify-center py-4">
            {insuranceVsCash.every((d) => d.value === 0) ? (
              <EmptyState title="No payment data" />
            ) : (
              <DonutChart data={insuranceVsCash} size={180} />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><p className="card-title">Monthly Income (6 months)</p></div>
          <div className="card-body"><BarChart data={monthlyIncome} height={220} color="#0d9488" formatValue={(v) => `$${v.toFixed(0)}`} /></div>
        </div>
      </div>

      {/* Top revenue services + Recent payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header"><p className="card-title">Top Revenue Services</p></div>
          <div className="card-body space-y-3">
            {topServices.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{s.label}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(s.value / Math.max(...topServices.map((t) => t.value))) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">{currency(s.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><p className="card-title">Recent Payments</p></div>
          <div className="card-body">
            {recentPayments.length === 0 ? (
              <EmptyState title="No payments yet" />
            ) : (
              <div className="space-y-3">
                {recentPayments.map((p) => {
                  const patient = patients.find((pt) => pt.id === p.patientId);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                      <div>
                        <p className="font-medium text-slate-900">{patient ? patientFullName(patient) : "—"}</p>
                        <p className="text-xs text-slate-500">{p.receiptNumber} · {p.method} · {formatDate(p.date)}</p>
                      </div>
                      <span className="font-semibold text-teal-600 tabular-nums">{currency(p.amountPaid)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="card-header"><p className="card-title">Quick Actions</p></div>
        <div className="card-body grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="btn-primary btn-sm" onClick={() => onNavigate("invoices")}><FileText size={14} /> Invoices</button>
          <button className="btn-secondary btn-sm" onClick={() => onNavigate("payments")}><CreditCard size={14} /> Payments</button>
          <button className="btn-secondary btn-sm" onClick={() => onNavigate("claims")}><ShieldAlert size={14} /> Claims</button>
          <button className="btn-secondary btn-sm" onClick={() => onNavigate("revenue-reports")}><BarChart3 size={14} /> Reports</button>
        </div>
      </div>
    </div>
  );
}
