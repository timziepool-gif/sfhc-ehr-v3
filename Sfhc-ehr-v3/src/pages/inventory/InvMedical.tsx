import { useMemo, useState } from "react";
import { Package, Plus, Pencil, Trash2, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { currency, formatDate } from "@/lib/format";
import type { GeneralInventoryItem, InventoryCategory, InventoryDepartment } from "@/lib/types";

const CATEGORIES: InventoryCategory[] = ["Medical Consumables", "Medical Equipment", "Office Supplies", "Cleaning Supplies", "IT Equipment", "Furniture", "Vaccines"];
const DEPARTMENTS: InventoryDepartment[] = ["Medical", "Nursing", "Administration", "Finance", "Reception", "Records", "ICT", "Maintenance"];

const PAGE_SIZE = 10;

export default function InvMedical() {
  const { generalInventory, suppliers, addGeneralInventoryItem, updateGeneralInventoryItem, deleteGeneralInventoryItem } = useApp();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GeneralInventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return generalInventory
      .filter((i) => CATEGORIES.includes(i.category))
      .filter((i) => !categoryFilter || i.category === categoryFilter)
      .filter((i) => !search || i.itemName.toLowerCase().includes(search.toLowerCase()) || i.itemCode.toLowerCase().includes(search.toLowerCase()));
  }, [generalInventory, search, categoryFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (item: GeneralInventoryItem) => { setEditing(item); setShowForm(true); };

  return (
    <div className="space-y-5">
      <PageHeader title="Medical Inventory" subtitle="Medical consumables, equipment, and supplies" icon={<Package size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Add Item</button>} />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or code..." className="flex-1" />
        <select className="input sm:w-48" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        {paged.length === 0 ? <EmptyState title="No items found" description="Add inventory items to get started." /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th><th>Name</th><th>Category</th><th>Dept</th><th>Qty</th><th>Min</th><th>Unit Cost</th><th>Expiry</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs">{item.itemCode}</td>
                    <td className="font-medium text-slate-900">{item.itemName}</td>
                    <td className="text-sm text-slate-500">{item.category}</td>
                    <td className="text-sm text-slate-500">{item.department}</td>
                    <td className="text-sm tabular-nums font-medium">{item.quantity}</td>
                    <td className="text-sm tabular-nums text-slate-500">{item.minimumStock}</td>
                    <td className="text-sm tabular-nums">{currency(item.unitCost)}</td>
                    <td className="text-sm text-slate-500">{item.expiryDate ? formatDate(item.expiryDate) : "—"}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(item)}><Pencil size={14} /></button>
                        <button className="btn-ghost btn-sm text-rose-600" onClick={() => setDeleteId(item.id)}><Trash2 size={14} /></button>
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
        <InventoryForm
          editing={editing}
          suppliers={suppliers}
          categories={CATEGORIES}
          departments={DEPARTMENTS}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            if (editing) updateGeneralInventoryItem(editing.id, data);
            else addGeneralInventoryItem(data);
            setShowForm(false);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Item"
        message="Are you sure you want to delete this inventory item?"
        onConfirm={() => { if (deleteId) deleteGeneralInventoryItem(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export function InventoryForm({
  editing, suppliers, categories, departments, onClose, onSave,
}: {
  editing: GeneralInventoryItem | null;
  suppliers: { id: string; name: string }[];
  categories: InventoryCategory[];
  departments: InventoryDepartment[];
  onClose: () => void;
  onSave: (data: Omit<GeneralInventoryItem, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [form, setForm] = useState({
    itemCode: editing?.itemCode ?? `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    itemName: editing?.itemName ?? "",
    category: editing?.category ?? categories[0],
    department: editing?.department ?? departments[0],
    manufacturer: editing?.manufacturer ?? "",
    supplierId: editing?.supplierId ?? suppliers[0]?.id ?? "",
    supplierName: editing?.supplierName ?? suppliers[0]?.name ?? "",
    batchNumber: editing?.batchNumber ?? "",
    serialNumber: editing?.serialNumber ?? "",
    quantity: editing?.quantity ?? 0,
    minimumStock: editing?.minimumStock ?? 10,
    maximumStock: editing?.maximumStock ?? 100,
    unitCost: editing?.unitCost ?? 0,
    sellingPrice: editing?.sellingPrice ?? 0,
    expiryDate: editing?.expiryDate ?? "",
    storageLocation: editing?.storageLocation ?? "",
    status: editing?.status ?? "Active" as const,
    notes: editing?.notes ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find((s) => s.id === form.supplierId);
    onSave({ ...form, supplierName: supplier?.name ?? form.supplierName, sellingPrice: form.sellingPrice || undefined, expiryDate: form.expiryDate || undefined, serialNumber: form.serialNumber || undefined });
  };

  return (
    <Modal open onClose={onClose} title={editing ? "Edit Inventory Item" : "Add Inventory Item"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Item Code"><input className="input" value={form.itemCode} onChange={(e) => setForm({ ...form, itemCode: e.target.value })} required /></Field>
          <Field label="Item Name"><input className="input" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} required /></Field>
          <Field label="Category"><select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as InventoryCategory })}>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
          <Field label="Department"><select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value as InventoryDepartment })}>{departments.map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
          <Field label="Manufacturer"><input className="input" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></Field>
          <Field label="Supplier"><select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Batch Number"><input className="input" value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} /></Field>
          <Field label="Serial Number"><input className="input" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></Field>
          <Field label="Quantity"><input type="number" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} required /></Field>
          <Field label="Minimum Stock"><input type="number" className="input" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: +e.target.value })} /></Field>
          <Field label="Maximum Stock"><input type="number" className="input" value={form.maximumStock} onChange={(e) => setForm({ ...form, maximumStock: +e.target.value })} /></Field>
          <Field label="Unit Cost"><input type="number" step="0.01" className="input" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: +e.target.value })} /></Field>
          <Field label="Selling Price"><input type="number" step="0.01" className="input" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: +e.target.value })} /></Field>
          <Field label="Expiry Date"><input type="date" className="input" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></Field>
          <Field label="Storage Location"><input className="input" value={form.storageLocation} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} /></Field>
          <Field label="Status"><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as GeneralInventoryItem["status"] })}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Discontinued">Discontinued</option></select></Field>
        </div>
        <Field label="Notes"><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{editing ? "Update" : "Add"} Item</button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
