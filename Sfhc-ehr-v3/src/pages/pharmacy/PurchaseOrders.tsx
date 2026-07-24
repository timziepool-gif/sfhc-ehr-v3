import { useMemo, useState } from "react";
import { FileText, Plus, Pencil, Trash2, Eye, CheckCircle2, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, StatusBadge, EmptyState, Pagination, KpiCard } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDate, currency } from "@/lib/format";
import { MED_CATALOG, MED_CATEGORIES } from "@/lib/medications";
import type { PurchaseOrder, PurchaseOrderLine, PurchaseOrderStatus } from "@/lib/types";
import type { Route } from "@/components/Sidebar";
import { uid } from "@/lib/storage";

const PAGE_SIZE = 8;
const STATUSES: PurchaseOrderStatus[] = ["Draft", "Submitted", "Approved", "Received", "Cancelled"];
const SUPPLIERS = ["Pharma Distributors", "CareWell Direct", "CardioCare Supplies", "GlucoMed Direct", "RespCare Direct", "TropiMed Direct", "GastroMed Direct", "BioGenix", "MedLine", "NutriCare"];

export default function PurchaseOrders({ onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  void onNavigate;
  const { purchaseOrders, currentUser, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, addInventoryItem, inventory, adjustInventory } = useApp();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [detailPo, setDetailPo] = useState<PurchaseOrder | null>(null);

  const filtered = useMemo(() => [...purchaseOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [purchaseOrders]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const draft = purchaseOrders.filter((p) => p.status === "Draft").length;
  const submitted = purchaseOrders.filter((p) => p.status === "Submitted").length;
  const received = purchaseOrders.filter((p) => p.status === "Received").length;
  const totalValue = purchaseOrders.reduce((s, p) => s + p.total, 0);

  const blankForm: Omit<PurchaseOrder, "id" | "createdAt"> = {
    supplier: SUPPLIERS[0], status: "Draft", orderDate: new Date().toISOString().slice(0, 10),
    expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), lines: [], total: 0, notes: "",
    createdBy: currentUser?.id ?? "",
  };
  const [form, setForm] = useState(blankForm);

  function openNew() {
    setEditing(null);
    setForm({ ...blankForm, lines: [{ id: uid("pol"), medicationId: "", drugName: "", quantity: 0, unitCost: 0, receivedQuantity: 0 }] });
    setFormOpen(true);
  }
  function openEdit(p: PurchaseOrder) {
    setEditing(p);
    const { id, createdAt, ...rest } = p;
    void id; void createdAt;
    setForm(rest);
    setFormOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const total = form.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
    const payload = { ...form, total };
    if (editing) updatePurchaseOrder(editing.id, payload);
    else addPurchaseOrder(payload);
    setFormOpen(false);
  }
  function handleDelete() {
    if (confirmId) deletePurchaseOrder(confirmId);
    setConfirmId(null);
  }

  function addLine() {
    setForm((f) => ({ ...f, lines: [...f.lines, { id: uid("pol"), medicationId: "", drugName: "", quantity: 0, unitCost: 0, receivedQuantity: 0 }] }));
  }
  function updateLine(id: string, patch: Partial<PurchaseOrderLine>) {
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }
  function removeLine(id: string) {
    setForm((f) => ({ ...f, lines: f.lines.filter((l) => l.id !== id) }));
  }
  function selectMed(lineId: string, medId: string) {
    const med = MED_CATALOG.find((m) => m.id === medId);
    if (!med) return;
    updateLine(lineId, { medicationId: medId, drugName: `${med.name} ${med.strength}`, unitCost: med.typicalCost });
  }

  function receive(po: PurchaseOrder) {
    // Add received stock into inventory
    po.lines.forEach((l) => {
      if (l.receivedQuantity <= 0 && l.quantity <= 0) return;
      const qty = l.receivedQuantity || l.quantity;
      const existing = inventory.find((i) => i.medicationId === l.medicationId && i.supplier === po.supplier);
      if (existing) {
        adjustInventory(existing.id, qty);
      } else {
        addInventoryItem({
          drugName: l.drugName, medicationId: l.medicationId,
          category: (MED_CATALOG.find((m) => m.id === l.medicationId)?.category ?? "Other") as never,
          batchNumber: `PO-${po.id.slice(-4)}`, manufacturer: MED_CATALOG.find((m) => m.id === l.medicationId)?.manufacturer ?? "",
          expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
          quantity: qty, minimumStock: 50, reorderLevel: 100,
          unitCost: l.unitCost, supplier: po.supplier, location: "", controlled: MED_CATALOG.find((m) => m.id === l.medicationId)?.controlled ?? false,
        });
      }
    });
    updatePurchaseOrder(po.id, { status: "Received", receivedDate: new Date().toISOString().slice(0, 10) });
    setDetailPo(null);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchase Orders"
        subtitle={`${purchaseOrders.length} orders · ${currency(totalValue)} total value`}
        icon={<FileText size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> New Purchase Order</button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Draft" value={draft} icon={<FileText size={20} />} tone="slate" />
        <KpiCard label="Submitted" value={submitted} icon={<FileText size={20} />} tone="blue" />
        <KpiCard label="Received" value={received} icon={<CheckCircle2 size={20} />} tone="green" />
        <KpiCard label="Total Value" value={currency(totalValue)} icon={<FileText size={20} />} tone="teal" />
      </div>

      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={<FileText size={28} />} title="No purchase orders" description="Create a purchase order to restock inventory." action={<button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> New Purchase Order</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>PO ID</th><th>Supplier</th><th>Order Date</th><th>Expected</th><th>Items</th><th>Total</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="cursor-pointer" onClick={() => setDetailPo(p)}>
                    <td className="font-mono text-xs">{p.id}</td>
                    <td className="font-medium">{p.supplier}</td>
                    <td className="text-slate-600">{formatDate(p.orderDate)}</td>
                    <td className="text-slate-600">{formatDate(p.expectedDate)}</td>
                    <td className="tabular-nums">{p.lines.length}</td>
                    <td className="tabular-nums font-medium">{currency(p.total)}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn-ghost btn-sm !p-1.5" onClick={() => setDetailPo(p)} title="View"><Eye size={15} /></button>
                        <button className="btn-ghost btn-sm !p-1.5" onClick={() => openEdit(p)} title="Edit"><Pencil size={15} /></button>
                        <button className="btn-ghost btn-sm !p-1.5 hover:!text-rose-600" onClick={() => setConfirmId(p.id)} title="Delete"><Trash2 size={15} /></button>
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

      {/* Form modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Purchase Order" : "New Purchase Order"} size="xl">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="label">Supplier</label>
              <select className="select" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
                {SUPPLIERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Order Date</label><input type="date" className="input" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} /></div>
            <div><label className="label">Expected Date</label><input type="date" className="input" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} /></div>
            <div><label className="label">Status</label>
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PurchaseOrderStatus })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Order Lines</p>
              <button type="button" className="btn-secondary btn-sm" onClick={addLine}><Plus size={14} /> Add Line</button>
            </div>
            <div className="space-y-2">
              {form.lines.map((l) => (
                <div key={l.id} className="grid grid-cols-12 gap-2 items-center rounded-lg border border-slate-200 p-2.5">
                  <select className="select col-span-5" value={l.medicationId ?? ""} onChange={(e) => selectMed(l.id, e.target.value)}>
                    <option value="">Select medication…</option>
                    {MED_CATEGORIES.map((cat) => (
                      <optgroup key={cat.value} label={cat.label}>
                        {MED_CATALOG.filter((m) => m.category === cat.value).map((m) => <option key={m.id} value={m.id}>{m.name} {m.strength}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <input type="number" min={0} className="input col-span-2" placeholder="Qty" value={l.quantity} onChange={(e) => updateLine(l.id, { quantity: parseInt(e.target.value) || 0 })} />
                  <input type="number" step="0.01" min={0} className="input col-span-2" placeholder="Unit cost" value={l.unitCost} onChange={(e) => updateLine(l.id, { unitCost: parseFloat(e.target.value) || 0 })} />
                  <span className="col-span-2 text-sm text-slate-600 tabular-nums text-right">{currency(l.quantity * l.unitCost)}</span>
                  <button type="button" className="btn-ghost btn-sm !p-1.5 col-span-1 justify-self-end hover:!text-rose-600" onClick={() => removeLine(l.id)}><X size={14} /></button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2 text-sm font-semibold text-slate-900">
              Total: <span className="tabular-nums ml-2">{currency(form.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0))}</span>
            </div>
          </div>

          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary"><FileText size={16} /> {editing ? "Update" : "Create"} PO</button>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      <Modal open={detailPo !== null} onClose={() => setDetailPo(null)} title="Purchase Order Detail" subtitle={detailPo?.id} size="lg">
        {detailPo && <PoDetail po={detailPo} onReceive={receive} />}
      </Modal>

      <ConfirmDialog open={confirmId !== null} title="Delete purchase order?" message="This order will be permanently removed." destructive confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </div>
  );
}

function PoDetail({ po, onReceive }: { po: PurchaseOrder; onReceive: (po: PurchaseOrder) => void }) {
  const [received, setReceived] = useState<Record<string, number>>({});
  const canReceive = po.status === "Submitted" || po.status === "Approved";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-xs text-slate-500">Supplier</p><p className="font-medium text-slate-900">{po.supplier}</p></div>
        <div><p className="text-xs text-slate-500">Status</p><StatusBadge status={po.status} /></div>
        <div><p className="text-xs text-slate-500">Order Date</p><p className="font-medium text-slate-900">{formatDate(po.orderDate)}</p></div>
        <div><p className="text-xs text-slate-500">Expected Date</p><p className="font-medium text-slate-900">{formatDate(po.expectedDate)}</p></div>
      </div>
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="table">
          <thead><tr><th>Medication</th><th>Qty</th><th>Unit Cost</th><th>Subtotal</th>{canReceive && <th>Received</th>}</tr></thead>
          <tbody>
            {po.lines.map((l) => (
              <tr key={l.id}>
                <td className="font-medium">{l.drugName}</td>
                <td className="tabular-nums">{l.quantity}</td>
                <td className="tabular-nums">{currency(l.unitCost)}</td>
                <td className="tabular-nums">{currency(l.quantity * l.unitCost)}</td>
                {canReceive && (
                  <td>
                    <input type="number" min={0} max={l.quantity} className="input w-24" placeholder={String(l.quantity)} value={received[l.id] ?? l.receivedQuantity} onChange={(e) => setReceived((r) => ({ ...r, [l.id]: parseInt(e.target.value) || 0 }))} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>Total</span><span className="tabular-nums text-lg">{currency(po.total)}</span>
      </div>
      {po.notes && <p className="text-sm text-slate-600">{po.notes}</p>}
      {canReceive && (
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button className="btn-primary" onClick={() => onReceive({ ...po, lines: po.lines.map((l) => ({ ...l, receivedQuantity: received[l.id] ?? l.quantity })) })}>
            <CheckCircle2 size={16} /> Mark Received & Add Stock
          </button>
        </div>
      )}
    </div>
  );
}
