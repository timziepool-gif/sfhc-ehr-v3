import { useMemo, useState } from "react";
import { BarChart3, Download, Filter } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/ui";
import { BarChart } from "@/components/Charts";
import { currency } from "@/lib/format";
import { buildRevenueReport, type ReportGroupBy } from "@/lib/billing";

const GROUP_OPTIONS: { value: ReportGroupBy; label: string }[] = [
  { value: "date", label: "By Date" },
  { value: "department", label: "By Department" },
  { value: "provider", label: "By Provider" },
  { value: "method", label: "By Payment Method" },
  { value: "insurance", label: "By Insurance" },
  { value: "service", label: "By Service Type" },
];

export default function RevenueReports() {
  const { invoices, payments, refunds, insurancePolicies, users } = useApp();
  const [groupBy, setGroupBy] = useState<ReportGroupBy>("department");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const rows = useMemo(() => {
    return buildRevenueReport(invoices, payments, refunds, insurancePolicies, users, groupBy, dateFrom, dateTo);
  }, [invoices, payments, refunds, insurancePolicies, users, groupBy, dateFrom, dateTo]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        totalRevenue: acc.totalRevenue + r.totalRevenue,
        collectedRevenue: acc.collectedRevenue + r.collectedRevenue,
        outstandingRevenue: acc.outstandingRevenue + r.outstandingRevenue,
        refunds: acc.refunds + r.refunds,
        insurancePayments: acc.insurancePayments + r.insurancePayments,
        cashPayments: acc.cashPayments + r.cashPayments,
        count: acc.count + r.count,
      }),
      { totalRevenue: 0, collectedRevenue: 0, outstandingRevenue: 0, refunds: 0, insurancePayments: 0, cashPayments: 0, count: 0 },
    );
  }, [rows]);

  const chartData = rows.slice(0, 10).map((r) => ({ label: r.label.length > 12 ? r.label.slice(0, 12) + "..." : r.label, value: r.totalRevenue }));

  function exportCSV() {
    const header = "Group,Total Revenue,Collected,Outstanding,Refunds,Insurance,Cash,Count\n";
    const body = rows.map((r) => `${r.label},${r.totalRevenue.toFixed(2)},${r.collectedRevenue.toFixed(2)},${r.outstandingRevenue.toFixed(2)},${r.refunds.toFixed(2)},${r.insurancePayments.toFixed(2)},${r.cashPayments.toFixed(2)},${r.count}`).join("\n");
    const csv = header + body;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `revenue-report-${groupBy}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Revenue Reports"
        subtitle="Analyze revenue by date, department, provider, method, insurance, and service"
        actions={<button className="btn-secondary btn-sm" onClick={exportCSV}><Download size={14} /> Export CSV</button>}
      />

      {/* Filters */}
      <div className="card">
        <div className="card-body flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="form-label">Group By</label>
            <select className="input" value={groupBy} onChange={(e) => setGroupBy(e.target.value as ReportGroupBy)}>
              {GROUP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">From Date</label>
            <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <SummaryStat label="Total Revenue" value={currency(totals.totalRevenue)} tone="text-slate-900" />
        <SummaryStat label="Collected" value={currency(totals.collectedRevenue)} tone="text-teal-600" />
        <SummaryStat label="Outstanding" value={currency(totals.outstandingRevenue)} tone="text-rose-500" />
        <SummaryStat label="Refunds" value={currency(totals.refunds)} tone="text-amber-500" />
        <SummaryStat label="Insurance" value={currency(totals.insurancePayments)} tone="text-blue-600" />
        <SummaryStat label="Cash/Card" value={currency(totals.cashPayments)} tone="text-teal-600" />
        <SummaryStat label="Invoices" value={String(totals.count)} tone="text-slate-900" />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <div className="card-header"><p className="card-title">Revenue by {GROUP_OPTIONS.find((o) => o.value === groupBy)?.label}</p></div>
          <div className="card-body"><BarChart data={chartData} height={220} color="#0d9488" formatValue={(v) => `$${v.toFixed(0)}`} /></div>
        </div>
      )}

      {/* Report table */}
      <div className="card overflow-hidden">
        <div className="card-header"><p className="card-title">Detailed Report</p></div>
        {rows.length === 0 ? (
          <EmptyState icon={<BarChart3 size={28} />} title="No data for the selected filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th className="text-right">Total Revenue</th>
                  <th className="text-right">Collected</th>
                  <th className="text-right">Outstanding</th>
                  <th className="text-right">Refunds</th>
                  <th className="text-right">Insurance</th>
                  <th className="text-right">Cash</th>
                  <th className="text-right">Invoices</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="hover:bg-slate-50">
                    <td className="font-medium">{r.label}</td>
                    <td className="text-right font-semibold tabular-nums">{currency(r.totalRevenue)}</td>
                    <td className="text-right tabular-nums text-teal-600">{currency(r.collectedRevenue)}</td>
                    <td className="text-right tabular-nums text-rose-500">{currency(r.outstandingRevenue)}</td>
                    <td className="text-right tabular-nums text-amber-500">{currency(r.refunds)}</td>
                    <td className="text-right tabular-nums text-blue-600">{currency(r.insurancePayments)}</td>
                    <td className="text-right tabular-nums">{currency(r.cashPayments)}</td>
                    <td className="text-right tabular-nums">{r.count}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-bold">
                  <td>TOTAL</td>
                  <td className="text-right tabular-nums">{currency(totals.totalRevenue)}</td>
                  <td className="text-right tabular-nums text-teal-600">{currency(totals.collectedRevenue)}</td>
                  <td className="text-right tabular-nums text-rose-500">{currency(totals.outstandingRevenue)}</td>
                  <td className="text-right tabular-nums text-amber-500">{currency(totals.refunds)}</td>
                  <td className="text-right tabular-nums text-blue-600">{currency(totals.insurancePayments)}</td>
                  <td className="text-right tabular-nums">{currency(totals.cashPayments)}</td>
                  <td className="text-right tabular-nums">{totals.count}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="card">
      <div className="card-body py-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</p>
        <p className={`text-lg font-bold tabular-nums ${tone} mt-1`}>{value}</p>
      </div>
    </div>
  );
}
