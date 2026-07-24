import { useMemo, useState } from "react";
import { ClipboardList, Plus, Pencil, Trash2, CheckCircle2, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { currency, formatDate } from "@/lib/format";
import type { ProcurementPurchaseOrder, ProcurementPOLine, InventoryDepartment, InventoryCategory, ProcurementPOStatus } from "@/lib/types";
import type { Route } from "@/components/Sidebar";

const DEPARTMENTS: InventoryDepartment[] = ["Laboratory", "Pharmacy", "Medical", "Nursing", "Administration", "Finance", "Reception", "Records", "ICT", "Maintenance"];
const CATEGORIES: InventoryCategory[] = ["Laboratory Reagents", "Laboratory Consumables", "Pharmacy Medications", "Vaccines", "Medical Equipment", "Medical Consumables", "Office Supplies", "Cleaning Supplies", "IT Equipment", "Furniture"];
const PAGE_SIZE = 10;

export default function InvProcurement({ onNavigate: _onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const { procurementPOs, suppliers, currentUser, addProcurementPO, updateProcurementPO, deleteProcurementPO, receiveProcurementPO } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProcurementPurchaseOrder | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return procurementPOs
      .filter((p) => !statusFilter || p.status === statusFilter)
      .filter((p) => !search || p.poNumber.toLowerCase().includes(search.toLowerCase()) || p.supplierName.toLowerCase().includes(search.toLowerCase()));
  }, [procurementPOs, search, statusFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader title="Procurement" subtitle="Purchase orders and procurement workflow" icon={<ClipboardList size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> New Purchase Order</button>} />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search POs..." className="flex-1" />
        <select className="input sm:w-48" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option>Draft</option><option>Submitted</option><option>Approved</option><option>Ordered</option><option>Received</option><option>Cancelled</option>
        </select>
      </div>

      <div className="card">
        {paged.length === 0 ? <EmptyState title="No purchase orders" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>PO Number</th><th>Supplier</th><th>Department</th><th>Requested By</th><th>Order Date</th><th>Expected</th><th>Total</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {paged.map((po) => (
                  <tr key={po.id}>
                    <td className="font-mono text-xs font-medium">{po.poNumber}</td>
                    <td className="text-sm text-slate-900">{po.supplierName}</td>
                    <td className="text-sm text-slate-500">{po.department}</td>
                    <td className="text-sm text-slate-500">{po.requestedByName}</td>
                    <td className="text-sm text-slate-500">{formatDate(po.orderDate)}</td>
                    <td className="text-sm text-slate-500">{formatDate(po.expectedDate)}</td>
                    <td className="text-sm font-semibold tabular-nums">{currency(po.total)}</td>
                    <td><StatusBadge status={po.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        {(po.status === "Submitted" || po.status === "Approved") && (
                          <button className="btn-ghost btn-sm text-teal-600" title="Mark as Ordered" onClick={() => updateProcurementPO(po.id, { status: "Ordered" })}><ClipboardList size={14} /></button>
                        )}
                        {po.status === "Ordered" && (
                          <button className="btn-ghost btn-sm text-green-600" title="Receive PO" onClick={() => receiveProcurementPO(po.id)}><CheckCircle2 size={14} /></button>
                        )}
                        {po.status === "Draft" && (
                          <button className="btn-ghost btn-sm" title="Submit" onClick={() => updateProcurementPO(po.id, { status: "Submitted" })}><CheckCircle2 size={14} /></button>
                        )}
                        <button className="btn-ghost btn-sm" onClick={() => { setEditing(po); setShowForm(true); }}><Pencil size={14} /></button>
                        <button className="btn-ghost btn-sm text-rose-600" onClick={() => setDeleteId(po.id)}><Trash2 size={14} /></button>
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
        <POForm
          editing={editing}
          suppliers={suppliers}
          currentUser={currentUser}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            if (editing) updateProcurementPO(editing.id, data);
            else addProcurementPO(data);
            setShowForm(false);
          }}
        />
      )}

      <ConfirmDialog open={!!deleteId} title="Delete PO" message="Delete this purchase order?"
        onConfirm={() => { if (deleteId) deleteProcurementPO(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />
    </div>
  );
}

function POForm({
  editing, suppliers, currentUser, onClose, onSave,
}: {
  editing: ProcurementPurchaseOrder | null;
  suppliers: { id: string; name: string }[];
  currentUser: { id: string; name: string } | null;
  onClose: () => void;
  onSave: (data: Omit<ProcurementPurchaseOrder, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [form, setForm] = useState({
    poNumber: editing?.poNumber ?? `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    supplierId: editing?.supplierId ?? suppliers[0]?.id ?? "",
    supplierName: editing?.supplierName ?? suppliers[0]?.name ?? "",
    department: editing?.department ?? "Medical" as InventoryDepartment,
    requestedBy: editing?.requestedBy ?? currentUser?.id ?? "",
    requestedByName: editing?.requestedByName ?? currentUser?.name ?? "System",
    approvedBy: editing?.approvedBy,
    approvedByName: editing?.approvedByName,
    status: editing?.status ?? "Draft" as ProcurementPOStatus,
    orderDate: editing?.orderDate ?? new Date().toISOString().slice(0, 10),
    expectedDate: editing?.expectedDate ?? new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    receivedDate: editing?.receivedDate,
    lines: editing?.lines ?? [] as ProcurementPOLine[],
    total: editing?.total ?? 0,
    notes: editing?.notes ?? "",
  });

  const addLine = () => {
    setForm({
      ...form,
      lines: [...form.lines, { id: `pol-${Date.now()}`, itemCode: "", itemName: "", category: "Medical Consumables" as InventoryCategory, quantity: 1, unitCost: 0, receivedQuantity: 0 }],
    });
  };

  const updateLine = (id: string, patch: Partial<ProcurementPOLine>) => {
    const lines = form.lines.map((l) => (l.id === id ? { ...l, ...patch } : l));
    setForm({ ...form, lines, total: lines.reduce((s, l) => s + l.quantity * l.unitCost, 0) });
  };

  const removeLine = (id: string) => {
    const lines = form.lines.filter((l) => l.id !== id);
    setForm({ ...form, lines, total: lines.reduce((s, l) => s + l.quantity * l.unitCost, 0) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find((s) => s.id === form.supplierId);
    onSave({ ...form, supplierName: supplier?.name ?? form.supplierName });
  };

  return (
    <Modal open onClose={onClose} title={editing ? "Edit Purchase Order" : "New Purchase Order"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">PO Number</label><input className="input" value={form.poNumber} onChange={(e) => setForm({ ...form, poNumber: e.target.value })} required /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Supplier</label><select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Department</label><select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value as InventoryDepartment })}>{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Expected Date</label><input type="date" className="input" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} /></div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Line Items</label>
            <button type="button" className="btn-secondary btn-sm" onClick={addLine}><Plus size={14} /> Add Line</button>
          </div>
          {form.lines.length === 0 ? <p className="text-sm text-slate-400 py-4 text-center">No items added yet.</p> : (
            <div className="space-y-2">
              {form.lines.map((line) => (
                <div key={line.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3"><input className="input" placeholder="Item Code" value={line.itemCode} onChange={(e) => updateLine(line.id, { itemCode: e.target.value })} /></div>
                  <div className="col-span-3"><input className="input" placeholder="Item Name" value={line.itemName} onChange={(e) => updateLine(line.id, { itemName: e.target.value })} /></div>
                  <div className="col-span-3"><select className="input" value={line.category} onChange={(e) => updateLine(line.id, { category: e.target.value as InventoryCategory })}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div className="col-span-1"><input type="number" className="input" placeholder="Qty" value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: +e.target.value })} /></div>
                  <div className="col-span-1"><input type="number" step="0.01" className="input" placeholder="Cost" value={line.unitCost} onChange={(e) => updateLine(line.id, { unitCost: +e.target.value })} /></div>
                  <div className="col-span-1"><button type="button" className="btn-ghost btn-sm text-rose-600" onClick={() => removeLine(line.id)}><X size={14} /></button></div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end mt-2"><span className="text-sm font-semibold">Total: {currency(form.total)}</span></div>
        </div>

        <div><label className="block text-xs font-medium text-slate-600 mb-1">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{editing ? "Update" : "Create"} PO</button>
        </div>
      </form>
    </Modal>
  );
}
