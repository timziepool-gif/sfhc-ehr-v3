import { useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, EmptyState, Pagination } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { AuditModule } from "@/lib/types";

const PAGE_SIZE = 20;
const MODULES: (AuditModule | "All")[] = ["All", "Auth", "Patients", "Appointments", "Clinical", "Laboratory", "Pharmacy", "Billing", "Inventory", "Procurement", "Assets", "Staff", "Users", "Settings"];

export default function AdminAudit() {
  const { auditLogs } = useApp();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return auditLogs
      .filter((l) => !moduleFilter || l.module === moduleFilter)
      .filter((l) => !search || l.userName.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase()));
  }, [auditLogs, search, moduleFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader title="Audit Logs" subtitle="System activity and change tracking" icon={<ScrollText size={20} />} />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search logs..." className="flex-1" />
        <select className="input sm:w-48" value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}>
          {MODULES.map((m) => <option key={m} value={m === "All" ? "" : m}>{m}</option>)}
        </select>
      </div>

      <div className="card">
        {paged.length === 0 ? <EmptyState title="No audit logs" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Time</th><th>User</th><th>Action</th><th>Module</th><th>Description</th><th>IP Address</th></tr>
              </thead>
              <tbody>
                {paged.map((l) => (
                  <tr key={l.id}>
                    <td className="text-sm text-slate-500">{formatDate(l.date)}</td>
                    <td className="text-sm tabular-nums font-mono">{l.time}</td>
                    <td className="font-medium text-slate-900">{l.userName}</td>
                    <td className="text-sm text-slate-700">{l.action}</td>
                    <td><span className="badge-teal">{l.module}</span></td>
                    <td className="text-sm text-slate-500 max-w-[300px] truncate">{l.description}</td>
                    <td className="text-sm font-mono text-xs text-slate-400">{l.ipAddress}</td>
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
