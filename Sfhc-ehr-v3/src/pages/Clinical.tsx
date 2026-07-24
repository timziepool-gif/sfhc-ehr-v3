import { useMemo, useState } from "react";
import { Stethoscope, Plus, Pencil, Trash2, FileText, Eye, Activity, Thermometer, HeartPulse, Droplet, Send } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination, Tabs } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { age, bmi, formatDate, formatDateTime, patientFullName } from "@/lib/format";
import type { SoapNote, SoapNoteType, Vitals } from "@/lib/types";
import type { Route } from "@/components/Sidebar";

const PAGE_SIZE = 8;
const SOAP_TYPES: SoapNoteType[] = ["Initial", "Progress", "Discharge", "Emergency"];

export default function Clinical({ onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const { soapNotes, patients, users, currentUser, addSoapNote, updateSoapNote, deleteSoapNote, addVitals } = useApp();
  const [tab, setTab] = useState<"soap" | "vitals">("soap");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SoapNote | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return soapNotes
      .filter((s) => {
        if (!q) return true;
        const p = patients.find((pt) => pt.id === s.patientId);
        return `${p?.firstName} ${p?.lastName} ${s.diagnosis} ${s.diagnosisCode}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [soapNotes, patients, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const blankForm: Omit<SoapNote, "id" | "createdAt"> = {
    patientId: patients[0]?.id ?? "", clinicianId: currentUser?.id ?? users[0]?.id ?? "",
    encounterDate: new Date().toISOString().slice(0, 10), type: "Progress",
    subjective: "", objective: "", assessment: "", plan: "", diagnosis: "", diagnosisCode: "",
  };
  const [form, setForm] = useState<Omit<SoapNote, "id" | "createdAt">>(blankForm);
  const [vitalsForm, setVitalsForm] = useState<Omit<Vitals, "id">>({
    patientId: patients[0]?.id ?? "", encounterId: "", temperatureC: 37, bloodPressureSystolic: 120, bloodPressureDiastolic: 80,
    heartRate: 72, respiratoryRate: 16, oxygenSaturation: 98, weightKg: 70, heightCm: 170, recordedBy: currentUser?.id ?? users[0]?.id ?? "",
    recordedAt: new Date().toISOString(),
  });
  const [vitalsOpen, setVitalsOpen] = useState(false);

  function openNew() {
    setEditing(null);
    setForm(blankForm);
    setFormOpen(true);
  }
  function openEdit(s: SoapNote) {
    setEditing(s);
    const { id, createdAt, ...rest } = s;
    void id; void createdAt;
    setForm(rest);
    setFormOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateSoapNote(editing.id, form);
    else addSoapNote(form);
    setFormOpen(false);
  }
  function submitVitals(e: React.FormEvent) {
    e.preventDefault();
    addVitals({ ...vitalsForm, recordedAt: new Date().toISOString() });
    setVitalsOpen(false);
  }
  function handleDelete() {
    if (confirmId) deleteSoapNote(confirmId);
    setConfirmId(null);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clinical Documentation"
        subtitle="SOAP notes and patient vitals."
        icon={<Stethoscope size={20} />}
        actions={
          tab === "soap" ? (
            <>
              <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search patient, diagnosis…" className="w-56" />
              <button className="btn-secondary btn-sm" onClick={() => setVitalsOpen(true)}><Activity size={14} /> Record Vitals</button>
              <button className="btn-secondary btn-sm" onClick={() => onNavigate("referrals")}><Send size={14} /> Create Referral</button>
              <button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> New SOAP Note</button>
            </>
          ) : (
            <>
              <button className="btn-secondary btn-sm" onClick={() => onNavigate("referrals")}><Send size={14} /> Create Referral</button>
              <button className="btn-primary btn-sm" onClick={() => setVitalsOpen(true)}><Activity size={14} /> Record Vitals</button>
            </>
          )
        }
      />

      <Tabs tabs={[{ id: "soap", label: "SOAP Notes", count: soapNotes.length }, { id: "vitals", label: "Vitals", count: useApp().vitals.length }]} active={tab} onChange={(t) => setTab(t as "soap" | "vitals")} />

      {tab === "soap" && (
        <div className="card overflow-hidden">
          {pageItems.length === 0 ? (
            <EmptyState icon={<FileText size={28} />} title="No SOAP notes" description="Create a clinical note to get started." action={<button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> New SOAP Note</button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Date</th><th>Patient</th><th>Clinician</th><th>Type</th><th>Diagnosis</th><th>Code</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {pageItems.map((s) => {
                    const p = patients.find((pt) => pt.id === s.patientId);
                    return (
                      <tr key={s.id} className="cursor-pointer" onClick={() => p && onNavigate("patient-detail", { id: p.id })}>
                        <td className="text-slate-600">{formatDate(s.encounterDate)}</td>
                        <td className="font-medium">{p ? patientFullName(p) : "—"}</td>
                        <td className="text-slate-600">{users.find((u) => u.id === s.clinicianId)?.name ?? "—"}</td>
                        <td><StatusBadge status={s.type} tone="blue" /></td>
                        <td className="text-slate-700">{s.diagnosis}</td>
                        <td className="font-mono text-xs text-slate-500">{s.diagnosisCode}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button className="btn-ghost btn-sm !p-1.5" onClick={() => p && onNavigate("patient-detail", { id: p.id })} title="View"><Eye size={15} /></button>
                            <button className="btn-ghost btn-sm !p-1.5" onClick={() => openEdit(s)} title="Edit"><Pencil size={15} /></button>
                            <button className="btn-ghost btn-sm !p-1.5 hover:!text-rose-600" onClick={() => setConfirmId(s.id)} title="Delete"><Trash2 size={15} /></button>
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
      )}

      {tab === "vitals" && <VitalsList />}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit SOAP Note" : "New SOAP Note"} size="xl">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="label">Patient</label>
              <select className="select" required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                {patients.map((p) => <option key={p.id} value={p.id}>{patientFullName(p)} ({age(p.dateOfBirth)}y)</option>)}
              </select>
            </div>
            <div><label className="label">Clinician</label>
              <select className="select" required value={form.clinicianId} onChange={(e) => setForm({ ...form, clinicianId: e.target.value })}>
                {users.filter((u) => u.role === "physician" || u.role === "admin").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div><label className="label">Encounter Date</label><input type="date" className="input" required value={form.encounterDate} onChange={(e) => setForm({ ...form, encounterDate: e.target.value })} /></div>
            <div><label className="label">Type</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as SoapNoteType })}>
                {SOAP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Diagnosis</label><input className="input" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></div>
            <div><label className="label">Diagnosis Code</label><input className="input font-mono" value={form.diagnosisCode} onChange={(e) => setForm({ ...form, diagnosisCode: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SoapField label="Subjective" value={form.subjective} onChange={(v) => setForm({ ...form, subjective: v })} />
            <SoapField label="Objective" value={form.objective} onChange={(v) => setForm({ ...form, objective: v })} />
            <SoapField label="Assessment" value={form.assessment} onChange={(v) => setForm({ ...form, assessment: v })} />
            <SoapField label="Plan" value={form.plan} onChange={(v) => setForm({ ...form, plan: v })} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary"><FileText size={16} /> {editing ? "Update Note" : "Save Note"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={vitalsOpen} onClose={() => setVitalsOpen(false)} title="Record Vitals" size="lg">
        <form onSubmit={submitVitals} className="space-y-4">
          <div><label className="label">Patient</label>
            <select className="select" required value={vitalsForm.patientId} onChange={(e) => setVitalsForm({ ...vitalsForm, patientId: e.target.value })}>
              {patients.map((p) => <option key={p.id} value={p.id}>{patientFullName(p)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <NumField icon={<Thermometer size={14} />} label="Temp (°C)" value={vitalsForm.temperatureC} onChange={(v) => setVitalsForm({ ...vitalsForm, temperatureC: v })} />
            <NumField icon={<HeartPulse size={14} />} label="Systolic" value={vitalsForm.bloodPressureSystolic} onChange={(v) => setVitalsForm({ ...vitalsForm, bloodPressureSystolic: v })} />
            <NumField icon={<HeartPulse size={14} />} label="Diastolic" value={vitalsForm.bloodPressureDiastolic} onChange={(v) => setVitalsForm({ ...vitalsForm, bloodPressureDiastolic: v })} />
            <NumField icon={<HeartPulse size={14} />} label="HR (bpm)" value={vitalsForm.heartRate} onChange={(v) => setVitalsForm({ ...vitalsForm, heartRate: v })} />
            <NumField label="RR" value={vitalsForm.respiratoryRate} onChange={(v) => setVitalsForm({ ...vitalsForm, respiratoryRate: v })} />
            <NumField icon={<Droplet size={14} />} label="SpO₂ %" value={vitalsForm.oxygenSaturation} onChange={(v) => setVitalsForm({ ...vitalsForm, oxygenSaturation: v })} />
            <NumField label="Weight (kg)" value={vitalsForm.weightKg} onChange={(v) => setVitalsForm({ ...vitalsForm, weightKg: v })} />
            <NumField label="Height (cm)" value={vitalsForm.heightCm} onChange={(v) => setVitalsForm({ ...vitalsForm, heightCm: v })} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" className="btn-secondary" onClick={() => setVitalsOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary"><Activity size={16} /> Save Vitals</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmId !== null} title="Delete SOAP note?" message="This clinical note will be permanently removed." destructive confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </div>
  );
}

function VitalsList() {
  const { vitals, patients, users } = useApp();
  if (vitals.length === 0) return <div className="card"><EmptyState icon={<Activity size={28} />} title="No vitals recorded" /></div>;
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead><tr><th>Recorded</th><th>Patient</th><th>BP</th><th>HR</th><th>Temp</th><th>SpO₂</th><th>BMI</th><th>By</th></tr></thead>
          <tbody>
            {vitals.map((v) => {
              const p = patients.find((pt) => pt.id === v.patientId);
              return (
                <tr key={v.id}>
                  <td className="text-slate-600">{formatDateTime(v.recordedAt)}</td>
                  <td className="font-medium">{p ? patientFullName(p) : "—"}</td>
                  <td className="tabular-nums">{v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</td>
                  <td className="tabular-nums">{v.heartRate}</td>
                  <td className="tabular-nums">{v.temperatureC}°</td>
                  <td className="tabular-nums">{v.oxygenSaturation}%</td>
                  <td className="tabular-nums">{bmi(v.weightKg, v.heightCm)}</td>
                  <td className="text-slate-600">{users.find((u) => u.id === v.recordedBy)?.name ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SoapField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input" rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function NumField({ label, value, onChange, icon }: { label: string; value: number; onChange: (v: number) => void; icon?: React.ReactNode }) {
  return (
    <div>
      <label className="label flex items-center gap-1">{icon}{label}</label>
      <input type="number" step="0.1" className="input" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
    </div>
  );
}
