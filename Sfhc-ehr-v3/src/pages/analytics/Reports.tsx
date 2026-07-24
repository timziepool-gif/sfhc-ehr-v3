import { useMemo, useState } from "react";
import { FileBarChart, Download, Printer, FileText } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { BarChart, DonutChart } from "@/components/Charts";
import { currency, formatDate } from "@/lib/format";

type ReportType = "patient-stats" | "revenue" | "laboratory" | "pharmacy" | "inventory" | "staff" | "attendance" | "appointments" | "billing" | "insurance" | "disease-trends" | "department-performance";

const REPORTS: { id: ReportType; label: string }[] = [
  { id: "patient-stats", label: "Patient Statistics" },
  { id: "revenue", label: "Revenue Reports" },
  { id: "laboratory", label: "Laboratory Reports" },
  { id: "pharmacy", label: "Pharmacy Reports" },
  { id: "inventory", label: "Inventory Reports" },
  { id: "staff", label: "Staff Reports" },
  { id: "attendance", label: "Attendance Reports" },
  { id: "appointments", label: "Appointment Reports" },
  { id: "billing", label: "Billing Reports" },
  { id: "insurance", label: "Insurance Reports" },
  { id: "disease-trends", label: "Disease Trends" },
  { id: "department-performance", label: "Department Performance" },
];

function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const app = useApp();
  const [activeReport, setActiveReport] = useState<ReportType>("patient-stats");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const reportData = useMemo(() => {
    switch (activeReport) {
      case "patient-stats": {
        const total = app.patients.length;
        const male = app.patients.filter((p) => p.gender === "Male").length;
        const female = app.patients.filter((p) => p.gender === "Female").length;
        const other = total - male - female;
        const genderData = [{ label: "Male", value: male, color: "#0d9488" }, { label: "Female", value: female, color: "#6366f1" }, { label: "Other", value: other, color: "#f59e0b" }];
        const ageBuckets = { "0-18": 0, "19-35": 0, "36-50": 0, "51-65": 0, "65+": 0 };
        for (const p of app.patients) { const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear(); if (age <= 18) ageBuckets["0-18"]++; else if (age <= 35) ageBuckets["19-35"]++; else if (age <= 50) ageBuckets["36-50"]++; else if (age <= 65) ageBuckets["51-65"]++; else ageBuckets["65+"]++; }
        const ageData = Object.entries(ageBuckets).map(([label, value]) => ({ label, value }));
        return { total, genderData, ageData, headers: ["Metric", "Value"], rows: [["Total Patients", total], ["Male", male], ["Female", female], ["Other", other]] };
      }
      case "revenue": {
        const totalRevenue = app.payments.reduce((s, p) => s + p.amountPaid, 0);
        const totalInvoiced = app.invoices.reduce((s, i) => s + i.grandTotal, 0);
        const outstanding = app.invoices.filter((i) => i.paymentStatus !== "Paid").reduce((s, i) => s + i.balance, 0);
        const monthlyData = new Map<string, number>();
        for (const p of app.payments) { const m = p.date.slice(0, 7); monthlyData.set(m, (monthlyData.get(m) ?? 0) + p.amountPaid); }
        const trend = Array.from(monthlyData.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label));
        return { totalRevenue, totalInvoiced, outstanding, trend, headers: ["Metric", "Value"], rows: [["Total Revenue", currency(totalRevenue)], ["Total Invoiced", currency(totalInvoiced)], ["Outstanding", currency(outstanding)]] };
      }
      case "laboratory": {
        const total = app.labOrders.length;
        const completed = app.labOrders.filter((l) => l.status === "Completed").length;
        const pending = app.labOrders.filter((l) => l.status === "Ordered" || l.status === "Sample-Collected" || l.status === "In-Progress").length;
        const testFreq = new Map<string, number>();
        for (const l of app.labOrders) for (const t of l.tests) testFreq.set(t.testName, (testFreq.get(t.testName) ?? 0) + 1);
        const topTests = Array.from(testFreq.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
        return { total, completed, pending, topTests, headers: ["Metric", "Value"], rows: [["Total Lab Orders", total], ["Completed", completed], ["Pending", pending]] };
      }
      case "pharmacy": {
        const totalRx = app.prescriptions.length;
        const dispensed = app.dispenses.length;
        const medFreq = new Map<string, number>();
        for (const d of app.dispenses) medFreq.set(d.medicationName, (medFreq.get(d.medicationName) ?? 0) + 1);
        const topMeds = Array.from(medFreq.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
        return { totalRx, dispensed, topMeds, headers: ["Metric", "Value"], rows: [["Total Prescriptions", totalRx], ["Dispensed", dispensed]] };
      }
      case "inventory": {
        const totalItems = app.generalInventory.length;
        const totalValue = app.generalInventory.reduce((s, i) => s + i.quantity * i.unitCost, 0);
        const lowStock = app.generalInventory.filter((i) => i.quantity < i.minimumStock).length;
        const expired = app.generalInventory.filter((i) => i.expiryDate && new Date(i.expiryDate) < new Date()).length;
        const catData = new Map<string, number>();
        for (const i of app.generalInventory) catData.set(i.category, (catData.get(i.category) ?? 0) + i.quantity * i.unitCost);
        const catChart = Array.from(catData.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
        return { totalItems, totalValue, lowStock, expired, catChart, headers: ["Metric", "Value"], rows: [["Total Items", totalItems], ["Total Value", currency(totalValue)], ["Low Stock", lowStock], ["Expired", expired]] };
      }
      case "staff": {
        const total = app.staff.length;
        const active = app.staff.filter((s) => s.status === "Active").length;
        const onLeave = app.staff.filter((s) => s.status === "On Leave").length;
        const deptData = new Map<string, number>();
        for (const s of app.staff) deptData.set(s.department, (deptData.get(s.department) ?? 0) + 1);
        const deptChart = Array.from(deptData.entries()).map(([label, value]) => ({ label, value }));
        return { total, active, onLeave, deptChart, headers: ["Metric", "Value"], rows: [["Total Staff", total], ["Active", active], ["On Leave", onLeave]] };
      }
      case "attendance": {
        const total = app.attendance.length;
        const present = app.attendance.filter((a) => a.status === "Present").length;
        const late = app.attendance.filter((a) => a.status === "Late").length;
        const absent = app.attendance.filter((a) => a.status === "Absent").length;
        const statusData = [{ label: "Present", value: present, color: "#10b981" }, { label: "Late", value: late, color: "#f59e0b" }, { label: "Absent", value: absent, color: "#f43f5e" }];
        return { total, present, late, absent, statusData, headers: ["Metric", "Value"], rows: [["Total Records", total], ["Present", present], ["Late", late], ["Absent", absent]] };
      }
      case "appointments": {
        const total = app.appointments.length;
        const completed = app.appointments.filter((a) => a.status === "Completed").length;
        const cancelled = app.appointments.filter((a) => a.status === "Cancelled").length;
        const typeFreq = new Map<string, number>();
        for (const a of app.appointments) typeFreq.set(a.type, (typeFreq.get(a.type) ?? 0) + 1);
        const typeChart = Array.from(typeFreq.entries()).map(([label, value]) => ({ label, value }));
        return { total, completed, cancelled, typeChart, headers: ["Metric", "Value"], rows: [["Total Appointments", total], ["Completed", completed], ["Cancelled", cancelled]] };
      }
      case "billing": {
        const totalInvoices = app.invoices.length;
        const paid = app.invoices.filter((i) => i.paymentStatus === "Paid").length;
        const unpaid = app.invoices.filter((i) => i.paymentStatus !== "Paid").length;
        const totalCollected = app.payments.reduce((s, p) => s + p.amountPaid, 0);
        const statusData = [{ label: "Paid", value: paid, color: "#10b981" }, { label: "Unpaid", value: unpaid, color: "#f43f5e" }];
        return { totalInvoices, paid, unpaid, totalCollected, statusData, headers: ["Metric", "Value"], rows: [["Total Invoices", totalInvoices], ["Paid", paid], ["Unpaid", unpaid], ["Total Collected", currency(totalCollected)]] };
      }
      case "insurance": {
        const total = app.claims.length;
        const approved = app.claims.filter((c) => c.status === "Approved").length;
        const pending = app.claims.filter((c) => c.status === "Submitted" || c.status === "Under Review").length;
        const rejected = app.claims.filter((c) => c.status === "Rejected").length;
        const statusData = [{ label: "Approved", value: approved, color: "#10b981" }, { label: "Pending", value: pending, color: "#f59e0b" }, { label: "Rejected", value: rejected, color: "#f43f5e" }];
        return { total, approved, pending, rejected, statusData, headers: ["Metric", "Value"], rows: [["Total Claims", total], ["Approved", approved], ["Pending", pending], ["Rejected", rejected]] };
      }
      case "disease-trends": {
        const dxFreq = new Map<string, number>();
        for (const s of app.soapNotes) { if (s.assessment) dxFreq.set(s.assessment, (dxFreq.get(s.assessment) ?? 0) + 1); }
        const topDx = Array.from(dxFreq.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10);
        return { topDx, headers: ["Diagnosis", "Count"], rows: topDx.map((d) => [d.label, d.value]) };
      }
      case "department-performance": {
        const deptData = app.departments.map((d) => { const staff = app.staff.filter((s) => s.department === d.name).length; const appts = app.appointments.filter((a) => { const p = app.patients.find((p) => p.id === a.patientId); return p && false; }).length; return { label: d.name, value: staff }; });
        return { deptData, headers: ["Department", "Staff Count"], rows: deptData.map((d) => [d.label, d.value]) };
      }
      default: return null;
    }
  }, [activeReport, app]);

  const report = REPORTS.find((r) => r.id === activeReport);

  return (
    <div className="space-y-5">
      <PageHeader title="Reports & Analytics" subtitle="Enterprise-level reporting and analytics" icon={<FileBarChart size={20} />} />

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Report selector */}
        <div className="lg:w-56 shrink-0">
          <div className="card p-2">
            {REPORTS.map((r) => (
              <button key={r.id} onClick={() => setActiveReport(r.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeReport === r.id ? "bg-teal-50 text-teal-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Report content */}
        <div className="flex-1 space-y-4">
          {/* Filters */}
          <div className="card p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div><label className="block text-xs font-medium text-slate-600 mb-1">From Date</label><input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">To Date</label><input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                <select className="input" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                  <option value="">All</option>
                  {app.departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 ml-auto">
                <button className="btn-secondary btn-sm" onClick={() => reportData && exportCSV(`${activeReport}.csv`, reportData.headers, reportData.rows)}><Download size={14} /> CSV</button>
                <button className="btn-secondary btn-sm" onClick={() => window.print()}><Printer size={14} /> Print</button>
                <button className="btn-secondary btn-sm" onClick={() => alert("PDF export is a mock in this demo.")}><FileText size={14} /> PDF</button>
              </div>
            </div>
          </div>

          {/* Report summary */}
          {reportData && (
            <>
              <div className="card">
                <div className="card-header"><p className="card-title">{report?.label}</p></div>
                <div className="card-body">
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead><tr>{reportData.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>{reportData.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j === 0 ? "font-medium text-slate-900" : "text-sm tabular-nums"}>{c}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Charts */}
              {"genderData" in reportData && reportData.genderData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="card"><div className="card-header"><p className="card-title">Gender Distribution</p></div><div className="card-body flex justify-center"><DonutChart data={reportData.genderData} /></div></div>
                  <div className="card"><div className="card-header"><p className="card-title">Age Distribution</p></div><div className="card-body"><BarChart data={reportData.ageData} height={220} color="#6366f1" /></div></div>
                </div>
              )}
              {"trend" in reportData && reportData.trend && (
                <div className="card"><div className="card-header"><p className="card-title">Revenue Trend</p></div><div className="card-body"><BarChart data={reportData.trend} height={220} color="#10b981" formatValue={(v) => `$${v.toFixed(0)}`} /></div></div>
              )}
              {"topTests" in reportData && reportData.topTests && (
                <div className="card"><div className="card-header"><p className="card-title">Most Requested Lab Tests</p></div><div className="card-body"><BarChart data={reportData.topTests} height={220} color="#0d9488" /></div></div>
              )}
              {"topMeds" in reportData && reportData.topMeds && (
                <div className="card"><div className="card-header"><p className="card-title">Most Dispensed Medications</p></div><div className="card-body"><BarChart data={reportData.topMeds} height={220} color="#8b5cf6" /></div></div>
              )}
              {"catChart" in reportData && reportData.catChart && (
                <div className="card"><div className="card-header"><p className="card-title">Inventory Value by Category</p></div><div className="card-body"><BarChart data={reportData.catChart} height={220} color="#f59e0b" formatValue={(v) => `$${v.toFixed(0)}`} /></div></div>
              )}
              {"deptChart" in reportData && reportData.deptChart && (
                <div className="card"><div className="card-header"><p className="card-title">Staff by Department</p></div><div className="card-body"><BarChart data={reportData.deptChart} height={220} color="#6366f1" /></div></div>
              )}
              {"statusData" in reportData && reportData.statusData && (
                <div className="card"><div className="card-header"><p className="card-title">Status Distribution</p></div><div className="card-body flex justify-center"><DonutChart data={reportData.statusData} /></div></div>
              )}
              {"typeChart" in reportData && reportData.typeChart && (
                <div className="card"><div className="card-header"><p className="card-title">Appointment Types</p></div><div className="card-body"><BarChart data={reportData.typeChart} height={220} color="#0d9488" /></div></div>
              )}
              {"topDx" in reportData && reportData.topDx && (
                <div className="card"><div className="card-header"><p className="card-title">Top Diagnoses</p></div><div className="card-body"><BarChart data={reportData.topDx} height={220} color="#f43f5e" /></div></div>
              )}
              {"deptData" in reportData && reportData.deptData && (
                <div className="card"><div className="card-header"><p className="card-title">Department Performance</p></div><div className="card-body"><BarChart data={reportData.deptData} height={220} color="#0d9488" /></div></div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
