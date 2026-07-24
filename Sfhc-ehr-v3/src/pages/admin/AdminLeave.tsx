import { useMemo, useState } from "react";
import { CalendarClock, Plus, Check, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import { formatDate } from "@/lib/format";
import type { LeaveRequest, LeaveType, LeaveStatus } from "@/lib/types";

const PAGE_SIZE = 10;
const LEAVE_TYPES: LeaveType[] = ["Annual Leave", "Sick Leave", "Maternity Leave", "Compassionate Leave", "Unpaid Leave"];

export default function AdminLeave() {
  const { leaveRequests, staff, currentUser, addLeaveRequest, approveLeaveRequest, rejectLeaveRequest, deleteLeaveRequest } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    return leaveRequests
      .filter((l) => !statusFilter || l.status === statusFilter)
      .filter((l) => !search || l.staffName.toLowerCase().includes(search.toLowerCase()) || l.leaveType.toLowerCase().includes(search.toLowerCase()));
  }, [leaveRequests, search, statusFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pendingCount = leaveRequests.filter((l) => l.status === "Pending").length;
  const approvedCount = leaveRequests.filter((l) => l.status === "Approved").length;

  return (
    <div className="space-y-5">
      <PageHeader title="Leave Management" subtitle="Manage staff leave requests" icon={<CalendarClock size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> New Leave Request</button>} />

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 text-center"><p className="text-2xl font-semibold text-amber-600">{pendingCount}</p><p className="text-xs text-slate-500 mt-1">Pending</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-semibold text-teal-600">{approvedCount}</p><p className="text-xs text-slate-500 mt-1">Approved</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search leave..." className="flex-1" />
        <select className="input sm:w-48" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option>Pending</option><option>Approved</option><option>Rejected</option><option>Cancelled</option>
        </select>
      </div>

      <div className="card">
        {paged.length === 0 ? <EmptyState title="No leave requests" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Staff</th><th>Type</th><th>Start</th><th>End</th><th>Days</th><th>Reason</th><th>Approved By</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {paged.map((l) => (
                  <tr key={l.id}>
                    <td className="font-medium text-slate-900">{l.staffName}</td>
                    <td className="text-sm text-slate-500">{l.leaveType}</td>
                    <td className="text-sm text-slate-500">{formatDate(l.startDate)}</td>
                    <td className="text-sm text-slate-500">{formatDate(l.endDate)}</td>
                    <td className="text-sm tabular-nums">{l.days}</td>
                    <td className="text-sm text-slate-500 max-w-[200px] truncate">{l.reason}</td>
                    <td className="text-sm text-slate-500">{l.approvedByName ?? "—"}</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td>
                      {l.status === "Pending" ? (
                        <div className="flex gap-1">
                          <button className="btn-ghost btn-sm text-teal-600" title="Approve" onClick={() => approveLeaveRequest(l.id, currentUser?.id ?? "", currentUser?.name ?? "Admin")}><Check size={14} /></button>
                          <button className="btn-ghost btn-sm text-rose-600" title="Reject" onClick={() => rejectLeaveRequest(l.id, currentUser?.id ?? "", currentUser?.name ?? "Admin")}><X size={14} /></button>
                        </div>
                      ) : (
                        <button className="btn-ghost btn-sm text-rose-600" onClick={() => deleteLeaveRequest(l.id)}><X size={14} /></button>
                      )}
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
        <LeaveForm staff={staff} onClose={() => setShowForm(false)}
          onSave={(data) => { addLeaveRequest(data); setShowForm(false); }} />
      )}
    </div>
  );
}

function LeaveForm({ staff, onClose, onSave }: {
  staff: { id: string; fullName: string; department: string }[];
  onClose: () => void;
  onSave: (data: Omit<LeaveRequest, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [form, setForm] = useState({
    staffId: staff[0]?.id ?? "",
    staffName: staff[0]?.fullName ?? "",
    department: staff[0]?.department ?? "",
    leaveType: "Annual Leave" as LeaveType,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: "",
    status: "Pending" as LeaveStatus,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = staff.find((st) => st.id === form.staffId);
    const days = Math.max(1, Math.round((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000) + 1);
    onSave({ ...form, staffName: s?.fullName ?? form.staffName, department: s?.department ?? form.department, days });
  };

  return (
    <Modal open onClose={onClose} title="New Leave Request" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Staff Member</label>
          <select className="input" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
          </select>
        </div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Leave Type</label>
          <select className="input" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value as LeaveType })}>
            {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label><input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">End Date</label><input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></div>
        </div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Reason</label><textarea className="input" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Submit Request</button>
        </div>
      </form>
    </Modal>
  );
}
