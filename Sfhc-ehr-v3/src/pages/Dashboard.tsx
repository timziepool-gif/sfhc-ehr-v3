import { useMemo } from "react";
import {
  Users,
  CalendarDays,
  FlaskConical,
  Pill,
  HeartPulse,
  TrendingUp,
  Clock,
  AlertTriangle,
  Package,
  Activity,
  ArrowRight,
  DollarSign,
  ShieldCheck,
  CreditCard,
  ClipboardList,
  CalendarClock,
  Wrench,
  Send,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { computeAlerts } from "@/lib/store";
import { KpiCard, PageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { BarChart, DonutChart } from "@/components/Charts";
import { formatDate, isToday, patientFullName, relativeTime, currency } from "@/lib/format";
import type { Route } from "@/components/Sidebar";

export default function Dashboard({ onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const {
    patients,
    appointments,
    labOrders,
    prescriptions,
    dispenses,
    inventory,
    activity,
    soapNotes,
    invoices,
    payments,
    claims,
    generalInventory,
    procurementPOs,
    assets,
    staff,
    leaveRequests,
    referrals,
  } = useApp();

  const todaysAppts = appointments.filter((a) => isToday(a.date));
  const pendingRx = prescriptions.filter((p) => p.status === "Pending");
  const lowStock = inventory.filter((i) => i.quantity <= i.reorderLevel);
  const alerts = computeAlerts(inventory).filter((a) => !a.acknowledged);
  const todaysDispenses = dispenses.filter((d) => isToday(d.date));
  const revenueToday = payments.filter((p) => isToday(p.date)).reduce((s, p) => s + p.amountPaid, 0);
  const outstandingBalance = invoices.filter((i) => i.balance > 0).reduce((s, i) => s + i.balance, 0);
  const pendingClaims = claims.filter((c) => c.status === "Submitted" || c.status === "Under Review").length;
  const recentPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const activeReferrals = referrals.filter((r) => r.status === "Sent" || r.status === "Accepted" || r.status === "Appointment Scheduled").length;
  const pendingReferralResponses = referrals.filter((r) => r.status === "Sent").length;
  const completedReferrals = referrals.filter((r) => r.status === "Completed" || r.status === "Closed").length;

  const rxStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    prescriptions.forEach((p) => { counts[p.status] = (counts[p.status] ?? 0) + 1; });
    return [
      { label: "Pending", value: counts["Pending"] ?? 0, color: "#f59e0b" },
      { label: "Reviewed", value: counts["Reviewed"] ?? 0, color: "#3b82f6" },
      { label: "Dispensed", value: counts["Dispensed"] ?? 0, color: "#10b981" },
      { label: "Cancelled", value: counts["Cancelled"] ?? 0, color: "#64748b" },
    ];
  }, [prescriptions]);

  const weeklyDispense = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const count = dispenses.filter((dp) => dp.date === iso).length;
      days.push({ label: d.toLocaleDateString("en-GB", { weekday: "short" }), value: count });
    }
    return days;
  }, [dispenses]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinic Overview"
        subtitle="Real-time snapshot across all clinical and pharmacy services of Sahel Family Health Clinic."
        icon={<HeartPulse size={20} />}
        actions={
          <button className="btn-primary btn-sm" onClick={() => onNavigate("pharmacy-dashboard")}>
            <Pill size={14} /> Open Pharmacy
          </button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Patients" value={patients.length} icon={<Users size={20} />} tone="blue" hint="Active records" />
        <KpiCard label="Today's Appts" value={todaysAppts.length} icon={<CalendarDays size={20} />} tone="violet" hint={`${appointments.length} total`} />
        <KpiCard label="Pending Rx" value={pendingRx.length} icon={<Pill size={20} />} tone="amber" hint="Awaiting review" />
        <KpiCard label="Lab Orders" value={labOrders.filter((l) => l.status !== "Completed" && l.status !== "Cancelled").length} icon={<FlaskConical size={20} />} tone="teal" hint={`${labOrders.length} total`} />
        <KpiCard label="Low Stock" value={lowStock.length} icon={<Package size={20} />} tone="rose" hint="Needs reorder" />
        <KpiCard label="Dispensed Today" value={todaysDispenses.length} icon={<Activity size={20} />} tone="green" hint={`${dispenses.length} total`} />
      </div>

      {/* Billing KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Revenue Today" value={currency(revenueToday)} icon={<DollarSign size={20} />} tone="teal" hint="Collected today" />
        <KpiCard label="Outstanding Balance" value={currency(outstandingBalance)} icon={<Clock size={20} />} tone="amber" hint="Unpaid invoices" />
        <KpiCard label="Pending Claims" value={pendingClaims} icon={<ShieldCheck size={20} />} tone="rose" hint="Awaiting insurer" />
      </div>

      {/* M12: Referral KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Active Referrals" value={activeReferrals} icon={<Send size={20} />} tone="blue" hint="In progress" />
        <KpiCard label="Pending Responses" value={pendingReferralResponses} icon={<Clock size={20} />} tone="amber" hint="Awaiting acceptance" />
        <KpiCard label="Completed Referrals" value={completedReferrals} icon={<ClipboardList size={20} />} tone="green" hint="Completed or closed" />
      </div>

      {/* Charts + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="card-header">
            <p className="card-title">Dispensing Activity (7 days)</p>
            <span className="text-xs text-slate-400">Daily dispenses</span>
          </div>
          <div className="card-body">
            <BarChart data={weeklyDispense} color="#0d9488" />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <p className="card-title">Prescription Status</p>
            <span className="text-xs text-slate-400">{prescriptions.length} total</span>
          </div>
          <div className="card-body flex justify-center">
            <DonutChart data={rxStatusData} />
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's appointments */}
        <div className="card">
          <div className="card-header">
            <p className="card-title">Today's Appointments</p>
            <button className="text-xs text-teal-600 hover:underline inline-flex items-center gap-1" onClick={() => onNavigate("appointments")}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          {todaysAppts.length === 0 ? (
            <EmptyState title="No appointments today" description="Scheduled appointments will appear here." />
          ) : (
            <div className="divide-y divide-slate-50">
              {todaysAppts.slice(0, 5).map((a) => {
                const p = patients.find((pt) => pt.id === a.patientId);
                return (
                  <div key={a.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/60">
                    <div className="text-xs font-mono text-slate-500 w-12 shrink-0">{a.time}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{p ? patientFullName(p) : "Unknown"}</p>
                      <p className="text-xs text-slate-500 truncate">{a.type} · {a.reason}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending prescriptions */}
        <div className="card">
          <div className="card-header">
            <p className="card-title">Pending Prescriptions</p>
            <button className="text-xs text-teal-600 hover:underline inline-flex items-center gap-1" onClick={() => onNavigate("prescriptions")}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          {pendingRx.length === 0 ? (
            <EmptyState title="No pending prescriptions" description="All prescriptions are reviewed." />
          ) : (
            <div className="divide-y divide-slate-50">
              {pendingRx.slice(0, 5).map((rx) => {
                const p = patients.find((pt) => pt.id === rx.patientId);
                return (
                  <div key={rx.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/60">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Pill size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{p ? patientFullName(p) : "Unknown"}</p>
                      <p className="text-xs text-slate-500 truncate">{rx.diagnosis} · {rx.lines.length} item(s)</p>
                    </div>
                    <StatusBadge status={rx.status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stock alerts */}
        <div className="card">
          <div className="card-header">
            <p className="card-title">Stock Alerts</p>
            <button className="text-xs text-teal-600 hover:underline inline-flex items-center gap-1" onClick={() => onNavigate("stock-alerts")}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          {alerts.length === 0 ? (
            <EmptyState title="No active alerts" description="Inventory levels are healthy." />
          ) : (
            <div className="divide-y divide-slate-50">
              {alerts.slice(0, 5).map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/60">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.severity === "danger" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                    <AlertTriangle size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{a.drugName}</p>
                    <p className="text-xs text-slate-500 truncate">{a.message}</p>
                  </div>
                  <span className={`badge-${a.severity === "danger" ? "rose" : "amber"}`}>{a.kind}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity + clinical summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent payments */}
        <div className="card">
          <div className="card-header">
            <p className="card-title">Recent Payments</p>
            <CreditCard size={16} className="text-teal-600" />
          </div>
          {recentPayments.length === 0 ? (
            <EmptyState title="No payments yet" />
          ) : (
            <div className="divide-y divide-slate-50">
              {recentPayments.map((p) => {
                const patient = patients.find((pt) => pt.id === p.patientId);
                return (
                  <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <DollarSign size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{patient ? patientFullName(patient) : "Unknown"}</p>
                      <p className="text-xs text-slate-500 truncate">{p.receiptNumber} · {p.method}</p>
                    </div>
                    <span className="text-sm font-semibold text-teal-600 tabular-nums">{currency(p.amountPaid)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card lg:col-span-2">
          <div className="card-header">
            <p className="card-title">Recent Activity</p>
            <span className="text-xs text-slate-400">System-wide</span>
          </div>
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <div className="divide-y divide-slate-50">
              {activity.slice(0, 8).map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <Activity size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{a.title}</p>
                    <p className="text-xs text-slate-500 truncate">{a.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">{relativeTime(a.at)}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[120px]">{a.actorName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <p className="card-title">Clinical Summary</p>
            <TrendingUp size={16} className="text-teal-600" />
          </div>
          <div className="card-body space-y-3">
            <Row label="SOAP Notes" value={soapNotes.length} />
            <Row label="Lab Orders" value={labOrders.length} />
            <Row label="Lab Pending" value={labOrders.filter((l) => l.status !== "Completed" && l.status !== "Cancelled").length} />
            <Row label="Active Patients" value={patients.length} />
            <Row label="Allergies Recorded" value={patients.reduce((s, p) => s + p.allergies.length, 0)} />
            <div className="pt-3 border-t border-slate-100">
              <button className="btn-secondary btn-sm w-full" onClick={() => onNavigate("clinical")}>
                <Clock size={14} /> View Clinical Docs
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* M8/M9: Inventory & Staff widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* M8: Inventory & Procurement */}
        <div className="card">
          <div className="card-header">
            <p className="card-title">Inventory & Procurement</p>
            <Package size={16} className="text-teal-600" />
          </div>
          <div className="card-body space-y-3">
            <Row label="Low Stock Items" value={generalInventory.filter((i) => i.quantity > 0 && i.quantity < i.minimumStock).length} />
            <Row label="Out of Stock" value={generalInventory.filter((i) => i.quantity <= 0).length} />
            <Row label="Expiring (30 days)" value={generalInventory.filter((i) => { if (!i.expiryDate) return false; const d = Math.round((new Date(i.expiryDate).getTime() - Date.now()) / 86400000); return d >= 0 && d <= 30; }).length} />
            <Row label="Pending POs" value={procurementPOs.filter((p) => p.status === "Submitted" || p.status === "Approved" || p.status === "Ordered").length} />
            <Row label="Assets Under Maintenance" value={assets.filter((a) => a.serviceStatus === "Under Maintenance").length} />
            <div className="pt-3 border-t border-slate-100">
              <button className="btn-secondary btn-sm w-full" onClick={() => onNavigate("inv-dashboard")}>
                <Package size={14} /> View Inventory
              </button>
            </div>
          </div>
        </div>

        {/* M9: Staff & Administration */}
        <div className="card">
          <div className="card-header">
            <p className="card-title">Staff & Administration</p>
            <Users size={16} className="text-teal-600" />
          </div>
          <div className="card-body space-y-3">
            <Row label="Total Staff" value={staff.length} />
            <Row label="Active Staff" value={staff.filter((s) => s.status === "Active").length} />
            <Row label="On Leave" value={staff.filter((s) => s.status === "On Leave").length} />
            <Row label="Pending Leave Requests" value={leaveRequests.filter((l) => l.status === "Pending").length} />
            <Row label="Asset Maintenance Due" value={assets.filter((a) => { if (!a.nextMaintenanceDate) return false; const d = Math.round((new Date(a.nextMaintenanceDate).getTime() - Date.now()) / 86400000); return d <= 7; }).length} />
            <div className="pt-3 border-t border-slate-100">
              <button className="btn-secondary btn-sm w-full" onClick={() => onNavigate("admin-staff")}>
                <Users size={14} /> View Staff
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}
