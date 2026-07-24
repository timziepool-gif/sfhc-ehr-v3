import { useMemo, useState } from "react";
import { Monitor, FileText, Pill, FlaskConical, Receipt, CalendarDays, HeartPulse, Activity, Download, Clock, AlertCircle, Stethoscope } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { currency, formatDate } from "@/lib/format";
import type { Route } from "@/components/Sidebar";

type PortalTab = "overview" | "appointments" | "labs" | "prescriptions" | "billing" | "timeline";

export default function PatientPortal({ onNavigate: _onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const { patients, appointments, labOrders, prescriptions, invoices, payments, soapNotes, users } = useApp();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id ?? "");
  const [tab, setTab] = useState<PortalTab>("overview");

  const patient = patients.find((p) => p.id === selectedPatientId);
  const patientAppointments = useMemo(() => appointments.filter((a) => a.patientId === selectedPatientId).sort((a, b) => b.date.localeCompare(a.date)), [appointments, selectedPatientId]);
  const patientLabs = useMemo(() => labOrders.filter((l) => l.patientId === selectedPatientId), [labOrders, selectedPatientId]);
  const patientRx = useMemo(() => prescriptions.filter((r) => r.patientId === selectedPatientId), [prescriptions, selectedPatientId]);
  const patientInvoices = useMemo(() => invoices.filter((i) => i.patientId === selectedPatientId), [invoices, selectedPatientId]);
  const patientPayments = useMemo(() => payments.filter((p) => p.patientId === selectedPatientId), [payments, selectedPatientId]);
  const patientSoap = useMemo(() => soapNotes.filter((s) => s.patientId === selectedPatientId).sort((a, b) => b.encounterDate.localeCompare(a.encounterDate)), [soapNotes, selectedPatientId]);

  const upcomingAppts = patientAppointments.filter((a) => new Date(a.date) >= new Date() && a.status !== "Cancelled");
  const pastAppts = patientAppointments.filter((a) => new Date(a.date) < new Date() || a.status === "Completed");

  const clinicianName = (id: string) => users.find((u) => u.id === id)?.name ?? "Unknown";

  const TABS: { id: PortalTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Monitor size={16} /> },
    { id: "appointments", label: "Appointments", icon: <CalendarDays size={16} /> },
    { id: "labs", label: "Lab Results", icon: <FlaskConical size={16} /> },
    { id: "prescriptions", label: "Prescriptions", icon: <Pill size={16} /> },
    { id: "billing", label: "Billing", icon: <Receipt size={16} /> },
    { id: "timeline", label: "Visit Timeline", icon: <Activity size={16} /> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Patient Portal" subtitle="Secure patient self-service portal" icon={<Monitor size={20} />} />

      <div className="card p-4">
        <label className="block text-xs font-medium text-slate-600 mb-2">Select Patient</label>
        <select className="input" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.phone}</option>)}
        </select>
      </div>

      {patient && (
        <>
          <div className="card p-5 bg-gradient-to-r from-teal-50 to-blue-50 border-teal-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl font-semibold shrink-0">
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900">{patient.firstName} {patient.lastName}</h2>
                <p className="text-sm text-slate-600">{patient.gender} · DOB: {formatDate(patient.dateOfBirth)} · {patient.phone}</p>
                <p className="text-sm text-slate-600">{patient.email}</p>
              </div>
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-lg border border-rose-100">
                  <AlertCircle size={16} className="text-rose-600" />
                  <span className="text-sm text-rose-700">Allergies: {patient.allergies.map(a => `${a.substance} (${a.severity})`).join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3"><CalendarDays size={18} className="text-teal-600" /><h3 className="text-sm font-semibold">Upcoming Appointments</h3></div>
                {upcomingAppts.length === 0 ? <p className="text-sm text-slate-400">No upcoming appointments</p> : (
                  <div className="space-y-2">{upcomingAppts.slice(0, 3).map((a) => (
                    <div key={a.id} className="text-sm"><p className="font-medium text-slate-900">{formatDate(a.date)} at {a.time}</p><p className="text-slate-500">{a.type} · {clinicianName(a.clinicianId)}</p></div>
                  ))}</div>
                )}
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3"><FlaskConical size={18} className="text-blue-600" /><h3 className="text-sm font-semibold">Recent Lab Results</h3></div>
                {patientLabs.length === 0 ? <p className="text-sm text-slate-400">No lab results</p> : (
                  <div className="space-y-2">{patientLabs.slice(0, 3).map((l) => (
                    <div key={l.id} className="text-sm"><p className="font-medium text-slate-900">{l.tests.map((t) => t.testName).join(", ")}</p><p className="text-slate-500">{formatDate(l.orderedAt)} · <StatusBadge status={l.status} /></p></div>
                  ))}</div>
                )}
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3"><Pill size={18} className="text-teal-600" /><h3 className="text-sm font-semibold">Active Prescriptions</h3></div>
                {patientRx.length === 0 ? <p className="text-sm text-slate-400">No prescriptions</p> : (
                  <div className="space-y-2">{patientRx.slice(0, 3).map((r) => (
                    <div key={r.id} className="text-sm"><p className="font-medium text-slate-900">{r.diagnosis}</p><p className="text-slate-500">{formatDate(r.date)} · <StatusBadge status={r.status} /></p></div>
                  ))}</div>
                )}
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3"><Receipt size={18} className="text-amber-600" /><h3 className="text-sm font-semibold">Outstanding Bills</h3></div>
                {patientInvoices.filter((i) => i.paymentStatus !== "Paid").length === 0 ? <p className="text-sm text-slate-400">No outstanding bills</p> : (
                  <div className="space-y-2">{patientInvoices.filter((i) => i.paymentStatus !== "Paid").slice(0, 3).map((i) => (
                    <div key={i.id} className="text-sm"><p className="font-medium text-slate-900">{i.invoiceNumber}</p><p className="text-slate-500">{currency(i.grandTotal)} · <StatusBadge status={i.paymentStatus} /></p></div>
                  ))}</div>
                )}
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3"><HeartPulse size={18} className="text-rose-600" /><h3 className="text-sm font-semibold">Allergies & Conditions</h3></div>
                <div className="space-y-1.5 text-sm">
                  <p className="text-slate-500">Allergies: <span className="font-medium text-rose-600">{patient.allergies?.length ? patient.allergies.map(a => `${a.substance} (${a.severity})`).join(", ") : "None recorded"}</span></p>
                  <p className="text-slate-500">Blood Type: <span className="font-medium text-slate-700">{patient.bloodType ?? "Unknown"}</span></p>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3"><Stethoscope size={18} className="text-violet-600" /><h3 className="text-sm font-semibold">Diagnoses History</h3></div>
                {patientSoap.length === 0 ? <p className="text-sm text-slate-400">No diagnoses recorded</p> : (
                  <div className="space-y-2">{patientSoap.slice(0, 3).map((s) => (
                    <div key={s.id} className="text-sm"><p className="font-medium text-slate-900">{s.assessment}</p><p className="text-slate-500">{formatDate(s.encounterDate)}</p></div>
                  ))}</div>
                )}
              </div>
            </div>
          )}

          {tab === "appointments" && (
            <div className="space-y-4">
              <div className="card">
                <div className="card-header"><p className="card-title">Upcoming Appointments</p></div>
                {upcomingAppts.length === 0 ? <EmptyState title="No upcoming appointments" /> : (
                  <div className="divide-y divide-slate-50">
                    {upcomingAppts.map((a) => (
                      <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                        <div><p className="text-sm font-medium text-slate-900">{formatDate(a.date)} at {a.time}</p><p className="text-sm text-slate-500">{a.type} · {clinicianName(a.clinicianId)}</p></div>
                        <StatusBadge status={a.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card">
                <div className="card-header"><p className="card-title">Appointment History</p></div>
                {pastAppts.length === 0 ? <EmptyState title="No past appointments" /> : (
                  <div className="divide-y divide-slate-50">
                    {pastAppts.map((a) => (
                      <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                        <div><p className="text-sm font-medium text-slate-900">{formatDate(a.date)} at {a.time}</p><p className="text-sm text-slate-500">{a.type} · {clinicianName(a.clinicianId)}</p></div>
                        <StatusBadge status={a.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "labs" && (
            <div className="card">
              <div className="card-header"><p className="card-title">Laboratory Results</p></div>
              {patientLabs.length === 0 ? <EmptyState title="No lab results" /> : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead><tr><th>Date</th><th>Tests</th><th>Status</th><th>Results</th><th>Action</th></tr></thead>
                    <tbody>
                      {patientLabs.map((l) => (
                        <tr key={l.id}>
                          <td className="text-sm text-slate-500">{formatDate(l.orderedAt)}</td>
                          <td className="font-medium text-slate-900">{l.tests.map((t) => t.testName).join(", ")}</td>
                          <td><StatusBadge status={l.status} /></td>
                          <td className="text-sm text-slate-500">{l.tests.filter((t) => t.result).map((t) => `${t.testName}: ${t.result}`).join("; ") || "—"}</td>
                          <td>{l.status === "Completed" && <button className="btn-ghost btn-sm text-teal-600" onClick={() => window.print()}><Download size={14} /> Report</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "prescriptions" && (
            <div className="card">
              <div className="card-header"><p className="card-title">Prescriptions</p></div>
              {patientRx.length === 0 ? <EmptyState title="No prescriptions" /> : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead><tr><th>Date</th><th>Diagnosis</th><th>Medications</th><th>Status</th></tr></thead>
                    <tbody>
                      {patientRx.map((r) => (
                        <tr key={r.id}>
                          <td className="text-sm text-slate-500">{formatDate(r.date)}</td>
                          <td className="font-medium text-slate-900">{r.diagnosis}</td>
                          <td className="text-sm text-slate-500">{r.lines.length} items</td>
                          <td><StatusBadge status={r.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "billing" && (
            <div className="space-y-4">
              <div className="card">
                <div className="card-header"><p className="card-title">Invoices</p></div>
                {patientInvoices.length === 0 ? <EmptyState title="No invoices" /> : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead><tr><th>Invoice #</th><th>Date</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                      <tbody>
                        {patientInvoices.map((i) => (
                          <tr key={i.id}>
                            <td className="font-mono text-xs font-medium">{i.invoiceNumber}</td>
                            <td className="text-sm text-slate-500">{formatDate(i.date)}</td>
                            <td className="text-sm font-semibold tabular-nums">{currency(i.grandTotal)}</td>
                            <td><StatusBadge status={i.paymentStatus} /></td>
                            <td><button className="btn-ghost btn-sm text-teal-600" onClick={() => window.print()}><Download size={14} /> Invoice</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="card">
                <div className="card-header"><p className="card-title">Payment Receipts</p></div>
                {patientPayments.length === 0 ? <EmptyState title="No payments" /> : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Action</th></tr></thead>
                      <tbody>
                        {patientPayments.map((p) => (
                          <tr key={p.id}>
                            <td className="text-sm text-slate-500">{formatDate(p.date)}</td>
                            <td className="text-sm font-semibold tabular-nums">{currency(p.amountPaid)}</td>
                            <td className="text-sm text-slate-500">{p.method}</td>
                            <td><button className="btn-ghost btn-sm text-teal-600" onClick={() => window.print()}><Download size={14} /> Receipt</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "timeline" && (
            <div className="card">
              <div className="card-header"><p className="card-title">Visit Timeline</p></div>
              {patientSoap.length === 0 ? <EmptyState title="No visit history" /> : (
                <div className="px-5 py-4">
                  <div className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {patientSoap.map((s) => (
                      <div key={s.id} className="relative pl-10">
                        <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center border-2 border-white shadow-sm">
                          <Clock size={14} />
                        </div>
                        <div className="card p-4">
                          <p className="text-sm font-medium text-slate-900">{formatDate(s.encounterDate)}</p>
                          <p className="text-sm text-slate-500 mt-1"><span className="font-medium">S:</span> {s.subjective}</p>
                          <p className="text-sm text-slate-500"><span className="font-medium">O:</span> {s.objective}</p>
                          <p className="text-sm text-slate-500"><span className="font-medium">A:</span> {s.assessment}</p>
                          <p className="text-sm text-slate-500"><span className="font-medium">P:</span> {s.plan}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
