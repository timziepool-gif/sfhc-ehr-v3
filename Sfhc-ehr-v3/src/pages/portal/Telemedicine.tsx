import { useMemo, useState } from "react";
import { Video, Clock, CheckCircle2, XCircle, MessageSquare, FileText, Stethoscope, CalendarPlus, Pill, FlaskConical, Receipt, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, StatusBadge, EmptyState } from "@/components/ui";
import Modal from "@/components/Modal";
import { formatDate } from "@/lib/format";
import type { TelemedicineSession, TelemedicineStatus } from "@/lib/types";
import type { Route } from "@/components/Sidebar";

export default function Telemedicine({ onNavigate: _onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const { telemedicineSessions, patients, users, currentUser, addTelemedicineSession, updateTelemedicineSession, addTelemedicineChat, staff } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [showNewSession, setShowNewSession] = useState(false);

  const filtered = useMemo(() => {
    return telemedicineSessions
      .filter((s) => !statusFilter || s.status === statusFilter)
      .filter((s) => !search || s.patientName.toLowerCase().includes(search.toLowerCase()) || s.physicianName.toLowerCase().includes(search.toLowerCase()) || s.sessionId.toLowerCase().includes(search.toLowerCase()));
  }, [telemedicineSessions, search, statusFilter]);

  const activeSession = selectedSession ? telemedicineSessions.find((s) => s.id === selectedSession) : null;

  const upcoming = telemedicineSessions.filter((s) => s.status === "Scheduled" || s.status === "Waiting");
  const inProgress = telemedicineSessions.filter((s) => s.status === "In Progress");
  const completed = telemedicineSessions.filter((s) => s.status === "Completed");

  return (
    <div className="space-y-5">
      <PageHeader title="Telemedicine" subtitle="Virtual consultations and remote care" icon={<Video size={20} />}
        actions={<button className="btn-primary btn-sm" onClick={() => setShowNewSession(true)}><CalendarPlus size={14} /> New Session</button>} />

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2"><Clock size={20} /></div><p className="text-2xl font-semibold text-slate-900">{upcoming.length}</p><p className="text-xs text-slate-500">Upcoming</p></div>
        <div className="card p-4 text-center"><div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2"><Video size={20} /></div><p className="text-2xl font-semibold text-slate-900">{inProgress.length}</p><p className="text-xs text-slate-500">In Progress</p></div>
        <div className="card p-4 text-center"><div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-2"><CheckCircle2 size={20} /></div><p className="text-2xl font-semibold text-slate-900">{completed.length}</p><p className="text-xs text-slate-500">Completed</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search sessions..." className="flex-1" />
        <select className="input sm:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Scheduled</option><option>Waiting</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
        </select>
      </div>

      <div className="card">
        {filtered.length === 0 ? <EmptyState title="No telemedicine sessions" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Session ID</th><th>Patient</th><th>Physician</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs font-medium">{s.sessionId}</td>
                    <td className="font-medium text-slate-900">{s.patientName}</td>
                    <td className="text-sm text-slate-500">{s.physicianName}</td>
                    <td className="text-sm text-slate-500">{formatDate(s.scheduledDate)}</td>
                    <td className="text-sm tabular-nums">{s.scheduledTime}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        {(s.status === "Scheduled" || s.status === "Waiting") && (
                          <button className="btn-primary btn-sm" onClick={() => { updateTelemedicineSession(s.id, { status: "In Progress" }); setSelectedSession(s.id); }}><Video size={14} /> Join</button>
                        )}
                        {s.status === "In Progress" && (
                          <button className="btn-primary btn-sm" onClick={() => setSelectedSession(s.id)}><MessageSquare size={14} /> Consult</button>
                        )}
                        {s.status === "Completed" && (
                          <button className="btn-ghost btn-sm" onClick={() => setSelectedSession(s.id)}><FileText size={14} /> View</button>
                        )}
                        {s.status === "In Progress" && (
                          <button className="btn-ghost btn-sm text-green-600" onClick={() => updateTelemedicineSession(s.id, { status: "Completed" })}><CheckCircle2 size={14} /></button>
                        )}
                        {(s.status === "Scheduled" || s.status === "Waiting") && (
                          <button className="btn-ghost btn-sm text-rose-600" onClick={() => updateTelemedicineSession(s.id, { status: "Cancelled" })}><XCircle size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Consultation modal */}
      {activeSession && (
        <Modal open onClose={() => setSelectedSession(null)} title={`Consultation — ${activeSession.sessionId}`} size="lg">
          <div className="space-y-4">
            {/* Video placeholder */}
            <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Video size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Video consultation placeholder</p>
                <p className="text-xs mt-1">Meeting link: {activeSession.meetingLink}</p>
              </div>
            </div>

            {/* Patient info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-3"><p className="text-xs text-slate-500">Patient</p><p className="text-sm font-medium">{activeSession.patientName}</p></div>
              <div className="card p-3"><p className="text-xs text-slate-500">Physician</p><p className="text-sm font-medium">{activeSession.physicianName}</p></div>
            </div>

            {/* Chat */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Chat</p>
              <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-lg">
                {activeSession.chatLog.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No messages yet</p> : (
                  activeSession.chatLog.map((c, i) => (
                    <div key={i} className={`flex ${c.sender === activeSession.physicianName ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${c.sender === activeSession.physicianName ? "bg-teal-600 text-white" : "bg-white border border-slate-200"}`}>
                        <p className="text-xs opacity-70 mb-0.5">{c.sender}</p>
                        <p>{c.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {activeSession.status === "In Progress" && (
                <div className="flex gap-2 mt-2">
                  <input className="input flex-1" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => { if (e.key === "Enter" && chatMessage.trim()) { addTelemedicineChat(activeSession.id, currentUser?.name ?? "Physician", chatMessage); setChatMessage(""); } }} />
                  <button className="btn-primary" onClick={() => { if (chatMessage.trim()) { addTelemedicineChat(activeSession.id, currentUser?.name ?? "Physician", chatMessage); setChatMessage(""); } }}>Send</button>
                </div>
              )}
            </div>

            {/* Consultation notes */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Consultation Notes</p>
              <textarea className="input" rows={3} value={activeSession.consultationNotes} onChange={(e) => updateTelemedicineSession(activeSession.id, { consultationNotes: e.target.value })} placeholder="Enter clinical notes..." />
            </div>

            {/* Visit summary */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Visit Summary</p>
              <textarea className="input" rows={2} value={activeSession.visitSummary} onChange={(e) => updateTelemedicineSession(activeSession.id, { visitSummary: e.target.value })} placeholder="Summary for patient..." />
            </div>

            {/* Follow-up + actions */}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Follow-up Date</label><input type="date" className="input" value={activeSession.followUpDate ?? ""} onChange={(e) => updateTelemedicineSession(activeSession.id, { followUpDate: e.target.value })} /></div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <button className="btn-secondary btn-sm" onClick={() => _onNavigate("prescriptions")}><Pill size={14} /> Create Prescription</button>
              <button className="btn-secondary btn-sm" onClick={() => _onNavigate("labs")}><FlaskConical size={14} /> Request Lab</button>
              <button className="btn-secondary btn-sm" onClick={() => _onNavigate("invoices")}><Receipt size={14} /> Create Invoice</button>
              {activeSession.status === "In Progress" && <button className="btn-primary btn-sm ml-auto" onClick={() => { updateTelemedicineSession(activeSession.id, { status: "Completed" }); setSelectedSession(null); }}><CheckCircle2 size={14} /> Complete Consultation</button>}
            </div>
          </div>
        </Modal>
      )}

      {/* New session modal */}
      {showNewSession && (
        <NewSessionModal patients={patients} users={users} currentUser={currentUser} onClose={() => setShowNewSession(false)} onCreate={(data) => { addTelemedicineSession(data); setShowNewSession(false); }} />
      )}
    </div>
  );
}

function NewSessionModal({ patients, users, currentUser, onClose, onCreate }: {
  patients: { id: string; firstName: string; lastName: string }[];
  users: { id: string; name: string; role: string }[];
  currentUser: { id: string; name: string } | null;
  onClose: () => void;
  onCreate: (data: Omit<TelemedicineSession, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [form, setForm] = useState({
    patientId: patients[0]?.id ?? "",
    patientName: patients[0] ? `${patients[0].firstName} ${patients[0].lastName}` : "",
    physicianId: currentUser?.id ?? users[0]?.id ?? "",
    physicianName: currentUser?.name ?? users[0]?.name ?? "",
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "10:00",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === form.patientId);
    const sid = `TEL-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    onCreate({
      ...form,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : form.patientName,
      status: "Scheduled",
      sessionId: sid,
      meetingLink: `https://meet.sfhc.org/${sid.toLowerCase()}`,
      chatLog: [],
      consultationNotes: "",
      visitSummary: "",
    });
  };

  return (
    <Modal open onClose={onClose} title="New Telemedicine Session" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Patient</label>
          <select className="input" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
          </select>
        </div>
        <div><label className="block text-xs font-medium text-slate-600 mb-1">Physician</label>
          <select className="input" value={form.physicianId} onChange={(e) => { const u = users.find((u) => u.id === e.target.value); setForm({ ...form, physicianId: e.target.value, physicianName: u?.name ?? "" }); }}>
            {users.filter((u) => u.role === "Physician" || u.role === "Administrator").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Date</label><input type="date" className="input" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} required /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Time</label><input type="time" className="input" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Create Session</button>
        </div>
      </form>
    </Modal>
  );
}
