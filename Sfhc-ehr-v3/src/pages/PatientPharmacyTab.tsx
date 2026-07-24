import { Pill, FileText, Clock, AlertTriangle, Activity, ArrowRight, RefreshCw } from "lucide-react";
import { formatDate, patientFullName } from "@/lib/format";
import { EmptyState, StatusBadge } from "@/components/ui";
import type { DispenseRecord, MedicationHistoryEntry, Patient, Prescription } from "@/lib/types";
import type { Route } from "@/components/Sidebar";

interface Props {
  patient: Patient;
  prescriptions: Prescription[];
  dispenses: DispenseRecord[];
  medicationHistory: MedicationHistoryEntry[];
  onNavigate: (r: Route, params?: Record<string, string>) => void;
}

type SubTab = "prescriptions" | "dispensing" | "current" | "allergies" | "timeline";

export default function PatientPharmacyTab({ patient, prescriptions, dispenses, medicationHistory, onNavigate }: Props) {
  const subTabs: { id: SubTab; label: string; count?: number }[] = [
    { id: "prescriptions", label: "Prescription History", count: prescriptions.length },
    { id: "dispensing", label: "Dispensing History", count: dispenses.length },
    { id: "current", label: "Current Medications", count: prescriptions.filter((r) => r.status === "Dispensed").length },
    { id: "allergies", label: "Allergy Alerts", count: patient.allergies.length },
    { id: "timeline", label: "Medication Timeline", count: medicationHistory.length },
  ];
  const active = subTabs[0].id;
  return <PharmacyTabContent patient={patient} prescriptions={prescriptions} dispenses={dispenses} medicationHistory={medicationHistory} subTabs={subTabs} initial={active} onNavigate={onNavigate} />;
}

function PharmacyTabContent({
  patient, prescriptions, dispenses, medicationHistory, subTabs, initial, onNavigate,
}: {
  patient: Patient;
  prescriptions: Prescription[];
  dispenses: DispenseRecord[];
  medicationHistory: MedicationHistoryEntry[];
  subTabs: { id: SubTab; label: string; count?: number }[];
  initial: SubTab;
  onNavigate: (r: Route, params?: Record<string, string>) => void;
}) {
  const [tab, setTab] = useStateSubTab(initial);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {subTabs.map((s) => (
          <button
            key={s.id}
            onClick={() => setTab(s.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === s.id ? "bg-teal-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {s.label}
            {typeof s.count === "number" && (
              <span className={`ml-1.5 rounded-full px-1.5 text-xs ${tab === s.id ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>{s.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "prescriptions" && (
        <div className="card overflow-hidden">
          {prescriptions.length === 0 ? (
            <EmptyState icon={<FileText size={28} />} title="No prescriptions" description="Prescriptions for this patient will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th> Rx ID</th><th>Date</th><th>Diagnosis</th><th>Medications</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {prescriptions.map((rx) => (
                    <tr key={rx.id}>
                      <td className="font-mono text-xs">{rx.id}</td>
                      <td className="text-slate-600">{formatDate(rx.date)}</td>
                      <td className="font-medium text-slate-800">{rx.diagnosis}</td>
                      <td className="text-slate-600">{rx.lines.map((l) => l.medicationName).join(", ")}</td>
                      <td><StatusBadge status={rx.status} /></td>
                      <td><button className="btn-ghost btn-sm !p-1.5" onClick={() => onNavigate("prescriptions", { id: rx.id })}><ArrowRight size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "dispensing" && (
        <div className="card overflow-hidden">
          {dispenses.length === 0 ? (
            <EmptyState icon={<Pill size={28} />} title="No dispensing records" description="Dispensed medications will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Date</th><th>Medication</th><th>Qty Dispensed</th><th>Remaining</th><th>Pharmacist</th></tr></thead>
                <tbody>
                  {dispenses.map((d) => (
                    <tr key={d.id}>
                      <td className="text-slate-600">{formatDate(d.date)} <span className="text-xs text-slate-400 font-mono">{d.time}</span></td>
                      <td className="font-medium text-slate-800">{d.medicationName}</td>
                      <td className="tabular-nums">{d.quantityDispensed}</td>
                      <td className="tabular-nums">{d.remainingQuantity}</td>
                      <td className="text-slate-600">{d.steps.find((s) => s.stage === "Dispensed")?.actorName ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "current" && (
        <div className="space-y-3">
          {prescriptions.filter((r) => r.status === "Dispensed").length === 0 ? (
            <div className="card"><EmptyState icon={<Pill size={28} />} title="No active medications" description="Currently dispensed medications will appear here." /></div>
          ) : (
            prescriptions.filter((r) => r.status === "Dispensed").flatMap((rx) =>
              rx.lines.map((line) => (
                <div key={line.id} className="card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0"><Pill size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{line.medicationName}</p>
                    <p className="text-sm text-slate-500">{line.dose} · {line.route} · {line.frequency} · {line.duration}</p>
                    {line.instructions && <p className="text-xs text-slate-400 mt-0.5">{line.instructions}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">Since</p>
                    <p className="text-sm font-medium text-slate-700">{formatDate(rx.date)}</p>
                  </div>
                </div>
              )),
            )
          )}
        </div>
      )}

      {tab === "allergies" && (
        <div className="space-y-3">
          {patient.allergies.length === 0 ? (
            <div className="card"><EmptyState icon={<AlertTriangle size={28} />} title="No known allergies" description="This patient has no recorded allergies." /></div>
          ) : (
            patient.allergies.map((a) => (
              <div key={a.id} className={`card p-4 border-l-4 ${a.severity === "Severe" ? "border-l-rose-500" : a.severity === "Moderate" ? "border-l-amber-500" : "border-l-slate-300"}`}>
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2.5 shrink-0 ${a.severity === "Severe" ? "bg-rose-50 text-rose-600" : a.severity === "Moderate" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600"}`}>
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{a.substance}</p>
                      <span className={`badge-${a.severity === "Severe" ? "rose" : a.severity === "Moderate" ? "amber" : "slate"}`}>{a.severity}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">Reaction: {a.reaction || "Not specified"}</p>
                    <p className="text-xs text-slate-400 mt-1">Pharmacists will be alerted when prescribing medications in this class.</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "timeline" && (
        <div className="card">
          {medicationHistory.length === 0 ? (
            <EmptyState icon={<Clock size={28} />} title="No medication history" description="Prescribing and dispensing events will appear here." />
          ) : (
            <div className="p-5">
              <div className="relative space-y-4 pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {medicationHistory.map((m) => (
                  <div key={m.id} className="relative animate-fade-in">
                    <div className={`absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-white ${
                      m.eventType === "Dispensed" ? "bg-emerald-500" :
                      m.eventType === "Prescribed" ? "bg-blue-500" :
                      m.eventType === "Cancelled" ? "bg-rose-500" : "bg-slate-400"
                    }`} />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{m.medicationName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{m.details}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">by {m.actorName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`badge-${m.eventType === "Dispensed" ? "green" : m.eventType === "Prescribed" ? "blue" : m.eventType === "Cancelled" ? "rose" : "slate"}`}>{m.eventType}</span>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(m.date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Small helper to keep React import explicit
import { useState } from "react";
function useStateSubTab(initial: SubTab) {
  return useState<SubTab>(initial);
}
