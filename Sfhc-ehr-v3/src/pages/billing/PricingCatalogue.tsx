import { useMemo, useState } from "react";
import {
  Banknote, Plus, Pencil, Trash2, Search, X, CheckCircle2, XCircle,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { currency } from "@/lib/format";
import type { PricingItem, BillingCategory } from "@/lib/types";

const PAGE_SIZE = 12;

const CATEGORIES: BillingCategory[] = [
  "Consultation", "Laboratory", "Radiology", "Pharmacy", "Procedures",
  "Vaccination", "Admission", "Emergency", "Dental", "Other Services",
];

export default function PricingCatalogue() {
  const { pricing, addPricingItem, updatePricingItem, deletePricingItem, logActivity, currentUser } = useApp();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [activeFilter, setActiveFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PricingItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PricingItem | null>(null);

  const filtered = useMemo(() => {
    return pricing.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "All" || p.category === categoryFilter;
      const matchesActive = activeFilter === "All" || (activeFilter === "Active" && p.active) || (activeFilter === "Inactive" && !p.active);
      return matchesSearch && matchesCat && matchesActive;
    });
  }, [pricing, search, categoryFilter, activeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleActive(item: PricingItem) {
    updatePricingItem(item.id, { active: !item.active });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deletePricingItem(deleteTarget.id);
    logActivity({ kind: "billing", title: "Pricing item deleted", description: `${deleteTarget.code} — ${deleteTarget.name}`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pricing Catalogue"
        subtitle={`${pricing.length} services · ${pricing.filter((p) => p.active).length} active`}
        actions={<button className="btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> Add Service</button>}
      />

      <div className="card">
        <div className="card-body flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or code..." className="flex-1" />
          <select className="input flex-none w-full sm:w-48" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input flex-none w-full sm:w-36" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={<Banknote size={28} />} title="No pricing items" description="Add a service to the pricing catalogue." action={<button className="btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> Add Service</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Code</th><th>Service Name</th><th>Category</th><th className="text-right">Unit Price</th><th>Description</th><th>Status</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="font-mono text-xs font-medium">{p.code}</td>
                    <td className="font-medium">{p.name}</td>
                    <td><span className="badge-blue">{p.category}</span></td>
                    <td className="text-right font-semibold tabular-nums">{currency(p.unitPrice)}</td>
                    <td className="text-slate-500 text-sm max-w-xs truncate">{p.description || "—"}</td>
                    <td>
                      <button onClick={() => toggleActive(p)} className={`badge-${p.active ? "green" : "slate"} cursor-pointer`}>
                        {p.active ? <><CheckCircle2 size={11} className="inline mr-1" />Active</> : <><XCircle size={11} className="inline mr-1" />Inactive</>}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-1">
                        <button className="btn-ghost btn-sm !p-1.5" title="Edit" onClick={() => { setEditing(p); setShowForm(true); }}><Pencil size={15} /></button>
                        <button className="btn-ghost btn-sm !p-1.5 text-rose-500" title="Delete" onClick={() => setDeleteTarget(p)}><Trash2 size={15} /></button>
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
        <PricingForm
          editing={editing}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            if (editing) {
              updatePricingItem(editing.id, data);
            } else {
              addPricingItem(data);
            }
            setShowForm(false);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Pricing Item"
        message={`Delete ${deleteTarget?.code} — ${deleteTarget?.name}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function PricingForm({
  editing, onClose, onSave,
}: {
  editing: PricingItem | null;
  onClose: () => void;
  onSave: (data: Omit<PricingItem, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [code, setCode] = useState(editing?.code ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [category, setCategory] = useState<BillingCategory>(editing?.category ?? "Consultation");
  const [unitPrice, setUnitPrice] = useState(editing?.unitPrice ?? 0);
  const [description, setDescription] = useState(editing?.description ?? "");
  const [active, setActive] = useState(editing?.active ?? true);

  function handleSave() {
    if (!code || !name) return;
    onSave({ code, name, category, unitPrice, description, active });
  }

  return (
    <Modal open onClose={onClose} title={editing ? "Edit Service" : "Add Pricing Item"} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Code</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CONS-GEN" />
          </div>
          <div>
            <label className="form-label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as BillingCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Service Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. General Consultation" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Unit Price ($)</label>
            <input type="number" step="0.01" min={0} className="input" value={unitPrice} onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="input" value={active ? "yes" : "no"} onChange={(e) => setActive(e.target.value === "yes")}>
              <option value="yes">Active</option>
              <option value="no">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Description</label>
          <textarea className="input min-h-[50px]" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button className="btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={handleSave} disabled={!code || !name}>{editing ? "Update" : "Add Service"}</button>
        </div>
      </div>
    </Modal>
  );
}
