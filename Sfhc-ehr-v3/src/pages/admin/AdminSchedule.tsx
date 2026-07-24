import { useMemo, useState } from "react";
import { CalendarRange, Plus, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDate } from "@/lib/format";
import type { ScheduleEntry, ShiftType } from "@/lib/types";

const PAGE_SIZE = 15;
const SHIFTS: ShiftType[] = ["Morning", "Afternoon", "Night", "On-Call"];

export default function AdminSchedule() {
  const { schedule, staff, addScheduleEntry, deleteScheduleEntry } = useApp();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return schedule
      .filter((s) => !search || s.staffName.toLowerCase().includes(search.toLowerCase()) || s.department.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [schedule, search]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader title="Staff Schedule" subtitle="Duty roster and shift assignments" icon={<CalendarRange size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Add Shift</button>} />

      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search schedule..." className="flex-1" />

      <div className="card">
        {paged.length === 0 ? <EmptyState title="No schedule entries" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Staff</th><th>Department</th><th>Shift</th><th>Start</th><th>End</th><th>Notes</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {paged.map((s) => (
                  <tr key={s.id}>
                    <td className="text-sm text-slate-500">{formatDate(s.date)}</td>
                    <td className="font-medium text-slate-900">{s.staffName}</td>
                    <td className="text-sm text-slate-500">{s.department}</td>
                    <td><StatusBadge status={s.shift} /></td>
                    <td className="text-sm tabular-nums">{s.startTime}</td>
                    <td className="text-sm tabular-nums">{s.endTime}</td>
                    <td className="text-sm text-slate-500 max-w-[200px] truncate">{s.notes}</td>
                    <td><button className="btn-ghost btn-sm text-rose-600" onClick={() => setDeleteId(s.id)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>

      {showForm && (
        <ScheduleForm staff={staff} onClose={() => setShowForm(false)}
          onSave={(data) => { addScheduleEntry(data); setShowForm(false); }} />
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Shift" message="Delete this schedule entry?"
        onConfirm={() => { if (deleteId) deleteScheduleEntry(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />
    </div>
  );
}

function ScheduleForm({ staff, onClose, onSave }: {
  staff: { id: string; fullName: string; department: string }[];
  onClose: () => void;
  onSave: (data: Omit<ScheduleEntry, "id" | "createdAt">) => void;
}) {
  const [form, setForm] = useState({
    staffId: staff[0]?.id ?? "",
    staffName: staff[0]?.fullName ?? "",
    department: staff[0]?.department ?? "",
    date: new Date().toISOString().slice(0, 10),
    shift: "Morning" as ShiftType,
    startTime: "08:00",
    endTime: "17:00",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = staff.find((st) => st.id === form.staffId);
    onSave({ ...form, staffName: s?.fullName ?? form.staffName, department: s?.department ?? form.department });
  };

  return (
    <Modal open onClose={onClose} title="Add Shift" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Staff Member</label>
          <select className="input" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Date</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Shift</label><select className="input" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value as ShiftType })}>{SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label><input type="time" className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">End Time</label><input type="time" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
        </div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Notes</label><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add Shift</button>
        </div>
      </form>
    </Modal>
  );
}
