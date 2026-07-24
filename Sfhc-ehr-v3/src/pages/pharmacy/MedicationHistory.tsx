import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, EmptyState, Pagination } from "@/components/ui";
import { formatDate, patientFullName } from "@/lib/format";
import type { Route } from "@/components/Sidebar";

const PAGE_SIZE = 12;

export default function MedicationHistory({ onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const { medicationHistory, patients } = useApp();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...medicationHistory]
      .filter((m) => {
        if (filter && m.eventType !== filter) return false;
        if (!q) return true;
        const p = patients.find((pt) => pt.id === m.patientId);
        return `${m.medicationName} ${p?.firstName} ${p?.lastName} ${m.details} ${m.eventType}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [medicationHistory, patients, query, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Medication History"
        subtitle="Chronological log of prescribing, dispensing, refill, and cancellation events across all patients."
        icon={<Clock size={20} />}
        actions={
          <>
            <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search medication, patient…" className="w-56" />
            <select className="select w-40" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
              <option value="">All events</option>
              <option>Prescribed</option>
              <option>Dispensed</option>
              <option>Refilled</option>
              <option>Stopped</option>
              <option>Cancelled</option>
            </select>
          </>
        }
      />

      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={<Clock size={28} />} title="No medication history" description="Prescribing and dispensing events will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Date</th><th>Patient</th><th>Medication</th><th>Event</th><th>Details</th><th>Actor</th></tr></thead>
              <tbody>
                {pageItems.map((m) => {
                  const p = patients.find((pt) => pt.id === m.patientId);
                  return (
                    <tr key={m.id} className="cursor-pointer" onClick={() => p && onNavigate("patient-detail", { id: p.id })}>
                      <td className="text-slate-600">{formatDate(m.date)}</td>
                      <td className="font-medium">{p ? patientFullName(p) : "—"}</td>
                      <td className="text-slate-800">{m.medicationName}</td>
                      <td>
                        <span className={`badge-${m.eventType === "Dispensed" ? "green" : m.eventType === "Prescribed" ? "blue" : m.eventType === "Cancelled" ? "rose" : "slate"}`}>
                          {m.eventType}
                        </span>
                      </td>
                      <td className="text-slate-600 text-xs">{m.details}</td>
                      <td className="text-slate-600 text-xs">{m.actorName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>
    </div>
  );
}
