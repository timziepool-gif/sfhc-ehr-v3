import { useMemo } from "react";
import {
  FileText, CreditCard, Receipt, ShieldCheck, Clock, DollarSign,
  TrendingUp, TrendingDown, Printer, Eye, RotateCcw,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { EmptyState, StatusBadge, KpiCard } from "@/components/ui";
import { currency, formatDate, patientFullName } from "@/lib/format";
import { invoicePrintHTML, receiptPrintHTML, buildPatientFinancialTimeline } from "@/lib/billing";
import type { Patient } from "@/lib/types";
import type { Route as SidebarRoute } from "@/components/Sidebar";

interface Props {
  patient: Patient;
  onNavigate: (r: SidebarRoute, params?: Record<string, string>) => void;
}

export default function PatientBillingTab({ patient, onNavigate }: Props) {
  const { invoices, payments, claims, refunds, insurancePolicies, users, labOrders, prescriptions, appointments } = useApp();

  const patientInvoices = useMemo(() => invoices.filter((i) => i.patientId === patient.id), [invoices, patient.id]);
  const patientPayments = useMemo(() => payments.filter((p) => p.patientId === patient.id), [payments, patient.id]);
  const patientClaims = useMemo(() => claims.filter((c) => c.patientId === patient.id), [claims, patient.id]);
  const patientRefunds = useMemo(() => refunds.filter((r) => r.patientId === patient.id), [refunds, patient.id]);
  const patientPolicies = useMemo(() => insurancePolicies.filter((p) => p.patientId === patient.id), [insurancePolicies, patient.id]);

  const timeline = useMemo(() => buildPatientFinancialTimeline(patient.id, invoices, payments, claims, refunds, labOrders, prescriptions, appointments), [patient.id, invoices, payments, claims, refunds, labOrders, prescriptions, appointments]);

  const stats = useMemo(() => {
    const totalBilled = patientInvoices.reduce((s, i) => s + i.grandTotal, 0);
    const totalPaid = patientInvoices.reduce((s, i) => s + i.amountPaid, 0);
    const outstanding = patientInvoices.reduce((s, i) => s + i.balance, 0);
    const activeCount = patientInvoices.filter((i) => i.balance > 0).length;
    return { totalBilled, totalPaid, outstanding, activeCount };
  }, [patientInvoices]);

  function handlePrintInvoice(inv: typeof patientInvoices[number]) {
    const clinician = users.find((u) => u.id === inv.clinicianId);
    const html = invoicePrintHTML(inv, patient, clinician, patientPayments);
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
  }

  function handlePrintReceipt(pay: typeof patientPayments[number]) {
    const inv = invoices.find((i) => i.id === pay.invoiceId);
    const cashier = users.find((u) => u.id === pay.cashierId);
    if (!inv || !cashier) return;
    const html = receiptPrintHTML(pay, inv, patient, cashier);
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
  }

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<DollarSign size={18} />} label="Total Billed" value={currency(stats.totalBilled)} tone="teal" />
        <KpiCard icon={<TrendingUp size={18} />} label="Total Paid" value={currency(stats.totalPaid)} tone="blue" />
        <KpiCard icon={<TrendingDown size={18} />} label="Outstanding" value={currency(stats.outstanding)} tone="rose" />
        <KpiCard icon={<Clock size={18} />} label="Active Invoices" value={String(stats.activeCount)} tone="amber" />
      </div>

      {/* Insurance policies */}
      <div className="card">
        <div className="card-header"><p className="card-title">Insurance Information</p><ShieldCheck size={16} className="text-blue-500" /></div>
        <div className="card-body">
          {patientPolicies.length === 0 ? (
            <p className="text-sm text-slate-500">No insurance policies on file.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {patientPolicies.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">{p.insurerName}</span>
                    <span className="badge-blue">{p.type}</span>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div className="flex justify-between"><span className="text-slate-400">Policy #</span><span className="font-mono text-xs">{p.policyNumber}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Member ID</span><span>{p.memberId}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Coverage</span><span className="font-semibold text-teal-600">{p.coveragePercent}%</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Expiry</span><span>{formatDate(p.expiryDate)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Status</span><StatusBadge status={p.active ? "Active" : "Inactive"} tone={p.active ? "green" : "slate"} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active invoices */}
      <div className="card overflow-hidden">
        <div className="card-header"><p className="card-title">Active Invoices</p></div>
        <div className="card-body !p-0">
          {patientInvoices.filter((i) => i.balance > 0).length === 0 ? (
            <EmptyState title="No outstanding invoices" description="All invoices are fully paid." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Invoice #</th><th>Date</th><th>Department</th><th className="text-right">Total</th><th className="text-right">Balance</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {patientInvoices.filter((i) => i.balance > 0).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="font-mono text-xs font-medium">{inv.invoiceNumber}</td>
                      <td className="text-sm text-slate-600">{formatDate(inv.date)}</td>
                      <td className="text-slate-600">{inv.department}</td>
                      <td className="text-right font-semibold tabular-nums">{currency(inv.grandTotal)}</td>
                      <td className="text-right tabular-nums text-rose-500">{currency(inv.balance)}</td>
                      <td><StatusBadge status={inv.paymentStatus} /></td>
                      <td className="text-right">
                        <button className="btn-ghost btn-sm !p-1.5" title="Print" onClick={() => handlePrintInvoice(inv)}><Printer size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invoice history */}
      <div className="card overflow-hidden">
        <div className="card-header"><p className="card-title">Invoice History</p></div>
        <div className="card-body !p-0">
          {patientInvoices.length === 0 ? (
            <EmptyState icon={<FileText size={28} />} title="No invoices" description="Invoices will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Invoice #</th><th>Date</th><th>Department</th><th className="text-right">Total</th><th className="text-right">Paid</th><th className="text-right">Balance</th><th>Status</th></tr></thead>
                <tbody>
                  {patientInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="font-mono text-xs font-medium">{inv.invoiceNumber}</td>
                      <td className="text-sm text-slate-600">{formatDate(inv.date)}</td>
                      <td className="text-slate-600">{inv.department}</td>
                      <td className="text-right tabular-nums">{currency(inv.grandTotal)}</td>
                      <td className="text-right tabular-nums text-teal-600">{currency(inv.amountPaid)}</td>
                      <td className="text-right tabular-nums">{currency(inv.balance)}</td>
                      <td><StatusBadge status={inv.paymentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment history */}
      <div className="card overflow-hidden">
        <div className="card-header"><p className="card-title">Payment History</p></div>
        <div className="card-body !p-0">
          {patientPayments.length === 0 ? (
            <EmptyState icon={<CreditCard size={28} />} title="No payments" description="Payments will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Receipt #</th><th>Date</th><th>Method</th><th>Reference</th><th className="text-right">Amount</th><th className="text-right">Receipt</th></tr></thead>
                <tbody>
                  {patientPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="font-mono text-xs font-medium">{p.receiptNumber}</td>
                      <td className="text-sm text-slate-600">{formatDate(p.date)}</td>
                      <td><span className="badge-slate">{p.method}</span></td>
                      <td className="text-slate-500 text-sm">{p.reference || "—"}</td>
                      <td className="text-right font-semibold tabular-nums text-teal-600">{currency(p.amountPaid)}</td>
                      <td className="text-right">
                        <button className="btn-ghost btn-sm !p-1.5" title="Print Receipt" onClick={() => handlePrintReceipt(p)}><Printer size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Claims */}
      {patientClaims.length > 0 && (
        <div className="card overflow-hidden">
          <div className="card-header"><p className="card-title">Insurance Claims</p></div>
          <div className="card-body !p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Claim #</th><th>Insurer</th><th className="text-right">Amount</th><th>Submitted</th><th>Status</th></tr></thead>
                <tbody>
                  {patientClaims.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="font-mono text-xs font-medium">{c.claimNumber}</td>
                      <td className="text-slate-600">{c.insurerName}</td>
                      <td className="text-right tabular-nums">{currency(c.amount)}</td>
                      <td className="text-sm text-slate-600">{formatDate(c.submissionDate)}</td>
                      <td><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Refunds */}
      {patientRefunds.length > 0 && (
        <div className="card overflow-hidden">
          <div className="card-header"><p className="card-title">Refund History</p></div>
          <div className="card-body !p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Refund #</th><th>Reason</th><th className="text-right">Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {patientRefunds.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="font-mono text-xs font-medium">{r.refundNumber}</td>
                      <td className="text-slate-600 text-sm">{r.reason}</td>
                      <td className="text-right tabular-nums text-rose-500">{currency(r.amount)}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="text-sm text-slate-600">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Financial timeline */}
      <div className="card">
        <div className="card-header"><p className="card-title">Financial Timeline</p></div>
        <div className="card-body">
          {timeline.length === 0 ? (
            <EmptyState title="No financial activity" description="Billing events will appear here in chronological order." />
          ) : (
            <div className="space-y-3">
              {timeline.map((event) => {
                const iconMap: Record<string, React.ReactNode> = {
                  invoice: <FileText size={14} />,
                  payment: <CreditCard size={14} />,
                  claim: <ShieldCheck size={14} />,
                  refund: <RotateCcw size={14} />,
                  "lab-charge": <Receipt size={14} />,
                  "pharmacy-charge": <Receipt size={14} />,
                  appointment: <Clock size={14} />,
                };
                const colorMap: Record<string, string> = {
                  invoice: "bg-amber-50 text-amber-600",
                  payment: "bg-teal-50 text-teal-600",
                  claim: "bg-blue-50 text-blue-600",
                  refund: "bg-rose-50 text-rose-600",
                  "lab-charge": "bg-slate-100 text-slate-600",
                  "pharmacy-charge": "bg-slate-100 text-slate-600",
                  appointment: "bg-slate-100 text-slate-500",
                };
                return (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorMap[event.type]}`}>
                      {iconMap[event.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{event.title}</p>
                        {event.amount !== undefined && (
                          <span className={`text-sm font-semibold tabular-nums ${event.type === "payment" ? "text-teal-600" : event.type === "refund" ? "text-rose-500" : "text-slate-700"}`}>
                            {event.type === "refund" ? "-" : ""}{currency(event.amount)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{event.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(event.date)}{event.status ? ` · ${event.status}` : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
