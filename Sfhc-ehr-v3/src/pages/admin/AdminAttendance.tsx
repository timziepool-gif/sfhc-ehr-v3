import { useMemo, useState } from "react";
import { Clock, LogIn, LogOut } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 15;

export default function AdminAttendance() {
  const { attendance, staff, currentUser, clockIn, clockOut } = useApp();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return attendance
      .filter((a) => !search || a.staffName.toLowerCase().includes(search.toLowerCase()) || a.department.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, search]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = attendance.filter((a) => a.date === today);
  const presentCount = todayRecords.filter((a) => a.status === "Present").length;
  const lateCount = todayRecords.filter((a) => a.status === "Late").length;
  const absentCount = todayRecords.filter((a) => a.status === "Absent").length;

  const myStaffId = staff.find((s) => s.userId === currentUser?.id)?.id;
  const myTodayRecord = myStaffId ? attendance.find((a) => a.staffId === myStaffId && a.date === today) : undefined;

  return (
    <div className="space-y-5">
      <PageHeader title="Attendance" subtitle="Track staff attendance and working hours" icon={<Clock size={20} />} />

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center"><p className="text-2xl font-semibold text-teal-600">{presentCount}</p><p className="text-xs text-slate-500 mt-1">Present Today</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-semibold text-amber-600">{lateCount}</p><p className="text-xs text-slate-500 mt-1">Late Today</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-semibold text-rose-600">{absentCount}</p><p className="text-xs text-slate-500 mt-1">Absent Today</p></div>
      </div>

      {myStaffId && (
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">My Attendance — {formatDate(today)}</p>
            <p className="text-xs text-slate-500">{myTodayRecord ? `Clock In: ${myTodayRecord.clockIn ?? "—"} · Clock Out: ${myTodayRecord.clockOut ?? "—"}` : "Not clocked in yet"}</p>
          </div>
          <div className="flex gap-2">
            {!myTodayRecord?.clockIn && <button className="btn-primary btn-sm" onClick={() => clockIn(myStaffId)}><LogIn size={14} /> Clock In</button>}
            {myTodayRecord?.clockIn && !myTodayRecord?.clockOut && <button className="btn-secondary btn-sm" onClick={() => clockOut(myStaffId)}><LogOut size={14} /> Clock Out</button>}
          </div>
        </div>
      )}

      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search attendance..." className="flex-1" />

      <div className="card">
        {paged.length === 0 ? <EmptyState title="No attendance records" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Staff</th><th>Department</th><th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Status</th></tr>
              </thead>
              <tbody>
                {paged.map((a) => (
                  <tr key={a.id}>
                    <td className="text-sm text-slate-500">{formatDate(a.date)}</td>
                    <td className="font-medium text-slate-900">{a.staffName}</td>
                    <td className="text-sm text-slate-500">{a.department}</td>
                    <td className="text-sm tabular-nums">{a.clockIn ?? "—"}</td>
                    <td className="text-sm tabular-nums">{a.clockOut ?? "—"}</td>
                    <td className="text-sm tabular-nums">{a.workingHours > 0 ? `${a.workingHours.toFixed(1)}h` : "—"}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>
    </div>
  );
}
