import { useMemo, useState } from "react";
import { Package, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import { formatDate, relativeTime } from "@/lib/format";
import type { StockMovement, StockMovementType, InventoryDepartment } from "@/lib/types";

const PAGE_SIZE = 15;
const MOVEMENT_TYPES: StockMovementType[] = ["Received", "Issued", "Transferred", "Returned", "Damaged", "Expired", "Adjusted"];
const DEPARTMENTS: InventoryDepartment[] = ["Laboratory", "Pharmacy", "Medical", "Nursing", "Administration", "Finance", "Reception", "Records", "ICT", "Maintenance"];

export default function InvAdjustments() {
  const { stockMovements, generalInventory, currentUser, addStockMovement, updateGeneralInventoryItem } = useApp();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    return stockMovements
      .filter((m) => !typeFilter || m.movementType === typeFilter)
      .filter((m) => !search || m.itemName.toLowerCase().includes(search.toLowerCase()) || m.itemCode.toLowerCase().includes(search.toLowerCase()) || m.referenceNumber.toLowerCase().includes(search.toLowerCase()));
  }, [stockMovements, search, typeFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader title="Stock Adjustments" subtitle="Record and track all stock movements" icon={<Package size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> New Adjustment</button>} />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search movements..." className="flex-1" />
        <select className="input sm:w-48" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="card">
        {paged.length === 0 ? <EmptyState title="No stock movements" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Item</th><th>Type</th><th>Qty</th><th>Department</th><th>Staff</th><th>Reason</th><th>Reference</th></tr>
              </thead>
              <tbody>
                {paged.map((m) => (
                  <tr key={m.id}>
                    <td className="text-sm text-slate-500">{formatDate(m.date)}</td>
                    <td className="font-medium text-slate-900">{m.itemName}</td>
                    <td><StatusBadge status={m.movementType} /></td>
                    <td className="text-sm tabular-nums font-medium">{m.movementType === "Received" || m.movementType === "Returned" ? "+" : "-"}{m.quantity}</td>
                    <td className="text-sm text-slate-500">{m.department}</td>
                    <td className="text-sm text-slate-500">{m.staffName}</td>
                    <td className="text-sm text-slate-500 max-w-[200px] truncate">{m.reason}</td>
                    <td className="text-sm font-mono text-xs">{m.referenceNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>

      {showForm && (
        <AdjustmentForm
          items={generalInventory}
          currentUser={currentUser}
          onClose={() => setShowForm(false)}
          onSave={(data, itemId, qtyChange) => {
            addStockMovement(data);
            const item = generalInventory.find((i) => i.id === itemId);
            if (item) {
              const newQty = Math.max(0, item.quantity + qtyChange);
              updateGeneralInventoryItem(itemId, { quantity: newQty });
            }
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function AdjustmentForm({ items, currentUser, onClose, onSave }: {
  items: { id: string; itemCode: string; itemName: string; department: InventoryDepartment }[];
  currentUser: { id: string; name: string } | null;
  onClose: () => void;
  onSave: (data: Omit<StockMovement, "id" | "createdAt">, itemId: string, qtyChange: number) => void;
}) {
  const [form, setForm] = useState({
    itemId: items[0]?.id ?? "",
    movementType: "Adjusted" as StockMovementType,
    quantity: 1,
    department: items[0]?.department ?? "Medical" as InventoryDepartment,
    reason: "",
  });

  const item = items.find((i) => i.id === form.itemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    const qtyChange = form.movementType === "Received" || form.movementType === "Returned" ? form.quantity : -form.quantity;
    onSave({
      itemId: item.id, itemCode: item.itemCode, itemName: item.itemName,
      movementType: form.movementType, quantity: form.quantity,
      staffId: currentUser?.id ?? "", staffName: currentUser?.name ?? "System",
      department: form.department, reason: form.reason,
      referenceNumber: `ADJ-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
    }, item.id, qtyChange);
  };

  return (
    <Modal open onClose={onClose} title="New Stock Adjustment" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Item</label>
          <select className="input" value={form.itemId} onChange={(e) => { const it = items.find((i) => i.id === e.target.value); setForm({ ...form, itemId: e.target.value, department: it?.department ?? form.department }); }}>
            {items.map((i) => <option key={i.id} value={i.id}>{i.itemCode} — {i.itemName}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Movement Type</label>
            <select className="input" value={form.movementType} onChange={(e) => setForm({ ...form, movementType: e.target.value as StockMovementType })}>
              {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label><input type="number" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} min="1" required /></div>
        </div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Reason</label><input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Record Movement</button>
        </div>
      </form>
    </Modal>
  );
}
