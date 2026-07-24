import { useMemo, useState } from "react";
import { CalendarDays, Plus, Pencil, Trash2, Clock, User, Stethoscope } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDate, patientFullName } from "@/lib/format";
import type { Appointment, AppointmentStatus, AppointmentType } from "@/lib/types";
import type { Route } from "@/components/Sidebar";

const PAGE_SIZE = 10;
const STATUS_OPTIONS: AppointmentStatus[] = ["Scheduled", "Checked-In", "In-Progress", "Completed", "Cancelled", "No-Show"];
const TYPE_OPTIONS: AppointmentType[] = ["Consultation", "Follow-Up", "Emergency", "Vaccination", "Check-Up", "Lab Visit"];

export default function Appointments({ onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const { appointments, patients, users, currentUser, addAppointment, updateAppointment, deleteAppointment } = useApp();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments
      .filter((a) => {
        if (statusFilter && a.status !== statusFilter) return false;
        if (!q) return true;
        const p = patients.find((pt) => pt.id === a.patientId);
        return `${p?.firstName} ${p?.lastName} ${a.type} ${a.reason}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [appointments, patients, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const blankForm: Omit<Appointment, "id" | "createdAt"> = {
    patientId: patients[0]?.id ?? "", clinicianId: currentUser?.id ?? users[0]?.id ?? "",
    date: new Date().toISOString().slice(0, 10), time: "09:00", type: "Consultation",
    reason: "", status: "Scheduled", notes: "",
  };
  const [form, setForm] = useState<Omit<Appointment, "id" | "createdAt">>(blankForm);

  function openNew() {
    setEditing(null);
    setForm(blankForm);
    setFormOpen(true);
  }
  function openEdit(a: Appointment) {
    setEditing(a);
    setForm({ patientId: a.patientId, clinicianId: a.clinicianId, date: a.date, time: a.time, type: a.type, reason: a.reason, status: a.status, notes: a.notes });
    setFormOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateAppointment(editing.id, form);
    else addAppointment(form);
    setFormOpen(false);
  }
  function handleDelete() {
    if (confirmId) deleteAppointment(confirmId);
    setConfirmId(null);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Appointment Management"
        subtitle={`${appointments.length} appointments scheduled.`}
        icon={<CalendarDays size={20} />}
        actions={
          <>
            <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search patient, reason…" className="w-56" />
            <select className="select w-40" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> New Appointment</button>
          </>
        }
      />

      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={<CalendarDays size={28} />} title="No appointments" description="Schedule a new appointment to get started." action={<button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> New Appointment</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Date & Time</th><th>Patient</th><th>Clinician</th><th>Type</th><th>Reason</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {pageItems.map((a) => {
                  const p = patients.find((pt) => pt.id === a.patientId);
                  return (
                    <tr key={a.id} className="cursor-pointer" onClick={() => p && onNavigate("patient-detail", { id: p.id })}>
                      <td>
                        <p className="font-medium text-slate-900">{formatDate(a.date)}</p>
                        <p className="text-xs text-slate-500 font-mono">{a.time}</p>
                      </td>
                      <td>{p ? patientFullName(p) : "—"}</td>
                      <td className="text-slate-600">{users.find((u) => u.id === a.clinicianId)?.name ?? "—"}</td>
                      <td><span className="badge-slate">{a.type}</span></td>
                      <td className="text-slate-600">{a.reason}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button className="btn-ghost btn-sm !p-1.5" onClick={() => openEdit(a)} title="Edit"><Pencil size={15} /></button>
                          <button className="btn-ghost btn-sm !p-1.5 hover:!text-rose-600" onClick={() => setConfirmId(a.id)} title="Delete"><Trash2 size={15} /></button>
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Appointment" : "New Appointment"} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div><label className="label">Time</label><input type="time" className="input" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
            <div><label className="label">Type</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AppointmentType })}>
                {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Status</label>
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><label className="label">Reason</label><input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary"><Clock size={16} /> {editing ? "Update" : "Schedule"}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmId !== null} title="Delete appointment?" message="This appointment will be permanently removed." destructive confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </div>
  );
}
