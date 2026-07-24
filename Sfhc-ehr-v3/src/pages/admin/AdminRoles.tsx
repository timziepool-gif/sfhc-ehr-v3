import { KeyRound, Check, X } from "lucide-react";
import { PageHeader } from "@/components/ui";
import type { AdminUserRole } from "@/lib/types";

const ROLES: { role: AdminUserRole; description: string; permissions: string[] }[] = [
  { role: "Administrator", description: "Full system access", permissions: ["All Modules", "User Management", "System Settings", "Audit Logs", "Role Management"] },
  { role: "Physician", description: "Clinical modules access", permissions: ["Dashboard", "Patient Management", "Appointments", "Clinical Documentation", "Laboratory", "Pharmacy (view)"] },
  { role: "Medical Laboratory Scientist", description: "Laboratory access only", permissions: ["Dashboard", "Laboratory", "Lab Inventory"] },
  { role: "Pharmacist", description: "Pharmacy access only", permissions: ["Dashboard", "Pharmacy", "Prescriptions", "Dispensing", "Pharmacy Inventory"] },
  { role: "Finance Officer", description: "Billing and finance access", permissions: ["Dashboard", "Billing", "Invoices", "Payments", "Claims", "Revenue Reports", "Pricing"] },
  { role: "Receptionist", description: "Front desk access", permissions: ["Dashboard", "Appointments", "Patient Registration"] },
  { role: "Nurse", description: "Clinical support access", permissions: ["Dashboard", "Patient Management", "Appointments", "Clinical Support", "Vitals"] },
  { role: "Inventory Officer", description: "Inventory and procurement access", permissions: ["Dashboard", "Inventory", "Procurement", "Suppliers", "Stock Adjustments", "Stock Transfers", "Assets"] },
  { role: "Department Head", description: "Department management access", permissions: ["Dashboard", "Staff Directory", "Staff Schedule", "Leave Management", "Attendance"] },
  { role: "System Auditor", description: "Audit and review access", permissions: ["Dashboard", "Audit Logs", "Reports"] },
];

export default function AdminRoles() {
  return (
    <div className="space-y-5">
      <PageHeader title="Roles & Permissions" subtitle="Role-based access control matrix" icon={<KeyRound size={20} />} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROLES.map((r) => (
          <div key={r.role} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{r.role}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center"><KeyRound size={18} /></div>
            </div>
            <div className="space-y-1.5">
              {r.permissions.map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm">
                  <Check size={14} className="text-teal-600 shrink-0" />
                  <span className="text-slate-700">{p}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
