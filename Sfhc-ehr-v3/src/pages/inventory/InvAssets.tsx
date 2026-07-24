import { useMemo, useState } from "react";
import { Wrench, Plus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { currency, formatDate } from "@/lib/format";
import type { Asset, AssetCategory, AssetServiceStatus, AssetCondition, InventoryDepartment } from "@/lib/types";

const CATEGORIES: AssetCategory[] = ["Medical Equipment", "Laboratory Equipment", "IT Equipment", "Office Equipment", "Furniture", "Infrastructure"];
const DEPARTMENTS: InventoryDepartment[] = ["Laboratory", "Pharmacy", "Medical", "Nursing", "Administration", "Finance", "Reception", "Records", "ICT", "Maintenance"];
const SERVICE_STATUSES: AssetServiceStatus[] = ["In Service", "Under Maintenance", "Decommissioned", "In Storage"];
const CONDITIONS: AssetCondition[] = ["Excellent", "Good", "Fair", "Poor", "Damaged"];
const PAGE_SIZE = 10;

export default function InvAssets() {
  const { assets, staff, addAsset, updateAsset, deleteAsset } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return assets
      .filter((a) => !statusFilter || a.serviceStatus === statusFilter)
      .filter((a) => !search || a.assetName.toLowerCase().includes(search.toLowerCase()) || a.assetId.toLowerCase().includes(search.toLowerCase()));
  }, [assets, search, statusFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader title="Asset Management" subtitle="Track hospital equipment and assets" icon={<Wrench size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> Add Asset</button>} />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search assets..." className="flex-1" />
        <select className="input sm:w-48" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {SERVICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        {paged.length === 0 ? <EmptyState title="No assets found" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Asset ID</th><th>Name</th><th>Category</th><th>Dept</th><th>Location</th><th>Assigned To</th><th>Condition</th><th>Next Maint.</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {paged.map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs">{a.assetId}</td>
                    <td className="font-medium text-slate-900">{a.assetName}</td>
                    <td className="text-sm text-slate-500">{a.category}</td>
                    <td className="text-sm text-slate-500">{a.department}</td>
                    <td className="text-sm text-slate-500">{a.location}</td>
                    <td className="text-sm text-slate-500">{a.assignedStaffName ?? "—"}</td>
                    <td><StatusBadge status={a.condition} /></td>
                    <td className="text-sm text-slate-500">{a.nextMaintenanceDate ? formatDate(a.nextMaintenanceDate) : "—"}</td>
                    <td><StatusBadge status={a.serviceStatus} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => { setEditing(a); setShowForm(true); }}><Pencil size={14} /></button>
                        <button className="btn-ghost btn-sm text-rose-600" onClick={() => setDeleteId(a.id)}><Trash2 size={14} /></button>
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
        <AssetForm editing={editing} staff={staff} onClose={() => setShowForm(false)}
          onSave={(data) => { if (editing) updateAsset(editing.id, data); else addAsset(data); setShowForm(false); }} />
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Asset" message="Delete this asset?"
        onConfirm={() => { if (deleteId) deleteAsset(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />
    </div>
  );
}

function AssetForm({ editing, staff, onClose, onSave }: {
  editing: Asset | null;
  staff: { id: string; fullName: string }[];
  onClose: () => void;
  onSave: (data: Omit<Asset, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [form, setForm] = useState({
    assetId: editing?.assetId ?? `AST-${Date.now().toString(36).toUpperCase().slice(-4)}`,
    assetName: editing?.assetName ?? "",
    category: editing?.category ?? "Medical Equipment" as AssetCategory,
    department: editing?.department ?? "Medical" as InventoryDepartment,
    location: editing?.location ?? "",
    assignedStaffId: editing?.assignedStaffId ?? "",
    assignedStaffName: editing?.assignedStaffName ?? "",
    purchaseDate: editing?.purchaseDate ?? new Date().toISOString().slice(0, 10),
    purchaseCost: editing?.purchaseCost ?? 0,
    warrantyExpiry: editing?.warrantyExpiry ?? "",
    lastMaintenanceDate: editing?.lastMaintenanceDate ?? "",
    nextMaintenanceDate: editing?.nextMaintenanceDate ?? "",
    serviceStatus: editing?.serviceStatus ?? "In Service" as AssetServiceStatus,
    condition: editing?.condition ?? "Good" as AssetCondition,
    depreciation: editing?.depreciation ?? 0,
    notes: editing?.notes ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedStaff = staff.find((s) => s.id === form.assignedStaffId);
    onSave({
      ...form,
      assignedStaffId: assignedStaff?.id || undefined,
      assignedStaffName: assignedStaff?.fullName || undefined,
      warrantyExpiry: form.warrantyExpiry || undefined,
      lastMaintenanceDate: form.lastMaintenanceDate || undefined,
      nextMaintenanceDate: form.nextMaintenanceDate || undefined,
    });
  };

  return (
    <Modal open onClose={onClose} title={editing ? "Edit Asset" : "Add Asset"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Asset ID</label><input className="input" value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} required /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Asset Name</label><input className="input" value={form.assetName} onChange={(e) => setForm({ ...form, assetName: e.target.value })} required /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Category</label><select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as AssetCategory })}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Department</label><select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value as InventoryDepartment })}>{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Location</label><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Assigned Staff</label><select className="input" value={form.assignedStaffId} onChange={(e) => setForm({ ...form, assignedStaffId: e.target.value })}><option value="">Unassigned</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Purchase Date</label><input type="date" className="input" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Purchase Cost</label><input type="number" step="0.01" className="input" value={form.purchaseCost} onChange={(e) => setForm({ ...form, purchaseCost: +e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Warranty Expiry</label><input type="date" className="input" value={form.warrantyExpiry} onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Last Maintenance</label><input type="date" className="input" value={form.lastMaintenanceDate} onChange={(e) => setForm({ ...form, lastMaintenanceDate: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Next Maintenance</label><input type="date" className="input" value={form.nextMaintenanceDate} onChange={(e) => setForm({ ...form, nextMaintenanceDate: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Service Status</label><select className="input" value={form.serviceStatus} onChange={(e) => setForm({ ...form, serviceStatus: e.target.value as AssetServiceStatus })}>{SERVICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Condition</label><select className="input" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as AssetCondition })}>{CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Depreciation</label><input type="number" step="0.01" className="input" value={form.depreciation} onChange={(e) => setForm({ ...form, depreciation: +e.target.value })} /></div>
        </div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{editing ? "Update" : "Add"} Asset</button>
        </div>
      </form>
    </Modal>
  );
}
