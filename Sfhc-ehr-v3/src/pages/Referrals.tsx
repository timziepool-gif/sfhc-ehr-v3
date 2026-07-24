import { useMemo, useState } from "react";
import {
  Send, Plus, Eye, Pencil, Trash2, Filter, ArrowRight, Clock,
} from "lucide-react";
import { useApp } from "@/lib/store";
import {
  PageHeader, SearchInput, StatusBadge, EmptyState, Pagination, KpiCard,
} from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { age, formatDate, formatDateTime, patientFullName } from "@/lib/format";
import type { Referral, ReferralUrgency, ReferralStatus } from "@/lib/types";
import type { Route } from "@/components/Sidebar";

const PAGE_SIZE = 8;
const URGENCIES: ReferralUrgency[] = ["Routine", "Urgent", "Emergency"];
const STATUSES: ReferralStatus[] = [
  "Draft", "Sent", "Accepted", "Appointment Scheduled", "Completed", "Closed",
];

const URGENCY_BADGE: Record<ReferralUrgency, string> = {
  Routine: "badge-slate",
  Urgent: "badge-amber",
  Emergency: "badge-rose",
};

export default function Referrals({
  onNavigate,
  preselectPatientId,
}: {
  onNavigate: (r: Route, params?: Record<string, string>) => void;
  preselectPatientId?: string;
}) {
  const {
    referrals, patients, users, currentUser,
    addReferral, updateReferral, deleteReferral, advanceReferralStatus,
  } = useApp();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Referral | null>(null);
  const [viewing, setViewing] = useState<Referral | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return referrals
      .filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (!q) return true;
        const p = patients.find((pt) => pt.id === r.patientId);
        return `${p?.firstName} ${p?.lastName} ${r.referralId} ${r.receivingFacility} ${r.receivingSpecialist} ${r.specialty} ${r.reason}`
          .toLowerCase().includes(q);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [referrals, patients, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCount = referrals.filter((r) =>
    r.status === "Sent" || r.status === "Accepted" || r.status === "Appointment Scheduled"
  ).length;
  const pendingResponseCount = referrals.filter((r) => r.status === "Sent").length;
  const completedCount = referrals.filter((r) => r.status === "Completed" || r.status === "Closed").length;

  const blankForm = {
    patientId: preselectPatientId ?? patients[0]?.id ?? "",
    referringClinicianId: currentUser?.id ?? users[0]?.id ?? "",
    receivingFacility: "",
    receivingSpecialist: "",
    specialty: "",
    reason: "",
    clinicalSummary: "",
    urgency: "Routine" as ReferralUrgency,
    attachments: [] as string[],
    date: new Date().toISOString().slice(0, 10),
    status: "Draft" as ReferralStatus,
  };
  const [form, setForm] = useState(blankForm);

  function openNew() {
    setEditing(null);
    setForm({ ...blankForm, patientId: preselectPatientId ?? patients[0]?.id ?? "" });
    setFormOpen(true);
  }

  function openEdit(r: Referral) {
    setEditing(r);
    const { id, referralId, timeline, createdAt, updatedAt, ...rest } = r;
    void id; void referralId; void timeline; void createdAt; void updatedAt;
    setForm(rest);
    setFormOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      updateReferral(editing.id, form);
    } else {
      addReferral(form);
    }
    setFormOpen(false);
  }

  function handleDelete() {
    if (confirmId) deleteReferral(confirmId);
    setConfirmId(null);
  }

  function handleAdvance(r: Referral, status: ReferralStatus) {
    const actorName = currentUser?.name ?? "System";
    advanceReferralStatus(r.id, status, actorName);
    setViewing((prev) => prev ? { ...prev, status } : prev);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Referrals"
        subtitle="Manage outgoing patient referrals and track their status."
        icon={<Send size={20} />}
        actions={
          <>
            <SearchInput
              value={query}
              onChange={(v) => { setQuery(v); setPage(1); }}
              placeholder="Search patient, facility, reason…"
              className="w-56"
            />
            <button className="btn-primary btn-sm" onClick={openNew}>
              <Plus size={14} /> Create Referral
            </button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Active Referrals" value={activeCount} icon={<Send size={20} />} tone="blue" hint="In progress" />
        <KpiCard label="Pending Responses" value={pendingResponseCount} icon={<Clock size={20} />} tone="amber" hint="Awaiting acceptance" />
        <KpiCard label="Completed Referrals" value={completedCount} icon={<Filter size={20} />} tone="green" hint="Completed or closed" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          className={`btn-sm ${statusFilter === "all" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => { setStatusFilter("all"); setPage(1); }}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`btn-sm ${statusFilter === s ? "btn-primary" : "btn-secondary"}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState
            icon={<Send size={28} />}
            title="No referrals"
            description="Create a referral to send a patient to a specialist."
            action={<button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> Create Referral</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Referral ID</th><th>Patient</th><th>Facility</th><th>Specialist</th>
                  <th>Urgency</th><th>Date</th><th>Status</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => {
                  const p = patients.find((pt) => pt.id === r.patientId);
                  return (
                    <tr
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => setViewing(r)}
                    >
                      <td className="font-mono text-xs text-slate-600">{r.referralId}</td>
                      <td className="font-medium">{p ? patientFullName(p) : "—"}</td>
                      <td className="text-slate-600">{r.receivingFacility}</td>
                      <td className="text-slate-600">{r.receivingSpecialist}</td>
                      <td><span className={URGENCY_BADGE[r.urgency]}>{r.urgency}</span></td>
                      <td className="text-slate-600">{formatDate(r.date)}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button className="btn-ghost btn-sm !p-1.5" onClick={() => setViewing(r)} title="View"><Eye size={15} /></button>
                          <button className="btn-ghost btn-sm !p-1.5" onClick={() => openEdit(r)} title="Edit"><Pencil size={15} /></button>
                          <button className="btn-ghost btn-sm !p-1.5 hover:!text-rose-600" onClick={() => setConfirmId(r.id)} title="Delete"><Trash2 size={15} /></button>
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

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Referral" : "Create Referral"}
        size="xl"
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="label">Patient</label>
              <select
                className="select"
                required
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{patientFullName(p)} ({age(p.dateOfBirth)}y)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Referring Clinician</label>
              <select
                className="select"
                required
                value={form.referringClinicianId}
                onChange={(e) => setForm({ ...form, referringClinicianId: e.target.value })}
              >
                {users.filter((u) => u.role === "physician" || u.role === "admin").map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Receiving Facility</label>
              <input
                className="input"
                required
                placeholder="e.g. Sahel Regional Hospital"
                value={form.receivingFacility}
                onChange={(e) => setForm({ ...form, receivingFacility: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Receiving Specialist</label>
              <input
                className="input"
                required
                placeholder="Dr. Name"
                value={form.receivingSpecialist}
                onChange={(e) => setForm({ ...form, receivingSpecialist: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Specialty</label>
              <input
                className="input"
                required
                placeholder="e.g. Cardiology"
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Urgency</label>
              <select
                className="select"
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value as ReferralUrgency })}
              >
                {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ReferralStatus })}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Reason for Referral</label>
            <input
              className="input"
              required
              placeholder="Brief reason for the referral"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Clinical Summary</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Relevant clinical history, findings, and context for the receiving specialist"
              value={form.clinicalSummary}
              onChange={(e) => setForm({ ...form, clinicalSummary: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Attachments (placeholder)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl px-4 py-6 text-center text-sm text-slate-400">
              File upload placeholder — attach lab results, imaging, or documents.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary"><Send size={16} /> {editing ? "Update Referral" : "Create Referral"}</button>
          </div>
        </form>
      </Modal>

      {/* View modal with timeline */}
      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing ? `Referral ${viewing.referralId}` : ""}
        size="lg"
      >
        {viewing && (
          <ReferralDetail
            referral={viewing}
            patient={patients.find((p) => p.id === viewing.patientId)}
            clinician={users.find((u) => u.id === viewing.referringClinicianId)?.name ?? "—"}
            onAdvance={handleAdvance}
            onNavigate={onNavigate}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete referral?"
        message="This referral record will be permanently removed."
        destructive
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

// ----------------------------------------------------------------------------

function ReferralDetail({
  referral,
  patient,
  clinician,
  onAdvance,
  onNavigate,
}: {
  referral: Referral;
  patient: { firstName: string; lastName: string; id: string; dateOfBirth: string } | undefined;
  clinician: string;
  onAdvance: (r: Referral, s: ReferralStatus) => void;
  onNavigate: (r: Route, params?: Record<string, string>) => void;
}) {
  const nextStatus: Record<ReferralStatus, ReferralStatus | null> = {
    Draft: "Sent",
    Sent: "Accepted",
    Accepted: "Appointment Scheduled",
    "Appointment Scheduled": "Completed",
    Completed: "Closed",
    Closed: null,
  };
  const next = nextStatus[referral.status];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`badge-${referral.urgency === "Emergency" ? "rose" : referral.urgency === "Urgent" ? "amber" : "slate"}`}>
              {referral.urgency}
            </span>
            <StatusBadge status={referral.status} />
          </div>
        </div>
        {next && (
          <button className="btn-primary btn-sm" onClick={() => onAdvance(referral, next)}>
            Advance to "{next}" <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Patient + clinician info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DetailField label="Patient" value={patient ? patientFullName(patient) : "—"} />
        <DetailField label="Referring Clinician" value={clinician} />
        <DetailField label="Receiving Facility" value={referral.receivingFacility} />
        <DetailField label="Receiving Specialist" value={referral.receivingSpecialist} />
        <DetailField label="Specialty" value={referral.specialty} />
        <DetailField label="Date" value={formatDate(referral.date)} />
      </div>

      <DetailField label="Reason for Referral" value={referral.reason} />
      <DetailField label="Clinical Summary" value={referral.clinicalSummary || "—"} />

      {patient && (
        <button
          className="btn-secondary btn-sm"
          onClick={() => onNavigate("patient-detail", { id: patient.id })}
        >
          View Patient Profile <ArrowRight size={14} />
        </button>
      )}

      {/* Timeline */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Referral Timeline</h3>
        <div className="space-y-3">
          {referral.timeline.map((t, i) => (
            <div key={t.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full ${i === referral.timeline.length - 1 ? "bg-teal-600" : "bg-slate-300"}`} />
                {i < referral.timeline.length - 1 && <div className="w-px flex-1 bg-slate-200" />}
              </div>
              <div className="pb-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  <span className="text-xs text-slate-400">{formatDateTime(t.at)}</span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{t.note}</p>
                <p className="text-xs text-slate-400 mt-0.5">by {t.actorName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}
