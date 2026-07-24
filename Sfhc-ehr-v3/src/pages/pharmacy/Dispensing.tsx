import { useMemo, useState, useEffect } from "react";
import { Pill, Eye, Activity, Package, AlertTriangle } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState, Pagination, Tabs } from "@/components/ui";
import Modal from "@/components/Modal";
import { formatDate, patientFullName } from "@/lib/format";
import { findMed, findInteraction, checkAllergy } from "@/lib/medications";
import type { DispenseRecord, DispenseStep, DispenseStage, Prescription, PrescriptionLine } from "@/lib/types";
import type { Route } from "@/components/Sidebar";
import { uid, nowISO } from "@/lib/storage";

const PAGE_SIZE = 8;
const STAGES: DispenseStage[] = ["Received", "Prepared", "Verified", "Dispensed", "Completed"];

interface Props {
  initialRxId?: string;
  onNavigate: (r: Route, params?: Record<string, string>) => void;
}

export default function Dispensing({ initialRxId, onNavigate }: Props) {
  const {
    prescriptions, dispenses, patients, users, inventory, controlled, currentUser,
    updatePrescription, addDispense, addControlledEntry, adjustInventory,
  } = useApp();
  const [tab, setTab] = useState<"queue" | "history">("queue");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [dispenseRx, setDispenseRx] = useState<Prescription | null>(null);

  useEffect(() => {
    if (initialRxId) {
      const rx = prescriptions.find((r) => r.id === initialRxId);
      if (rx) setDispenseRx(rx);
    }
  }, [initialRxId, prescriptions]);

  const queue = useMemo(
    () => prescriptions.filter((r) => r.status === "Pending" || r.status === "Reviewed").sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [prescriptions],
  );
  const queueFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return queue;
    return queue.filter((r) => {
      const p = patients.find((pt) => pt.id === r.patientId);
      return `${p?.firstName} ${p?.lastName} ${r.id} ${r.diagnosis}`.toLowerCase().includes(q);
    });
  }, [queue, patients, query]);

  const historyFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dispenses;
    return dispenses.filter((d) => {
      const p = patients.find((pt) => pt.id === d.patientId);
      return `${p?.firstName} ${p?.lastName} ${d.medicationName} ${d.id}`.toLowerCase().includes(q);
    });
  }, [dispenses, patients, query]);

  const list = tab === "queue" ? queueFiltered : historyFiltered;
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const queueItems = queueFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const historyItems = historyFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function inventoryByMed(medId: string) {
    return inventory.find((i) => i.medicationId === medId);
  }

  function controlledBalance(medId: string): number {
    const entries = controlled.filter((c) => c.medicationId === medId).sort((a, b) => b.date.localeCompare(a.date));
    return entries[0]?.runningBalance ?? 0;
  }

  function handleComplete(record: DispenseRecord, qty: number, line: PrescriptionLine) {
    const inv = inventoryByMed(line.medicationId);
    if (inv) adjustInventory(inv.id, -qty);
    addDispense(record, qty);
    if (dispenseRx) {
      updatePrescription(dispenseRx.id, { status: "Dispensed", dispensedAt: nowISO(), pharmacistId: currentUser?.id });
      const med = findMed(line.medicationId);
      if (med?.controlled) {
        const last = controlledBalance(line.medicationId);
        addControlledEntry({
          drugName: line.medicationName, medicationId: line.medicationId, schedule: med.schedule ?? "Schedule II",
          transactionType: "Dispensed", quantity: qty, runningBalance: Math.max(0, last - qty),
          prescriberId: dispenseRx.clinicianId, prescriberName: users.find((u) => u.id === dispenseRx.clinicianId)?.name ?? "—",
          pharmacistId: currentUser?.id ?? "", pharmacistName: currentUser?.name ?? "—",
          patientId: dispenseRx.patientId, patientName: patients.find((p) => p.id === dispenseRx.patientId)?.lastName ?? "—",
          date: record.date, reference: dispenseRx.id, notes: record.notes,
        });
      }
    }
    setDispenseRx(null);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Medication Dispensing"
        subtitle="Pharmacist workflow: Received → Prepared → Verified → Dispensed → Completed."
        icon={<Pill size={20} />}
        actions={<SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search patient, prescription…" className="w-64" />}
      />

      <Tabs tabs={[{ id: "queue", label: "Dispensing Queue", count: queue.length }, { id: "history", label: "Dispensing History", count: dispenses.length }]} active={tab} onChange={(t) => { setTab(t as "queue" | "history"); setPage(1); }} />

      {tab === "queue" && (
        <div className="card overflow-hidden">
          {queueItems.length === 0 ? (
            <EmptyState icon={<Pill size={28} />} title="Queue empty" description="Prescriptions awaiting dispensing will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th> Rx ID</th><th>Patient</th><th>Clinician</th><th>Diagnosis</th><th>Items</th><th>Status</th><th className="text-right">Action</th></tr></thead>
                <tbody>
                  {queueItems.map((r) => {
                    const p = patients.find((pt) => pt.id === r.patientId);
                    return (
                      <tr key={r.id}>
                        <td className="font-mono text-xs">{r.id}</td>
                        <td className="font-medium">{p ? patientFullName(p) : "—"}</td>
                        <td className="text-slate-600">{users.find((u) => u.id === r.clinicianId)?.name ?? "—"}</td>
                        <td className="text-slate-700">{r.diagnosis}</td>
                        <td className="text-slate-600 tabular-nums">{r.lines.length}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td className="text-right">
                          <button className="btn-primary btn-sm" onClick={() => setDispenseRx(r)}><Pill size={13} /> Dispense</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} pageCount={pageCount} total={queueFiltered.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      )}

      {tab === "history" && (
        <div className="card overflow-hidden">
          {historyItems.length === 0 ? (
            <EmptyState icon={<Activity size={28} />} title="No dispensing records" />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Dispense ID</th><th>Date / Time</th><th>Patient</th><th>Medication</th><th>Qty</th><th>Remaining</th><th>Pharmacist</th><th className="text-right">View</th></tr></thead>
                <tbody>
                  {historyItems.map((d) => {
                    const p = patients.find((pt) => pt.id === d.patientId);
                    return (
                      <tr key={d.id}>
                        <td className="font-mono text-xs">{d.id}</td>
                        <td className="text-slate-600">{formatDate(d.date)} <span className="text-xs text-slate-400 font-mono">{d.time}</span></td>
                        <td className="font-medium">{p ? patientFullName(p) : "—"}</td>
                        <td className="text-slate-700">{d.medicationName}</td>
                        <td className="tabular-nums">{d.quantityDispensed}</td>
                        <td className="tabular-nums">{d.remainingQuantity}</td>
                        <td className="text-slate-600">{d.steps.find((s) => s.stage === "Dispensed")?.actorName ?? "—"}</td>
                        <td className="text-right"><button className="btn-ghost btn-sm !p-1.5" onClick={() => onNavigate("patient-detail", { id: d.patientId })}><Eye size={15} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} pageCount={pageCount} total={historyFiltered.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      )}

      <Modal open={dispenseRx !== null} onClose={() => setDispenseRx(null)} title="Dispense Medication" subtitle={dispenseRx?.id} size="xl">
        {dispenseRx && (
          <DispenseForm
            rx={dispenseRx}
            onClose={() => setDispenseRx(null)}
            inventoryByMed={inventoryByMed}
            onComplete={handleComplete}
          />
        )}
      </Modal>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Dispense workflow form
// ----------------------------------------------------------------------------

function DispenseForm({
  rx, onClose, onComplete, inventoryByMed,
}: {
  rx: Prescription;
  onClose: () => void;
  inventoryByMed: (medId: string) => { quantity: number; drugName: string } | undefined;
  onComplete: (record: DispenseRecord, qty: number, line: PrescriptionLine) => void;
}) {
  const { patients, users, currentUser } = useApp();
  const patient = patients.find((p) => p.id === rx.patientId);
  const [selectedLineId, setSelectedLineId] = useState<string>(rx.lines[0]?.id ?? "");
  const [stageIdx, setStageIdx] = useState(0);
  const [qty, setQty] = useState<number>(rx.lines[0]?.quantity ?? 0);
  const [notes, setNotes] = useState("");

  const selectedLine = rx.lines.find((l) => l.id === selectedLineId) ?? rx.lines[0];
  const inv = selectedLine ? inventoryByMed(selectedLine.medicationId) : undefined;
  const inStock = inv ? inv.quantity : 0;

  // Safety checks
  const med = selectedLine ? findMed(selectedLine.medicationId) : undefined;
  const allergyWarn = useMemo(() => {
    if (!med || !patient) return null;
    return checkAllergy(med.name, med.commonAllergies, patient.allergies.map((a) => a.substance));
  }, [med, patient]);

  const interactionWarns = useMemo(() => {
    const names = rx.lines.filter((l) => l.medicationName).map((l) => l.medicationName.split(" ")[0]);
    const out: { a: string; b: string; severity: string; recommendation: string }[] = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const ix = findInteraction(names[i], names[j]);
        if (ix) out.push({ a: names[i], b: names[j], severity: ix.severity, recommendation: ix.recommendation });
      }
    }
    return out;
  }, [rx.lines]);

  useEffect(() => {
    if (selectedLine) {
      setQty(selectedLine.quantity);
    }
  }, [selectedLineId]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectLine(id: string) {
    const line = rx.lines.find((l) => l.id === id);
    setSelectedLineId(id);
    if (line) setQty(line.quantity);
    setStageIdx(0);
  }

  function advance() {
    if (stageIdx >= STAGES.length - 1) {
      // Complete
      if (!selectedLine) return;
      const now = new Date();
      const steps: DispenseStep[] = STAGES.map((stage, i) => ({
        stage,
        actorId: currentUser?.id ?? "",
        actorName: currentUser?.name ?? "Pharmacist",
        at: new Date(now.getTime() + i * 60000).toISOString(),
        notes: i === stageIdx ? notes : "",
      }));
      const remaining = Math.max(0, inStock - qty);
      const record: DispenseRecord = {
        id: uid("dsp"),
        prescriptionId: rx.id,
        patientId: rx.patientId,
        pharmacistId: currentUser?.id ?? "",
        medicationId: selectedLine.medicationId,
        medicationName: selectedLine.medicationName,
        quantityDispensed: qty,
        remainingQuantity: remaining,
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        steps,
        notes,
        createdAt: nowISO(),
      };
      onComplete(record, qty, selectedLine);
      return;
    }
    setStageIdx((i) => i + 1);
  }

  if (!selectedLine) return <EmptyState title="No medication lines" />;

  const insufficient = qty > inStock;

  return (
    <div className="space-y-4">
      {/* Patient & prescription summary */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-xs text-slate-500">Patient</p><p className="font-medium text-slate-900">{patient ? patientFullName(patient) : "—"}</p></div>
        <div><p className="text-xs text-slate-500">Pharmacist</p><p className="font-medium text-slate-900">{currentUser?.name}</p></div>
        <div><p className="text-xs text-slate-500">Diagnosis</p><p className="font-medium text-slate-900">{rx.diagnosis}</p></div>
        <div><p className="text-xs text-slate-500">Clinician</p><p className="font-medium text-slate-900">{users.find((u) => u.id === rx.clinicianId)?.name ?? "—"}</p></div>
      </div>

      {/* Line selector */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Select Medication Line</p>
        <div className="space-y-2">
          {rx.lines.map((l) => (
            <button
              key={l.id}
              onClick={() => selectLine(l.id)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${selectedLineId === l.id ? "border-teal-500 bg-teal-50/50" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900">{l.medicationName}</p>
                <span className="text-sm text-slate-600 tabular-nums">Qty {l.quantity}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{l.dose} · {l.route} · {l.frequency} · {l.duration}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Safety warnings */}
      {(allergyWarn || interactionWarns.length > 0) && (
        <div className="space-y-2">
          {allergyWarn && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle size={14} />
                <p className="text-sm font-semibold">Allergy Alert · {allergyWarn.severity}</p>
              </div>
              <p className="text-xs text-rose-700 mt-1">{allergyWarn.recommendation}</p>
              {allergyWarn.alternative && <p className="text-xs text-rose-700 mt-0.5">Alternative: {allergyWarn.alternative}</p>}
            </div>
          )}
          {interactionWarns.map((w, i) => (
            <div key={i} className={`rounded-lg border px-3 py-2.5 ${w.severity === "High" || w.severity === "Contraindicated" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"}`}>
              <div className={`flex items-center gap-2 ${w.severity === "High" ? "text-rose-700" : "text-amber-700"}`}>
                <AlertTriangle size={14} />
                <p className="text-sm font-semibold">Drug Interaction · {w.severity}: {w.a} + {w.b}</p>
              </div>
              <p className="text-xs text-slate-700 mt-1">{w.recommendation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Inventory check */}
      <div className="rounded-lg border border-slate-200 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Available in inventory</p>
            <p className={`text-sm font-semibold ${insufficient ? "text-rose-600" : "text-slate-900"} tabular-nums`}>{inStock} units</p>
          </div>
        </div>
        {insufficient && <span className="badge-rose">Insufficient stock</span>}
      </div>

      {/* Quantity */}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Quantity to dispense</label><input type="number" min={0} max={inStock} className="input" value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 0)} /></div>
        <div><label className="label">Remaining after dispense</label><div className="input bg-slate-50 tabular-nums">{Math.max(0, inStock - qty)}</div></div>
      </div>

      {/* Workflow stepper */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Dispensing Workflow</p>
        <div className="flex items-center gap-1">
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`flex-1 rounded-lg px-2.5 py-2 text-center text-xs font-medium transition-colors ${i <= stageIdx ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                {s}
              </div>
              {i < STAGES.length - 1 && <div className={`w-4 h-0.5 mx-0.5 ${i < stageIdx ? "bg-teal-600" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">Current stage: <span className="font-medium text-slate-700">{STAGES[stageIdx]}</span></p>
      </div>

      <div><label className="label">Notes</label><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Counselling notes, verification comments…" /></div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={advance} disabled={insufficient || qty <= 0}>
          {stageIdx >= STAGES.length - 1 ? "Complete Dispense" : `Mark as ${STAGES[stageIdx + 1]}`}
        </button>
      </div>
    </div>
  );
}
