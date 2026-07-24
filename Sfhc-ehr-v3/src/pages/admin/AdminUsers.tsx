import { useMemo, useState } from "react";
import { UserCog, Plus, Pencil, Trash2, KeyRound, UserX } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDate } from "@/lib/format";
import type { AdminUser, AdminUserRole } from "@/lib/types";

const PAGE_SIZE = 10;
const ROLES: AdminUserRole[] = ["Administrator", "Physician", "Medical Laboratory Scientist", "Pharmacist", "Finance Officer", "Receptionist", "Nurse", "Inventory Officer", "Department Head", "System Auditor"];

export default function AdminUsers() {
  const { adminUsers, departments, staff, addAdminUser, updateAdminUser, deleteAdminUser } = useApp();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => {
    return adminUsers
      .filter((u) => !roleFilter || u.role === roleFilter)
      .filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  }, [adminUsers, search, roleFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader title="User Management" subtitle="Manage system users and access" icon={<UserCog size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> Add User</button>} />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search users..." className="flex-1" />
        <select className="input sm:w-48" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="card">
        {paged.length === 0 ? <EmptyState title="No users found" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Active</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {paged.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium text-slate-900">{u.name}</td>
                    <td className="text-sm text-slate-500">{u.email}</td>
                    <td><StatusBadge status={u.role} /></td>
                    <td className="text-sm text-slate-500">{u.departmentName ?? "—"}</td>
                    <td>{u.active ? <span className="badge-green">Active</span> : <span className="badge-slate">Inactive</span>}</td>
                    <td className="text-sm text-slate-500">{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-ghost btn-sm" title="Reset Password" onClick={() => setResetUser(u)}><KeyRound size={14} /></button>
                        <button className="btn-ghost btn-sm" title="Toggle Active" onClick={() => updateAdminUser(u.id, { active: !u.active })}><UserX size={14} /></button>
                        <button className="btn-ghost btn-sm" onClick={() => { setEditing(u); setShowForm(true); }}><Pencil size={14} /></button>
                        <button className="btn-ghost btn-sm text-rose-600" onClick={() => setDeleteId(u.id)}><Trash2 size={14} /></button>
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
        <UserForm editing={editing} departments={departments} staff={staff} onClose={() => setShowForm(false)}
          onSave={(data) => { if (editing) updateAdminUser(editing.id, data); else addAdminUser(data); setShowForm(false); }} />
      )}

      <ConfirmDialog open={!!deleteId} title="Delete User" message="Delete this user account?"
        onConfirm={() => { if (deleteId) deleteAdminUser(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />

      <ConfirmDialog open={!!resetUser} title="Reset Password" message={`Reset password for ${resetUser?.name}? A temporary password will be generated (mock).`}
        onConfirm={() => { setResetUser(null); }}
        onCancel={() => setResetUser(null)} />
    </div>
  );
}

function UserForm({ editing, departments, staff, onClose, onSave }: {
  editing: AdminUser | null;
  departments: { id: string; name: string }[];
  staff: { id: string; fullName: string }[];
  onClose: () => void;
  onSave: (data: Omit<AdminUser, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    email: editing?.email ?? "",
    role: editing?.role ?? "Nurse" as AdminUserRole,
    department: editing?.department ?? departments[0]?.id ?? "",
    departmentName: editing?.departmentName ?? departments[0]?.name ?? "",
    staffId: editing?.staffId ?? "",
    active: editing?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dept = departments.find((d) => d.id === form.department);
    onSave({ ...form, departmentName: dept?.name ?? "" });
  };

  return (
    <Modal open onClose={onClose} title={editing ? "Edit User" : "Add User"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Role</label><select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminUserRole })}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Department</label><select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Linked Staff</label><select className="input" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}><option value="">None</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}</select></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{editing ? "Update" : "Add"} User</button>
        </div>
      </form>
    </Modal>
  );
}
