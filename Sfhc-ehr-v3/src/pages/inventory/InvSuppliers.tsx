import { useMemo, useState } from "react";
import { Truck, Plus, Pencil, Trash2, Star } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDate } from "@/lib/format";
import type { Supplier, ContractStatus } from "@/lib/types";

const PAGE_SIZE = 10;

export default function InvSuppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useApp();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return suppliers.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.contactPerson.toLowerCase().includes(search.toLowerCase()));
  }, [suppliers, search]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader title="Suppliers" subtitle="Manage suppliers and vendor relationships" icon={<Truck size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> Add Supplier</button>} />

      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search suppliers..." className="flex-1" />

      <div className="card">
        {paged.length === 0 ? <EmptyState title="No suppliers found" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Contact</th><th>Phone</th><th>Products</th><th>Rating</th><th>Contract</th><th>Orders</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {paged.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-slate-900">{s.name}</td>
                    <td className="text-sm text-slate-500">{s.contactPerson}</td>
                    <td className="text-sm text-slate-500">{s.phone}</td>
                    <td className="text-sm text-slate-500 max-w-[200px] truncate">{s.productsSupplied.join(", ")}</td>
                    <td><span className="text-sm font-medium text-amber-600 inline-flex items-center gap-0.5"><Star size={12} fill="currentColor" />{s.performanceRating.toFixed(1)}</span></td>
                    <td><StatusBadge status={s.contractStatus} /></td>
                    <td className="text-sm tabular-nums">{s.purchaseHistory}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => { setEditing(s); setShowForm(true); }}><Pencil size={14} /></button>
                        <button className="btn-ghost btn-sm text-rose-600" onClick={() => setDeleteId(s.id)}><Trash2 size={14} /></button>
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
        <SupplierForm editing={editing} onClose={() => setShowForm(false)}
          onSave={(data) => { if (editing) updateSupplier(editing.id, data); else addSupplier(data); setShowForm(false); }} />
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Supplier" message="Delete this supplier?"
        onConfirm={() => { if (deleteId) deleteSupplier(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />
    </div>
  );
}

function SupplierForm({ editing, onClose, onSave }: {
  editing: Supplier | null;
  onClose: () => void;
  onSave: (data: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    contactPerson: editing?.contactPerson ?? "",
    phone: editing?.phone ?? "",
    email: editing?.email ?? "",
    address: editing?.address ?? "",
    productsSupplied: editing?.productsSupplied.join(", ") ?? "",
    performanceRating: editing?.performanceRating ?? 4.0,
    contractStatus: editing?.contractStatus ?? "Active" as ContractStatus,
    purchaseHistory: editing?.purchaseHistory ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, productsSupplied: form.productsSupplied.split(",").map((p) => p.trim()).filter(Boolean) });
  };

  return (
    <Modal open onClose={onClose} title={editing ? "Edit Supplier" : "Add Supplier"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Contact Person</label><input className="input" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Address</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Products Supplied (comma-separated)</label><input className="input" value={form.productsSupplied} onChange={(e) => setForm({ ...form, productsSupplied: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Performance Rating (1-5)</label><input type="number" step="0.1" min="1" max="5" className="input" value={form.performanceRating} onChange={(e) => setForm({ ...form, performanceRating: +e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Contract Status</label><select className="input" value={form.contractStatus} onChange={(e) => setForm({ ...form, contractStatus: e.target.value as ContractStatus })}><option>Active</option><option>Expired</option><option>Suspended</option><option>Pending</option></select></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{editing ? "Update" : "Add"} Supplier</button>
        </div>
      </form>
    </Modal>
  );
}
