import { useMemo, useState } from "react";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDate } from "@/lib/format";
import type { StaffMember, StaffStatus, Gender } from "@/lib/types";

const PAGE_SIZE = 10;
const STATUSES: StaffStatus[] = ["Active", "On Leave", "Suspended", "Terminated", "Probation"];

export default function AdminStaff() {
  const { staff, departments, addStaff, updateStaff, deleteStaff } = useApp();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return staff
      .filter((s) => !deptFilter || s.department === deptFilter)
      .filter((s) => !search || s.fullName.toLowerCase().includes(search.toLowerCase()) || s.staffId.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));
  }, [staff, search, deptFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader title="Staff Directory" subtitle="Comprehensive staff records" icon={<Users size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> Add Staff</button>} />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search staff..." className="flex-1" />
        <select className="input sm:w-48" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
      </div>

      <div className="card">
        {paged.length === 0 ? <EmptyState title="No staff found" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Staff ID</th><th>Name</th><th>Dept</th><th>Position</th><th>Phone</th><th>Email</th><th>Employed</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {paged.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.staffId}</td>
                    <td className="font-medium text-slate-900">{s.fullName}</td>
                    <td className="text-sm text-slate-500">{s.department}</td>
                    <td className="text-sm text-slate-500">{s.position}</td>
                    <td className="text-sm text-slate-500">{s.phone}</td>
                    <td className="text-sm text-slate-500">{s.email}</td>
                    <td className="text-sm text-slate-500">{formatDate(s.employmentDate)}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => { setEditing(s); setShowForm(true); }}><Pencil size={14} /></button>
                        <button className="btn-ghost btn-sm text-rose-600" onClick={() => setDeleteId(s.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>

      {showForm && (
        <StaffForm editing={editing} departments={departments} onClose={() => setShowForm(false)}
          onSave={(data) => { if (editing) updateStaff(editing.id, data); else addStaff(data); setShowForm(false); }} />
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Staff" message="Delete this staff member?"
        onConfirm={() => { if (deleteId) deleteStaff(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />
    </div>
  );
}

export function StaffForm({ editing, departments, onClose, onSave }: {
  editing: StaffMember | null;
  departments: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: Omit<StaffMember, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [form, setForm] = useState({
    staffId: editing?.staffId ?? `SFHC-${String(Date.now()).slice(-3)}`,
    fullName: editing?.fullName ?? "",
    gender: editing?.gender ?? "Male" as Gender,
    dateOfBirth: editing?.dateOfBirth ?? "",
    phone: editing?.phone ?? "",
    email: editing?.email ?? "",
    address: editing?.address ?? "",
    department: editing?.department ?? departments[0]?.name ?? "Medical",
    position: editing?.position ?? "",
    professionalLicenseNumber: editing?.professionalLicenseNumber ?? "",
    employmentDate: editing?.employmentDate ?? new Date().toISOString().slice(0, 10),
    status: editing?.status ?? "Active" as StaffStatus,
    emergencyContactName: editing?.emergencyContactName ?? "",
    emergencyContactPhone: editing?.emergencyContactPhone ?? "",
    qualifications: editing?.qualifications.join(", ") ?? "",
    specialization: editing?.specialization ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, qualifications: form.qualifications.split(",").map((q) => q.trim()).filter(Boolean), professionalLicenseNumber: form.professionalLicenseNumber || undefined });
  };

  return (
    <Modal open onClose={onClose} title={editing ? "Edit Staff Member" : "Add Staff Member"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Staff ID</label><input className="input" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} required /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label><input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Gender</label><select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}><option>Male</option><option>Female</option><option>Other</option></select></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth</label><input type="date" className="input" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Address</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Department</label><select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>{departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Position</label><input className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">License Number</label><input className="input" value={form.professionalLicenseNumber} onChange={(e) => setForm({ ...form, professionalLicenseNumber: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Employment Date</label><input type="date" className="input" value={form.employmentDate} onChange={(e) => setForm({ ...form, employmentDate: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Status</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StaffStatus })}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Specialization</label><input className="input" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Emergency Contact Name</label><input className="input" value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Emergency Contact Phone</label><input className="input" value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Qualifications (comma-separated)</label><input className="input" value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{editing ? "Update" : "Add"} Staff</button>
        </div>
      </form>
    </Modal>
  );
}
