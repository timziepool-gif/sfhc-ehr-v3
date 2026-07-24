import { useMemo, useState } from "react";
import {
  ShieldCheck, Plus, Pencil, Trash2, Search, Eye, X, Building2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, SearchInput, EmptyState, Pagination, StatusBadge, KpiCard } from "@/components/ui";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDate, patientFullName, daysUntil } from "@/lib/format";
import type { InsurancePolicy, InsuranceType, ClaimStatus } from "@/lib/types";

const PAGE_SIZE = 10;

const INSURANCE_TYPES: InsuranceType[] = ["Cash", "Insurance", "Corporate", "NHIA", "Private HMO", "Self Pay"];
const CLAIM_STATUSES: ClaimStatus[] = ["Draft", "Submitted", "Under Review", "Approved", "Rejected", "Paid"];

export default function Insurance() {
  const { insurancePolicies, patients, addInsurancePolicy, updateInsurancePolicy, deleteInsurancePolicy, logActivity, currentUser } = useApp();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InsurancePolicy | null>(null);
  const [viewing, setViewing] = useState<InsurancePolicy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InsurancePolicy | null>(null);

  const filtered = useMemo(() => {
    return insurancePolicies.filter((p) => {
      const patient = patients.find((pt) => pt.id === p.patientId);
      const matchesSearch =
        p.insurerName.toLowerCase().includes(search.toLowerCase()) ||
        p.policyNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.memberId.toLowerCase().includes(search.toLowerCase()) ||
        (patient && patientFullName(patient).toLowerCase().includes(search.toLowerCase()));
      const matchesType = typeFilter === "All" || p.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [insurancePolicies, patients, search, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const active = insurancePolicies.filter((p) => p.active).length;
    const expiringSoon = insurancePolicies.filter((p) => { const d = daysUntil(p.expiryDate); return d >= 0 && d <= 30; }).length;
    const avgCoverage = insurancePolicies.length > 0 ? insurancePolicies.reduce((s, p) => s + p.coveragePercent, 0) / insurancePolicies.length : 0;
    return { active, expiringSoon, avgCoverage, total: insurancePolicies.length };
  }, [insurancePolicies]);

  function handleDelete() {
    if (!deleteTarget) return;
    deleteInsurancePolicy(deleteTarget.id);
    logActivity({ kind: "billing", title: "Insurance policy deleted", description: `${deleteTarget.policyNumber} deleted`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Insurance / HMO"
        subtitle="Manage patient insurance policies and coverage"
        actions={<button className="btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> Add Policy</button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<ShieldCheck size={18} />} label="Total Policies" value={String(stats.total)} tone="teal" />
        <KpiCard icon={<ShieldCheck size={18} />} label="Active" value={String(stats.active)} tone="blue" />
        <KpiCard icon={<Building2 size={18} />} label="Expiring Soon" value={String(stats.expiringSoon)} tone="amber" />
        <KpiCard icon={<ShieldCheck size={18} />} label="Avg Coverage" value={`${stats.avgCoverage.toFixed(0)}%`} tone="teal" />
      </div>

      <div className="card">
        <div className="card-body flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search insurer, policy no, member ID, patient..." className="flex-1" />
          <select className="input flex-none w-full sm:w-44" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="All">All Types</option>
            {INSURANCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={<ShieldCheck size={28} />} title="No insurance policies" description="Add an insurance policy for a patient." action={<button className="btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> Add Policy</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Policy #</th><th>Patient</th><th>Insurer</th><th>Type</th><th>Coverage</th><th>Expiry</th><th>Status</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {pageItems.map((p) => {
                  const patient = patients.find((pt) => pt.id === p.patientId);
                  const expiryDays = daysUntil(p.expiryDate);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="font-mono text-xs font-medium">{p.policyNumber}</td>
                      <td className="font-medium">{patient ? patientFullName(patient) : "—"}</td>
                      <td className="text-slate-600">{p.insurerName}</td>
                      <td><span className="badge-blue">{p.type}</span></td>
                      <td className="tabular-nums font-medium">{p.coveragePercent}%</td>
                      <td className="text-sm">
                        <span className={expiryDays < 0 ? "text-rose-500" : expiryDays <= 30 ? "text-amber-500" : "text-slate-600"}>
                          {formatDate(p.expiryDate)}
                        </span>
                      </td>
                      <td>{p.active ? <StatusBadge status="Active" tone="green" /> : <StatusBadge status="Inactive" tone="slate" />}</td>
                      <td className="text-right">
                        <div className="inline-flex gap-1">
                          <button className="btn-ghost btn-sm !p-1.5" title="View" onClick={() => setViewing(p)}><Eye size={15} /></button>
                          <button className="btn-ghost btn-sm !p-1.5" title="Edit" onClick={() => { setEditing(p); setShowForm(true); }}><Pencil size={15} /></button>
                          <button className="btn-ghost btn-sm !p-1.5 text-rose-500" title="Delete" onClick={() => setDeleteTarget(p)}><Trash2 size={15} /></button>
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

      {showForm && (
        <PolicyForm
          editing={editing}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            if (editing) {
              updateInsurancePolicy(editing.id, data);
              logActivity({ kind: "billing", title: "Policy updated", description: `${editing.policyNumber} updated`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
            } else {
              const pol = addInsurancePolicy(data);
              logActivity({ kind: "billing", title: "Policy created", description: `${pol.policyNumber} created`, actorId: currentUser?.id ?? "", actorName: currentUser?.name ?? "" });
            }
            setShowForm(false);
          }}
        />
      )}

      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={`Policy ${viewing.policyNumber}`} size="md">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-slate-500 uppercase">Patient</p><p className="font-medium">{patients.find((p) => p.id === viewing.patientId) ? patientFullName(patients.find((p) => p.id === viewing.patientId)!) : "—"}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Insurer</p><p className="font-medium">{viewing.insurerName}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Type</p><p className="font-medium">{viewing.type}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Coverage</p><p className="font-medium">{viewing.coveragePercent}%</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Member ID</p><p className="font-medium">{viewing.memberId}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Employer</p><p className="font-medium">{viewing.employer || "—"}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Expiry</p><p className="font-medium">{formatDate(viewing.expiryDate)}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Authorization</p><p className="font-medium">{viewing.authorizationNumber || "—"}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Claim Status</p><div><StatusBadge status={viewing.claimStatus} /></div></div>
              <div><p className="text-xs text-slate-500 uppercase">Active</p><p className="font-medium">{viewing.active ? "Yes" : "No"}</p></div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Policy"
        message={`Delete policy ${deleteTarget?.policyNumber}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function PolicyForm({
  editing, onClose, onSave,
}: {
  editing: InsurancePolicy | null;
  onClose: () => void;
  onSave: (data: Omit<InsurancePolicy, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const { patients } = useApp();
  const [patientId, setPatientId] = useState(editing?.patientId ?? patients[0]?.id ?? "");
  const [type, setType] = useState<InsuranceType>(editing?.type ?? "Insurance");
  const [insurerName, setInsurerName] = useState(editing?.insurerName ?? "");
  const [policyNumber, setPolicyNumber] = useState(editing?.policyNumber ?? "");
  const [memberId, setMemberId] = useState(editing?.memberId ?? "");
  const [employer, setEmployer] = useState(editing?.employer ?? "");
  const [coveragePercent, setCoveragePercent] = useState(editing?.coveragePercent ?? 80);
  const [expiryDate, setExpiryDate] = useState(editing?.expiryDate ?? new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10));
  const [authorizationNumber, setAuthorizationNumber] = useState(editing?.authorizationNumber ?? "");
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>(editing?.claimStatus ?? "Draft");
  const [active, setActive] = useState(editing?.active ?? true);

  function handleSave() {
    if (!patientId || !insurerName || !policyNumber) return;
    onSave({ patientId, type, insurerName, policyNumber, memberId, employer, coveragePercent, expiryDate, authorizationNumber, claimStatus, active });
  }

  return (
    <Modal open onClose={onClose} title={editing ? "Edit Policy" : "Add Insurance Policy"} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Patient</label>
            <select className="input" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              {patients.map((p) => <option key={p.id} value={p.id}>{patientFullName(p)}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value as InsuranceType)}>
              {INSURANCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Insurer Name</label>
            <input className="input" value={insurerName} onChange={(e) => setInsurerName(e.target.value)} placeholder="e.g. Allianz Africa" />
          </div>
          <div>
            <label className="form-label">Policy Number</label>
            <input className="input" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} placeholder="e.g. AZ-44120" />
          </div>
          <div>
            <label className="form-label">Member ID</label>
            <input className="input" value={memberId} onChange={(e) => setMemberId(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Employer</label>
            <input className="input" value={employer} onChange={(e) => setEmployer(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Coverage %</label>
            <input type="number" min={0} max={100} className="input" value={coveragePercent} onChange={(e) => setCoveragePercent(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="form-label">Expiry Date</label>
            <input type="date" className="input" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Authorization #</label>
            <input className="input" value={authorizationNumber} onChange={(e) => setAuthorizationNumber(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Claim Status</label>
            <select className="input" value={claimStatus} onChange={(e) => setClaimStatus(e.target.value as ClaimStatus)}>
              {CLAIM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Active</label>
            <select className="input" value={active ? "yes" : "no"} onChange={(e) => setActive(e.target.value === "yes")}>
              <option value="yes">Active</option>
              <option value="no">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button className="btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={handleSave} disabled={!patientId || !insurerName || !policyNumber}>{editing ? "Update Policy" : "Add Policy"}</button>
        </div>
      </div>
    </Modal>
  );
}
