import { useMemo, useState } from "react";
import {
  CreditCard, Plus, Printer, Search, RotateCcw, Eye, DollarSign,
  CheckCircle2, Clock, ShieldAlert,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, EmptyState, Pagination, StatusBadge, KpiCard } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { currency, formatDate, patientFullName } from "@/lib/format";
import { uid } from "@/lib/storage";
import { generateReceiptNumber, generateRefundNumber, receiptPrintHTML } from "@/lib/billing";
import type { Payment, PaymentMethod, Refund, RefundStatus } from "@/lib/types";
import type { Route as SidebarRoute } from "@/components/Sidebar";

const PAGE_SIZE = 10;

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "Transfer", "POS", "Insurance", "Mobile Money", "Split Payment"];
const REFUND_STATUSES: RefundStatus[] = ["Pending", "Approved", "Completed", "Rejected"];

export default function Payments({ onNavigate }: { onNavigate: (r: SidebarRoute, params?: Record<string, string>) => void }) {
  const {
    payments, invoices, patients, users, refunds, currentUser,
    addPayment, deletePayment, addRefund, updateRefund, logActivity,
  } = useApp();

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [showPayment, setShowPayment] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundInvoice, setRefundInvoice] = useState<string>("");
  const [viewing, setViewing] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [tab, setTab] = useState<"payments" | "refunds">("payments");

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const patient = patients.find((pt) => p.patientId === pt.id);
      const matchesSearch =
        p.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.reference.toLowerCase().includes(search.toLowerCase()) ||
        (patient && patientFullName(patient).toLowerCase().includes(search.toLowerCase()));
      const matchesMethod = methodFilter === "All" || p.method === methodFilter;
      return matchesSearch && matchesMethod;
    });
  }, [payments, patients, search, methodFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const totalCollected = payments.reduce((s, p) => s + p.amountPaid, 0);
    const totalRefunded = refunds.filter((r) => r.status === "Completed").reduce((s, r) => s + r.amount, 0);
    const cashPayments = payments.filter((p) => p.method === "Cash").reduce((s, p) => s + p.amountPaid, 0);
    const insurancePayments = payments.filter((p) => p.method === "Insurance").reduce((s, p) => s + p.amountPaid, 0);
    return { totalCollected, totalRefunded, cashPayments, insurancePayments };
  }, [payments, refunds]);

  function handlePrint(pay: Payment) {
    const inv = invoices.find((i) => i.id === pay.invoiceId);
    const patient = patients.find((p) => p.id === pay.patientId);
    const cashier = users.find((u) => u.id === pay.cashierId);
    if (!inv || !patient || !cashier) return;
    const html = receiptPrintHTML(pay, inv, patient, cashier);
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deletePayment(deleteTarget.id);
    logActivity({ kind: "billing", title: "Payment deleted", description: `${deleteTarget.receiptNumber} deleted`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        subtitle="Record payments, print receipts, and manage refunds"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary btn-sm" onClick={() => setShowRefund(true)}><RotateCcw size={14} /> New Refund</button>
            <button className="btn-primary btn-sm" onClick={() => setShowPayment(true)}><Plus size={14} /> Record Payment</button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<DollarSign size={18} />} label="Total Collected" value={currency(stats.totalCollected)} tone="teal" />
        <KpiCard icon={<RotateCcw size={18} />} label="Total Refunded" value={currency(stats.totalRefunded)} tone="rose" />
        <KpiCard icon={<CheckCircle2 size={18} />} label="Cash Payments" value={currency(stats.cashPayments)} tone="blue" />
        <KpiCard icon={<ShieldAlert size={18} />} label="Insurance Payments" value={currency(stats.insurancePayments)} tone="amber" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button className={`btn-sm ${tab === "payments" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("payments")}>Payments ({payments.length})</button>
        <button className={`btn-sm ${tab === "refunds" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("refunds")}>Refunds ({refunds.length})</button>
      </div>

      {tab === "payments" && (
        <>
          <div className="card">
            <div className="card-body flex flex-col sm:flex-row gap-3">
              <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search receipt no, patient, reference..." className="flex-1" />
              <select className="input flex-none w-full sm:w-44" value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}>
                <option value="All">All Methods</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            {pageItems.length === 0 ? (
              <EmptyState icon={<CreditCard size={28} />} title="No payments recorded" description="Record a payment to generate a printable receipt." action={<button className="btn-primary btn-sm" onClick={() => setShowPayment(true)}><Plus size={14} /> Record Payment</button>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr><th>Receipt #</th><th>Patient</th><th>Invoice</th><th>Date</th><th>Method</th><th className="text-right">Amount</th><th>Cashier</th><th className="text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {pageItems.map((p) => {
                      const patient = patients.find((pt) => p.patientId === pt.id);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="font-mono text-xs font-medium">{p.receiptNumber}</td>
                          <td>
                            <button className="text-left hover:text-teal-600 font-medium" onClick={() => onNavigate("patient-detail", { id: p.patientId })}>
                              {patient ? patientFullName(patient) : "—"}
                            </button>
                          </td>
                          <td className="font-mono text-xs text-slate-500">{invoices.find((i) => i.id === p.invoiceId)?.invoiceNumber ?? "—"}</td>
                          <td className="text-slate-600 text-sm">{formatDate(p.date)}</td>
                          <td><span className="badge-slate">{p.method}</span></td>
                          <td className="text-right font-semibold tabular-nums text-teal-600">{currency(p.amountPaid)}</td>
                          <td className="text-slate-600 text-sm">{p.cashierName}</td>
                          <td className="text-right">
                            <div className="inline-flex gap-1">
                              <button className="btn-ghost btn-sm !p-1.5" title="View" onClick={() => setViewing(p)}><Eye size={15} /></button>
                              <button className="btn-ghost btn-sm !p-1.5" title="Print Receipt" onClick={() => handlePrint(p)}><Printer size={15} /></button>
                              <button className="btn-ghost btn-sm !p-1.5 text-rose-500" title="Delete" onClick={() => setDeleteTarget(p)}><RotateCcw size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
          </div>
        </>
      )}

      {tab === "refunds" && (
        <div className="card overflow-hidden">
          {refunds.length === 0 ? (
            <EmptyState icon={<RotateCcw size={28} />} title="No refunds processed" description="Process a refund for a paid invoice." action={<button className="btn-secondary btn-sm" onClick={() => setShowRefund(true)}><RotateCcw size={14} /> New Refund</button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Refund #</th><th>Invoice</th><th>Patient</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {refunds.map((r) => {
                    const patient = patients.find((p) => p.id === r.patientId);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="font-mono text-xs font-medium">{r.refundNumber}</td>
                        <td className="font-mono text-xs text-slate-500">{invoices.find((i) => i.id === r.invoiceId)?.invoiceNumber ?? "—"}</td>
                        <td className="font-medium">{patient ? patientFullName(patient) : "—"}</td>
                        <td className="font-semibold tabular-nums text-rose-500">{currency(r.amount)}</td>
                        <td className="text-slate-600 text-sm max-w-xs truncate">{r.reason}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td className="text-slate-600 text-sm">{formatDate(r.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showPayment && (
        <RecordPaymentModal
          onClose={() => setShowPayment(false)}
          onSave={(data) => {
            const pay = addPayment(data);
            logActivity({ kind: "billing", title: "Payment recorded", description: `${pay.receiptNumber} — ${currency(pay.amountPaid)}`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
            setShowPayment(false);
          }}
        />
      )}

      {showRefund && (
        <RefundModal
          invoiceId={refundInvoice}
          onClose={() => { setShowRefund(false); setRefundInvoice(""); }}
          onSave={(data) => {
            const refund = addRefund(data);
            logActivity({ kind: "billing", title: "Refund created", description: `${refund.refundNumber} — ${currency(refund.amount)}`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
            setShowRefund(false); setRefundInvoice("");
          }}
        />
      )}

      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={`Receipt ${viewing.receiptNumber}`} size="md">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-slate-500 uppercase">Patient</p><p className="font-medium">{patients.find((p) => p.id === viewing.patientId) ? patientFullName(patients.find((p) => p.id === viewing.patientId)!) : "—"}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Invoice</p><p className="font-medium">{invoices.find((i) => i.id === viewing.invoiceId)?.invoiceNumber ?? "—"}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Date</p><p className="font-medium">{formatDate(viewing.date)}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Method</p><p className="font-medium">{viewing.method}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Reference</p><p className="font-medium">{viewing.reference || "—"}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Cashier</p><p className="font-medium">{viewing.cashierName}</p></div>
            </div>
            <div className="bg-teal-50 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-500 uppercase">Amount Paid</p>
              <p className="text-2xl font-bold text-teal-600">{currency(viewing.amountPaid)}</p>
            </div>
            {viewing.notes && <div className="text-slate-600 bg-slate-50 rounded-lg p-3">{viewing.notes}</div>}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button className="btn-primary btn-sm" onClick={() => handlePrint(viewing)}><Printer size={14} /> Print Receipt</button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Reverse Payment"
        message={`Reverse payment ${deleteTarget?.receiptNumber}? The invoice balance will be adjusted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ============================================================================
// Record Payment Modal
// ============================================================================

function RecordPaymentModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (data: Omit<Payment, "id" | "createdAt">) => void;
}) {
  const { invoices, patients, users, payments, currentUser } = useApp();
  const unpaidInvoices = invoices.filter((i) => i.balance > 0 && i.paymentStatus !== "Cancelled" && i.paymentStatus !== "Draft");
  const [invoiceId, setInvoiceId] = useState(unpaidInvoices[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const selectedInv = invoices.find((i) => i.id === invoiceId);
  const patient = selectedInv ? patients.find((p) => p.id === selectedInv.patientId) : null;
  const balance = selectedInv?.balance ?? 0;

  function handleSave() {
    if (!invoiceId || amount <= 0 || !selectedInv || !patient) return;
    const balanceAfter = Math.round((balance - amount) * 100) / 100;
    onSave({
      receiptNumber: generateReceiptNumber(payments),
      invoiceId, patientId: selectedInv.patientId, amountPaid: amount, balanceAfter,
      cashierId: currentUser?.id ?? "u-recep-1", cashierName: currentUser?.name ?? "System",
      date: new Date(date).toISOString(), method, reference, notes,
    });
  }

  return (
    <Modal open onClose={onClose} title="Record Payment" size="md">
      <div className="space-y-4">
        <div>
          <label className="form-label">Invoice</label>
          <select className="input" value={invoiceId} onChange={(e) => {
            setInvoiceId(e.target.value);
            const inv = invoices.find((i) => i.id === e.target.value);
            if (inv) setAmount(inv.balance);
          }}>
            <option value="">— Select invoice —</option>
            {unpaidInvoices.map((i) => {
              const p = patients.find((pt) => pt.id === i.patientId);
              return <option key={i.id} value={i.id}>{i.invoiceNumber} — {p ? patientFullName(p) : "—"} — Bal: {currency(i.balance)}</option>;
            })}
          </select>
        </div>

        {selectedInv && patient && (
          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">Patient</span><span className="font-medium">{patientFullName(patient)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Grand Total</span><span className="font-medium">{currency(selectedInv.grandTotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Already Paid</span><span className="font-medium">{currency(selectedInv.amountPaid)}</span></div>
            <div className="flex justify-between font-semibold"><span className="text-slate-700">Outstanding Balance</span><span className="text-rose-500">{currency(balance)}</span></div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Amount</label>
            <input type="number" step="0.01" min={0} max={balance} className="input" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className="form-label">Payment Method</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Reference</label>
            <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction ref..." />
          </div>
        </div>

        <div>
          <label className="form-label">Notes</label>
          <textarea className="input min-h-[50px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button className="btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={handleSave} disabled={!invoiceId || amount <= 0}><CheckCircle2 size={14} /> Record Payment</button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// Refund Modal
// ============================================================================

function RefundModal({
  invoiceId: initialInvoiceId, onClose, onSave,
}: {
  invoiceId: string;
  onClose: () => void;
  onSave: (data: Omit<Refund, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const { invoices, patients, refunds, currentUser } = useApp();
  const paidInvoices = invoices.filter((i) => i.amountPaid > 0);
  const [invoiceId, setInvoiceId] = useState(initialInvoiceId || paidInvoices[0]?.id || "");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [status, setStatus] = useState<RefundStatus>("Pending");
  const [notes, setNotes] = useState("");

  const selectedInv = invoices.find((i) => i.id === invoiceId);
  const patient = selectedInv ? patients.find((p) => p.id === selectedInv.patientId) : null;

  function handleSave() {
    if (!invoiceId || amount <= 0 || !selectedInv || !patient) return;
    onSave({
      refundNumber: generateRefundNumber(refunds),
      invoiceId, patientId: selectedInv.patientId, amount, reason, status,
      approvedBy: status === "Approved" || status === "Completed" ? currentUser?.id : undefined,
      approvedAt: status === "Approved" || status === "Completed" ? new Date().toISOString() : undefined,
      processedBy: currentUser?.id ?? "u-finance-1", paymentMethod: method, notes,
    });
  }

  return (
    <Modal open onClose={onClose} title="Process Refund" size="md">
      <div className="space-y-4">
        <div>
          <label className="form-label">Invoice</label>
          <select className="input" value={invoiceId} onChange={(e) => {
            setInvoiceId(e.target.value);
            const inv = invoices.find((i) => i.id === e.target.value);
            if (inv) setAmount(inv.amountPaid);
          }}>
            <option value="">— Select invoice —</option>
            {paidInvoices.map((i) => {
              const p = patients.find((pt) => pt.id === i.patientId);
              return <option key={i.id} value={i.id}>{i.invoiceNumber} — {p ? patientFullName(p) : "—"} — Paid: {currency(i.amountPaid)}</option>;
            })}
          </select>
        </div>

        {selectedInv && patient && (
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Patient</span><span className="font-medium">{patientFullName(patient)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Amount Paid</span><span className="font-medium">{currency(selectedInv.amountPaid)}</span></div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Refund Amount</label>
            <input type="number" step="0.01" min={0} max={selectedInv?.amountPaid ?? 0} className="input" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className="form-label">Refund Method</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Reason</label>
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for refund..." />
        </div>

        <div>
          <label className="form-label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as RefundStatus)}>
            {REFUND_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="form-label">Notes</label>
          <textarea className="input min-h-[50px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button className="btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={handleSave} disabled={!invoiceId || amount <= 0 || !reason}><RotateCcw size={14} /> Process Refund</button>
        </div>
      </div>
    </Modal>
  );
}
