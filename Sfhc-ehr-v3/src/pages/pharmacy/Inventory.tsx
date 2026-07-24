import { useMemo, useState } from "react";
import { Package, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, EmptyState, Pagination, KpiCard } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ProgressBar } from "@/components/Charts";
import { formatDate, currency, daysUntil } from "@/lib/format";
import { MED_CATALOG, MED_CATEGORIES } from "@/lib/medications";
import type { InventoryItem, MedicationCategory } from "@/lib/types";
import { uid } from "@/lib/storage";

const PAGE_SIZE = 10;
const SUPPLIERS = ["Pharma Distributors", "CareWell Direct", "CardioCare Supplies", "GlucoMed Direct", "RespCare Direct", "TropiMed Direct", "GastroMed Direct", "BioGenix", "MedLine", "NutriCare"];

export default function Inventory() {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useApp();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const lowStock = inventory.filter((i) => i.quantity > 0 && i.quantity <= i.reorderLevel).length;
  const outStock = inventory.filter((i) => i.quantity <= 0).length;
  const expired = inventory.filter((i) => daysUntil(i.expiryDate) < 0).length;
  const expiringSoon = inventory.filter((i) => { const d = daysUntil(i.expiryDate); return d >= 0 && d <= 60; }).length;
  const totalValue = inventory.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory.filter((i) => {
      if (categoryFilter && i.category !== categoryFilter) return false;
      if (statusFilter === "low" && !(i.quantity > 0 && i.quantity <= i.reorderLevel)) return false;
      if (statusFilter === "out" && i.quantity > 0) return false;
      if (statusFilter === "expired" && daysUntil(i.expiryDate) >= 0) return false;
      if (statusFilter === "expiring" && !(daysUntil(i.expiryDate) >= 0 && daysUntil(i.expiryDate) <= 60)) return false;
      if (statusFilter === "controlled" && !i.controlled) return false;
      if (!q) return true;
      return `${i.drugName} ${i.batchNumber} ${i.manufacturer} ${i.supplier}`.toLowerCase().includes(q);
    });
  }, [inventory, query, categoryFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const blankForm: Omit<InventoryItem, "id" | "createdAt" | "updatedAt"> = {
    drugName: "", medicationId: undefined, category: "Antibiotic", batchNumber: "", manufacturer: "",
    expiryDate: new Date().toISOString().slice(0, 10), quantity: 0, minimumStock: 50, reorderLevel: 100,
    unitCost: 0, supplier: SUPPLIERS[0], location: "", controlled: false,
  };
  const [form, setForm] = useState(blankForm);

  function openNew() {
    setEditing(null);
    setForm(blankForm);
    setFormOpen(true);
  }
  function openEdit(i: InventoryItem) {
    setEditing(i);
    const { id, createdAt, updatedAt, ...rest } = i;
    void id; void createdAt; void updatedAt;
    setForm(rest);
    setFormOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateInventoryItem(editing.id, form);
    else addInventoryItem(form);
    setFormOpen(false);
  }
  function handleDelete() {
    if (confirmId) deleteInventoryItem(confirmId);
    setConfirmId(null);
  }
  function selectMed(medId: string) {
    const med = MED_CATALOG.find((m) => m.id === medId);
    if (!med) { setForm((f) => ({ ...f, medicationId: undefined })); return; }
    setForm((f) => ({ ...f, medicationId: medId, drugName: `${med.name} ${med.strength}`, category: med.category, manufacturer: med.manufacturer, controlled: med.controlled, unitCost: med.typicalCost }));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Drug Inventory"
        subtitle={`${inventory.length} inventory items · ${currency(totalValue)} total value`}
        icon={<Package size={20} />}
        actions={
          <>
            <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search drug, batch…" className="w-56" />
            <select className="select w-40" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
              <option value="">All categories</option>
              {MED_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select className="select w-40" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
              <option value="expiring">Expiring soon</option>
              <option value="expired">Expired</option>
              <option value="controlled">Controlled</option>
            </select>
            <button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> Add Stock</button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Items" value={inventory.length} icon={<Package size={20} />} tone="teal" />
        <KpiCard label="Low Stock" value={lowStock} icon={<AlertTriangle size={20} />} tone="amber" />
        <KpiCard label="Out of Stock" value={outStock} icon={<AlertTriangle size={20} />} tone="rose" />
        <KpiCard label="Expiring ≤ 60d" value={expiringSoon} icon={<AlertTriangle size={20} />} tone="amber" hint={`${expired} expired`} />
      </div>

      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={<Package size={28} />} title="No inventory items" description="Add stock to get started." action={<button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> Add Stock</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Drug</th><th>Category</th><th>Batch</th><th>Expiry</th><th>Qty</th><th>Stock Level</th><th>Supplier</th><th>Value</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {pageItems.map((i) => {
                  const d = daysUntil(i.expiryDate);
                  const low = i.quantity <= i.reorderLevel;
                  return (
                    <tr key={i.id}>
                      <td>
                        <p className="font-medium text-slate-900">{i.drugName}</p>
                        <p className="text-xs text-slate-500">{i.manufacturer}{i.controlled && <span className="ml-1 badge-violet">Controlled</span>}</p>
                      </td>
                      <td><span className="badge-slate">{i.category}</span></td>
                      <td className="font-mono text-xs">{i.batchNumber}</td>
                      <td>
                        <span className={d < 0 ? "text-rose-600 font-medium" : d <= 60 ? "text-amber-600 font-medium" : "text-slate-600"}>
                          {formatDate(i.expiryDate)}
                        </span>
                        {d < 0 && <span className="block text-xs text-rose-500">Expired</span>}
                        {d >= 0 && d <= 60 && <span className="block text-xs text-amber-500">{d}d left</span>}
                      </td>
                      <td className={`tabular-nums font-medium ${i.quantity <= 0 ? "text-rose-600" : low ? "text-amber-600" : "text-slate-900"}`}>{i.quantity}</td>
                      <td className="min-w-[120px]"><ProgressBar value={i.quantity} max={Math.max(i.reorderLevel * 2, 1)} tone={i.quantity <= 0 ? "rose" : low ? "amber" : "teal"} /></td>
                      <td className="text-slate-600 text-xs">{i.supplier}</td>
                      <td className="tabular-nums text-slate-700">{currency(i.quantity * i.unitCost)}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="btn-ghost btn-sm !p-1.5" onClick={() => openEdit(i)} title="Edit"><Pencil size={15} /></button>
                          <button className="btn-ghost btn-sm !p-1.5 hover:!text-rose-600" onClick={() => setConfirmId(i.id)} title="Delete"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Inventory Item" : "Add Inventory Item"} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className="label">From Medication Catalogue (optional)</label>
              <select className="select" value={form.medicationId ?? ""} onChange={(e) => selectMed(e.target.value)}>
                <option value="">— Custom entry —</option>
                {MED_CATEGORIES.map((cat) => (
                  <optgroup key={cat.value} label={cat.label}>
                    {MED_CATALOG.filter((m) => m.category === cat.value).map((m) => <option key={m.id} value={m.id}>{m.name} {m.strength}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2"><label className="label">Drug Name</label><input className="input" required value={form.drugName} onChange={(e) => setForm({ ...form, drugName: e.target.value })} /></div>
            <div><label className="label">Category</label>
              <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as MedicationCategory })}>
                {MED_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div><label className="label">Batch Number</label><input className="input font-mono" required value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} /></div>
            <div><label className="label">Manufacturer</label><input className="input" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></div>
            <div><label className="label">Expiry Date</label><input type="date" className="input" required value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
            <div><label className="label">Quantity</label><input type="number" min={0} className="input" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} /></div>
            <div><label className="label">Minimum Stock</label><input type="number" min={0} className="input" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: parseInt(e.target.value) || 0 })} /></div>
            <div><label className="label">Reorder Level</label><input type="number" min={0} className="input" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 0 })} /></div>
            <div><label className="label">Unit Cost ($)</label><input type="number" step="0.01" min={0} className="input" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: parseFloat(e.target.value) || 0 })} /></div>
            <div><label className="label">Supplier</label>
              <select className="select" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
                {SUPPLIERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Location</label><input className="input" placeholder="e.g. A1-01" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input type="checkbox" id="controlled" checked={form.controlled} onChange={(e) => setForm({ ...form, controlled: e.target.checked })} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
              <label htmlFor="controlled" className="text-sm text-slate-700">Controlled substance (requires register entry)</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary"><Package size={16} /> {editing ? "Update" : "Add"} Item</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmId !== null} title="Delete inventory item?" message="This item will be permanently removed from inventory." destructive confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </div>
  );
}
