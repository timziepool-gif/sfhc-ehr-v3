import { useState } from "react";
import { Save, X } from "lucide-react";
import type { Patient, Allergy, Gender, BloodType } from "@/lib/types";

interface Props {
  patient: Patient | null;
  onSubmit: (data: Omit<Patient, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const GENDERS: Gender[] = ["Male", "Female", "Other"];
const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

const emptyForm = {
  firstName: "", lastName: "", dateOfBirth: "", gender: "Male" as Gender, bloodType: "Unknown" as BloodType,
  phone: "", email: "", address: "", city: "", emergencyContactName: "", emergencyContactPhone: "",
  insuranceProvider: "", insuranceNumber: "", allergies: [] as Allergy[], chronicConditions: [] as string[],
};

export default function PatientForm({ patient, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState(
    patient
      ? { ...patient }
      : { ...emptyForm },
  );
  const [chronicInput, setChronicInput] = useState("");
  const [allergyInput, setAllergyInput] = useState<Allergy>({ id: "", substance: "", severity: "Mild", reaction: "" });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addChronic() {
    const v = chronicInput.trim();
    if (!v) return;
    set("chronicConditions", [...form.chronicConditions, v]);
    setChronicInput("");
  }
  function removeChronic(c: string) {
    set("chronicConditions", form.chronicConditions.filter((x) => x !== c));
  }
  function addAllergy() {
    if (!allergyInput.substance.trim()) return;
    set("allergies", [...form.allergies, { ...allergyInput, id: `a-${Date.now()}` }]);
    setAllergyInput({ id: "", substance: "", severity: "Mild", reaction: "" });
  }
  function removeAllergy(id: string) {
    set("allergies", form.allergies.filter((a) => a.id !== id));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Section title="Personal Information">
        <Grid>
          <Field label="First Name" required>
            <input className="input" required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </Field>
          <Field label="Last Name" required>
            <input className="input" required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </Field>
          <Field label="Date of Birth" required>
            <input type="date" className="input" required value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
          </Field>
          <Field label="Gender">
            <select className="select" value={form.gender} onChange={(e) => set("gender", e.target.value as Gender)}>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Blood Type">
            <select className="select" value={form.bloodType} onChange={(e) => set("bloodType", e.target.value as BloodType)}>
              {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
        </Grid>
      </Section>

      <Section title="Contact">
        <Grid>
          <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Email"><input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Address" full><input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="City"><input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
          <Field label="Emergency Contact Name"><input className="input" value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} /></Field>
          <Field label="Emergency Contact Phone"><input className="input" value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} /></Field>
        </Grid>
      </Section>

      <Section title="Insurance">
        <Grid>
          <Field label="Provider"><input className="input" value={form.insuranceProvider} onChange={(e) => set("insuranceProvider", e.target.value)} /></Field>
          <Field label="Number"><input className="input" value={form.insuranceNumber} onChange={(e) => set("insuranceNumber", e.target.value)} /></Field>
        </Grid>
      </Section>

      <Section title="Allergies">
        <div className="space-y-3">
          {form.allergies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.allergies.map((a) => (
                <span key={a.id} className={`badge-${a.severity === "Severe" ? "rose" : a.severity === "Moderate" ? "amber" : "slate"}`}>
                  {a.substance} · {a.severity}
                  <button type="button" onClick={() => removeAllergy(a.id)} className="ml-1 hover:text-slate-900"><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input className="input sm:col-span-2" placeholder="Allergen (e.g. Penicillin)" value={allergyInput.substance} onChange={(e) => setAllergyInput((a) => ({ ...a, substance: e.target.value }))} />
            <select className="select" value={allergyInput.severity} onChange={(e) => setAllergyInput((a) => ({ ...a, severity: e.target.value as Allergy["severity"] }))}>
              <option>Mild</option><option>Moderate</option><option>Severe</option>
            </select>
            <button type="button" className="btn-secondary btn-sm" onClick={addAllergy}><Plus2 /> Add</button>
            <input className="input sm:col-span-4" placeholder="Reaction (optional)" value={allergyInput.reaction} onChange={(e) => setAllergyInput((a) => ({ ...a, reaction: e.target.value }))} />
          </div>
        </div>
      </Section>

      <Section title="Chronic Conditions">
        <div className="space-y-3">
          {form.chronicConditions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.chronicConditions.map((c) => (
                <span key={c} className="badge-blue">{c}
                  <button type="button" onClick={() => removeChronic(c)} className="ml-1 hover:text-slate-900"><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input className="input" placeholder="Add condition (e.g. Hypertension)" value={chronicInput} onChange={(e) => setChronicInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChronic(); } }} />
            <button type="button" className="btn-secondary btn-sm" onClick={addChronic}><Plus2 /> Add</button>
          </div>
        </div>
      </Section>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary"><Save size={16} /> Save Patient</button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>;
}
function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "sm:col-span-2 lg:col-span-3" : ""}>
      <label className="label">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}
function Plus2() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5v14" />
    </svg>
  );
}
