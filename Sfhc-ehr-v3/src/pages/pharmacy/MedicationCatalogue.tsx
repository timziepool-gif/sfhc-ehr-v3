import { useMemo, useState } from "react";
import { Pill, ShieldAlert } from "lucide-react";
import { PageHeader, SearchInput, EmptyState, Pagination } from "@/components/ui";
import { MED_CATALOG, MED_CATEGORIES } from "@/lib/medications";
import { currency } from "@/lib/format";

const PAGE_SIZE = 12;

export default function MedicationCatalogue() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MED_CATALOG.filter((m) => {
      if (category && m.category !== category) return false;
      if (!q) return true;
      return `${m.name} ${m.genericName} ${m.category} ${m.manufacturer}`.toLowerCase().includes(q);
    });
  }, [query, category]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Medication Catalogue"
        subtitle={`${MED_CATALOG.length} medications across ${MED_CATEGORIES.length} categories.`}
        icon={<Pill size={20} />}
        actions={
          <>
            <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search name, generic, manufacturer…" className="w-64" />
            <select className="select w-44" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <option value="">All categories</option>
              {MED_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </>
        }
      />

      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={<Pill size={28} />} title="No medications found" description="Try a different search or category." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Name</th><th>Generic</th><th>Category</th><th>Form</th><th>Strength</th><th>Default Dose</th><th>Route</th><th>Frequency</th><th>Manufacturer</th><th>Cost</th><th>Controlled</th></tr></thead>
              <tbody>
                {pageItems.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium text-slate-900">{m.name}</td>
                    <td className="text-slate-600">{m.genericName}</td>
                    <td><span className="badge-slate">{m.category}</span></td>
                    <td className="text-slate-600">{m.form}</td>
                    <td className="text-slate-700 font-mono text-xs">{m.strength}</td>
                    <td className="text-slate-600">{m.defaultDose}</td>
                    <td className="text-slate-600">{m.defaultRoute}</td>
                    <td className="text-slate-600">{m.defaultFrequency}</td>
                    <td className="text-slate-600 text-xs">{m.manufacturer}</td>
                    <td className="tabular-nums text-slate-700">{currency(m.typicalCost)}</td>
                    <td>
                      {m.controlled ? (
                        <span className="badge-violet"><ShieldAlert size={10} /> {m.schedule}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
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
    </div>
  );
}
