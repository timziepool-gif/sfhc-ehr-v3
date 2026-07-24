import type {
  ChatMessage,
  Reminder,
  TelemedicineSession,
  AppNotification,
  HolidayEntry,
  BusinessHours,
} from "./types";

const now = new Date();
const isoDate = (d: Date) => d.toISOString();
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

// ---- Chat Messages ----
export const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "msg-001", threadId: "thread-p001-u002",
    fromChannel: "Physician", fromName: "Dr. John Smith", fromId: "u-002",
    toChannel: "Patient", toName: "Jane Doe", toId: "p-001",
    subject: "Lab Results Review",
    body: "Your CBC results look normal. Please continue your current medication and schedule a follow-up in 2 weeks.",
    read: true, sentAt: isoDate(addDays(now, -3)), readAt: isoDate(addDays(now, -3)),
  },
  {
    id: "msg-002", threadId: "thread-p001-u002",
    fromChannel: "Patient", fromName: "Jane Doe", fromId: "p-001",
    toChannel: "Physician", toName: "Dr. John Smith", toId: "u-002",
    subject: "Re: Lab Results Review",
    body: "Thank you, Doctor. I'll schedule the follow-up. Should I fast before the next blood test?",
    read: false, sentAt: isoDate(addDays(now, -1)),
  },
  {
    id: "msg-003", threadId: "thread-p002-u002",
    fromChannel: "Laboratory", fromName: "Lab Tech Mike Brown", fromId: "u-005",
    toChannel: "Patient", toName: "John Smith", toId: "p-002",
    subject: "Lipid Panel Ready",
    body: "Your lipid panel results are ready. Please collect them at the lab or view them in your patient portal.",
    read: false, sentAt: isoDate(addDays(now, -2)),
  },
  {
    id: "msg-004", threadId: "thread-p001-u004",
    fromChannel: "Pharmacy", fromName: "Pharmacist Grace Lee", fromId: "u-004",
    toChannel: "Patient", toName: "Jane Doe", toId: "p-001",
    subject: "Prescription Ready",
    body: "Your prescription for Amoxicillin 500mg is ready for pickup. Please bring your ID.",
    read: false, sentAt: isoDate(addDays(now, -1)),
  },
  {
    id: "msg-005", threadId: "thread-p003-u006",
    fromChannel: "Reception", fromName: "Receptionist Ada Okafor", fromId: "u-006",
    toChannel: "Patient", toName: "Mary Johnson", toId: "p-003",
    subject: "Appointment Confirmation",
    body: "Your appointment on " + dateOnly(addDays(now, 3)) + " at 10:00 AM with Dr. Smith has been confirmed.",
    read: true, sentAt: isoDate(addDays(now, -5)), readAt: isoDate(addDays(now, -4)),
  },
];

// ---- Reminders ----
export const SEED_REMINDERS: Reminder[] = [
  {
    id: "rem-001", kind: "Upcoming Appointment", patientId: "p-001", patientName: "Jane Doe",
    title: "Appointment Tomorrow", message: "You have an appointment with Dr. Smith tomorrow at 10:00 AM.",
    dueDate: dateOnly(addDays(now, 1)), dismissed: false, createdAt: isoDate(now),
  },
  {
    id: "rem-002", kind: "Medication Reminder", patientId: "p-001", patientName: "Jane Doe",
    title: "Take Amoxicillin", message: "Remember to take your Amoxicillin 500mg — 1 capsule, 3 times daily with meals.",
    dueDate: dateOnly(now), dismissed: false, createdAt: isoDate(now),
  },
  {
    id: "rem-003", kind: "Laboratory Reminder", patientId: "p-002", patientName: "John Smith",
    title: "Fasting Blood Test", message: "Please come to the lab for your fasting blood glucose test. Do not eat 8 hours before the test.",
    dueDate: dateOnly(addDays(now, 2)), dismissed: false, createdAt: isoDate(now),
  },
  {
    id: "rem-004", kind: "Outstanding Bill", patientId: "p-001", patientName: "Jane Doe",
    title: "Outstanding Invoice", message: "You have an outstanding invoice of $150.00 due in 5 days.",
    dueDate: dateOnly(addDays(now, 5)), dismissed: false, createdAt: isoDate(now),
  },
  {
    id: "rem-005", kind: "Follow-up", patientId: "p-003", patientName: "Mary Johnson",
    title: "Follow-up Visit", message: "Your follow-up visit for hypertension management is due next week.",
    dueDate: dateOnly(addDays(now, 7)), dismissed: false, createdAt: isoDate(now),
  },
];

// ---- Telemedicine Sessions ----
export const SEED_TELEMEDICINE: TelemedicineSession[] = [
  {
    id: "tel-001", sessionId: "TEL-2024-001",
    patientId: "p-001", patientName: "Jane Doe",
    physicianId: "u-002", physicianName: "Dr. John Smith",
    scheduledDate: dateOnly(addDays(now, 1)), scheduledTime: "14:00",
    status: "Scheduled", meetingLink: "https://meet.sfhc.org/tel-2024-001",
    chatLog: [], consultationNotes: "", visitSummary: "",
    createdAt: isoDate(addDays(now, -2)), updatedAt: isoDate(addDays(now, -2)),
  },
  {
    id: "tel-002", sessionId: "TEL-2024-002",
    patientId: "p-003", patientName: "Mary Johnson",
    physicianId: "u-002", physicianName: "Dr. John Smith",
    scheduledDate: dateOnly(now), scheduledTime: "15:30",
    status: "Waiting", meetingLink: "https://meet.sfhc.org/tel-2024-002",
    chatLog: [
      { sender: "Mary Johnson", message: "Hello Doctor, I'm ready for the consultation.", timestamp: isoDate(now) },
    ],
    consultationNotes: "", visitSummary: "",
    createdAt: isoDate(addDays(now, -1)), updatedAt: isoDate(now),
  },
  {
    id: "tel-003", sessionId: "TEL-2024-003",
    patientId: "p-002", patientName: "John Smith",
    physicianId: "u-009", physicianName: "Dr. Aisha Bello",
    scheduledDate: dateOnly(addDays(now, -5)), scheduledTime: "10:00",
    status: "Completed", meetingLink: "https://meet.sfhc.org/tel-2024-003",
    chatLog: [
      { sender: "John Smith", message: "Good morning, Dr. Bello.", timestamp: isoDate(addDays(now, -5)) },
      { sender: "Dr. Aisha Bello", message: "Good morning! How are you feeling today?", timestamp: isoDate(addDays(now, -5)) },
      { sender: "John Smith", message: "Much better, thank you. The new medication is working well.", timestamp: isoDate(addDays(now, -5)) },
    ],
    consultationNotes: "Patient reports improvement with new antihypertensive medication. BP was 130/85 during last in-person visit. Continue current regimen. Follow up in 4 weeks.",
    visitSummary: "Teleconsultation completed. Patient stable on current medication. No changes needed. Follow-up scheduled.",
    followUpDate: dateOnly(addDays(now, 23)),
    createdAt: isoDate(addDays(now, -5)), updatedAt: isoDate(addDays(now, -5)),
  },
];

// ---- Notifications ----
export const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: "ntf-001", kind: "Critical Lab Result", title: "Critical Lab Result", message: "Patient John Smith has critical potassium levels (6.2 mmol/L)", severity: "danger", linkRoute: "labs", read: false, createdAt: isoDate(now) },
  { id: "ntf-002", kind: "Low Inventory", title: "Low Stock Alert", message: "Glucose Test Strips below minimum stock level (8 units)", severity: "warning", linkRoute: "inv-laboratory", read: false, createdAt: isoDate(now) },
  { id: "ntf-003", kind: "Upcoming Appointment", title: "Appointment Tomorrow", message: "Jane Doe has an appointment tomorrow at 10:00 AM", severity: "info", linkRoute: "appointments", read: false, createdAt: isoDate(now) },
  { id: "ntf-004", kind: "Pending Payment", title: "Pending Payment", message: "Invoice INV-0001 has an outstanding balance of $150.00", severity: "warning", linkRoute: "invoices", read: false, createdAt: isoDate(now) },
  { id: "ntf-005", kind: "Insurance Claim Update", title: "Claim Update", message: "Insurance claim CLM-001 has been submitted to insurer", severity: "info", linkRoute: "claims", read: true, createdAt: isoDate(addDays(now, -1)) },
  { id: "ntf-006", kind: "Staff Leave", title: "Leave Request", message: "Dr. John Smith has a pending annual leave request", severity: "info", linkRoute: "admin-leave", read: false, createdAt: isoDate(addDays(now, -1)) },
  { id: "ntf-007", kind: "Purchase Order", title: "PO Submitted", message: "PO-2024-003 has been submitted for approval", severity: "info", linkRoute: "inv-procurement", read: true, createdAt: isoDate(addDays(now, -2)) },
  { id: "ntf-008", kind: "Unread Message", title: "Unread Message", message: "You have 3 unread messages in your inbox", severity: "info", linkRoute: "messaging", read: false, createdAt: isoDate(now) },
];

// ---- Holidays ----
export const SEED_HOLIDAYS: HolidayEntry[] = [
  { id: "hol-001", name: "New Year's Day", date: `${now.getFullYear()}-01-01`, type: "Public Holiday", notes: "Clinic closed" },
  { id: "hol-002", name: "Workers' Day", date: `${now.getFullYear()}-05-01`, type: "Public Holiday", notes: "Clinic closed" },
  { id: "hol-003", name: "Independence Day", date: `${now.getFullYear()}-10-01`, type: "Public Holiday", notes: "Clinic closed" },
  { id: "hol-004", name: "Christmas Day", date: `${now.getFullYear()}-12-25`, type: "Public Holiday", notes: "Clinic closed" },
  { id: "hol-005", name: "Boxing Day", date: `${now.getFullYear()}-12-26`, type: "Public Holiday", notes: "Clinic closed" },
  { id: "hol-006", name: "Staff Training", date: dateOnly(addDays(now, 14)), type: "Clinic Holiday", notes: "Half day — closed after 12 PM" },
];

// ---- Business Hours ----
export const SEED_BUSINESS_HOURS: BusinessHours = {
  monday: { open: "08:00", close: "17:00", closed: false },
  tuesday: { open: "08:00", close: "17:00", closed: false },
  wednesday: { open: "08:00", close: "17:00", closed: false },
  thursday: { open: "08:00", close: "17:00", closed: false },
  friday: { open: "08:00", close: "17:00", closed: false },
  saturday: { open: "09:00", close: "13:00", closed: false },
  sunday: { open: "00:00", close: "00:00", closed: true },
};
