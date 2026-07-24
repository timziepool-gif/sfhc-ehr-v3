import { useMemo, useState } from "react";
import { ShieldAlert, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, EmptyState, Pagination, KpiCard } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDate } from "@/lib/format";
import { MED_CATALOG } from "@/lib/medications";
import type { ControlledDrugEntry } from "@/lib/types";

const PAGE_SIZE = 12;
const SCHEDULES = ["Schedule II", "Schedule III", "Schedule IV", "Schedule V"];
const TRANSACTION_TYPES: ControlledDrugEntry["transactionType"][] = ["Received", "Dispensed", "Destroyed", "Adjusted"];

export default function ControlledDrugs() {
  const { controlled, patients, users, currentUser, addControlledEntry, deleteControlledEntry } = useApp();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const controlledMeds = MED_CATALOG.filter((m) => m.controlled);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...controlled]
      .filter((c) => {
        if (!q) return true;
        return `${c.drugName} ${c.patientName} ${c.prescriberName} ${c.pharmacistName} ${c.reference}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [controlled, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const balances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of controlled) {
      if (!map[c.medicationId ?? c.drugName]) map[c.medicationId ?? c.drugName] = c.runningBalance;
    }
    return map;
  }, [controlled]);

  const blankForm: Omit<ControlledDrugEntry, "id"> = {
    drugName: "", medicationId: undefined, schedule: "Schedule II", transactionType: "Received",
    quantity: 0, runningBalance: 0, prescriberId: "", prescriberName: "", pharmacistId: currentUser?.id ?? "",
    pharmacistName: currentUser?.name ?? "", patientId: "", patientName: "", date: new Date().toISOString().slice(0, 10),
    reference: "", notes: "",
  };
  const [form, setForm] = useState(blankForm);

  function openNew() {
    setEditingNewForm();
    setFormOpen(true);
  }
  function setEditingNewForm() {
    setForm({ ...blankForm });
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const med = MED_CATALOG.find((m) => m.id === form.medicationId);
    const key = form.medicationId ?? form.drugName;
    const current = balances[key] ?? 0;
    const delta = form.transactionType === "Received" || form.transactionType === "Adjusted" ? form.quantity : -form.quantity;
    const running = Math.max(0, current + delta);
    addControlledEntry({ ...form, drugName: med ? `${med.name} ${med.strength}` : form.drugName, runningBalance: running });
    setFormOpen(false);
  }
  function handleDelete() {
    if (confirmId) deleteControlledEntry(confirmId);
    setConfirmId(null);
  }
  function selectMed(medId: string) {
    const med = MED_CATALOG.find((m) => m.id === medId);
    if (!med) return;
    setForm((f) => ({ ...f, medicationId: medId, drugName: `${med.name} ${med.strength}`, schedule: med.schedule ?? "Schedule II" }));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Controlled Drugs Register"
        subtitle="Legally-required register tracking receipt, dispensing, and destruction of controlled substances."
        icon={<ShieldAlert size={20} />}
        actions={
          <>
            <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search drug, patient…" className="w-56" />
            <button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> New Entry</button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Entries" value={controlled.length} icon={<ShieldAlert size={20} />} tone="violet" />
        <KpiCard label="Controlled Drugs" value={controlledMeds.length} icon={<ShieldAlert size={20} />} tone="rose" />
        <KpiCard label="Low Balance Alerts" value={Object.values(balances).filter((b) => b <= 10).length} icon={<AlertTriangle size={20} />} tone="amber" />
        <KpiCard label="Dispensed (total)" value={controlled.filter((c) => c.transactionType === "Dispensed").reduce((s, c) => s + c.quantity, 0)} icon={<ShieldAlert size={20} />} tone="teal" />
      </div>

      {/* Running balances */}
      <div className="card">
        <div className="card-header"><p className="card-title">Running Balances by Drug</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
          {controlledMeds.map((m) => {
            const bal = balances[m.id] ?? 0;
            return (
              <div key={m.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900 text-sm">{m.name} {m.strength}</p>
                  <span className="badge-violet">{m.schedule}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{m.manufacturer}</p>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-xs text-slate-500">Current balance</span>
                  <span className={`text-xl font-semibold tabular-nums ${bal <= 10 ? "text-rose-600" : "text-slate-900"}`}>{bal}</span>
                </div>
                {bal <= 10 && <p className="text-xs text-rose-500 mt-1 flex items-center gap-1"><AlertTriangle size={11} /> Low balance — reorder</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Register table */}
      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={<ShieldAlert size={28} />} title="No entries" description="Add a controlled drug transaction to begin the register." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Date</th><th>Drug</th><th>Schedule</th><th>Type</th><th>Qty</th><th>Balance</th><th>Prescriber</th><th>Pharmacist</th><th>Patient</th><th>Reference</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {pageItems.map((c) => (
                  <tr key={c.id}>
                    <td className="text-slate-600">{formatDate(c.date)}</td>
                    <td className="font-medium">{c.drugName}</td>
                    <td><span className="badge-violet">{c.schedule}</span></td>
                    <td>
                      <span className={`badge-${c.transactionType === "Received" ? "green" : c.transactionType === "Dispensed" ? "blue" : c.transactionType === "Destroyed" ? "rose" : "amber"}`}>
                        {c.transactionType}
                      </span>
                    </td>
                    <td className="tabular-nums">{c.quantity}</td>
                    <td className="tabular-nums font-medium">{c.runningBalance}</td>
                    <td className="text-slate-600 text-xs">{c.prescriberName}</td>
                    <td className="text-slate-600 text-xs">{c.pharmacistName}</td>
                    <td className="text-slate-600 text-xs">{c.patientName}</td>
                    <td className="font-mono text-xs text-slate-500">{c.reference}</td>
                    <td className="text-right">
                      <button className="btn-ghost btn-sm !p-1.5 hover:!text-rose-600" onClick={() => setConfirmId(c.id)} title="Delete"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="New Controlled Drug Entry" size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-2 text-xs text-violet-800 flex items-center gap-2">
            <ShieldAlert size={14} />
            <span>Controlled drug transactions are legally recorded. Verify all details before saving.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className="label">Drug</label>
              <select className="select" value={form.medicationId ?? ""} onChange={(e) => selectMed(e.target.value)} required>
                <option value="">Select controlled drug…</option>
                {controlledMeds.map((m) => <option key={m.id} value={m.id}>{m.name} {m.strength} ({m.schedule})</option>)}
              </select>
            </div>
            <div><label className="label">Schedule</label>
              <select className="select" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })}>
                {SCHEDULES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Transaction Type</label>
              <select className="select" value={form.transactionType} onChange={(e) => setForm({ ...form, transactionType: e.target.value as ControlledDrugEntry["transactionType"] })}>
                {TRANSACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Quantity</label><input type="number" min={0} className="input" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} /></div>
            <div><label className="label">Date</label><input type="date" className="input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><label className="label">Prescriber</label>
              <select className="select" value={form.prescriberId} onChange={(e) => { const u = users.find((x) => x.id === e.target.value); setForm({ ...form, prescriberId: e.target.value, prescriberName: u?.name ?? "" }); }}>
                <option value="">— Stock Receipt / Adjustment —</option>
                {users.filter((u) => u.role === "physician" || u.role === "admin").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div><label className="label">Patient</label>
              <select className="select" value={form.patientId} onChange={(e) => { const p = patients.find((x) => x.id === e.target.value); setForm({ ...form, patientId: e.target.value, patientName: p ? `${p.firstName} ${p.lastName}` : "— Stock Receipt —" }); }}>
                <option value="">— Stock Receipt / Adjustment —</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><label className="label">Reference</label><input className="input font-mono" placeholder="PO / Rx number" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary"><ShieldAlert size={16} /> Record Entry</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmId !== null} title="Delete register entry?" message="This entry will be permanently removed from the controlled drug register." destructive confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </div>
  );
}
