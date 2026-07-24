import { useMemo, useState } from "react";
import { Users, Plus, Eye, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, EmptyState, Pagination } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import PatientForm from "@/pages/parts/PatientForm";
import { age, formatDate, initials, patientFullName } from "@/lib/format";
import type { Patient } from "@/lib/types";
import type { Route } from "@/components/Sidebar";

const PAGE_SIZE = 8;

export default function Patients({ onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const { patients, addPatient, updatePatient, deletePatient } = useApp();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      `${p.firstName} ${p.lastName} ${p.phone} ${p.email} ${p.insuranceNumber}`.toLowerCase().includes(q),
    );
  }, [patients, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: Patient) {
    setEditing(p);
    setFormOpen(true);
  }
  function view(p: Patient) {
    onNavigate("patient-detail", { id: p.id });
  }
  function handleDelete() {
    if (confirmId) deletePatient(confirmId);
    setConfirmId(null);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Patient Management"
        subtitle={`${patients.length} patient records in the registry.`}
        icon={<Users size={20} />}
        actions={
          <>
            <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search name, phone, insurance…" className="w-64" />
            <button className="btn-primary btn-sm" onClick={openNew}>
              <Plus size={14} /> New Patient
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title="No patients found"
            description={query ? "Try a different search term." : "Add your first patient to get started."}
            action={!query && <button className="btn-primary btn-sm" onClick={openNew}><Plus size={14} /> New Patient</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age / Gender</th>
                  <th>Contact</th>
                  <th>Allergies</th>
                  <th>Conditions</th>
                  <th>Registered</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="cursor-pointer" onClick={() => view(p)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-semibold shrink-0">
                          {initials(p.firstName, p.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{patientFullName(p)}</p>
                          <p className="text-xs text-slate-500 font-mono">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-slate-700">{age(p.dateOfBirth)}y</span>
                      <span className="text-xs text-slate-400 ml-1.5">{p.gender}</span>
                    </td>
                    <td>
                      <p className="text-sm text-slate-700 truncate">{p.phone}</p>
                      <p className="text-xs text-slate-500 truncate">{p.email}</p>
                    </td>
                    <td>
                      {p.allergies.length === 0 ? (
                        <span className="text-xs text-slate-400">None recorded</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {p.allergies.slice(0, 2).map((a) => (
                            <span key={a.id} className={`badge-${a.severity === "Severe" ? "rose" : a.severity === "Moderate" ? "amber" : "slate"}`}>
                              <AlertTriangle size={10} /> {a.substance}
                            </span>
                          ))}
                          {p.allergies.length > 2 && <span className="text-xs text-slate-400">+{p.allergies.length - 2}</span>}
                        </div>
                      )}
                    </td>
                    <td>
                      {p.chronicConditions.length === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <span className="text-sm text-slate-700">{p.chronicConditions.join(", ")}</span>
                      )}
                    </td>
                    <td className="text-sm text-slate-600">{formatDate(p.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn-ghost btn-sm !p-1.5" onClick={() => view(p)} title="View"><Eye size={15} /></button>
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Patient" : "New Patient"}
        subtitle={editing ? editing.id : "Register a new patient record"}
        size="xl"
      >
        <PatientForm
          patient={editing}
          onSubmit={(data) => {
            if (editing) updatePatient(editing.id, data);
            else addPatient(data);
            setFormOpen(false);
          }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete patient?"
        message="This will permanently remove the patient record. This action cannot be undone."
        destructive
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
