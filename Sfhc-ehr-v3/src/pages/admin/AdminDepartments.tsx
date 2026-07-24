import { useState } from "react";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Department } from "@/lib/types";

export default function AdminDepartments() {
  const { departments, staff, addDepartment, updateDepartment, deleteDepartment } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader title="Departments" subtitle="Manage clinic departments" icon={<Building2 size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> Add Department</button>} />

      {departments.length === 0 ? <div className="card"><EmptyState title="No departments" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => {
            const deptStaff = staff.filter((s) => s.department === d.name);
            return (
              <div key={d.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center"><Building2 size={20} /></div>
                  <div className="flex gap-1">
                    <button className="btn-ghost btn-sm" onClick={() => { setEditing(d); setShowForm(true); }}><Pencil size={14} /></button>
                    <button className="btn-ghost btn-sm text-rose-600" onClick={() => setDeleteId(d.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{d.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{d.description}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Head: <span className="font-medium text-slate-700">{d.headOfDepartmentName ?? "Not assigned"}</span></span>
                  <span className="text-slate-500">{deptStaff.length} staff</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <DeptForm editing={editing} staff={staff} onClose={() => setShowForm(false)}
          onSave={(data) => { if (editing) updateDepartment(editing.id, data); else addDepartment(data); setShowForm(false); }} />
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Department" message="Delete this department?"
        onConfirm={() => { if (deleteId) deleteDepartment(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />
    </div>
  );
}

function DeptForm({ editing, staff, onClose, onSave }: {
  editing: Department | null;
  staff: { id: string; fullName: string }[];
  onClose: () => void;
  onSave: (data: Omit<Department, "id" | "createdAt">) => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    headOfDepartment: editing?.headOfDepartment ?? "",
    headOfDepartmentName: editing?.headOfDepartmentName ?? "",
    description: editing?.description ?? "",
    staffCount: editing?.staffCount ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const head = staff.find((s) => s.id === form.headOfDepartment);
    onSave({ ...form, headOfDepartmentName: head?.fullName ?? "" });
  };

  return (
    <Modal open onClose={onClose} title={editing ? "Edit Department" : "Add Department"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Head of Department</label>
          <select className="input" value={form.headOfDepartment} onChange={(e) => setForm({ ...form, headOfDepartment: e.target.value })}>
            <option value="">Not assigned</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
          </select>
        </div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Description</label><textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{editing ? "Update" : "Add"} Department</button>
        </div>
      </form>
    </Modal>
  );
}
