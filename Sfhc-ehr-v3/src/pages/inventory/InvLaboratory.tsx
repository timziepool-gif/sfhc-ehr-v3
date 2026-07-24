import { useMemo, useState } from "react";
import { FlaskConical, Plus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { currency, formatDate } from "@/lib/format";
import type { GeneralInventoryItem, InventoryCategory, InventoryDepartment } from "@/lib/types";
import { InventoryForm } from "./InvMedical";

const CATEGORIES: InventoryCategory[] = ["Laboratory Reagents", "Laboratory Consumables"];
const DEPARTMENTS: InventoryDepartment[] = ["Laboratory"];
const PAGE_SIZE = 10;

export default function InvLaboratory() {
  const { generalInventory, suppliers, addGeneralInventoryItem, updateGeneralInventoryItem, deleteGeneralInventoryItem } = useApp();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GeneralInventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return generalInventory
      .filter((i) => CATEGORIES.includes(i.category))
      .filter((i) => !search || i.itemName.toLowerCase().includes(search.toLowerCase()) || i.itemCode.toLowerCase().includes(search.toLowerCase()));
  }, [generalInventory, search]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader title="Laboratory Inventory" subtitle="Reagents, consumables, and lab supplies" icon={<FlaskConical size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> Add Item</button>} />

      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search lab inventory..." className="flex-1" />

      <div className="card">
        {paged.length === 0 ? <EmptyState title="No lab items found" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Code</th><th>Name</th><th>Category</th><th>Qty</th><th>Min</th><th>Unit Cost</th><th>Expiry</th><th>Location</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {paged.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs">{item.itemCode}</td>
                    <td className="font-medium text-slate-900">{item.itemName}</td>
                    <td className="text-sm text-slate-500">{item.category}</td>
                    <td className="text-sm tabular-nums font-medium">{item.quantity}</td>
                    <td className="text-sm tabular-nums text-slate-500">{item.minimumStock}</td>
                    <td className="text-sm tabular-nums">{currency(item.unitCost)}</td>
                    <td className="text-sm text-slate-500">{item.expiryDate ? formatDate(item.expiryDate) : "—"}</td>
                    <td className="text-sm text-slate-500">{item.storageLocation}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => { setEditing(item); setShowForm(true); }}><Pencil size={14} /></button>
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
          onSave={(data) => { if (editing) updateGeneralInventoryItem(editing.id, data); else addGeneralInventoryItem(data); setShowForm(false); }}
        />
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Item" message="Delete this lab inventory item?"
        onConfirm={() => { if (deleteId) deleteGeneralInventoryItem(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />
    </div>
  );
}
