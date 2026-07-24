import { useMemo, useState } from "react";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, Droplet, AlertTriangle, Heart,
  Pill, Activity, FileText, Clock, Plus, Eye, ShieldAlert, CalendarDays, FlaskConical,
  Send,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, Tabs, EmptyState, StatusBadge } from "@/components/ui";
import { age, formatDate, formatDateTime, patientFullName, initials, bmi } from "@/lib/format";
import type { Route } from "@/components/Sidebar";
import PatientPharmacyTab from "./PatientPharmacyTab";
import PatientBillingTab from "./billing/PatientBillingTab";

interface Props {
  patientId: string;
  onNavigate: (r: Route, params?: Record<string, string>) => void;
  onBack: () => void;
}

type TabId = "overview" | "appointments" | "clinical" | "labs" | "pharmacy" | "billing" | "referrals";

export default function PatientDetail({ patientId, onNavigate, onBack }: Props) {
  const { patients, appointments, soapNotes, vitals, labOrders, prescriptions, dispenses, medicationHistory, users, invoices, referrals } = useApp();
  const [tab, setTab] = useState<TabId>("overview");

  const patient = patients.find((p) => p.id === patientId);

  const patientAppts = useMemo(() => appointments.filter((a) => a.patientId === patientId), [appointments, patientId]);
  const patientSoap = useMemo(() => soapNotes.filter((s) => s.patientId === patientId), [soapNotes, patientId]);
  const patientVitals = useMemo(() => vitals.filter((v) => v.patientId === patientId), [vitals, patientId]);
  const patientLabs = useMemo(() => labOrders.filter((l) => l.patientId === patientId), [labOrders, patientId]);
  const patientRx = useMemo(() => prescriptions.filter((r) => r.patientId === patientId), [prescriptions, patientId]);
  const patientDispenses = useMemo(() => dispenses.filter((d) => d.patientId === patientId), [dispenses, patientId]);
  const patientMedHistory = useMemo(() => medicationHistory.filter((m) => m.patientId === patientId), [medicationHistory, patientId]);
  const patientReferrals = useMemo(() => referrals.filter((r) => r.patientId === patientId), [referrals, patientId]);

  if (!patient) {
    return (
      <div>
        <PageHeader title="Patient not found" />
        <EmptyState title="Patient record unavailable" description="It may have been deleted." action={<button className="btn-primary btn-sm" onClick={onBack}>Back to patients</button>} />
      </div>
    );
  }

  const tabs: { id: TabId; label: string; count?: number; icon?: React.ReactNode }[] = [
    { id: "overview", label: "Overview", count: undefined },
    { id: "appointments", label: "Appointments", count: patientAppts.length },
    { id: "clinical", label: "Clinical", count: patientSoap.length },
    { id: "labs", label: "Laboratory", count: patientLabs.length },
    { id: "pharmacy", label: "Pharmacy", count: patientRx.length, icon: <Pill size={14} /> },
    { id: "billing", label: "Billing", count: invoices.filter((i) => i.patientId === patientId).length, icon: <FileText size={14} /> },
    { id: "referrals", label: "Referrals", count: patientReferrals.length, icon: <Send size={14} /> },
  ];

  return (
    <div className="space-y-5">
      <button className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900" onClick={onBack}>
        <ArrowLeft size={16} /> Back to Patients
      </button>

      {/* Patient header card */}
      <div className="card overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-semibold shrink-0">
              {initials(patient.firstName, patient.lastName)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold tracking-tight">{patientFullName(patient)}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-teal-50">
                <span className="inline-flex items-center gap-1"><User size={13} /> {age(patient.dateOfBirth)}y · {patient.gender}</span>
                <span className="inline-flex items-center gap-1"><Droplet size={13} /> {patient.bloodType}</span>
                <span className="inline-flex items-center gap-1"><Calendar size={13} /> DOB {formatDate(patient.dateOfBirth)}</span>
                <span className="font-mono text-xs text-teal-100/80">{patient.id}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary btn-sm !bg-white/15 !text-white !border-white/20 hover:!bg-white/25" onClick={() => onNavigate("appointments")}>
                <CalendarDays size={14} /> Appointment
              </button>
              <button className="btn-secondary btn-sm !bg-white/15 !text-white !border-white/20 hover:!bg-white/25" onClick={() => onNavigate("prescriptions")}>
                <Pill size={14} /> Prescribe
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100 border-t border-slate-100">
          <InfoCell icon={<Phone size={14} />} label="Phone" value={patient.phone} />
          <InfoCell icon={<Mail size={14} />} label="Email" value={patient.email || "—"} />
          <InfoCell icon={<MapPin size={14} />} label="City" value={patient.city} />
          <InfoCell icon={<ShieldAlert size={14} />} label="Insurance" value={patient.insuranceProvider || "None"} />
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={(t) => setTab(t as TabId)} />

      {/* Tabs content */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card">
            <div className="card-header"><p className="card-title">Allergies</p><AlertTriangle size={16} className="text-amber-500" /></div>
            <div className="card-body">
              {patient.allergies.length === 0 ? (
                <p className="text-sm text-slate-500">No known allergies.</p>
              ) : (
                <div className="space-y-2">
                  {patient.allergies.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{a.substance}</p>
                        <p className="text-xs text-slate-500">{a.reaction}</p>
                      </div>
                      <span className={`badge-${a.severity === "Severe" ? "rose" : a.severity === "Moderate" ? "amber" : "slate"}`}>{a.severity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><p className="card-title">Chronic Conditions</p><Heart size={16} className="text-rose-500" /></div>
            <div className="card-body">
              {patient.chronicConditions.length === 0 ? (
                <p className="text-sm text-slate-500">No chronic conditions recorded.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {patient.chronicConditions.map((c) => <span key={c} className="badge-blue">{c}</span>)}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><p className="card-title">Latest Vitals</p><Activity size={16} className="text-teal-600" /></div>
            <div className="card-body">
              {patientVitals.length === 0 ? (
                <p className="text-sm text-slate-500">No vitals recorded.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <VitalRow label="BP" value={`${patientVitals[0].bloodPressureSystolic}/${patientVitals[0].bloodPressureDiastolic}`} unit="mmHg" />
                  <VitalRow label="HR" value={patientVitals[0].heartRate} unit="bpm" />
                  <VitalRow label="Temp" value={patientVitals[0].temperatureC} unit="°C" />
                  <VitalRow label="SpO₂" value={patientVitals[0].oxygenSaturation} unit="%" />
                  <VitalRow label="BMI" value={bmi(patientVitals[0].weightKg, patientVitals[0].heightCm)} unit="kg/m²" />
                  <p className="text-xs text-slate-400 pt-1">{formatDateTime(patientVitals[0].recordedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick summaries */}
          <div className="card lg:col-span-3">
            <div className="card-header"><p className="card-title">Recent Activity</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-x divide-slate-100">
              <SummaryCell icon={<CalendarDays size={18} />} label="Appointments" value={patientAppts.length} onClick={() => setTab("appointments")} />
              <SummaryCell icon={<FileText size={18} />} label="SOAP Notes" value={patientSoap.length} onClick={() => setTab("clinical")} />
              <SummaryCell icon={<FlaskConical size={18} />} label="Lab Orders" value={patientLabs.length} onClick={() => setTab("labs")} />
            </div>
          </div>
        </div>
      )}

      {tab === "appointments" && (
        <div className="card overflow-hidden">
          {patientAppts.length === 0 ? (
            <EmptyState icon={<CalendarDays size={28} />} title="No appointments" description="Schedule an appointment for this patient." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Date</th><th>Time</th><th>Type</th><th>Clinician</th><th>Reason</th><th>Status</th></tr></thead>
                <tbody>
                  {patientAppts.map((a) => (
                    <tr key={a.id}>
                      <td className="font-medium">{formatDate(a.date)}</td>
                      <td className="font-mono text-xs">{a.time}</td>
                      <td>{a.type}</td>
                      <td>{users.find((u) => u.id === a.clinicianId)?.name ?? "—"}</td>
                      <td className="text-slate-600">{a.reason}</td>
                      <td><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "clinical" && (
        <div className="space-y-3">
          {patientSoap.length === 0 ? (
            <div className="card"><EmptyState icon={<FileText size={28} />} title="No clinical notes" description="SOAP notes will appear here." /></div>
          ) : (
            patientSoap.map((s) => (
              <div key={s.id} className="card">
                <div className="card-header">
                  <div>
                    <p className="card-title">{s.diagnosis} <span className="text-slate-400 font-normal">· {s.diagnosisCode}</span></p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.type} · {formatDate(s.encounterDate)} · {users.find((u) => u.id === s.clinicianId)?.name}</p>
                  </div>
                  <StatusBadge status={s.type} tone="blue" />
                </div>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <SoapBlock label="Subjective" text={s.subjective} />
                  <SoapBlock label="Objective" text={s.objective} />
                  <SoapBlock label="Assessment" text={s.assessment} />
                  <SoapBlock label="Plan" text={s.plan} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "labs" && (
        <div className="card overflow-hidden">
          {patientLabs.length === 0 ? (
            <EmptyState icon={<FlaskConical size={28} />} title="No lab orders" description="Lab orders will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Order ID</th><th>Priority</th><th>Tests</th><th>Status</th><th>Ordered</th></tr></thead>
                <tbody>
                  {patientLabs.map((l) => (
                    <tr key={l.id}>
                      <td className="font-mono text-xs">{l.id}</td>
                      <td><span className={`badge-${l.priority === "STAT" ? "rose" : l.priority === "Urgent" ? "amber" : "slate"}`}>{l.priority}</span></td>
                      <td className="text-slate-600">{l.tests.map((t) => t.testName).join(", ")}</td>
                      <td><StatusBadge status={l.status} /></td>
                      <td className="text-slate-600">{formatDate(l.orderedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "pharmacy" && (
        <PatientPharmacyTab
          patient={patient}
          prescriptions={patientRx}
          dispenses={patientDispenses}
          medicationHistory={patientMedHistory}
          onNavigate={onNavigate}
        />
      )}

      {tab === "billing" && (
        <PatientBillingTab patient={patient} onNavigate={onNavigate} />
      )}

      {tab === "referrals" && (
        <PatientReferralsTab referrals={patientReferrals} onNavigate={onNavigate} />
      )}
    </div>
  );
}

function PatientReferralsTab({
  referrals,
  onNavigate,
}: {
  referrals: import("@/lib/types").Referral[];
  onNavigate: (r: Route, params?: Record<string, string>) => void;
}) {
  if (referrals.length === 0) {
    return (
      <div className="card">
        <EmptyState icon={<Send size={28} />} title="No referrals" description="Outgoing referrals for this patient will appear here." action={<button className="btn-primary btn-sm" onClick={() => onNavigate("referrals")}><Plus size={14} /> Create Referral</button>} />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {referrals.map((r) => (
        <div key={r.id} className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-teal-50 text-teal-600 p-2"><Send size={16} /></div>
              <div>
                <p className="card-title">{r.receivingFacility} — {r.receivingSpecialist}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.referralId} · {r.specialty} · {formatDate(r.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge-${r.urgency === "Emergency" ? "rose" : r.urgency === "Urgent" ? "amber" : "slate"}`}>{r.urgency}</span>
              <StatusBadge status={r.status} />
            </div>
          </div>
          <div className="card-body">
            <p className="text-sm text-slate-600"><span className="font-medium text-slate-700">Reason:</span> {r.reason}</p>
            {r.clinicalSummary && <p className="text-sm text-slate-600 mt-1"><span className="font-medium text-slate-700">Summary:</span> {r.clinicalSummary}</p>}
            {/* Mini timeline */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Timeline</p>
              <div className="flex flex-wrap gap-1.5">
                {r.timeline.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-1.5 text-xs">
                    <span className={i === r.timeline.length - 1 ? "text-teal-600 font-medium" : "text-slate-400"}>{t.status}</span>
                    {i < r.timeline.length - 1 && <span className="text-slate-300">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
      <button className="btn-primary btn-sm" onClick={() => onNavigate("referrals")}>
        <Plus size={14} /> Create New Referral
      </button>
    </div>
  );
}

function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 uppercase tracking-wider font-medium">{icon}{label}</p>
      <p className="text-sm font-medium text-slate-900 mt-1 truncate">{value}</p>
    </div>
  );
}
function VitalRow({ label, value, unit }: { label: string; value: React.ReactNode; unit: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900 tabular-nums">{value} <span className="text-xs text-slate-400 font-normal">{unit}</span></span>
    </div>
  );
}
function SummaryCell({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-5 py-5 text-left hover:bg-slate-50 transition-colors flex items-center gap-3">
      <div className="rounded-xl bg-teal-50 text-teal-600 p-2.5">{icon}</div>
      <div>
        <p className="text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </button>
  );
}
function SoapBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-slate-700 leading-relaxed">{text || "—"}</p>
    </div>
  );
}
