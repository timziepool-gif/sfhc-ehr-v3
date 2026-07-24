import type {
  StaffMember,
  Department,
  AdminUser,
  AttendanceRecord,
  LeaveRequest,
  ScheduleEntry,
  AuditLogEntry,
  SystemSettings,
} from "./types";

const now = new Date();
const isoDate = (d: Date) => d.toISOString();
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

// ---- Departments ----
export const SEED_DEPARTMENTS: Department[] = [
  { id: "dept-001", name: "Administration", headOfDepartment: "u-001", headOfDepartmentName: "Dr. Admin", description: "Overall clinic administration and management", staffCount: 2, createdAt: isoDate(addDays(now, -365)) },
  { id: "dept-002", name: "Medical", headOfDepartment: "u-002", headOfDepartmentName: "Dr. Smith", description: "Clinical medical services and patient care", staffCount: 3, createdAt: isoDate(addDays(now, -365)) },
  { id: "dept-003", name: "Nursing", headOfDepartment: "u-003", headOfDepartmentName: "Nurse Joy", description: "Nursing care and patient support", staffCount: 4, createdAt: isoDate(addDays(now, -300)) },
  { id: "dept-004", name: "Laboratory", headOfDepartment: "u-005", headOfDepartmentName: "Lab Tech", description: "Laboratory testing and diagnostics", staffCount: 2, createdAt: isoDate(addDays(now, -300)) },
  { id: "dept-005", name: "Pharmacy", headOfDepartment: "u-004", headOfDepartmentName: "Pharmacist", description: "Medication management and dispensing", staffCount: 2, createdAt: isoDate(addDays(now, -300)) },
  { id: "dept-006", name: "Finance", headOfDepartment: "u-007", headOfDepartmentName: "Finance Officer", description: "Billing, finance and revenue cycle", staffCount: 2, createdAt: isoDate(addDays(now, -250)) },
  { id: "dept-007", name: "Reception", headOfDepartment: "u-006", headOfDepartmentName: "Receptionist", description: "Front desk and patient registration", staffCount: 2, createdAt: isoDate(addDays(now, -250)) },
  { id: "dept-008", name: "Records", description: "Medical records management", staffCount: 1, createdAt: isoDate(addDays(now, -200)) },
  { id: "dept-009", name: "ICT", description: "Information and communication technology", staffCount: 1, createdAt: isoDate(addDays(now, -200)) },
  { id: "dept-010", name: "Maintenance", description: "Facility maintenance and repairs", staffCount: 1, createdAt: isoDate(addDays(now, -180)) },
];

// ---- Staff Members ----
export const SEED_STAFF: StaffMember[] = [
  {
    id: "stf-001", staffId: "SFHC-001", fullName: "Dr. Admin User", gender: "Male", dateOfBirth: "1975-03-15",
    phone: "+234 801 000 0001", email: "admin@sfhc.org", address: "1 Admin Way, Abuja",
    department: "Administration", position: "Clinic Director", professionalLicenseNumber: "MDCN-001",
    employmentDate: dateOnly(addDays(now, -365)), status: "Active",
    emergencyContactName: "Mary Admin", emergencyContactPhone: "+234 801 000 0002",
    qualifications: ["MBBS", "MPH"], specialization: "Healthcare Administration", userId: "u-001",
    createdAt: isoDate(addDays(now, -365)), updatedAt: isoDate(now),
  },
  {
    id: "stf-002", staffId: "SFHC-002", fullName: "Dr. John Smith", gender: "Male", dateOfBirth: "1980-07-22",
    phone: "+234 802 000 0001", email: "doctor@sfhc.org", address: "5 Medical Rd, Abuja",
    department: "Medical", position: "Senior Physician", professionalLicenseNumber: "MDCN-002",
    employmentDate: dateOnly(addDays(now, -300)), status: "Active",
    emergencyContactName: "Jane Smith", emergencyContactPhone: "+234 802 000 0002",
    qualifications: ["MBBS", "FWACP"], specialization: "Internal Medicine", userId: "u-002",
    createdAt: isoDate(addDays(now, -300)), updatedAt: isoDate(now),
  },
  {
    id: "stf-003", staffId: "SFHC-003", fullName: "Nurse Joy Adams", gender: "Female", dateOfBirth: "1985-11-10",
    phone: "+234 803 000 0001", email: "nurse@sfhc.org", address: "12 Nursing Ave, Abuja",
    department: "Nursing", position: "Head Nurse", professionalLicenseNumber: "RN-001",
    employmentDate: dateOnly(addDays(now, -280)), status: "Active",
    emergencyContactName: "Peter Adams", emergencyContactPhone: "+234 803 000 0002",
    qualifications: ["BNSc", "RN"], specialization: "Emergency Nursing", userId: "u-003",
    createdAt: isoDate(addDays(now, -280)), updatedAt: isoDate(now),
  },
  {
    id: "stf-004", staffId: "SFHC-004", fullName: "Pharmacist Grace Lee", gender: "Female", dateOfBirth: "1988-04-05",
    phone: "+234 804 000 0001", email: "pharmacist@sfhc.org", address: "8 Pharmacy St, Abuja",
    department: "Pharmacy", position: "Chief Pharmacist", professionalLicenseNumber: "PSN-001",
    employmentDate: dateOnly(addDays(now, -260)), status: "Active",
    emergencyContactName: "David Lee", emergencyContactPhone: "+234 804 000 0002",
    qualifications: ["PharmD", "MSc"], specialization: "Clinical Pharmacy", userId: "u-004",
    createdAt: isoDate(addDays(now, -260)), updatedAt: isoDate(now),
  },
  {
    id: "stf-005", staffId: "SFHC-005", fullName: "Lab Tech Mike Brown", gender: "Male", dateOfBirth: "1990-09-18",
    phone: "+234 805 000 0001", email: "lab@sfhc.org", address: "20 Lab Dr, Abuja",
    department: "Laboratory", position: "Medical Laboratory Scientist", professionalLicenseNumber: "MLSCN-001",
    employmentDate: dateOnly(addDays(now, -240)), status: "Active",
    emergencyContactName: "Sarah Brown", emergencyContactPhone: "+234 805 000 0002",
    qualifications: ["BMLS"], specialization: "Hematology", userId: "u-005",
    createdAt: isoDate(addDays(now, -240)), updatedAt: isoDate(now),
  },
  {
    id: "stf-006", staffId: "SFHC-006", fullName: "Receptionist Ada Okafor", gender: "Female", dateOfBirth: "1995-02-28",
    phone: "+234 806 000 0001", email: "reception@sfhc.org", address: "3 Front Desk Rd, Abuja",
    department: "Reception", position: "Front Desk Officer",
    employmentDate: dateOnly(addDays(now, -200)), status: "Active",
    emergencyContactName: "Chris Okafor", emergencyContactPhone: "+234 806 000 0002",
    qualifications: ["OND"], specialization: "Customer Service", userId: "u-006",
    createdAt: isoDate(addDays(now, -200)), updatedAt: isoDate(now),
  },
  {
    id: "stf-007", staffId: "SFHC-007", fullName: "Finance Officer Tom Wilson", gender: "Male", dateOfBirth: "1982-06-12",
    phone: "+234 807 000 0001", email: "finance@sfhc.org", address: "15 Finance Rd, Abuja",
    department: "Finance", position: "Finance Officer", professionalLicenseNumber: "ICAN-001",
    employmentDate: dateOnly(addDays(now, -250)), status: "Active",
    emergencyContactName: "Lisa Wilson", emergencyContactPhone: "+234 807 000 0002",
    qualifications: ["BSc Accounting", "ACA"], specialization: "Healthcare Finance", userId: "u-007",
    createdAt: isoDate(addDays(now, -250)), updatedAt: isoDate(now),
  },
  {
    id: "stf-008", staffId: "SFHC-008", fullName: "Nurse Mary Davis", gender: "Female", dateOfBirth: "1992-12-03",
    phone: "+234 808 000 0001", email: "nurse2@sfhc.org", address: "7 Care Ave, Abuja",
    department: "Nursing", position: "Staff Nurse", professionalLicenseNumber: "RN-002",
    employmentDate: dateOnly(addDays(now, -150)), status: "On Leave",
    emergencyContactName: "James Davis", emergencyContactPhone: "+234 808 000 0002",
    qualifications: ["BNSc"], specialization: "Pediatric Nursing",
    createdAt: isoDate(addDays(now, -150)), updatedAt: isoDate(now),
  },
  {
    id: "stf-009", staffId: "SFHC-009", fullName: "Dr. Aisha Bello", gender: "Female", dateOfBirth: "1987-08-15",
    phone: "+234 809 000 0001", email: "aisha@sfhc.org", address: "22 Bella St, Abuja",
    department: "Medical", position: "Medical Officer", professionalLicenseNumber: "MDCN-003",
    employmentDate: dateOnly(addDays(now, -120)), status: "Active",
    emergencyContactName: "Ibrahim Bello", emergencyContactPhone: "+234 809 000 0002",
    qualifications: ["MBBS"], specialization: "Pediatrics",
    createdAt: isoDate(addDays(now, -120)), updatedAt: isoDate(now),
  },
  {
    id: "stf-010", staffId: "SFHC-010", fullName: "Tech Support Sam Wilson", gender: "Male", dateOfBirth: "1993-05-20",
    phone: "+234 810 000 0001", email: "ict@sfhc.org", address: "10 Tech Rd, Abuja",
    department: "ICT", position: "IT Support Officer",
    employmentDate: dateOnly(addDays(now, -90)), status: "Active",
    emergencyContactName: "Kate Wilson", emergencyContactPhone: "+234 810 000 0002",
    qualifications: ["BSc Computer Science"], specialization: "Network Administration",
    createdAt: isoDate(addDays(now, -90)), updatedAt: isoDate(now),
  },
];

// ---- Admin Users (extended user management) ----
export const SEED_ADMIN_USERS: AdminUser[] = [
  { id: "u-001", name: "Dr. Admin User", email: "admin@sfhc.org", role: "Administrator", department: "dept-001", departmentName: "Administration", staffId: "stf-001", active: true, createdAt: isoDate(addDays(now, -365)), updatedAt: isoDate(now) },
  { id: "u-002", name: "Dr. John Smith", email: "doctor@sfhc.org", role: "Physician", department: "dept-002", departmentName: "Medical", staffId: "stf-002", active: true, createdAt: isoDate(addDays(now, -300)), updatedAt: isoDate(now) },
  { id: "u-003", name: "Nurse Joy Adams", email: "nurse@sfhc.org", role: "Nurse", department: "dept-003", departmentName: "Nursing", staffId: "stf-003", active: true, createdAt: isoDate(addDays(now, -280)), updatedAt: isoDate(now) },
  { id: "u-004", name: "Pharmacist Grace Lee", email: "pharmacist@sfhc.org", role: "Pharmacist", department: "dept-005", departmentName: "Pharmacy", staffId: "stf-004", active: true, createdAt: isoDate(addDays(now, -260)), updatedAt: isoDate(now) },
  { id: "u-005", name: "Lab Tech Mike Brown", email: "lab@sfhc.org", role: "Medical Laboratory Scientist", department: "dept-004", departmentName: "Laboratory", staffId: "stf-005", active: true, createdAt: isoDate(addDays(now, -240)), updatedAt: isoDate(now) },
  { id: "u-006", name: "Receptionist Ada Okafor", email: "reception@sfhc.org", role: "Receptionist", department: "dept-007", departmentName: "Reception", staffId: "stf-006", active: true, createdAt: isoDate(addDays(now, -200)), updatedAt: isoDate(now) },
  { id: "u-007", name: "Finance Officer Tom Wilson", email: "finance@sfhc.org", role: "Finance Officer", department: "dept-006", departmentName: "Finance", staffId: "stf-007", active: true, createdAt: isoDate(addDays(now, -250)), updatedAt: isoDate(now) },
];

// ---- Attendance ----
export const SEED_ATTENDANCE: AttendanceRecord[] = [
  { id: "att-001", staffId: "stf-001", staffName: "Dr. Admin User", department: "Administration", date: dateOnly(now), clockIn: "08:00", clockOut: undefined, workingHours: 0, status: "Present", notes: "", createdAt: isoDate(now) },
  { id: "att-002", staffId: "stf-002", staffName: "Dr. John Smith", department: "Medical", date: dateOnly(now), clockIn: "08:15", clockOut: undefined, workingHours: 0, status: "Late", notes: "15 min late", createdAt: isoDate(now) },
  { id: "att-003", staffId: "stf-003", staffName: "Nurse Joy Adams", department: "Nursing", date: dateOnly(now), clockIn: "07:45", clockOut: undefined, workingHours: 0, status: "Present", notes: "", createdAt: isoDate(now) },
  { id: "att-004", staffId: "stf-004", staffName: "Pharmacist Grace Lee", department: "Pharmacy", date: dateOnly(now), clockIn: "08:00", clockOut: undefined, workingHours: 0, status: "Present", notes: "", createdAt: isoDate(now) },
  { id: "att-005", staffId: "stf-005", staffName: "Lab Tech Mike Brown", department: "Laboratory", date: dateOnly(now), clockIn: "08:30", clockOut: undefined, workingHours: 0, status: "Late", notes: "30 min late", createdAt: isoDate(now) },
  { id: "att-006", staffId: "stf-006", staffName: "Receptionist Ada Okafor", department: "Reception", date: dateOnly(now), clockIn: "07:50", clockOut: undefined, workingHours: 0, status: "Present", notes: "", createdAt: isoDate(now) },
  { id: "att-007", staffId: "stf-007", staffName: "Finance Officer Tom Wilson", department: "Finance", date: dateOnly(now), clockIn: "08:05", clockOut: undefined, workingHours: 0, status: "Present", notes: "", createdAt: isoDate(now) },
  // Yesterday
  { id: "att-008", staffId: "stf-001", staffName: "Dr. Admin User", department: "Administration", date: dateOnly(addDays(now, -1)), clockIn: "08:00", clockOut: "17:00", workingHours: 9, status: "Present", notes: "", createdAt: isoDate(addDays(now, -1)) },
  { id: "att-009", staffId: "stf-002", staffName: "Dr. John Smith", department: "Medical", date: dateOnly(addDays(now, -1)), clockIn: "08:00", clockOut: "17:00", workingHours: 9, status: "Present", notes: "", createdAt: isoDate(addDays(now, -1)) },
  { id: "att-010", staffId: "stf-003", staffName: "Nurse Joy Adams", department: "Nursing", date: dateOnly(addDays(now, -1)), clockIn: "07:45", clockOut: "17:00", workingHours: 9.25, status: "Present", notes: "", createdAt: isoDate(addDays(now, -1)) },
  { id: "att-011", staffId: "stf-008", staffName: "Nurse Mary Davis", department: "Nursing", date: dateOnly(addDays(now, -1)), clockIn: undefined, clockOut: undefined, workingHours: 0, status: "Absent", notes: "On leave", createdAt: isoDate(addDays(now, -1)) },
];

// ---- Leave Requests ----
export const SEED_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "lv-001", staffId: "stf-008", staffName: "Nurse Mary Davis", department: "Nursing",
    leaveType: "Maternity Leave", startDate: dateOnly(addDays(now, -10)), endDate: dateOnly(addDays(now, 80)),
    days: 90, reason: "Maternity leave", status: "Approved", approvedBy: "u-001", approvedByName: "Dr. Admin User", approvedAt: isoDate(addDays(now, -12)),
    createdAt: isoDate(addDays(now, -15)), updatedAt: isoDate(addDays(now, -12)),
  },
  {
    id: "lv-002", staffId: "stf-002", staffName: "Dr. John Smith", department: "Medical",
    leaveType: "Annual Leave", startDate: dateOnly(addDays(now, 20)), endDate: dateOnly(addDays(now, 34)),
    days: 14, reason: "Family vacation", status: "Pending",
    createdAt: isoDate(addDays(now, -3)), updatedAt: isoDate(addDays(now, -3)),
  },
  {
    id: "lv-003", staffId: "stf-005", staffName: "Lab Tech Mike Brown", department: "Laboratory",
    leaveType: "Sick Leave", startDate: dateOnly(addDays(now, -5)), endDate: dateOnly(addDays(now, -3)),
    days: 3, reason: "Malaria", status: "Approved", approvedBy: "u-001", approvedByName: "Dr. Admin User", approvedAt: isoDate(addDays(now, -5)),
    createdAt: isoDate(addDays(now, -6)), updatedAt: isoDate(addDays(now, -5)),
  },
  {
    id: "lv-004", staffId: "stf-006", staffName: "Receptionist Ada Okafor", department: "Reception",
    leaveType: "Compassionate Leave", startDate: dateOnly(addDays(now, 5)), endDate: dateOnly(addDays(now, 7)),
    days: 3, reason: "Family bereavement", status: "Pending",
    createdAt: isoDate(addDays(now, -1)), updatedAt: isoDate(addDays(now, -1)),
  },
];

// ---- Staff Schedule ----
export const SEED_SCHEDULE: ScheduleEntry[] = [
  { id: "sch-001", staffId: "stf-001", staffName: "Dr. Admin User", department: "Administration", date: dateOnly(now), shift: "Morning", startTime: "08:00", endTime: "17:00", notes: "", createdAt: isoDate(now) },
  { id: "sch-002", staffId: "stf-002", staffName: "Dr. John Smith", department: "Medical", date: dateOnly(now), shift: "Morning", startTime: "08:00", endTime: "17:00", notes: "Clinic day", createdAt: isoDate(now) },
  { id: "sch-003", staffId: "stf-003", staffName: "Nurse Joy Adams", department: "Nursing", date: dateOnly(now), shift: "Morning", startTime: "07:00", endTime: "15:00", notes: "", createdAt: isoDate(now) },
  { id: "sch-004", staffId: "stf-004", staffName: "Pharmacist Grace Lee", department: "Pharmacy", date: dateOnly(now), shift: "Morning", startTime: "08:00", endTime: "17:00", notes: "", createdAt: isoDate(now) },
  { id: "sch-005", staffId: "stf-005", staffName: "Lab Tech Mike Brown", department: "Laboratory", date: dateOnly(now), shift: "Afternoon", startTime: "12:00", endTime: "20:00", notes: "", createdAt: isoDate(now) },
  { id: "sch-006", staffId: "stf-003", staffName: "Nurse Joy Adams", department: "Nursing", date: dateOnly(addDays(now, 1)), shift: "Night", startTime: "19:00", endTime: "07:00", notes: "Night shift", createdAt: isoDate(now) },
  { id: "sch-007", staffId: "stf-009", staffName: "Dr. Aisha Bello", department: "Medical", date: dateOnly(addDays(now, 1)), shift: "Morning", startTime: "08:00", endTime: "17:00", notes: "", createdAt: isoDate(now) },
  { id: "sch-008", staffId: "stf-006", staffName: "Receptionist Ada Okafor", department: "Reception", date: dateOnly(addDays(now, 2)), shift: "Morning", startTime: "07:30", endTime: "16:30", notes: "", createdAt: isoDate(now) },
];

// ---- Audit Logs ----
export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  { id: "aud-001", userId: "u-001", userName: "Dr. Admin User", action: "Login", module: "Auth", description: "User signed in", date: dateOnly(now), time: "08:00:00", ipAddress: "192.168.1.10", createdAt: isoDate(now) },
  { id: "aud-002", userId: "u-002", userName: "Dr. John Smith", action: "Create Patient", module: "Patients", description: "Created patient record: Jane Doe", date: dateOnly(now), time: "08:15:00", ipAddress: "192.168.1.11", createdAt: isoDate(now) },
  { id: "aud-003", userId: "u-004", userName: "Pharmacist Grace Lee", action: "Dispense", module: "Pharmacy", description: "Dispensed Amoxicillin 500mg to patient", date: dateOnly(now), time: "09:30:00", ipAddress: "192.168.1.12", createdAt: isoDate(now) },
  { id: "aud-004", userId: "u-005", userName: "Lab Tech Mike Brown", action: "Update Lab Result", module: "Laboratory", description: "Verified CBC results for patient", date: dateOnly(now), time: "10:00:00", ipAddress: "192.168.1.13", createdAt: isoDate(now) },
  { id: "aud-005", userId: "u-007", userName: "Finance Officer Tom Wilson", action: "Create Invoice", module: "Billing", description: "Created invoice INV-0001", date: dateOnly(now), time: "11:00:00", ipAddress: "192.168.1.14", createdAt: isoDate(now) },
  { id: "aud-006", userId: "u-001", userName: "Dr. Admin User", action: "Update Settings", module: "Settings", description: "Updated clinic contact information", date: dateOnly(addDays(now, -1)), time: "14:00:00", ipAddress: "192.168.1.10", createdAt: isoDate(addDays(now, -1)) },
  { id: "aud-007", userId: "u-003", userName: "Nurse Joy Adams", action: "Create SOAP Note", module: "Clinical", description: "Created clinical documentation", date: dateOnly(addDays(now, -1)), time: "09:00:00", ipAddress: "192.168.1.15", createdAt: isoDate(addDays(now, -1)) },
  { id: "aud-008", userId: "u-001", userName: "Dr. Admin User", action: "Create Staff", module: "Staff", description: "Added new staff member: Dr. Aisha Bello", date: dateOnly(addDays(now, -2)), time: "10:00:00", ipAddress: "192.168.1.10", createdAt: isoDate(addDays(now, -2)) },
];

// ---- System Settings ----
export const SEED_SYSTEM_SETTINGS: SystemSettings = {
  clinicName: "Sahel Family Health Clinic",
  clinicAddress: "15 Sahel Crescent, Abuja, Nigeria",
  clinicPhone: "+234 9 000 0000",
  clinicEmail: "info@sfhc.org",
  clinicWebsite: "www.sfhc.org",
  currency: "USD",
  taxRate: 7.5,
  theme: "light",
  emailNotifications: true,
  lowStockThreshold: 10,
  expiryAlertDays: 30,
  backupFrequency: "Weekly",
  updatedAt: isoDate(now),
};
