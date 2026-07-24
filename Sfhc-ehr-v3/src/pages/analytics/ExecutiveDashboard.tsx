import { useMemo } from "react";
import { TrendingUp, Users, CalendarDays, DollarSign, AlertTriangle, FlaskConical, Pill, Package, Clock, BarChart3, HeartPulse, Star, Activity, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { KpiCard, PageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { BarChart, DonutChart } from "@/components/Charts";
import { currency, formatDate } from "@/lib/format";
import type { Route } from "@/components/Sidebar";

export default function ExecutiveDashboard({ onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const { patients, appointments, payments, invoices, labOrders, dispenses, generalInventory, staff, attendance, leaveRequests, departments, soapNotes, claims, procurementPOs, assets } = useApp();

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);
    const dailyVisits = appointments.filter((a) => a.date === today).length;
    const monthlyVisits = appointments.filter((a) => a.date.slice(0, 7) === thisMonth).length;
    const revenue = payments.reduce((s, p) => s + p.amountPaid, 0);
    const outstandingBills = invoices.filter((i) => i.paymentStatus !== "Paid").reduce((s, i) => s + i.balance, 0);
    const inventoryValue = generalInventory.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    const lowStock = generalInventory.filter((i) => i.quantity < i.minimumStock).length;
    const presentToday = attendance.filter((a) => a.date === today && (a.status === "Present" || a.status === "Late")).length;
    const pendingLeave = leaveRequests.filter((l) => l.status === "Pending").length;
    const labCompleted = labOrders.filter((l) => l.status === "Completed").length;
    const labPending = labOrders.filter((l) => l.status === "Ordered" || l.status === "Sample-Collected" || l.status === "In-Progress").length;
    const approvedClaims = claims.filter((c: { status: string }) => c.status === "Approved").length;
    const pendingClaims = claims.filter((c: { status: string }) => c.status === "Submitted" || c.status === "Under Review").length;
    const assetsInService = assets.filter((a) => a.serviceStatus === "In Service").length;
    return { dailyVisits, monthlyVisits, revenue, outstandingBills, inventoryValue, lowStock, presentToday, pendingLeave, labCompleted, labPending, approvedClaims, pendingClaims, assetsInService };
  }, [patients, appointments, payments, invoices, labOrders, generalInventory, attendance, leaveRequests, claims, assets]);

  const revenueByDept = useMemo(() => {
    const deptMap = new Map<string, number>();
    for (const p of payments) { const inv = invoices.find((i) => i.id === p.invoiceId); const patient = inv ? patients.find((pt) => pt.id === inv.patientId) : null; const dept = "Medical"; deptMap.set(dept, (deptMap.get(dept) ?? 0) + p.amountPaid); }
    return Array.from(deptMap.entries()).map(([label, value]) => ({ label, value }));
  }, [payments, invoices, patients]);

  const apptTrend = useMemo(() => {
    const monthMap = new Map<string, number>();
    for (const a of appointments) { const m = a.date.slice(0, 7); monthMap.set(m, (monthMap.get(m) ?? 0) + 1); }
    return Array.from(monthMap.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label)).slice(-6);
  }, [appointments]);

  const topDx = useMemo(() => {
    const dxMap = new Map<string, number>();
    for (const s of soapNotes) { if (s.assessment) dxMap.set(s.assessment, (dxMap.get(s.assessment) ?? 0) + 1); }
    return Array.from(dxMap.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [soapNotes]);

  const topLabTests = useMemo(() => {
    const testMap = new Map<string, number>();
    for (const l of labOrders) for (const t of l.tests) testMap.set(t.testName, (testMap.get(t.testName) ?? 0) + 1);
    return Array.from(testMap.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [labOrders]);

  const topMeds = useMemo(() => {
    const medMap = new Map<string, number>();
    for (const d of dispenses) medMap.set(d.medicationName, (medMap.get(d.medicationName) ?? 0) + 1);
    return Array.from(medMap.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [dispenses]);

  const deptWorkload = useMemo(() => {
    return departments.map((d) => { const count = staff.filter((s) => s.department === d.name).length; return { label: d.name, value: count }; }).filter((d) => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [departments, staff]);

  const collectionData = useMemo(() => {
    const cash = payments.filter((p) => p.method === "Cash").reduce((s, p) => s + p.amountPaid, 0);
    const insurance = payments.filter((p) => p.method === "Insurance").reduce((s, p) => s + p.amountPaid, 0);
    const card = payments.filter((p) => p.method === "Card").reduce((s, p) => s + p.amountPaid, 0);
    return [{ label: "Cash", value: cash, color: "#10b981" }, { label: "Insurance", value: insurance, color: "#6366f1" }, { label: "Card", value: card, color: "#f59e0b" }];
  }, [payments]);

  return (
    <div className="space-y-5">
      <PageHeader title="Executive Dashboard" subtitle="CEO/Administrator analytics and KPIs" icon={<TrendingUp size={20} />} />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <KpiCard label="Total Patients" value={patients.length} icon={<Users size={18} />} tone="teal" />
        <KpiCard label="Daily Visits" value={stats.dailyVisits} icon={<CalendarDays size={18} />} tone="blue" />
        <KpiCard label="Monthly Visits" value={stats.monthlyVisits} icon={<CalendarDays size={18} />} tone="violet" />
        <KpiCard label="Revenue" value={currency(stats.revenue)} icon={<DollarSign size={18} />} tone="green" />
        <KpiCard label="Outstanding Bills" value={currency(stats.outstandingBills)} icon={<AlertTriangle size={18} />} tone="rose" />
        <KpiCard label="Lab Turnaround" value={`${stats.labCompleted}/${stats.labCompleted + stats.labPending}`} icon={<FlaskConical size={18} />} tone="amber" hint="Completed / Total" />
        <KpiCard label="Pharmacy Activity" value={dispenses.length} icon={<Pill size={18} />} tone="teal" hint="Dispensed items" />
        <KpiCard label="Inventory Value" value={currency(stats.inventoryValue)} icon={<Package size={18} />} tone="blue" />
        <KpiCard label="Low Stock Alerts" value={stats.lowStock} icon={<AlertTriangle size={18} />} tone="amber" />
        <KpiCard label="Staff Present Today" value={stats.presentToday} icon={<Clock size={18} />} tone="green" />
        <KpiCard label="Pending Leave" value={stats.pendingLeave} icon={<CalendarDays size={18} />} tone="amber" />
        <KpiCard label="Approved Claims" value={stats.approvedClaims} icon={<BarChart3 size={18} />} tone="teal" />
        <KpiCard label="Pending Claims" value={stats.pendingClaims} icon={<BarChart3 size={18} />} tone="rose" />
        <KpiCard label="Assets In Service" value={stats.assetsInService} icon={<Package size={18} />} tone="blue" />
        <KpiCard label="Patient Satisfaction" value="4.6/5" icon={<Star size={18} />} tone="amber" hint="Placeholder" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header"><p className="card-title">Appointment Trends (6 months)</p><Activity size={16} className="text-teal-600" /></div>
          <div className="card-body"><BarChart data={apptTrend} height={240} color="#0d9488" /></div>
        </div>
        <div className="card">
          <div className="card-header"><p className="card-title">Collections Breakdown</p><DollarSign size={16} className="text-green-600" /></div>
          <div className="card-body flex justify-center"><DonutChart data={collectionData} /></div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header"><p className="card-title">Top Diagnoses</p><HeartPulse size={16} className="text-rose-600" /></div>
          <div className="card-body"><BarChart data={topDx} height={220} color="#f43f5e" /></div>
        </div>
        <div className="card">
          <div className="card-header"><p className="card-title">Department Workload</p><Users size={16} className="text-violet-600" /></div>
          <div className="card-body"><BarChart data={deptWorkload} height={220} color="#6366f1" /></div>
        </div>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header"><p className="card-title">Most Requested Lab Tests</p><FlaskConical size={16} className="text-blue-600" /></div>
          <div className="card-body"><BarChart data={topLabTests} height={220} color="#3b82f6" /></div>
        </div>
        <div className="card">
          <div className="card-header"><p className="card-title">Most Dispensed Drugs</p><Pill size={16} className="text-teal-600" /></div>
          <div className="card-body"><BarChart data={topMeds} height={220} color="#14b8a6" /></div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button className="card p-4 text-left hover:shadow-md transition-shadow" onClick={() => onNavigate("reports")}>
          <FileBarChartIcon /><p className="text-sm font-medium text-slate-900 mt-2">View Reports</p><p className="text-xs text-slate-500">12 report types</p>
        </button>
        <button className="card p-4 text-left hover:shadow-md transition-shadow" onClick={() => onNavigate("inv-dashboard")}>
          <PackageIcon /><p className="text-sm font-medium text-slate-900 mt-2">Inventory</p><p className="text-xs text-slate-500">{stats.lowStock} low stock alerts</p>
        </button>
        <button className="card p-4 text-left hover:shadow-md transition-shadow" onClick={() => onNavigate("admin-staff")}>
          <UsersIcon /><p className="text-sm font-medium text-slate-900 mt-2">Staff</p><p className="text-xs text-slate-500">{staff.length} total staff</p>
        </button>
        <button className="card p-4 text-left hover:shadow-md transition-shadow" onClick={() => onNavigate("billing-dashboard")}>
          <DollarIcon /><p className="text-sm font-medium text-slate-900 mt-2">Billing</p><p className="text-xs text-slate-500">{currency(stats.outstandingBills)} outstanding</p>
        </button>
      </div>
    </div>
  );
}

function FileBarChartIcon() { return <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><BarChart3 size={16} /></div>; }
function PackageIcon() { return <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Package size={16} /></div>; }
function UsersIcon() { return <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><Users size={16} /></div>; }
function DollarIcon() { return <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><DollarSign size={16} /></div>; }
