import { useMemo, useState } from "react";
import {
  Pill, Plus, Pencil, Trash2, Eye, FileText, AlertTriangle, ShieldAlert, X,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination, Tabs } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDate, formatDateTime, patientFullName } from "@/lib/format";
import { MED_CATALOG, MED_CATEGORIES, FREQUENCY_OPTIONS, ROUTE_OPTIONS, findMed, findInteraction, checkAllergy } from "@/lib/medications";
import type { Prescription, PrescriptionLine, PrescriptionStatus, MedicationRoute } from "@/lib/types";
import type { Route } from "@/components/Sidebar";
import { uid } from "@/lib/storage";

const PAGE_SIZE = 8;
const STATUSES: PrescriptionStatus[] = ["Pending", "Reviewed", "Dispensed", "Cancelled"];

interface SafetyCheck {
  type: "interaction" | "allergy";
  severity: "Mild" | "Moderate" | "High" | "Severe" | "Contraindicated";
  medicationA: string;
  medicationB?: string;
  description: string;
  recommendation: string;
  alternative?: string;
}

export default function Prescriptions({ onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const { prescriptions, patients, users, soapNotes, currentUser, addPrescription, updatePrescription, deletePrescription } = useApp();
  const [tab, setTab] = useState<"all" | "pending" | "reviewed" | "dispensed" | "cancelled">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Prescription | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [detailRx, setDetailRx] = useState<Prescription | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prescriptions
      .filter((r) => {
        if (tab !== "all" && r.status.toLowerCase() !== tab) return false;
        if (!q) return true;
        const p = patients.find((pt) => pt.id === r.patientId);
        return `${p?.firstName} ${p?.lastName} ${r.id} ${r.diagnosis} ${r.lines.map((l) => l.medicationName).join(" ")}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [prescriptions, patients, query, tab]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => ({
    all: prescriptions.length,
    pending: prescriptions.filter((r) => r.status === "Pending").length,
    reviewed: prescriptions.filter((r) => r.status === "Reviewed").length,
    dispensed: prescriptions.filter((r) => r.status === "Dispensed").length,
    cancelled: prescriptions.filter((r) => r.status === "Cancelled").length,
  }), [prescriptions]);

  const blankForm: Omit<Prescription, "id" | "createdAt"> = {
    patientId: patients[0]?.id ?? "", clinicianId: currentUser?.id ?? users.find((u) => u.role === "physician")?.id ?? "",
    date: new Date().toISOString().slice(0, 10), diagnosis: "", lines: [], status: "Pending", notes: "", soapNoteId: undefined,
  };
  const [form, setForm] = useState<Omit<Prescription, "id" | "createdAt">>(blankForm);

  function openNew() {
    setEditing(null);
    setForm({ ...blankForm, lines: [{ id: uid("rxl"), medicationId: "", medicationName: "", dose: "", route: "Oral", frequency: "OD", duration: "7 days", quantity: 0, refills: 0, instructions: "" }] });
    setFormOpen(true);
  }
  function openEdit(r: Prescription) {
    setEditing(r);
    const { id, createdAt, ...rest } = r;
    void id; void createdAt;
    setForm(rest);
    setFormOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updatePrescription(editing.id, form);
    else addPrescription(form);
    setFormOpen(false);
  }
  function handleDelete() {
    if (confirmId) deletePrescription(confirmId);
    setConfirmId(null);
  }

  function addLine() {
    setForm((f) => ({ ...f, lines: [...f.lines, { id: uid("rxl"), medicationId: "", medicationName: "", dose: "", route: "Oral", frequency: "OD", duration: "7 days", quantity: 0, refills: 0, instructions: "" }] }));
  }
  function updateLine(id: string, patch: Partial<PrescriptionLine>) {
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }
  function removeLine(id: string) {
    setForm((f) => ({ ...f, lines: f.lines.filter((l) => l.id !== id) }));
  }
  function selectMed(lineId: string, medId: string) {
    const med = findMed(medId);
    if (!med) return;
    updateLine(lineId, {
      medicationId: medId,
      medicationName: `${med.name} ${med.strength}`,
      dose: med.defaultDose,
      route: med.defaultRoute,
      frequency: med.defaultFrequency,
    });
  }
  function loadFromSoap(soapId: string) {
    const note = soapNotes.find((s) => s.id === soapId);
    if (!note) return;
    setForm((f) => ({ ...f, soapNoteId: soapId, patientId: note.patientId, diagnosis: note.diagnosis }));
  }

  // Safety checks for the form
  const patient = patients.find((p) => p.id === form.patientId);
  const safetyChecks = useMemo<SafetyCheck[]>(() => {
    const checks: SafetyCheck[] = [];
    const medNames = form.lines.filter((l) => l.medicationName).map((l) => l.medicationName.split(" ")[0]);
    // Interactions between lines
    for (let i = 0; i < medNames.length; i++) {
      for (let j = i + 1; j < medNames.length; j++) {
        const ix = findInteraction(medNames[i], medNames[j]);
        if (ix) {
          checks.push({ type: "interaction", severity: ix.severity, medicationA: medNames[i], medicationB: medNames[j], description: ix.description, recommendation: ix.recommendation });
        }
      }
    }
    // Allergies
    if (patient) {
      const allergens = patient.allergies.map((a) => a.substance);
      for (const line of form.lines) {
        if (!line.medicationId) continue;
        const med = findMed(line.medicationId);
        if (!med) continue;
        const w = checkAllergy(med.name, med.commonAllergies, allergens);
        if (w) {
          checks.push({ type: "allergy", severity: w.severity, medicationA: w.medicationName, description: w.recommendation, recommendation: w.recommendation, alternative: w.alternative });
        }
      }
    }
    return checks;
  }, [form.lines, form.patientId, patient]);

  const highSeverity = safetyChecks.some((c) => c.severity === "High" || c.severity === "Severe" || c.severity === "Contraindicated");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Prescriptions"
        subtitle="Create and manage prescriptions from SOAP notes. Drug interactions and allergies are checked automatically."
        icon={<FileText size={20} />}
        actions={
          <>
            <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search patient, drug…" className="w-56" />
            <button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> New Prescription</button>
          </>
        }
      />

      <Tabs
        tabs={[
          { id: "all", label: "All", count: counts.all },
          { id: "pending", label: "Pending", count: counts.pending },
          { id: "reviewed", label: "Reviewed", count: counts.reviewed },
          { id: "dispensed", label: "Dispensed", count: counts.dispensed },
          { id: "cancelled", label: "Cancelled", count: counts.cancelled },
        ]}
        active={tab}
        onChange={(t) => { setTab(t as typeof tab); setPage(1); }}
      />

      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={<FileText size={28} />} title="No prescriptions" description="Create a new prescription to get started." action={<button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> New Prescription</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th> Rx ID</th><th>Patient</th><th>Clinician</th><th>Date</th><th>Diagnosis</th><th>Items</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {pageItems.map((r) => {
                  const p = patients.find((pt) => pt.id === r.patientId);
                  return (
                    <tr key={r.id} className="cursor-pointer" onClick={() => setDetailRx(r)}>
                      <td className="font-mono text-xs">{r.id}</td>
                      <td className="font-medium">{p ? patientFullName(p) : "—"}</td>
                      <td className="text-slate-600">{users.find((u) => u.id === r.clinicianId)?.name ?? "—"}</td>
                      <td className="text-slate-600">{formatDate(r.date)}</td>
                      <td className="text-slate-700">{r.diagnosis}</td>
                      <td className="text-slate-600 tabular-nums">{r.lines.length}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button className="btn-ghost btn-sm !p-1.5" onClick={() => setDetailRx(r)} title="View"><Eye size={15} /></button>
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

      {/* Prescription form */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Prescription" : "New Prescription"} size="xl">
        <form onSubmit={submit} className="space-y-4">
          {/* Safety banner */}
          {safetyChecks.length > 0 && (
            <div className={`rounded-xl border p-3 ${highSeverity ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"}`}>
              <div className="flex items-center gap-2 mb-2">
                {highSeverity ? <ShieldAlert size={16} className="text-rose-600" /> : <AlertTriangle size={16} className="text-amber-600" />}
                <p className={`text-sm font-semibold ${highSeverity ? "text-rose-700" : "text-amber-700"}`}>
                  {safetyChecks.length} safety warning{safetyChecks.length > 1 ? "s" : ""} detected
                </p>
              </div>
              <div className="space-y-1.5">
                {safetyChecks.map((c, i) => (
                  <div key={i} className="text-xs text-slate-700 bg-white/60 rounded-lg px-2.5 py-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge-${c.severity === "High" || c.severity === "Severe" || c.severity === "Contraindicated" ? "rose" : c.severity === "Moderate" ? "amber" : "slate"}`}>
                        {c.type === "interaction" ? "Interaction" : "Allergy"} · {c.severity}
                      </span>
                      <span className="font-medium text-slate-800">{c.medicationA}{c.medicationB ? ` + ${c.medicationB}` : ""}</span>
                    </div>
                    <p className="mt-1 text-slate-600">{c.description}</p>
                    <p className="mt-0.5"><span className="font-medium text-slate-700">Recommendation:</span> {c.recommendation}</p>
                    {c.alternative && <p className="mt-0.5"><span className="font-medium text-slate-700">Alternative:</span> {c.alternative}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="label">Patient</label>
              <select className="select" required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                {patients.map((p) => <option key={p.id} value={p.id}>{patientFullName(p)}</option>)}
              </select>
            </div>
            <div><label className="label">Clinician</label>
              <select className="select" required value={form.clinicianId} onChange={(e) => setForm({ ...form, clinicianId: e.target.value })}>
                {users.filter((u) => u.role === "physician" || u.role === "admin").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div><label className="label">Date</label><input type="date" className="input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">Diagnosis</label><input className="input" required value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></div>
            <div><label className="label">From SOAP Note (optional)</label>
              <select className="select" value={form.soapNoteId ?? ""} onChange={(e) => { if (e.target.value) loadFromSoap(e.target.value); else setForm((f) => ({ ...f, soapNoteId: undefined })); }}>
                <option value="">— None —</option>
                {soapNotes.map((s) => {
                  const p = patients.find((pt) => pt.id === s.patientId);
                  return <option key={s.id} value={s.id}>{p?.lastName} · {s.diagnosis} · {formatDate(s.encounterDate)}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Patient allergies reminder */}
          {patient && patient.allergies.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>Patient allergies: <strong>{patient.allergies.map((a) => a.substance).join(", ")}</strong></span>
            </div>
          )}

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Medication Lines</p>
              <button type="button" className="btn-secondary btn-sm" onClick={addLine}><Plus size={14} /> Add Line</button>
            </div>
            <div className="space-y-3">
              {form.lines.map((line, idx) => (
                <div key={line.id} className="rounded-xl border border-slate-200 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Line {idx + 1}</span>
                    {form.lines.length > 1 && <button type="button" className="btn-ghost btn-sm !p-1 hover:!text-rose-600" onClick={() => removeLine(line.id)}><X size={14} /></button>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    <div className="lg:col-span-2"><label className="label">Medication</label>
                      <select className="select" value={line.medicationId} onChange={(e) => selectMed(line.id, e.target.value)} required>
                        <option value="">Select medication…</option>
                        {MED_CATEGORIES.map((cat) => (
                          <optgroup key={cat.value} label={cat.label}>
                            {MED_CATALOG.filter((m) => m.category === cat.value).map((m) => (
                              <option key={m.id} value={m.id}>{m.name} {m.strength} — {m.form}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div><label className="label">Quantity</label><input type="number" min={0} className="input" value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: parseInt(e.target.value) || 0 })} required /></div>
                    <div><label className="label">Dose</label><input className="input" placeholder="e.g. 500mg" value={line.dose} onChange={(e) => updateLine(line.id, { dose: e.target.value })} required /></div>
                    <div><label className="label">Route</label>
                      <select className="select" value={line.route} onChange={(e) => updateLine(line.id, { route: e.target.value as MedicationRoute })}>
                        {ROUTE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div><label className="label">Frequency</label>
                      <select className="select" value={line.frequency} onChange={(e) => updateLine(line.id, { frequency: e.target.value })}>
                        {FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div><label className="label">Duration</label><input className="input" placeholder="e.g. 7 days" value={line.duration} onChange={(e) => updateLine(line.id, { duration: e.target.value })} required /></div>
                    <div><label className="label">Refills</label><input type="number" min={0} className="input" value={line.refills} onChange={(e) => updateLine(line.id, { refills: parseInt(e.target.value) || 0 })} /></div>
                    <div className="lg:col-span-3"><label className="label">Instructions</label><input className="input" placeholder="Take with food, etc." value={line.instructions} onChange={(e) => updateLine(line.id, { instructions: e.target.value })} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Status</label>
              <select className="select w-36 btn-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PrescriptionStatus })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={highSeverity && form.status !== "Cancelled" && !editing}>
                <FileText size={16} /> {editing ? "Update" : "Create Prescription"}
              </button>
            </div>
          </div>
          {highSeverity && !editing && <p className="text-xs text-rose-600 text-right">Resolve high-severity warnings or cancel the prescription to save.</p>}
        </form>
      </Modal>

      {/* Detail modal */}
      <Modal open={detailRx !== null} onClose={() => setDetailRx(null)} title="Prescription Detail" subtitle={detailRx?.id} size="lg">
        {detailRx && <PrescriptionDetail rx={detailRx} onDispense={() => { const rx = detailRx; setDetailRx(null); onNavigate("dispensing", { rxId: rx.id }); }} onEdit={() => { const rx = detailRx; setDetailRx(null); openEdit(rx); }} />}
      </Modal>

      <ConfirmDialog open={confirmId !== null} title="Delete prescription?" message="This prescription will be permanently removed." destructive confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </div>
  );
}

function PrescriptionDetail({ rx, onDispense, onEdit }: { rx: Prescription; onDispense: () => void; onEdit: () => void }) {
  const { patients, users } = useApp();
  const p = patients.find((pt) => pt.id === rx.patientId);
  const clinician = users.find((u) => u.id === rx.clinicianId);
  const pharmacist = rx.pharmacistId ? users.find((u) => u.id === rx.pharmacistId) : null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label="Patient" value={p ? patientFullName(p) : "—"} />
        <Info label="Clinician" value={clinician?.name ?? "—"} />
        <Info label="Date" value={formatDate(rx.date)} />
        <Info label="Status" value={<StatusBadge status={rx.status} />} />
        <Info label="Diagnosis" value={rx.diagnosis} />
        <Info label="Pharmacist" value={pharmacist?.name ?? "—"} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Medications</p>
        <div className="space-y-2">
          {rx.lines.map((l) => (
            <div key={l.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900">{l.medicationName}</p>
                <span className="text-sm text-slate-600 tabular-nums">Qty {l.quantity} · Refills {l.refills}</span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">{l.dose} · {l.route} · {l.frequency} · {l.duration}</p>
              {l.instructions && <p className="text-xs text-slate-500 mt-1">{l.instructions}</p>}
            </div>
          ))}
        </div>
      </div>

      {rx.notes && <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Notes</p><p className="text-sm text-slate-700">{rx.notes}</p></div>}

      <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div><p className="font-medium text-slate-700">Created</p><p>{formatDateTime(rx.createdAt)}</p></div>
        <div><p className="font-medium text-slate-700">Reviewed</p><p>{rx.reviewedAt ? formatDateTime(rx.reviewedAt) : "—"}</p></div>
        <div><p className="font-medium text-slate-700">Dispensed</p><p>{rx.dispensedAt ? formatDateTime(rx.dispensedAt) : "—"}</p></div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button className="btn-secondary" onClick={onEdit}><Pencil size={14} /> Edit</button>
        {rx.status === "Reviewed" || rx.status === "Pending" ? (
          <button className="btn-primary" onClick={onDispense}><Pill size={14} /> Dispense</button>
        ) : (
          <button className="btn-secondary" disabled title="Only reviewed/pending prescriptions can be dispensed"><Pill size={14} /> Dispense</button>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}
