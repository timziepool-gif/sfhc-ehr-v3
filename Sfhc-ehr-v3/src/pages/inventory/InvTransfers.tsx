import { useMemo, useState } from "react";
import { ArrowLeftRight, Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import { formatDate } from "@/lib/format";
import type { StockMovement, InventoryDepartment } from "@/lib/types";

const PAGE_SIZE = 15;
const DEPARTMENTS: InventoryDepartment[] = ["Laboratory", "Pharmacy", "Medical", "Nursing", "Administration", "Finance", "Reception", "Records", "ICT", "Maintenance"];

export default function InvTransfers() {
  const { stockMovements, generalInventory, currentUser, addStockMovement, updateGeneralInventoryItem } = useApp();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const transfers = useMemo(() => {
    return stockMovements
      .filter((m) => m.movementType === "Transferred")
      .filter((m) => !search || m.itemName.toLowerCase().includes(search.toLowerCase()) || m.referenceNumber.toLowerCase().includes(search.toLowerCase()));
  }, [stockMovements, search]);

  const pageCount = Math.ceil(transfers.length / PAGE_SIZE);
  const paged = transfers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader title="Stock Transfers" subtitle="Transfer stock between departments" icon={<ArrowLeftRight size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> New Transfer</button>} />

      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search transfers..." className="flex-1" />

      <div className="card">
        {paged.length === 0 ? <EmptyState title="No stock transfers recorded" description="Transfer stock between departments to see them here." /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Item</th><th>From</th><th>To</th><th>Qty</th><th>Staff</th><th>Reason</th><th>Reference</th></tr>
              </thead>
              <tbody>
                {paged.map((m) => (
                  <tr key={m.id}>
                    <td className="text-sm text-slate-500">{formatDate(m.date)}</td>
                    <td className="font-medium text-slate-900">{m.itemName}</td>
                    <td className="text-sm text-slate-500">{m.fromDepartment ?? "—"}</td>
                    <td className="text-sm text-slate-500">{m.toDepartment ?? "—"}</td>
                    <td className="text-sm tabular-nums font-medium">{m.quantity}</td>
                    <td className="text-sm text-slate-500">{m.staffName}</td>
                    <td className="text-sm text-slate-500 max-w-[200px] truncate">{m.reason}</td>
                    <td className="text-sm font-mono text-xs">{m.referenceNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} total={transfers.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>

      {showForm && (
        <TransferForm
          items={generalInventory}
          currentUser={currentUser}
          onClose={() => setShowForm(false)}
          onSave={(data, itemId, fromDept, toDept, qty) => {
            addStockMovement(data);
            // Stock stays in the same general inventory pool; department change is tracked via movement
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function TransferForm({ items, currentUser, onClose, onSave }: {
  items: { id: string; itemCode: string; itemName: string; department: InventoryDepartment }[];
  currentUser: { id: string; name: string } | null;
  onClose: () => void;
  onSave: (data: Omit<StockMovement, "id" | "createdAt">, itemId: string, fromDept: InventoryDepartment, toDept: InventoryDepartment, qty: number) => void;
}) {
  const [form, setForm] = useState({
    itemId: items[0]?.id ?? "",
    fromDepartment: items[0]?.department ?? "Medical" as InventoryDepartment,
    toDepartment: "Pharmacy" as InventoryDepartment,
    quantity: 1,
    reason: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find((i) => i.id === form.itemId);
    if (!item) return;
    onSave({
      itemId: item.id, itemCode: item.itemCode, itemName: item.itemName,
      movementType: "Transferred", quantity: form.quantity,
      fromDepartment: form.fromDepartment, toDepartment: form.toDepartment,
      staffId: currentUser?.id ?? "", staffName: currentUser?.name ?? "System",
      department: form.toDepartment, reason: form.reason || `Transfer from ${form.fromDepartment} to ${form.toDepartment}`,
      referenceNumber: `TRF-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
    }, item.id, form.fromDepartment, form.toDepartment, form.quantity);
  };

  return (
    <Modal open onClose={onClose} title="New Stock Transfer" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Item</label>
          <select className="input" value={form.itemId} onChange={(e) => { const it = items.find((i) => i.id === e.target.value); setForm({ ...form, itemId: e.target.value, fromDepartment: it?.department ?? form.fromDepartment }); }}>
            {items.map((i) => <option key={i.id} value={i.id}>{i.itemCode} — {i.itemName}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">From Department</label>
            <select className="input" value={form.fromDepartment} onChange={(e) => setForm({ ...form, fromDepartment: e.target.value as InventoryDepartment })}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">To Department</label>
            <select className="input" value={form.toDepartment} onChange={(e) => setForm({ ...form, toDepartment: e.target.value as InventoryDepartment })}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label><input type="number" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} min="1" required /></div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Reason</label><input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Transfer Stock</button>
        </div>
      </form>
    </Modal>
  );
}
