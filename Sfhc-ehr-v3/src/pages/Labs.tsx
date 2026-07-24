import { useMemo, useState } from "react";
import { FlaskConical, Plus, Pencil, Trash2, Eye, TestTube, Clock, CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination, Tabs } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDate, formatDateTime, patientFullName } from "@/lib/format";
import type { LabOrder, LabPriority, LabSpecimen, LabStatus, LabTestItem } from "@/lib/types";
import type { Route } from "@/components/Sidebar";
import { uid } from "@/lib/storage";

const PAGE_SIZE = 8;
const PRIORITIES: LabPriority[] = ["Routine", "Urgent", "STAT"];
const STATUSES: LabStatus[] = ["Ordered", "Sample-Collected", "In-Progress", "Completed", "Cancelled"];
const SPECIMENS: LabSpecimen[] = ["Blood", "Urine", "Sputum", "Stool", "Swab", "Tissue", "Other"];
const CATEGORIES = ["Haematology", "Biochemistry", "Coagulation", "Microbiology", "Radiology", "Endocrinology", "Serology"];

const COMMON_TESTS = [
  { code: "CBC", name: "Full Blood Count", category: "Haematology", unit: "", ref: "Multiple" },
  { code: "HBA1C", name: "HbA1c", category: "Biochemistry", unit: "%", ref: "< 5.7" },
  { code: "FPG", name: "Fasting Plasma Glucose", category: "Biochemistry", unit: "mmol/L", ref: "3.9-6.1" },
  { code: "LIPID", name: "Lipid Panel", category: "Biochemistry", unit: "mmol/L", ref: "Multiple" },
  { code: "ELECTRO", name: "Electrolytes U&E", category: "Biochemistry", unit: "mmol/L", ref: "Multiple" },
  { code: "INR", name: "INR / PT", category: "Coagulation", unit: "INR", ref: "2.0-3.0" },
  { code: "UACR", name: "Urine Albumin/Creatinine", category: "Biochemistry", unit: "mg/g", ref: "< 30" },
  { code: "CXR", name: "Chest X-Ray", category: "Radiology", unit: "", ref: "N/A" },
  { code: "WIDAL", name: "Widal Test", category: "Serology", unit: "", ref: "Negative" },
  { code: "MPS", name: "Malaria Smear", category: "Microbiology", unit: "", ref: "Negative" },
];

export default function Labs({ onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const { labOrders, patients, users, currentUser, addLabOrder, updateLabOrder, deleteLabOrder } = useApp();
  const [tab, setTab] = useState<"orders" | "results">("orders");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LabOrder | null>(null);
  const [resultOpen, setResultOpen] = useState<LabOrder | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return labOrders
      .filter((l) => {
        if (statusFilter && l.status !== statusFilter) return false;
        if (!q) return true;
        const p = patients.find((pt) => pt.id === l.patientId);
        return `${p?.firstName} ${p?.lastName} ${l.id} ${l.tests.map((t) => t.testName).join(" ")}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));
  }, [labOrders, patients, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const blankForm: Omit<LabOrder, "id" | "orderedAt"> = {
    patientId: patients[0]?.id ?? "", clinicianId: currentUser?.id ?? users[0]?.id ?? "",
    priority: "Routine", status: "Ordered", specimen: "Blood", clinicalIndication: "",
    tests: [], notes: "",
  };
  const [form, setForm] = useState<Omit<LabOrder, "id" | "orderedAt">>(blankForm);

  function openNew() {
    setEditing(null);
    setForm({ ...blankForm, tests: [{ id: uid("t"), testCode: "", testName: "", category: "Haematology", specimen: "Blood", result: "", unit: "", referenceRange: "", flag: "Pending", notes: "" }] });
    setFormOpen(true);
  }
  function openEdit(l: LabOrder) {
    setEditing(l);
    const { id, orderedAt, ...rest } = l;
    void id; void orderedAt;
    setForm(rest);
    setFormOpen(true);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateLabOrder(editing.id, form);
    else addLabOrder(form);
    setFormOpen(false);
  }
  function handleDelete() {
    if (confirmId) deleteLabOrder(confirmId);
    setConfirmId(null);
  }

  function addTestFromCatalog(code: string) {
    const t = COMMON_TESTS.find((c) => c.code === code);
    if (!t) return;
    setForm((f) => ({ ...f, tests: [...f.tests, { id: uid("t"), testCode: t.code, testName: t.name, category: t.category, specimen: f.specimen, result: "", unit: t.unit, referenceRange: t.ref, flag: "Pending", notes: "" }] }));
  }
  function removeTest(id: string) {
    setForm((f) => ({ ...f, tests: f.tests.filter((t) => t.id !== id) }));
  }
  function updateTest(id: string, patch: Partial<LabTestItem>) {
    setForm((f) => ({ ...f, tests: f.tests.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Laboratory Information System"
        subtitle="Order, track, and review laboratory tests."
        icon={<FlaskConical size={20} />}
        actions={
          <>
            <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search patient, test…" className="w-56" />
            <select className="select w-40" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> New Lab Order</button>
          </>
        }
      />

      <Tabs tabs={[{ id: "orders", label: "Lab Orders", count: labOrders.length }, { id: "results", label: "Results", count: labOrders.filter((l) => l.status === "Completed").length }]} active={tab} onChange={(t) => setTab(t as "orders" | "results")} />

      {tab === "orders" && (
        <div className="card overflow-hidden">
          {pageItems.length === 0 ? (
            <EmptyState icon={<FlaskConical size={28} />} title="No lab orders" description="Order a lab test to get started." action={<button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> New Lab Order</button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Order ID</th><th>Patient</th><th>Priority</th><th>Tests</th><th>Status</th><th>Ordered</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {pageItems.map((l) => {
                    const p = patients.find((pt) => pt.id === l.patientId);
                    return (
                      <tr key={l.id} className="cursor-pointer" onClick={() => p && onNavigate("patient-detail", { id: p.id })}>
                        <td className="font-mono text-xs">{l.id}</td>
                        <td className="font-medium">{p ? patientFullName(p) : "—"}</td>
                        <td><span className={`badge-${l.priority === "STAT" ? "rose" : l.priority === "Urgent" ? "amber" : "slate"}`}>{l.priority}</span></td>
                        <td className="text-slate-600 max-w-xs truncate">{l.tests.map((t) => t.testName).join(", ")}</td>
                        <td><StatusBadge status={l.status} /></td>
                        <td className="text-slate-600">{formatDate(l.orderedAt)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button className="btn-ghost btn-sm !p-1.5" onClick={() => setResultOpen(l)} title="Results"><Eye size={15} /></button>
                            <button className="btn-ghost btn-sm !p-1.5" onClick={() => openEdit(l)} title="Edit"><Pencil size={15} /></button>
                            <button className="btn-ghost btn-sm !p-1.5 hover:!text-rose-600" onClick={() => setConfirmId(l.id)} title="Delete"><Trash2 size={15} /></button>
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
      )}

      {tab === "results" && (
        <div className="space-y-3">
          {labOrders.filter((l) => l.status === "Completed").length === 0 ? (
            <div className="card"><EmptyState icon={<CheckCircle2 size={28} />} title="No completed results" description="Completed lab results will appear here." /></div>
          ) : (
            labOrders.filter((l) => l.status === "Completed").map((l) => {
              const p = patients.find((pt) => pt.id === l.patientId);
              return (
                <div key={l.id} className="card">
                  <div className="card-header">
                    <div>
                      <p className="card-title">{p ? patientFullName(p) : "—"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{l.id} · Completed {formatDateTime(l.completedAt)}</p>
                    </div>
                    <button className="btn-ghost btn-sm" onClick={() => setResultOpen(l)}><Eye size={14} /> View</button>
                  </div>
                  <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {l.tests.filter((t) => t.result).map((t) => (
                      <div key={t.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">{t.testName}</p>
                          <StatusBadge status={t.flag} />
                        </div>
                        <p className="text-lg font-semibold text-slate-900 mt-1 tabular-nums">{t.result} <span className="text-xs text-slate-400 font-normal">{t.unit}</span></p>
                        <p className="text-xs text-slate-500">Ref: {t.referenceRange}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Lab order form */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Lab Order" : "New Lab Order"} size="xl">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">Patient</label>
              <select className="select" required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                {patients.map((p) => <option key={p.id} value={p.id}>{patientFullName(p)}</option>)}
              </select>
            </div>
            <div><label className="label">Clinician</label>
              <select className="select" required value={form.clinicianId} onChange={(e) => setForm({ ...form, clinicianId: e.target.value })}>
                {users.filter((u) => u.role === "physician" || u.role === "admin").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div><label className="label">Priority</label>
              <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as LabPriority })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="label">Specimen</label>
              <select className="select" value={form.specimen} onChange={(e) => setForm({ ...form, specimen: e.target.value as LabSpecimen })}>
                {SPECIMENS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Status</label>
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LabStatus })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Clinical Indication</label><input className="input" value={form.clinicalIndication} onChange={(e) => setForm({ ...form, clinicalIndication: e.target.value })} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tests</p>
              <select className="select w-64 btn-sm" value="" onChange={(e) => { if (e.target.value) addTestFromCatalog(e.target.value); e.target.value = ""; }}>
                <option value="">+ Add common test…</option>
                {COMMON_TESTS.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              {form.tests.map((t) => (
                <div key={t.id} className="grid grid-cols-12 gap-2 items-center rounded-lg border border-slate-200 p-2.5">
                  <input className="input col-span-5" placeholder="Test name" value={t.testName} onChange={(e) => updateTest(t.id, { testName: e.target.value, testCode: e.target.value.slice(0, 8).toUpperCase() })} />
                  <select className="select col-span-3" value={t.category} onChange={(e) => updateTest(t.id, { category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input className="input col-span-2" placeholder="Ref range" value={t.referenceRange} onChange={(e) => updateTest(t.id, { referenceRange: e.target.value })} />
                  <button type="button" className="btn-ghost btn-sm !p-1.5 col-span-2 justify-self-end hover:!text-rose-600" onClick={() => removeTest(t.id)}><Trash2 size={15} /></button>
                </div>
              ))}
              {form.tests.length === 0 && <p className="text-sm text-slate-400 text-center py-3">No tests added yet.</p>}
            </div>
          </div>

          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary"><TestTube size={16} /> {editing ? "Update Order" : "Create Order"}</button>
          </div>
        </form>
      </Modal>

      {/* Results modal */}
      <Modal open={resultOpen !== null} onClose={() => setResultOpen(null)} title="Lab Results" subtitle={resultOpen?.id} size="lg">
        {resultOpen && <ResultEditor order={resultOpen} onSave={(tests, status) => { updateLabOrder(resultOpen.id, { tests, status, completedAt: status === "Completed" ? new Date().toISOString() : undefined, labTechId: currentUser?.id }); setResultOpen(null); }} />}
      </Modal>

      <ConfirmDialog open={confirmId !== null} title="Delete lab order?" message="This order will be permanently removed." destructive confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </div>
  );
}

function ResultEditor({ order, onSave }: { order: LabOrder; onSave: (tests: LabTestItem[], status: LabStatus) => void }) {
  const [tests, setTests] = useState<LabTestItem[]>(order.tests);
  const [status, setStatus] = useState<LabStatus>(order.status);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-slate-400" />
        <span className="text-xs text-slate-500">Status:</span>
        <select className="select w-44 btn-sm" value={status} onChange={(e) => setStatus(e.target.value as LabStatus)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-3">
        {tests.map((t) => (
          <div key={t.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">{t.testName || t.testCode}</p>
              <span className="text-xs text-slate-400">{t.category}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="label">Result</label><input className="input" value={t.result} onChange={(e) => setTests((ts) => ts.map((x) => x.id === t.id ? { ...x, result: e.target.value } : x))} /></div>
              <div><label className="label">Unit</label><input className="input" value={t.unit} onChange={(e) => setTests((ts) => ts.map((x) => x.id === t.id ? { ...x, unit: e.target.value } : x))} /></div>
              <div><label className="label">Flag</label>
                <select className="select" value={t.flag} onChange={(e) => setTests((ts) => ts.map((x) => x.id === t.id ? { ...x, flag: e.target.value as LabTestItem["flag"] } : x))}>
                  <option>Normal</option><option>Abnormal</option><option>Critical</option><option>Pending</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-400">Reference: {t.referenceRange}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button className="btn-primary" onClick={() => onSave(tests, status)}><CheckCircle2 size={16} /> Save Results</button>
      </div>
    </div>
  );
}
