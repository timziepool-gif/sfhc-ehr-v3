import { useMemo, useState } from "react";
import {
  FileText, Plus, Pencil, Trash2, Eye, Printer, Search, Filter,
  X, Pill, FlaskConical, Stethoscope, CalendarDays, Wand2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, EmptyState, Pagination, StatusBadge } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { currency, formatDate, patientFullName } from "@/lib/format";
import { uid, nowISO } from "@/lib/storage";
import {
  generateInvoiceNumber, computeInvoiceTotals, derivePaymentStatus,
  invoiceFromAppointment, invoiceFromLabOrder, invoiceFromPrescription, invoiceFromConsultation,
  invoicePrintHTML,
} from "@/lib/billing";
import type { Invoice, InvoiceLine, BillingCategory, InvoiceSource } from "@/lib/types";
import type { Route as SidebarRoute } from "@/components/Sidebar";

const PAGE_SIZE = 10;

const CATEGORIES: BillingCategory[] = [
  "Consultation", "Laboratory", "Radiology", "Pharmacy", "Procedures",
  "Vaccination", "Admission", "Emergency", "Dental", "Other Services",
];

const STATUS_FILTERS = ["All", "Unpaid", "Partially-Paid", "Paid", "Overdue", "Draft", "Cancelled", "Refunded"] as const;

export default function Invoices({ onNavigate }: { onNavigate: (r: SidebarRoute, params?: Record<string, string>) => void }) {
  const {
    invoices, patients, users, pricing, appointments, labOrders, prescriptions, soapNotes,
    addInvoice, updateInvoice, deleteInvoice, logActivity, currentUser,
  } = useApp();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const patient = patients.find((p) => p.id === inv.patientId);
      const patientName = patient ? patientFullName(patient).toLowerCase() : "";
      const clinician = users.find((u) => u.id === inv.clinicianId)?.name?.toLowerCase() ?? "";
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        patientName.includes(search.toLowerCase()) ||
        clinician.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || inv.paymentStatus === statusFilter;
      const matchesDept = deptFilter === "All" || inv.department === deptFilter;
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [invoices, patients, users, search, statusFilter, deptFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(inv: Invoice) {
    setEditing(inv);
    setShowForm(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteInvoice(deleteTarget.id);
    logActivity({ kind: "billing", title: "Invoice deleted", description: `${deleteTarget.invoiceNumber} deleted`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
    setDeleteTarget(null);
  }

  function handlePrint(inv: Invoice) {
    const patient = patients.find((p) => p.id === inv.patientId);
    const clinician = users.find((u) => u.id === inv.clinicianId);
    if (!patient) return;
    const html = invoicePrintHTML(inv, patient, clinician, []);
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Patient Invoices"
        subtitle={`${invoices.length} invoices · ${currency(invoices.reduce((s, i) => s + i.balance, 0))} outstanding`}
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary btn-sm" onClick={() => setShowGenerate(true)}><Wand2 size={14} /> Generate from...</button>
            <button className="btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> New Invoice</button>
          </div>
        }
      />

      <div className="card">
        <div className="card-body flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search invoice no, patient, clinician..." className="flex-1" />
          <select className="input flex-none w-full sm:w-44" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
          </select>
          <select className="input flex-none w-full sm:w-44" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
            <option value="All">All Departments</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={<FileText size={28} />} title="No invoices found" description="Create a new invoice or generate one from an appointment, lab order, or prescription." action={<button className="btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> New Invoice</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th><th>Patient</th><th>Department</th><th>Date</th><th>Due Date</th>
                  <th className="text-right">Total</th><th className="text-right">Balance</th><th>Status</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((inv) => {
                  const patient = patients.find((p) => p.id === inv.patientId);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="font-mono text-xs font-medium">{inv.invoiceNumber}</td>
                      <td>
                        <button className="text-left hover:text-teal-600 font-medium" onClick={() => onNavigate("patient-detail", { id: inv.patientId })}>
                          {patient ? patientFullName(patient) : "—"}
                        </button>
                      </td>
                      <td className="text-slate-600">{inv.department}</td>
                      <td className="text-slate-600 text-sm">{formatDate(inv.date)}</td>
                      <td className="text-slate-600 text-sm">{formatDate(inv.dueDate)}</td>
                      <td className="text-right font-semibold tabular-nums">{currency(inv.grandTotal)}</td>
                      <td className="text-right tabular-nums text-slate-700">{currency(inv.balance)}</td>
                      <td><StatusBadge status={inv.paymentStatus} /></td>
                      <td className="text-right">
                        <div className="inline-flex gap-1">
                          <button className="btn-ghost btn-sm !p-1.5" title="View" onClick={() => setViewing(inv)}><Eye size={15} /></button>
                          <button className="btn-ghost btn-sm !p-1.5" title="Print" onClick={() => handlePrint(inv)}><Printer size={15} /></button>
                          <button className="btn-ghost btn-sm !p-1.5" title="Edit" onClick={() => openEdit(inv)}><Pencil size={15} /></button>
                          <button className="btn-ghost btn-sm !p-1.5 text-rose-500" title="Delete" onClick={() => setDeleteTarget(inv)}><Trash2 size={15} /></button>
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

      {showForm && (
        <InvoiceForm
          editing={editing}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            if (editing) {
              updateInvoice(editing.id, data);
              logActivity({ kind: "billing", title: "Invoice updated", description: `${editing.invoiceNumber} updated`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
            } else {
              const inv = addInvoice(data);
              logActivity({ kind: "billing", title: "Invoice created", description: `${inv.invoiceNumber} created`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
            }
            setShowForm(false);
          }}
        />
      )}

      {viewing && (
        <InvoiceViewModal
          invoice={viewing}
          patient={patients.find((p) => p.id === viewing.patientId)}
          clinician={users.find((u) => u.id === viewing.clinicianId)}
          onClose={() => setViewing(null)}
          onPrint={() => handlePrint(viewing)}
          onEdit={() => { setViewing(null); openEdit(viewing); }}
        />
      )}

      {showGenerate && (
        <GenerateFromSourceModal
          onClose={() => setShowGenerate(false)}
          onGenerate={(sourceType, sourceId, patientId, clinicianId) => {
            let data: Omit<Invoice, "id" | "createdAt" | "updatedAt"> | null = null;
            if (sourceType === "Appointment") {
              const appt = appointments.find((a) => a.id === sourceId);
              if (appt) data = invoiceFromAppointment(appt, patientId, clinicianId, pricing, invoices);
            } else if (sourceType === "Laboratory") {
              const lab = labOrders.find((l) => l.id === sourceId);
              if (lab) data = invoiceFromLabOrder(lab, patientId, clinicianId, pricing, invoices);
            } else if (sourceType === "Pharmacy") {
              const rx = prescriptions.find((r) => r.id === sourceId);
              if (rx) data = invoiceFromPrescription(rx, patientId, clinicianId, pricing, invoices);
            } else if (sourceType === "Consultation") {
              const soap = soapNotes.find((s) => s.id === sourceId);
              if (soap) data = invoiceFromConsultation(soap, patientId, clinicianId, pricing, invoices);
            }
            if (data) {
              const inv = addInvoice(data);
              logActivity({ kind: "billing", title: "Invoice generated", description: `${inv.invoiceNumber} from ${sourceType}`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
            }
            setShowGenerate(false);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Invoice"
        message={`Delete ${deleteTarget?.invoiceNumber}? This will also remove related payments, claims, and refunds.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ============================================================================
// Invoice Form
// ============================================================================

function InvoiceForm({
  editing, onClose, onSave,
}: {
  editing: Invoice | null;
  onClose: () => void;
  onSave: (data: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const { patients, users, pricing, insurancePolicies, invoices } = useApp();

  const [patientId, setPatientId] = useState(editing?.patientId ?? patients[0]?.id ?? "");
  const [clinicianId, setClinicianId] = useState(editing?.clinicianId ?? "");
  const [department, setDepartment] = useState<BillingCategory>(editing?.department ?? "Consultation");
  const [date, setDate] = useState(editing?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(editing?.dueDate?.slice(0, 10) ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [lines, setLines] = useState<InvoiceLine[]>(editing?.lines ?? []);
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [insurancePolicyId, setInsurancePolicyId] = useState(editing?.insurancePolicyId ?? "");

  const patientPolicies = insurancePolicies.filter((p) => p.patientId === patientId && p.active);
  const totals = computeInvoiceTotals(lines);

  function addLine() {
    setLines([...lines, {
      id: uid("il"), description: "", category: department, quantity: 1, unitPrice: 0, discount: 0, taxRate: 0,
    }]);
  }

  function updateLine(id: string, patch: Partial<InvoiceLine>) {
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLine(id: string) {
    setLines(lines.filter((l) => l.id !== id));
  }

  function addFromPricing(pricingId: string) {
    const item = pricing.find((p) => p.id === pricingId);
    if (!item) return;
    setLines([...lines, {
      id: uid("il"), description: item.name, category: item.category, quantity: 1,
      unitPrice: item.unitPrice, discount: 0, taxRate: 0, reference: item.code,
    }]);
  }

  function handleSave() {
    if (!patientId || lines.length === 0) return;
    const policy = insurancePolicies.find((p) => p.id === insurancePolicyId);
    const insuranceCovered = policy ? Math.round((totals.grandTotal * policy.coveragePercent) / 100) : 0;
    const amountPaid = editing?.amountPaid ?? 0;
    const balance = Math.round((totals.grandTotal - amountPaid) * 100) / 100;
    const status = derivePaymentStatus(totals.grandTotal, amountPaid, new Date(dueDate).toISOString(), editing?.paymentStatus ?? "Unpaid");

    onSave({
      invoiceNumber: editing?.invoiceNumber ?? generateInvoiceNumber(invoices),
      patientId, clinicianId: clinicianId || undefined, cashierId: editing?.cashierId,
      department, date: new Date(date).toISOString(), dueDate: new Date(dueDate).toISOString(),
      lines, discountTotal: totals.discountTotal, taxTotal: totals.taxTotal,
      subtotal: totals.subtotal, grandTotal: totals.grandTotal, amountPaid, balance,
      paymentStatus: status, paymentMethod: editing?.paymentMethod,
      insurancePolicyId: insurancePolicyId || undefined, insuranceCovered,
      source: editing?.source ?? "Manual", sourceRefId: editing?.sourceRefId,
      notes,
    });
  }

  return (
    <Modal open onClose={onClose} title={editing ? `Edit ${editing.invoiceNumber}` : "New Invoice"} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Patient</label>
            <select className="input" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              {patients.map((p) => <option key={p.id} value={p.id}>{patientFullName(p)}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Clinician</label>
            <select className="input" value={clinicianId} onChange={(e) => setClinicianId(e.target.value)}>
              <option value="">— Select —</option>
              {users.filter((u) => u.role === "physician").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Department</label>
            <select className="input" value={department} onChange={(e) => setDepartment(e.target.value as BillingCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Due Date</label>
            <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Insurance Policy</label>
            <select className="input" value={insurancePolicyId} onChange={(e) => setInsurancePolicyId(e.target.value)}>
              <option value="">Self Pay / Cash</option>
              {patientPolicies.map((p) => <option key={p.id} value={p.id}>{p.insurerName} ({p.coveragePercent}%)</option>)}
            </select>
          </div>
        </div>

        {/* Invoice Lines */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-900">Invoice Items</p>
            <div className="flex gap-2">
              <select className="input btn-sm !py-1.5" value="" onChange={(e) => { if (e.target.value) addFromPricing(e.target.value); e.target.value = ""; }}>
                <option value="">+ From Catalogue</option>
                {pricing.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name} — {currency(p.unitPrice)}</option>)}
              </select>
              <button className="btn-primary btn-sm" onClick={addLine}><Plus size={14} /> Add Line</button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th><th>Qty</th><th>Unit Price</th><th>Disc %</th><th>Tax %</th><th className="text-right">Amount</th><th></th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-slate-400 py-6">No items — add a line or pick from catalogue</td></tr>
                ) : lines.map((l) => {
                  const t = computeInvoiceTotals([l]);
                  return (
                    <tr key={l.id}>
                      <td><input className="input !py-1.5 !text-sm" value={l.description} onChange={(e) => updateLine(l.id, { description: e.target.value })} placeholder="Description" /></td>
                      <td><input type="number" min={1} className="input !py-1.5 !text-sm w-16" value={l.quantity} onChange={(e) => updateLine(l.id, { quantity: parseInt(e.target.value) || 1 })} /></td>
                      <td><input type="number" step="0.01" className="input !py-1.5 !text-sm w-24" value={l.unitPrice} onChange={(e) => updateLine(l.id, { unitPrice: parseFloat(e.target.value) || 0 })} /></td>
                      <td><input type="number" min={0} max={100} className="input !py-1.5 !text-sm w-16" value={l.discount} onChange={(e) => updateLine(l.id, { discount: parseFloat(e.target.value) || 0 })} /></td>
                      <td><input type="number" min={0} max={100} className="input !py-1.5 !text-sm w-16" value={l.taxRate} onChange={(e) => updateLine(l.id, { taxRate: parseFloat(e.target.value) || 0 })} /></td>
                      <td className="text-right font-medium tabular-nums">{currency(t.grandTotal)}</td>
                      <td><button className="btn-ghost btn-sm !p-1 text-rose-500" onClick={() => removeLine(l.id)}><X size={14} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium tabular-nums">{currency(totals.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-medium tabular-nums text-rose-500">-{currency(totals.discountTotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="font-medium tabular-nums">{currency(totals.taxTotal)}</span></div>
            <div className="flex justify-between border-t-2 border-teal-500 pt-2 text-lg font-bold"><span>Grand Total</span><span className="text-teal-600 tabular-nums">{currency(totals.grandTotal)}</span></div>
          </div>
        </div>

        <div>
          <label className="form-label">Notes</label>
          <textarea className="input min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button className="btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={handleSave} disabled={!patientId || lines.length === 0}>{editing ? "Update Invoice" : "Create Invoice"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// Invoice View Modal
// ============================================================================

function InvoiceViewModal({
  invoice, patient, clinician, onClose, onPrint, onEdit,
}: {
  invoice: Invoice;
  patient: ReturnType<typeof useApp>["patients"][number] | undefined;
  clinician: ReturnType<typeof useApp>["users"][number] | undefined;
  onClose: () => void;
  onPrint: () => void;
  onEdit: () => void;
}) {
  return (
    <Modal open onClose={onClose} title={`Invoice ${invoice.invoiceNumber}`} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-slate-500 uppercase tracking-wider">Patient</p><p className="font-medium">{patient ? patientFullName(patient) : "—"}</p></div>
          <div><p className="text-xs text-slate-500 uppercase tracking-wider">Clinician</p><p className="font-medium">{clinician?.name ?? "—"}</p></div>
          <div><p className="text-xs text-slate-500 uppercase tracking-wider">Date</p><p className="font-medium">{formatDate(invoice.date)}</p></div>
          <div><p className="text-xs text-slate-500 uppercase tracking-wider">Due Date</p><p className="font-medium">{formatDate(invoice.dueDate)}</p></div>
          <div><p className="text-xs text-slate-500 uppercase tracking-wider">Department</p><p className="font-medium">{invoice.department}</p></div>
          <div><p className="text-xs text-slate-500 uppercase tracking-wider">Status</p><div><StatusBadge status={invoice.paymentStatus} /></div></div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="table">
            <thead><tr><th>Description</th><th className="text-center">Qty</th><th className="text-right">Unit Price</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {invoice.lines.map((l) => {
                const t = computeInvoiceTotals([l]);
                return (
                  <tr key={l.id}>
                    <td className="text-sm">{l.description}</td>
                    <td className="text-center tabular-nums">{l.quantity}</td>
                    <td className="text-right tabular-nums">{currency(l.unitPrice)}</td>
                    <td className="text-right font-medium tabular-nums">{currency(t.grandTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="tabular-nums">{currency(invoice.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="tabular-nums">-{currency(invoice.discountTotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="tabular-nums">{currency(invoice.taxTotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Insurance</span><span className="tabular-nums">-{currency(invoice.insuranceCovered)}</span></div>
            <div className="flex justify-between border-t-2 border-teal-500 pt-2 text-lg font-bold"><span>Grand Total</span><span className="text-teal-600 tabular-nums">{currency(invoice.grandTotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="tabular-nums text-teal-600">{currency(invoice.amountPaid)}</span></div>
            <div className="flex justify-between font-semibold"><span>Balance</span><span className="tabular-nums text-rose-500">{currency(invoice.balance)}</span></div>
          </div>
        </div>

        {invoice.notes && <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{invoice.notes}</div>}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button className="btn-secondary btn-sm" onClick={onPrint}><Printer size={14} /> Print</button>
          <button className="btn-primary btn-sm" onClick={onEdit}><Pencil size={14} /> Edit</button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// Generate From Source Modal
// ============================================================================

function GenerateFromSourceModal({
  onClose, onGenerate,
}: {
  onClose: () => void;
  onGenerate: (sourceType: InvoiceSource, sourceId: string, patientId: string, clinicianId: string) => void;
}) {
  const { appointments, labOrders, prescriptions, soapNotes, patients, users } = useApp();
  const [sourceType, setSourceType] = useState<InvoiceSource>("Appointment");

  const sources = useMemo(() => {
    if (sourceType === "Appointment") return appointments.filter((a) => a.status === "Completed").map((a) => ({ id: a.id, label: `${formatDate(a.date)} ${a.time} — ${patients.find((p) => p.id === a.patientId) ? patientFullName(patients.find((p) => p.id === a.patientId)!) : "—"} — ${a.reason}`, patientId: a.patientId, clinicianId: a.clinicianId }));
    if (sourceType === "Laboratory") return labOrders.filter((l) => l.status === "Completed").map((l) => ({ id: l.id, label: `${l.id} — ${patients.find((p) => p.id === l.patientId) ? patientFullName(patients.find((p) => p.id === l.patientId)!) : "—"} — ${l.tests.map((t) => t.testName).join(", ")}`, patientId: l.patientId, clinicianId: l.clinicianId }));
    if (sourceType === "Pharmacy") return prescriptions.filter((r) => r.status === "Dispensed").map((r) => ({ id: r.id, label: `${r.id} — ${patients.find((p) => p.id === r.patientId) ? patientFullName(patients.find((p) => p.id === r.patientId)!) : "—"} — ${r.lines.map((l) => l.medicationName).join(", ")}`, patientId: r.patientId, clinicianId: r.clinicianId }));
    if (sourceType === "Consultation") return soapNotes.map((s) => ({ id: s.id, label: `${formatDate(s.encounterDate)} — ${patients.find((p) => p.id === s.patientId) ? patientFullName(patients.find((p) => p.id === s.patientId)!) : "—"} — ${s.diagnosis}`, patientId: s.patientId, clinicianId: s.clinicianId }));
    return [];
  }, [sourceType, appointments, labOrders, prescriptions, soapNotes, patients]);

  const [selectedId, setSelectedId] = useState("");

  const sourceIcons: Record<InvoiceSource, React.ReactNode> = {
    Appointment: <CalendarDays size={16} />,
    Laboratory: <FlaskConical size={16} />,
    Pharmacy: <Pill size={16} />,
    Procedure: <Stethoscope size={16} />,
    Consultation: <Stethoscope size={16} />,
    Manual: <FileText size={16} />,
  };

  function handleGenerate() {
    const src = sources.find((s) => s.id === selectedId);
    if (!src) return;
    onGenerate(sourceType, src.id, src.patientId, src.clinicianId);
  }

  return (
    <Modal open onClose={onClose} title="Generate Invoice from..." size="lg">
      <div className="space-y-4">
        <div>
          <label className="form-label">Source Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(["Appointment", "Laboratory", "Pharmacy", "Consultation"] as InvoiceSource[]).map((s) => (
              <button
                key={s}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition ${sourceType === s ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                onClick={() => { setSourceType(s); setSelectedId(""); }}
              >
                {sourceIcons[s]} {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="form-label">Select {sourceType}</label>
          <select className="input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">— Choose a record —</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        {sources.length === 0 && (
          <div className="text-sm text-slate-500 bg-amber-50 rounded-lg p-3">
            No completed {sourceType.toLowerCase()} records available to generate invoices from.
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button className="btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={handleGenerate} disabled={!selectedId}><Wand2 size={14} /> Generate Invoice</button>
        </div>
      </div>
    </Modal>
  );
}
