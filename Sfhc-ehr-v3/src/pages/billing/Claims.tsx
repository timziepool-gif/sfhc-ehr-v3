import { useMemo, useState } from "react";
import {
  Receipt, Plus, Pencil, Trash2, Search, Eye, X, CheckCircle2, XCircle,
  Clock, FileText, ArrowRight,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, EmptyState, Pagination, StatusBadge, KpiCard } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { currency, formatDate, patientFullName } from "@/lib/format";
import { generateClaimNumber } from "@/lib/billing";
import type { InsuranceClaim, ClaimStatus } from "@/lib/types";
import type { Route as SidebarRoute } from "@/components/Sidebar";

const PAGE_SIZE = 10;

const CLAIM_STATUSES: ClaimStatus[] = ["Draft", "Submitted", "Under Review", "Approved", "Rejected", "Paid"];

const STATUS_FLOW: Record<ClaimStatus, ClaimStatus[]> = {
  "Draft": ["Submitted"],
  "Submitted": ["Under Review", "Approved", "Rejected"],
  "Under Review": ["Approved", "Rejected"],
  "Approved": ["Paid"],
  "Rejected": [],
  "Paid": [],
};

export default function Claims({ onNavigate }: { onNavigate: (r: SidebarRoute, params?: Record<string, string>) => void }) {
  const { claims, invoices, patients, insurancePolicies, addClaim, updateClaim, deleteClaim, logActivity, currentUser } = useApp();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InsuranceClaim | null>(null);
  const [viewing, setViewing] = useState<InsuranceClaim | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InsuranceClaim | null>(null);

  const filtered = useMemo(() => {
    return claims.filter((c) => {
      const patient = patients.find((p) => p.id === c.patientId);
      const matchesSearch =
        c.claimNumber.toLowerCase().includes(search.toLowerCase()) ||
        c.insurerName.toLowerCase().includes(search.toLowerCase()) ||
        (patient && patientFullName(patient).toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [claims, patients, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const pending = claims.filter((c) => c.status === "Submitted" || c.status === "Under Review").length;
    const approved = claims.filter((c) => c.status === "Approved").length;
    const rejected = claims.filter((c) => c.status === "Rejected").length;
    const paid = claims.filter((c) => c.status === "Paid").length;
    const totalAmount = claims.reduce((s, c) => s + c.amount, 0);
    return { pending, approved, rejected, paid, totalAmount, total: claims.length };
  }, [claims]);

  function advanceStatus(claim: InsuranceClaim, newStatus: ClaimStatus) {
    const patch: Partial<InsuranceClaim> = { status: newStatus };
    if (newStatus === "Under Review") patch.reviewDate = new Date().toISOString();
    if (newStatus === "Paid") patch.paymentDate = new Date().toISOString();
    updateClaim(claim.id, patch);
    logActivity({ kind: "billing", title: `Claim ${newStatus}`, description: `${claim.claimNumber} → ${newStatus}`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
    setViewing(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteClaim(deleteTarget.id);
    logActivity({ kind: "billing", title: "Claim deleted", description: `${deleteTarget.claimNumber} deleted`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Claims Management"
        subtitle={`${claims.length} claims · ${currency(stats.totalAmount)} total claimed`}
        actions={<button className="btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> New Claim</button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard icon={<Receipt size={18} />} label="Total Claims" value={String(stats.total)} tone="teal" />
        <KpiCard icon={<Clock size={18} />} label="Pending" value={String(stats.pending)} tone="amber" />
        <KpiCard icon={<CheckCircle2 size={18} />} label="Approved" value={String(stats.approved)} tone="teal" />
        <KpiCard icon={<XCircle size={18} />} label="Rejected" value={String(stats.rejected)} tone="rose" />
        <KpiCard icon={<CheckCircle2 size={18} />} label="Paid" value={String(stats.paid)} tone="blue" />
      </div>

      <div className="card">
        <div className="card-body flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search claim no, insurer, patient..." className="flex-1" />
          <select className="input flex-none w-full sm:w-44" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="All">All Statuses</option>
            {CLAIM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={<Receipt size={28} />} title="No claims found" description="Create a new insurance claim from an invoice." action={<button className="btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> New Claim</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Claim #</th><th>Patient</th><th>Insurer</th><th className="text-right">Amount</th><th>Submitted</th><th>Status</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {pageItems.map((c) => {
                  const patient = patients.find((p) => p.id === c.patientId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="font-mono text-xs font-medium">{c.claimNumber}</td>
                      <td>
                        <button className="text-left hover:text-teal-600 font-medium" onClick={() => onNavigate("patient-detail", { id: c.patientId })}>
                          {patient ? patientFullName(patient) : "—"}
                        </button>
                      </td>
                      <td className="text-slate-600">{c.insurerName}</td>
                      <td className="text-right font-semibold tabular-nums">{currency(c.amount)}</td>
                      <td className="text-slate-600 text-sm">{formatDate(c.submissionDate)}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="text-right">
                        <div className="inline-flex gap-1">
                          <button className="btn-ghost btn-sm !p-1.5" title="View" onClick={() => setViewing(c)}><Eye size={15} /></button>
                          <button className="btn-ghost btn-sm !p-1.5" title="Edit" onClick={() => { setEditing(c); setShowForm(true); }}><Pencil size={15} /></button>
                          <button className="btn-ghost btn-sm !p-1.5 text-rose-500" title="Delete" onClick={() => setDeleteTarget(c)}><Trash2 size={15} /></button>
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
        <ClaimForm
          editing={editing}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            if (editing) {
              updateClaim(editing.id, data);
              logActivity({ kind: "billing", title: "Claim updated", description: `${editing.claimNumber} updated`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
            } else {
              const clm = addClaim(data);
              logActivity({ kind: "billing", title: "Claim created", description: `${clm.claimNumber} created`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
            }
            setShowForm(false);
          }}
        />
      )}

      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={`Claim ${viewing.claimNumber}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-slate-500 uppercase">Patient</p><p className="font-medium">{patients.find((p) => p.id === viewing.patientId) ? patientFullName(patients.find((p) => p.id === viewing.patientId)!) : "—"}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Insurer</p><p className="font-medium">{viewing.insurerName}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Amount</p><p className="font-bold text-teal-600">{currency(viewing.amount)}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Status</p><div><StatusBadge status={viewing.status} /></div></div>
              <div><p className="text-xs text-slate-500 uppercase">Submission Date</p><p className="font-medium">{formatDate(viewing.submissionDate)}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Review Date</p><p className="font-medium">{formatDate(viewing.reviewDate)}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Payment Date</p><p className="font-medium">{formatDate(viewing.paymentDate)}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Invoice</p><p className="font-medium font-mono text-xs">{invoices.find((i) => i.id === viewing.invoiceId)?.invoiceNumber ?? "—"}</p></div>
            </div>

            {viewing.notes && <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{viewing.notes}</div>}

            {viewing.documents.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase mb-2">Supporting Documents</p>
                <div className="space-y-1">
                  {viewing.documents.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-700"><FileText size={14} /> {d}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow actions */}
            {STATUS_FLOW[viewing.status].length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500 uppercase mb-2">Advance Claim Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FLOW[viewing.status].map((next) => (
                    <button
                      key={next}
                      className={`btn-sm ${next === "Approved" || next === "Paid" ? "btn-primary" : next === "Rejected" ? "btn-secondary !text-rose-500 !border-rose-200" : "btn-secondary"}`}
                      onClick={() => advanceStatus(viewing, next)}
                    >
                      <ArrowRight size={14} /> {next}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button className="btn-secondary btn-sm" onClick={() => { setViewing(null); setEditing(viewing); setShowForm(true); }}><Pencil size={14} /> Edit</button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Claim"
        message={`Delete claim ${deleteTarget?.claimNumber}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ClaimForm({
  editing, onClose, onSave,
}: {
  editing: InsuranceClaim | null;
  onClose: () => void;
  onSave: (data: Omit<InsuranceClaim, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const { invoices, patients, insurancePolicies, claims } = useApp();
  const insInvoices = invoices.filter((i) => i.insurancePolicyId);

  const [invoiceId, setInvoiceId] = useState(editing?.invoiceId ?? insInvoices[0]?.id ?? "");
  const [policyId, setPolicyId] = useState(editing?.policyId ?? "");
  const [amount, setAmount] = useState(editing?.amount ?? 0);
  const [status, setStatus] = useState<ClaimStatus>(editing?.status ?? "Draft");
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const selectedInv = invoices.find((i) => i.id === invoiceId);
  const patient = selectedInv ? patients.find((p) => p.id === selectedInv.patientId) : null;
  const patientPolicies = selectedInv ? insurancePolicies.filter((p) => p.patientId === selectedInv.patientId && p.active) : [];
  const selectedPolicy = insurancePolicies.find((p) => p.id === policyId);

  function handleSave() {
    if (!invoiceId || !policyId || !selectedInv || !patient || !selectedPolicy) return;
    onSave({
      claimNumber: editing?.claimNumber ?? generateClaimNumber(claims),
      invoiceId, patientId: selectedInv.patientId, policyId,
      insurerName: selectedPolicy.insurerName, amount, status,
      submissionDate: editing?.submissionDate ?? new Date().toISOString(),
      reviewDate: editing?.reviewDate, paymentDate: editing?.paymentDate,
      notes, documents: editing?.documents ?? [],
    });
  }

  return (
    <Modal open onClose={onClose} title={editing ? "Edit Claim" : "New Insurance Claim"} size="md">
      <div className="space-y-4">
        <div>
          <label className="form-label">Invoice (with insurance)</label>
          <select className="input" value={invoiceId} onChange={(e) => {
            setInvoiceId(e.target.value);
            const inv = invoices.find((i) => i.id === e.target.value);
            if (inv) {
              const pol = insurancePolicies.find((p) => p.id === inv.insurancePolicyId);
              if (pol) { setPolicyId(pol.id); setAmount(inv.insuranceCovered); }
            }
          }}>
            <option value="">— Select invoice —</option>
            {insInvoices.map((i) => {
              const p = patients.find((pt) => pt.id === i.patientId);
              return <option key={i.id} value={i.id}>{i.invoiceNumber} — {p ? patientFullName(p) : "—"}</option>;
            })}
          </select>
        </div>

        {selectedInv && patient && (
          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">Patient</span><span className="font-medium">{patientFullName(patient)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Invoice Total</span><span className="font-medium">{currency(selectedInv.grandTotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Insurance Covered</span><span className="font-medium">{currency(selectedInv.insuranceCovered)}</span></div>
          </div>
        )}

        <div>
          <label className="form-label">Insurance Policy</label>
          <select className="input" value={policyId} onChange={(e) => setPolicyId(e.target.value)}>
            <option value="">— Select policy —</option>
            {patientPolicies.map((p) => <option key={p.id} value={p.id}>{p.insurerName} ({p.coveragePercent}%) — {p.policyNumber}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Claim Amount</label>
            <input type="number" step="0.01" min={0} className="input" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as ClaimStatus)}>
              {CLAIM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Notes</label>
          <textarea className="input min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button className="btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={handleSave} disabled={!invoiceId || !policyId || amount <= 0}>{editing ? "Update Claim" : "Create Claim"}</button>
        </div>
      </div>
    </Modal>
  );
}
