import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  ActivityLog,
  Appointment,
  BillingNotification,
  ControlledDrugEntry,
  DispenseRecord,
  InsuranceClaim,
  InsurancePolicy,
  InventoryItem,
  Invoice,
  LabOrder,
  MedicationHistoryEntry,
  Patient,
  Payment,
  Prescription,
  PricingItem,
  PurchaseOrder,
  Refund,
  SoapNote,
  StockAlert,
  User,
  Vitals,
  // M8: Inventory, Procurement, Assets
  GeneralInventoryItem,
  ProcurementPurchaseOrder,
  Supplier,
  StockMovement,
  Asset,
  InventoryAlert,
  // M9: Administration & Staff
  StaffMember,
  Department,
  AdminUser,
  AttendanceRecord,
  LeaveRequest,
  ScheduleEntry,
  AuditLogEntry,
  SystemSettings,
  // M10: Patient Portal, Telemedicine, Messaging, Reminders
  ChatMessage,
  Reminder,
  TelemedicineSession,
  // M11: Reporting, Analytics, Global Search, Notifications
  AppNotification,
  HolidayEntry,
  BusinessHours,
  GlobalSearchResult,
  // M12: Referrals
  Referral,
  ReferralStatus,
  ReferralTimelineEntry,
} from "./types";
import { load, save, setSchemaVersion, getSchemaVersion } from "./storage";
import {
  SEED_ACTIVITY,
  SEED_APPOINTMENTS,
  SEED_CONTROLLED_ENTRIES,
  SEED_DISPENSES,
  SEED_INVENTORY,
  SEED_LAB_ORDERS,
  SEED_MEDICATION_HISTORY,
  SEED_PATIENTS,
  SEED_PRESCRIPTIONS,
  SEED_PURCHASE_ORDERS,
  SEED_SOAP_NOTES,
  SEED_STOCK_ALERTS,
  SEED_USERS,
  SEED_VITALS,
} from "./seed";
import {
  SEED_PRICING,
  SEED_INVOICES,
  SEED_PAYMENTS,
  SEED_CLAIMS,
  SEED_INSURANCE_POLICIES,
  SEED_REFUNDS,
  SEED_BILLING_NOTIFICATIONS,
  SEED_FINANCE_USER,
} from "./billingSeed";
import {
  generateInvoiceNumber,
  generateReceiptNumber,
  generateClaimNumber,
  generateRefundNumber,
  computeInvoiceTotals,
  derivePaymentStatus,
  computeInsuranceCoverage,
  generateBillingNotifications,
} from "./billing";
import { uid, nowISO } from "./storage";
import { MED_CATALOG_NAMES } from "./derived";
import {
  SEED_GENERAL_INVENTORY,
  SEED_SUPPLIERS,
  SEED_PROCUREMENT_POS,
  SEED_STOCK_MOVEMENTS,
  SEED_ASSETS,
  SEED_INVENTORY_ALERTS,
} from "./inventorySeed";
import {
  SEED_STAFF,
  SEED_DEPARTMENTS,
  SEED_ADMIN_USERS,
  SEED_ATTENDANCE,
  SEED_LEAVE_REQUESTS,
  SEED_SCHEDULE,
  SEED_AUDIT_LOGS,
  SEED_SYSTEM_SETTINGS,
} from "./adminSeed";
import {
  SEED_MESSAGES,
  SEED_REMINDERS,
  SEED_TELEMEDICINE,
  SEED_NOTIFICATIONS,
  SEED_HOLIDAYS,
  SEED_BUSINESS_HOURS,
} from "./portalSeed";

// ============================================================================
// App store — single source of truth, persisted to localStorage
// ============================================================================

interface AppState {
  users: User[];
  patients: Patient[];
  appointments: Appointment[];
  vitals: Vitals[];
  soapNotes: SoapNote[];
  labOrders: LabOrder[];
  inventory: InventoryItem[];
  prescriptions: Prescription[];
  dispenses: DispenseRecord[];
  controlled: ControlledDrugEntry[];
  purchaseOrders: PurchaseOrder[];
  stockAlerts: StockAlert[];
  activity: ActivityLog[];
  medicationHistory: MedicationHistoryEntry[];
  // Billing (Milestone 7)
  pricing: PricingItem[];
  invoices: Invoice[];
  payments: Payment[];
  claims: InsuranceClaim[];
  insurancePolicies: InsurancePolicy[];
  refunds: Refund[];
  billingNotifications: BillingNotification[];
  // M8: Inventory, Procurement, Assets
  generalInventory: GeneralInventoryItem[];
  suppliers: Supplier[];
  procurementPOs: ProcurementPurchaseOrder[];
  stockMovements: StockMovement[];
  assets: Asset[];
  inventoryAlerts: InventoryAlert[];
  // M9: Administration & Staff
  staff: StaffMember[];
  departments: Department[];
  adminUsers: AdminUser[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  schedule: ScheduleEntry[];
  auditLogs: AuditLogEntry[];
  systemSettings: SystemSettings;
  // M10
  messages: ChatMessage[];
  reminders: Reminder[];
  telemedicineSessions: TelemedicineSession[];
  // M11
  notifications: AppNotification[];
  holidays: HolidayEntry[];
  businessHours: BusinessHours;
  // M12: Referrals
  referrals: Referral[];
}

interface AppContextValue extends AppState {
  currentUserId: string | null;
  currentUser: User | null;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  // Patient ops
  addPatient: (p: Omit<Patient, "id" | "createdAt" | "updatedAt">) => Patient;
  updatePatient: (id: string, patch: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  // Appointment ops
  addAppointment: (a: Omit<Appointment, "id" | "createdAt">) => Appointment;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  // Vitals
  addVitals: (v: Omit<Vitals, "id">) => Vitals;
  // SOAP
  addSoapNote: (s: Omit<SoapNote, "id" | "createdAt">) => SoapNote;
  updateSoapNote: (id: string, patch: Partial<SoapNote>) => void;
  deleteSoapNote: (id: string) => void;
  // Lab
  addLabOrder: (l: Omit<LabOrder, "id" | "orderedAt">) => LabOrder;
  updateLabOrder: (id: string, patch: Partial<LabOrder>) => void;
  deleteLabOrder: (id: string) => void;
  // Pharmacy: prescription
  addPrescription: (p: Omit<Prescription, "id" | "createdAt">) => Prescription;
  updatePrescription: (id: string, patch: Partial<Prescription>) => void;
  deletePrescription: (id: string) => void;
  // Pharmacy: dispense
  addDispense: (d: Omit<DispenseRecord, "id" | "createdAt">, quantityDelta: number) => DispenseRecord;
  // Pharmacy: inventory
  addInventoryItem: (i: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => InventoryItem;
  updateInventoryItem: (id: string, patch: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  adjustInventory: (inventoryId: string, delta: number) => void;
  // Pharmacy: purchase orders
  addPurchaseOrder: (p: Omit<PurchaseOrder, "id" | "createdAt">) => PurchaseOrder;
  updatePurchaseOrder: (id: string, patch: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  // Pharmacy: controlled drugs
  addControlledEntry: (c: Omit<ControlledDrugEntry, "id">) => ControlledDrugEntry;
  updateControlledEntry: (id: string, patch: Partial<ControlledDrugEntry>) => void;
  deleteControlledEntry: (id: string) => void;
  // Billing: pricing
  addPricingItem: (p: Omit<PricingItem, "id" | "createdAt" | "updatedAt">) => PricingItem;
  updatePricingItem: (id: string, patch: Partial<PricingItem>) => void;
  deletePricingItem: (id: string) => void;
  // Billing: invoices
  addInvoice: (i: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => Invoice;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  // Billing: payments
  addPayment: (p: Omit<Payment, "id" | "createdAt">) => Payment;
  updatePayment: (id: string, patch: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  // Billing: claims
  addClaim: (c: Omit<InsuranceClaim, "id" | "createdAt" | "updatedAt">) => InsuranceClaim;
  updateClaim: (id: string, patch: Partial<InsuranceClaim>) => void;
  deleteClaim: (id: string) => void;
  // Billing: insurance policies
  addInsurancePolicy: (p: Omit<InsurancePolicy, "id" | "createdAt" | "updatedAt">) => InsurancePolicy;
  updateInsurancePolicy: (id: string, patch: Partial<InsurancePolicy>) => void;
  deleteInsurancePolicy: (id: string) => void;
  // Billing: refunds
  addRefund: (r: Omit<Refund, "id" | "createdAt" | "updatedAt">) => Refund;
  updateRefund: (id: string, patch: Partial<Refund>) => void;
  deleteRefund: (id: string) => void;
  // Billing: notifications
  markBillingNotificationRead: (id: string) => void;
  refreshBillingNotifications: () => void;
  // Activity log
  logActivity: (entry: Omit<ActivityLog, "id" | "at">) => void;
  // Alerts
  acknowledgeAlert: (id: string) => void;
  refreshAlerts: () => void;
  // M8: General Inventory
  addGeneralInventoryItem: (i: Omit<GeneralInventoryItem, "id" | "createdAt" | "updatedAt">) => GeneralInventoryItem;
  updateGeneralInventoryItem: (id: string, patch: Partial<GeneralInventoryItem>) => void;
  deleteGeneralInventoryItem: (id: string) => void;
  // M8: Suppliers
  addSupplier: (s: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => Supplier;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  // M8: Procurement POs
  addProcurementPO: (p: Omit<ProcurementPurchaseOrder, "id" | "createdAt" | "updatedAt">) => ProcurementPurchaseOrder;
  updateProcurementPO: (id: string, patch: Partial<ProcurementPurchaseOrder>) => void;
  deleteProcurementPO: (id: string) => void;
  receiveProcurementPO: (id: string) => void;
  // M8: Stock Movements
  addStockMovement: (m: Omit<StockMovement, "id" | "createdAt">) => StockMovement;
  // M8: Assets
  addAsset: (a: Omit<Asset, "id" | "createdAt" | "updatedAt">) => Asset;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  // M8: Inventory Alerts
  refreshInventoryAlerts: () => void;
  acknowledgeInventoryAlert: (id: string) => void;
  // M9: Staff
  addStaff: (s: Omit<StaffMember, "id" | "createdAt" | "updatedAt">) => StaffMember;
  updateStaff: (id: string, patch: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;
  // M9: Departments
  addDepartment: (d: Omit<Department, "id" | "createdAt">) => Department;
  updateDepartment: (id: string, patch: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  // M9: Admin Users
  addAdminUser: (u: Omit<AdminUser, "id" | "createdAt" | "updatedAt">) => AdminUser;
  updateAdminUser: (id: string, patch: Partial<AdminUser>) => void;
  deleteAdminUser: (id: string) => void;
  // M9: Attendance
  addAttendance: (a: Omit<AttendanceRecord, "id" | "createdAt">) => AttendanceRecord;
  updateAttendance: (id: string, patch: Partial<AttendanceRecord>) => void;
  clockIn: (staffId: string) => void;
  clockOut: (staffId: string) => void;
  // M9: Leave
  addLeaveRequest: (l: Omit<LeaveRequest, "id" | "createdAt" | "updatedAt">) => LeaveRequest;
  updateLeaveRequest: (id: string, patch: Partial<LeaveRequest>) => void;
  deleteLeaveRequest: (id: string) => void;
  approveLeaveRequest: (id: string, approverId: string, approverName: string) => void;
  rejectLeaveRequest: (id: string, approverId: string, approverName: string) => void;
  // M9: Schedule
  addScheduleEntry: (s: Omit<ScheduleEntry, "id" | "createdAt">) => ScheduleEntry;
  updateScheduleEntry: (id: string, patch: Partial<ScheduleEntry>) => void;
  deleteScheduleEntry: (id: string) => void;
  // M9: Audit Logs
  addAuditLog: (entry: Omit<AuditLogEntry, "id" | "createdAt">) => void;
  // M9: Settings
  updateSystemSettings: (patch: Partial<SystemSettings>) => void;
  // M10: Messaging
  sendMessage: (m: Omit<ChatMessage, "id" | "sentAt" | "read">) => ChatMessage;
  markMessageRead: (id: string) => void;
 // M10: Reminders
  addReminder: (r: Omit<Reminder, "id" | "createdAt" | "dismissed">) => Reminder;
  dismissReminder: (id: string) => void;
  refreshReminders: () => void;
  // M10: Telemedicine
  addTelemedicineSession: (t: Omit<TelemedicineSession, "id" | "createdAt" | "updatedAt">) => TelemedicineSession;
  updateTelemedicineSession: (id: string, patch: Partial<TelemedicineSession>) => void;
  deleteTelemedicineSession: (id: string) => void;
  addTelemedicineChat: (id: string, sender: string, message: string) => void;
  // M11: Notifications
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshNotifications: () => void;
  // M11: Holidays
  addHoliday: (h: Omit<HolidayEntry, "id">) => HolidayEntry;
  updateHoliday: (id: string, patch: Partial<HolidayEntry>) => void;
  deleteHoliday: (id: string) => void;
  // M11: Business Hours
  updateBusinessHours: (patch: Partial<BusinessHours>) => void;
  // M11: Global Search
  globalSearch: (query: string) => GlobalSearchResult[];
  // M12: Referrals
  addReferral: (r: Omit<Referral, "id" | "referralId" | "timeline" | "createdAt" | "updatedAt">) => Referral;
  updateReferral: (id: string, patch: Partial<Referral>) => void;
  deleteReferral: (id: string) => void;
  advanceReferralStatus: (id: string, status: ReferralStatus, actorName: string, note?: string) => void;
  // Reset
  resetDemoData: () => void;
}

const STORAGE_KEY = "app-state-v9";
const SESSION_KEY = "current-user";

const initialSeedState: AppState = {
  users: [...SEED_USERS, SEED_FINANCE_USER],
  patients: SEED_PATIENTS,
  appointments: SEED_APPOINTMENTS,
  vitals: SEED_VITALS,
  soapNotes: SEED_SOAP_NOTES,
  labOrders: SEED_LAB_ORDERS,
  inventory: SEED_INVENTORY,
  prescriptions: SEED_PRESCRIPTIONS,
  dispenses: SEED_DISPENSES,
  controlled: SEED_CONTROLLED_ENTRIES,
  purchaseOrders: SEED_PURCHASE_ORDERS,
  stockAlerts: SEED_STOCK_ALERTS,
  activity: SEED_ACTIVITY,
  medicationHistory: SEED_MEDICATION_HISTORY,
  pricing: SEED_PRICING,
  invoices: SEED_INVOICES,
  payments: SEED_PAYMENTS,
  claims: SEED_CLAIMS,
  insurancePolicies: SEED_INSURANCE_POLICIES,
  refunds: SEED_REFUNDS,
  billingNotifications: SEED_BILLING_NOTIFICATIONS,
  // M8
  generalInventory: SEED_GENERAL_INVENTORY,
  suppliers: SEED_SUPPLIERS,
  procurementPOs: SEED_PROCUREMENT_POS,
  stockMovements: SEED_STOCK_MOVEMENTS,
  assets: SEED_ASSETS,
  inventoryAlerts: SEED_INVENTORY_ALERTS,
  // M9
  staff: SEED_STAFF,
  departments: SEED_DEPARTMENTS,
  adminUsers: SEED_ADMIN_USERS,
  attendance: SEED_ATTENDANCE,
  leaveRequests: SEED_LEAVE_REQUESTS,
  schedule: SEED_SCHEDULE,
  auditLogs: SEED_AUDIT_LOGS,
  systemSettings: SEED_SYSTEM_SETTINGS,
  // M10
  messages: SEED_MESSAGES,
  reminders: SEED_REMINDERS,
  telemedicineSessions: SEED_TELEMEDICINE,
  // M11
  notifications: SEED_NOTIFICATIONS,
  holidays: SEED_HOLIDAYS,
  businessHours: SEED_BUSINESS_HOURS,
  // M12
  referrals: [],
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const version = getSchemaVersion();
  const [state, setState] = useState<AppState>(() => {
    if (version !== "9.0.0") {
      setSchemaVersion("9.0.0");
 save(STORAGE_KEY, initialSeedState);
      return initialSeedState;
    }
    const loaded = load<AppState>(STORAGE_KEY, initialSeedState);
    // ensure all keys present (forward-compat)
    return { ...initialSeedState, ...loaded };
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => load<string | null>(SESSION_KEY, null));

  // Persist on any change
  useEffect(() => {
    save(STORAGE_KEY, state);
  }, [state]);

  useEffect(() => {
    save(SESSION_KEY, currentUserId);
  }, [currentUserId]);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === currentUserId) ?? null,
    [state.users, currentUserId],
  );

  // --------------------------------------------------------------------------
  // Helper: update + activity log
  // --------------------------------------------------------------------------
  function mutate(fn: (s: AppState) => AppState) {
    setState((prev) => fn(prev));
  }

  function logActivity(entry: Omit<ActivityLog, "id" | "at">) {
    setState((prev) => ({
      ...prev,
      activity: [{ ...entry, id: uid("act"), at: nowISO() }, ...prev.activity].slice(0, 100),
    }));
  }

  // --------------------------------------------------------------------------
  // Auth
  // --------------------------------------------------------------------------
  function login(email: string, password: string): User | null {
    const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      setCurrentUserId(user.id);
      logActivity({ kind: "prescription", title: "User signed in", description: `${user.name} signed in`, actorId: user.id, actorName: user.name });
      return user;
    }
    return null;
  }

  function logout() {
    setCurrentUserId(null);
  }

  // --------------------------------------------------------------------------
  // Patients
  // --------------------------------------------------------------------------
  function addPatient(p: Omit<Patient, "id" | "createdAt" | "updatedAt">): Patient {
    const now = nowISO();
    const patient: Patient = { ...p, id: uid("p"), createdAt: now, updatedAt: now };
    mutate((s) => ({ ...s, patients: [patient, ...s.patients] }));
    return patient;
  }

  function updatePatient(id: string, patch: Partial<Patient>) {
    mutate((s) => ({
      ...s,
      patients: s.patients.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowISO() } : p)),
    }));
  }

  function deletePatient(id: string) {
    mutate((s) => ({ ...s, patients: s.patients.filter((p) => p.id !== id) }));
  }

  // --------------------------------------------------------------------------
  // Appointments
  // --------------------------------------------------------------------------
  function addAppointment(a: Omit<Appointment, "id" | "createdAt">): Appointment {
    const appt: Appointment = { ...a, id: uid("ap"), createdAt: nowISO() };
    mutate((s) => ({ ...s, appointments: [appt, ...s.appointments] }));
    return appt;
  }

  function updateAppointment(id: string, patch: Partial<Appointment>) {
    mutate((s) => ({
      ...s,
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }

  function deleteAppointment(id: string) {
    mutate((s) => ({ ...s, appointments: s.appointments.filter((a) => a.id !== id) }));
  }

  // --------------------------------------------------------------------------
  // Vitals
  // --------------------------------------------------------------------------
  function addVitals(v: Omit<Vitals, "id">): Vitals {
    const vit: Vitals = { ...v, id: uid("v") };
    mutate((s) => ({ ...s, vitals: [vit, ...s.vitals] }));
    return vit;
  }

  // --------------------------------------------------------------------------
  // SOAP notes
  // --------------------------------------------------------------------------
  function addSoapNote(sn: Omit<SoapNote, "id" | "createdAt">): SoapNote {
    const note: SoapNote = { ...sn, id: uid("soap"), createdAt: nowISO() };
    mutate((s) => ({ ...s, soapNotes: [note, ...s.soapNotes] }));
    return note;
  }

  function updateSoapNote(id: string, patch: Partial<SoapNote>) {
    mutate((s) => ({
      ...s,
      soapNotes: s.soapNotes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
  }

  function deleteSoapNote(id: string) {
    mutate((s) => ({ ...s, soapNotes: s.soapNotes.filter((n) => n.id !== id) }));
  }

  // --------------------------------------------------------------------------
  // Lab orders
  // --------------------------------------------------------------------------
  function addLabOrder(l: Omit<LabOrder, "id" | "orderedAt">): LabOrder {
    const order: LabOrder = { ...l, id: uid("lab"), orderedAt: nowISO() };
    mutate((s) => ({ ...s, labOrders: [order, ...s.labOrders] }));
    return order;
  }

  function updateLabOrder(id: string, patch: Partial<LabOrder>) {
    mutate((s) => ({
      ...s,
      labOrders: s.labOrders.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  }

  function deleteLabOrder(id: string) {
    mutate((s) => ({ ...s, labOrders: s.labOrders.filter((l) => l.id !== id) }));
  }

  // --------------------------------------------------------------------------
  // Prescriptions
  // --------------------------------------------------------------------------
  function addPrescription(p: Omit<Prescription, "id" | "createdAt">): Prescription {
    const rx: Prescription = { ...p, id: uid("rx"), createdAt: nowISO() };
    mutate((s) => {
      // Add to medication history for each line
      const newHistory: MedicationHistoryEntry[] = rx.lines.map((line) => ({
        id: uid("mh"),
        patientId: rx.patientId,
        prescriptionId: rx.id,
        medicationName: line.medicationName,
        eventType: "Prescribed",
        date: rx.date,
        actorName: s.users.find((u) => u.id === rx.clinicianId)?.name ?? "Unknown",
        details: `${line.dose} ${line.route} ${line.frequency} — ${line.duration} — ${rx.status}`,
      }));
      return {
        ...s,
        prescriptions: [rx, ...s.prescriptions],
        medicationHistory: [...newHistory, ...s.medicationHistory],
      };
    });
    logActivity({
      kind: "prescription",
      title: "Prescription created",
      description: `${rx.id} for ${state.patients.find((p) => p.id === rx.patientId)?.lastName ?? "patient"} — ${rx.diagnosis}`,
      actorId: rx.clinicianId,
      actorName: state.users.find((u) => u.id === rx.clinicianId)?.name ?? "Unknown",
    });
    return rx;
  }

  function updatePrescription(id: string, patch: Partial<Prescription>) {
    mutate((s) => ({
      ...s,
      prescriptions: s.prescriptions.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }

  function deletePrescription(id: string) {
    mutate((s) => ({ ...s, prescriptions: s.prescriptions.filter((p) => p.id !== id) }));
  }

  // --------------------------------------------------------------------------
  // Dispensing — also decreases inventory and updates history
  // --------------------------------------------------------------------------
  function addDispense(d: Omit<DispenseRecord, "id" | "createdAt">, quantityDelta: number): DispenseRecord {
    const disp: DispenseRecord = { ...d, id: uid("dsp"), createdAt: nowISO() };
    mutate((s) => {
      // Decrease inventory quantity for matching medicationId (best-match)
      const inventory = s.inventory.map((inv) => {
        if (inv.medicationId === d.medicationId && inv.quantity >= quantityDelta) {
          return { ...inv, quantity: inv.quantity - quantityDelta, updatedAt: nowISO() };
        }
        return inv;
      });
      const hist: MedicationHistoryEntry = {
        id: uid("mh"),
        patientId: d.patientId,
        dispenseId: disp.id,
        medicationName: d.medicationName,
        eventType: "Dispensed",
        date: d.date,
        actorName: s.users.find((u) => u.id === d.pharmacistId)?.name ?? "Pharmacist",
        details: `Qty: ${d.quantityDispensed} — Remaining: ${d.remainingQuantity}`,
      };
      return {
        ...s,
        dispenses: [disp, ...s.dispenses],
        inventory,
        medicationHistory: [hist, ...s.medicationHistory],
      };
    });
    logActivity({
      kind: "dispense",
      title: "Medication dispensed",
      description: `${d.medicationName} (${d.quantityDispensed}) for ${state.patients.find((p) => p.id === d.patientId)?.lastName ?? "patient"}`,
      actorId: d.pharmacistId,
      actorName: state.users.find((u) => u.id === d.pharmacistId)?.name ?? "Pharmacist",
    });
    return disp;
  }

  // --------------------------------------------------------------------------
  // Inventory
  // --------------------------------------------------------------------------
  function addInventoryItem(i: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">): InventoryItem {
    const item: InventoryItem = { ...i, id: uid("inv"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((s) => ({ ...s, inventory: [item, ...s.inventory] }));
    return item;
  }

  function updateInventoryItem(id: string, patch: Partial<InventoryItem>) {
    mutate((s) => ({
      ...s,
      inventory: s.inventory.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: nowISO() } : i)),
    }));
  }

  function deleteInventoryItem(id: string) {
    mutate((s) => ({ ...s, inventory: s.inventory.filter((i) => i.id !== id) }));
  }

  function adjustInventory(inventoryId: string, delta: number) {
    mutate((s) => ({
      ...s,
      inventory: s.inventory.map((i) =>
        i.id === inventoryId ? { ...i, quantity: Math.max(0, i.quantity + delta), updatedAt: nowISO() } : i,
      ),
    }));
  }

  // --------------------------------------------------------------------------
  // Purchase orders
  // --------------------------------------------------------------------------
  function addPurchaseOrder(p: Omit<PurchaseOrder, "id" | "createdAt">): PurchaseOrder {
    const po: PurchaseOrder = { ...p, id: uid("po"), createdAt: nowISO() };
    mutate((s) => ({ ...s, purchaseOrders: [po, ...s.purchaseOrders] }));
    return po;
  }

  function updatePurchaseOrder(id: string, patch: Partial<PurchaseOrder>) {
    mutate((s) => ({
      ...s,
      purchaseOrders: s.purchaseOrders.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }

  function deletePurchaseOrder(id: string) {
    mutate((s) => ({ ...s, purchaseOrders: s.purchaseOrders.filter((p) => p.id !== id) }));
  }

  // --------------------------------------------------------------------------
  // Controlled drugs
  // --------------------------------------------------------------------------
  function addControlledEntry(c: Omit<ControlledDrugEntry, "id">): ControlledDrugEntry {
    const entry: ControlledDrugEntry = { ...c, id: uid("cd") };
    mutate((s) => ({ ...s, controlled: [entry, ...s.controlled] }));
    return entry;
  }

  function updateControlledEntry(id: string, patch: Partial<ControlledDrugEntry>) {
    mutate((s) => ({
      ...s,
      controlled: s.controlled.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  function deleteControlledEntry(id: string) {
    mutate((s) => ({ ...s, controlled: s.controlled.filter((c) => c.id !== id) }));
  }

  // --------------------------------------------------------------------------
  // Alerts
  // --------------------------------------------------------------------------
  function refreshAlerts() {
    setState((prev) => {
      const alerts = computeAlerts(prev.inventory);
      return { ...prev, stockAlerts: alerts };
    });
  }

  // ========================================================================
  // Billing CRUD — Pricing
  // ========================================================================

  function addPricingItem(p: Omit<PricingItem, "id" | "createdAt" | "updatedAt">): PricingItem {
    const item: PricingItem = { ...p, id: uid("prc"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((s) => ({ ...s, pricing: [item, ...s.pricing] }));
    return item;
  }

  function updatePricingItem(id: string, patch: Partial<PricingItem>): void {
    mutate((s) => ({
      ...s,
      pricing: s.pricing.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowISO() } : p)),
    }));
  }

  function deletePricingItem(id: string): void {
    mutate((s) => ({ ...s, pricing: s.pricing.filter((p) => p.id !== id) }));
  }

  // Billing — Invoices

  function addInvoice(i: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Invoice {
    const inv: Invoice = { ...i, id: uid("inv"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((s) => ({ ...s, invoices: [inv, ...s.invoices] }));
    return inv;
  }

  function updateInvoice(id: string, patch: Partial<Invoice>): void {
    mutate((s) => ({
      ...s,
      invoices: s.invoices.map((inv) => {
        if (inv.id !== id) return inv;
        const updated = { ...inv, ...patch, updatedAt: nowISO() };
        if (patch.lines) {
          const totals = computeInvoiceTotals(updated.lines);
          updated.subtotal = totals.subtotal;
          updated.discountTotal = totals.discountTotal;
          updated.taxTotal = totals.taxTotal;
          updated.grandTotal = totals.grandTotal;
          updated.balance = Math.round((totals.grandTotal - updated.amountPaid) * 100) / 100;
          updated.paymentStatus = derivePaymentStatus(updated.grandTotal, updated.amountPaid, updated.dueDate, updated.paymentStatus);
        }
        if (patch.amountPaid !== undefined) {
          updated.balance = Math.round((updated.grandTotal - updated.amountPaid) * 100) / 100;
          updated.paymentStatus = derivePaymentStatus(updated.grandTotal, updated.amountPaid, updated.dueDate, updated.paymentStatus);
        }
        return updated;
      }),
    }));
  }

  function deleteInvoice(id: string): void {
    mutate((s) => ({
      ...s,
      invoices: s.invoices.filter((inv) => inv.id !== id),
      payments: s.payments.filter((p) => p.invoiceId !== id),
      claims: s.claims.filter((c) => c.invoiceId !== id),
      refunds: s.refunds.filter((r) => r.invoiceId !== id),
    }));
  }

  // Billing — Payments

  function addPayment(p: Omit<Payment, "id" | "createdAt">): Payment {
    const pay: Payment = { ...p, id: uid("pay"), createdAt: nowISO() };
    mutate((s) => {
      const invoice = s.invoices.find((inv) => inv.id === p.invoiceId);
      const newAmountPaid = invoice ? invoice.amountPaid + p.amountPaid : p.amountPaid;
      return {
        ...s,
        payments: [pay, ...s.payments],
        invoices: invoice
          ? s.invoices.map((inv) => {
              if (inv.id !== p.invoiceId) return inv;
              const amtPaid = Math.round(newAmountPaid * 100) / 100;
              const balance = Math.round((inv.grandTotal - amtPaid) * 100) / 100;
              return {
                ...inv,
                amountPaid: amtPaid,
                balance,
                paymentStatus: derivePaymentStatus(inv.grandTotal, amtPaid, inv.dueDate, inv.paymentStatus),
                paymentMethod: p.method,
                updatedAt: nowISO(),
              };
            })
          : s.invoices,
      };
    });
    return pay;
  }

  function updatePayment(id: string, patch: Partial<Payment>): void {
    mutate((s) => ({ ...s, payments: s.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  }

  function deletePayment(id: string): void {
    mutate((s) => {
      const pay = s.payments.find((p) => p.id === id);
      if (!pay) return s;
      const invoice = s.invoices.find((inv) => inv.id === pay.invoiceId);
      return {
        ...s,
        payments: s.payments.filter((p) => p.id !== id),
        invoices: invoice
          ? s.invoices.map((inv) => {
              if (inv.id !== pay.invoiceId) return inv;
              const amtPaid = Math.round((inv.amountPaid - pay.amountPaid) * 100) / 100;
              const balance = Math.round((inv.grandTotal - amtPaid) * 100) / 100;
              return {
                ...inv,
                amountPaid: amtPaid,
                balance,
                paymentStatus: derivePaymentStatus(inv.grandTotal, amtPaid, inv.dueDate, inv.paymentStatus),
                updatedAt: nowISO(),
              };
            })
          : s.invoices,
      };
    });
  }

  // Billing — Claims

  function addClaim(c: Omit<InsuranceClaim, "id" | "createdAt" | "updatedAt">): InsuranceClaim {
    const claim: InsuranceClaim = { ...c, id: uid("clm"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((s) => ({ ...s, claims: [claim, ...s.claims] }));
    return claim;
  }

  function updateClaim(id: string, patch: Partial<InsuranceClaim>): void {
    mutate((s) => ({
      ...s,
      claims: s.claims.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: nowISO() } : c)),
    }));
  }

  function deleteClaim(id: string): void {
    mutate((s) => ({ ...s, claims: s.claims.filter((c) => c.id !== id) }));
  }

  // Billing — Insurance Policies

  function addInsurancePolicy(p: Omit<InsurancePolicy, "id" | "createdAt" | "updatedAt">): InsurancePolicy {
    const policy: InsurancePolicy = { ...p, id: uid("pol"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((s) => ({ ...s, insurancePolicies: [policy, ...s.insurancePolicies] }));
    return policy;
  }

  function updateInsurancePolicy(id: string, patch: Partial<InsurancePolicy>): void {
    mutate((s) => ({
      ...s,
      insurancePolicies: s.insurancePolicies.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowISO() } : p)),
    }));
  }

  function deleteInsurancePolicy(id: string): void {
    mutate((s) => ({ ...s, insurancePolicies: s.insurancePolicies.filter((p) => p.id !== id) }));
  }

  // Billing — Refunds

  function addRefund(r: Omit<Refund, "id" | "createdAt" | "updatedAt">): Refund {
    const refund: Refund = { ...r, id: uid("rfd"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((s) => ({ ...s, refunds: [refund, ...s.refunds] }));
    return refund;
  }

  function updateRefund(id: string, patch: Partial<Refund>): void {
    mutate((s) => ({
      ...s,
      refunds: s.refunds.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: nowISO() } : r)),
    }));
  }

  function deleteRefund(id: string): void {
    mutate((s) => ({ ...s, refunds: s.refunds.filter((r) => r.id !== id) }));
  }

  // Billing — Notifications

  function markBillingNotificationRead(id: string): void {
    mutate((s) => ({
      ...s,
      billingNotifications: s.billingNotifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }

  function refreshBillingNotifications(): void {
    mutate((s) => {
      const computed = generateBillingNotifications(s.invoices, s.claims, s.insurancePolicies, s.refunds, s.patients);
      return { ...s, billingNotifications: computed };
    });
  }

  function acknowledgeAlert(id: string) {
    mutate((s) => ({
      ...s,
      stockAlerts: s.stockAlerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    }));
  }

  // ---- M8: General Inventory ----
  function addGeneralInventoryItem(i: Omit<GeneralInventoryItem, "id" | "createdAt" | "updatedAt">): GeneralInventoryItem {
    const item: GeneralInventoryItem = { ...i, id: uid("gi"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((s) => ({ ...s, generalInventory: [item, ...s.generalInventory] }));
    addAuditLog({ userId: currentUserId ?? "system", userName: currentUser?.name ?? "System", action: "Create Inventory Item", module: "Inventory", description: `Created inventory item: ${item.itemName}`, date: nowISO().slice(0, 10), time: new Date().toLocaleTimeString("en-GB"), ipAddress: "192.168.1.10" });
    return item;
  }

  function updateGeneralInventoryItem(id: string, patch: Partial<GeneralInventoryItem>) {
    mutate((s) => ({
      ...s,
      generalInventory: s.generalInventory.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: nowISO() } : i)),
    }));
    addAuditLog({ userId: currentUserId ?? "system", userName: currentUser?.name ?? "System", action: "Update Inventory Item", module: "Inventory", description: `Updated inventory item ID: ${id}`, date: nowISO().slice(0, 10), time: new Date().toLocaleTimeString("en-GB"), ipAddress: "192.168.1.10" });
  }

  function deleteGeneralInventoryItem(id: string) {
    mutate((s) => ({ ...s, generalInventory: s.generalInventory.filter((i) => i.id !== id) }));
    addAuditLog({ userId: currentUserId ?? "system", userName: currentUser?.name ?? "System", action: "Delete Inventory Item", module: "Inventory", description: `Deleted inventory item ID: ${id}`, date: nowISO().slice(0, 10), time: new Date().toLocaleTimeString("en-GB"), ipAddress: "192.168.1.10" });
  }

  // ---- M8: Suppliers ----
  function addSupplier(s: Omit<Supplier, "id" | "createdAt" | "updatedAt">): Supplier {
    const sup: Supplier = { ...s, id: uid("sup"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((st) => ({ ...st, suppliers: [sup, ...st.suppliers] }));
    return sup;
  }

  function updateSupplier(id: string, patch: Partial<Supplier>) {
    mutate((s) => ({ ...s, suppliers: s.suppliers.map((sup) => (sup.id === id ? { ...sup, ...patch, updatedAt: nowISO() } : sup)) }));
  }

  function deleteSupplier(id: string) {
    mutate((s) => ({ ...s, suppliers: s.suppliers.filter((sup) => sup.id !== id) }));
  }

  // ---- M8: Procurement POs ----
  function addProcurementPO(p: Omit<ProcurementPurchaseOrder, "id" | "createdAt" | "updatedAt">): ProcurementPurchaseOrder {
    const po: ProcurementPurchaseOrder = { ...p, id: uid("po-m8"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((s) => ({ ...s, procurementPOs: [po, ...s.procurementPOs] }));
    addAuditLog({ userId: currentUserId ?? "system", userName: currentUser?.name ?? "System", action: "Create Purchase Order", module: "Procurement", description: `Created PO: ${po.poNumber}`, date: nowISO().slice(0, 10), time: new Date().toLocaleTimeString("en-GB"), ipAddress: "192.168.1.10" });
    return po;
  }

  function updateProcurementPO(id: string, patch: Partial<ProcurementPurchaseOrder>) {
    mutate((s) => ({
      ...s,
      procurementPOs: s.procurementPOs.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowISO() } : p)),
    }));
  }

  function deleteProcurementPO(id: string) {
    mutate((s) => ({ ...s, procurementPOs: s.procurementPOs.filter((p) => p.id !== id) }));
  }

  function receiveProcurementPO(id: string) {
    mutate((s) => {
      const po = s.procurementPOs.find((p) => p.id === id);
      if (!po || po.status === "Received") return s;
      const updatedPO: ProcurementPurchaseOrder = {
        ...po,
        status: "Received",
        receivedDate: nowISO().slice(0, 10),
        lines: po.lines.map((l) => ({ ...l, receivedQuantity: l.quantity })),
        updatedAt: nowISO(),
      };
      const newMovements: StockMovement[] = po.lines.flatMap((line) => {
        const item = s.generalInventory.find((gi) => gi.itemCode === line.itemCode);
        return [{
          id: uid("sm"),
          itemId: item?.id ?? "",
          itemCode: line.itemCode,
          itemName: line.itemName,
          movementType: "Received" as const,
          quantity: line.quantity,
          toDepartment: po.department,
          staffId: currentUserId ?? "system",
          staffName: currentUser?.name ?? "System",
          department: po.department,
          reason: `PO ${po.poNumber} received`,
          referenceNumber: po.poNumber,
          date: nowISO().slice(0, 10),
          createdAt: nowISO(),
        }];
      });
      const updatedInventory = s.generalInventory.map((gi) => {
        const poLine = po.lines.find((l) => l.itemCode === gi.itemCode);
        if (poLine) return { ...gi, quantity: gi.quantity + poLine.quantity, updatedAt: nowISO() };
        return gi;
      });
      return { ...s, procurementPOs: s.procurementPOs.map((p) => (p.id === id ? updatedPO : p)), stockMovements: [...newMovements, ...s.stockMovements], generalInventory: updatedInventory };
    });
    addAuditLog({ userId: currentUserId ?? "system", userName: currentUser?.name ?? "System", action: "Receive Purchase Order", module: "Procurement", description: `Received PO: ${id}`, date: nowISO().slice(0, 10), time: new Date().toLocaleTimeString("en-GB"), ipAddress: "192.168.1.10" });
  }

  // ---- M8: Stock Movements ----
  function addStockMovement(m: Omit<StockMovement, "id" | "createdAt">): StockMovement {
    const mv: StockMovement = { ...m, id: uid("sm"), createdAt: nowISO() };
    mutate((s) => ({ ...s, stockMovements: [mv, ...s.stockMovements] }));
    return mv;
  }

  // ---- M8: Assets ----
  function addAsset(a: Omit<Asset, "id" | "createdAt" | "updatedAt">): Asset {
    const asset: Asset = { ...a, id: uid("ast"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((s) => ({ ...s, assets: [asset, ...s.assets] }));
    addAuditLog({ userId: currentUserId ?? "system", userName: currentUser?.name ?? "System", action: "Create Asset", module: "Assets", description: `Created asset: ${asset.assetName}`, date: nowISO().slice(0, 10), time: new Date().toLocaleTimeString("en-GB"), ipAddress: "192.168.1.10" });
    return asset;
  }

  function updateAsset(id: string, patch: Partial<Asset>) {
    mutate((s) => ({ ...s, assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: nowISO() } : a)) }));
    addAuditLog({ userId: currentUserId ?? "system", userName: currentUser?.name ?? "System", action: "Update Asset", module: "Assets", description: `Updated asset ID: ${id}`, date: nowISO().slice(0, 10), time: new Date().toLocaleTimeString("en-GB"), ipAddress: "192.168.1.10" });
  }

  function deleteAsset(id: string) {
    mutate((s) => ({ ...s, assets: s.assets.filter((a) => a.id !== id) }));
  }

  // ---- M8: Inventory Alerts ----
  function refreshInventoryAlerts() {
    const now = new Date();
    const alerts: InventoryAlert[] = [];
    for (const item of state.generalInventory) {
      if (item.quantity <= 0) {
        alerts.push({ id: `ialert-${item.id}-oos`, itemId: item.id, itemCode: item.itemCode, itemName: item.itemName, kind: "Out-of-Stock", severity: "danger", message: `${item.itemName} is out of stock`, createdAt: now.toISOString(), acknowledged: false });
      } else if (item.quantity < item.minimumStock) {
        alerts.push({ id: `ialert-${item.id}-low`, itemId: item.id, itemCode: item.itemCode, itemName: item.itemName, kind: "Low-Stock", severity: "warning", message: `${item.itemName} is low on stock (${item.quantity} units)`, createdAt: now.toISOString(), acknowledged: false });
      }
      if (item.quantity > item.maximumStock) {
        alerts.push({ id: `ialert-${item.id}-over`, itemId: item.id, itemCode: item.itemCode, itemName: item.itemName, kind: "Overstock", severity: "info", message: `${item.itemName} is overstocked (${item.quantity} units)`, createdAt: now.toISOString(), acknowledged: false });
      }
      if (item.expiryDate) {
        const expiry = new Date(item.expiryDate);
        const days = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days < 0) {
          alerts.push({ id: `ialert-${item.id}-exp`, itemId: item.id, itemCode: item.itemCode, itemName: item.itemName, kind: "Expired", severity: "danger", message: `${item.itemName} expired on ${item.expiryDate}`, createdAt: now.toISOString(), acknowledged: false });
        } else if (days <= 30) {
          alerts.push({ id: `ialert-${item.id}-soon`, itemId: item.id, itemCode: item.itemCode, itemName: item.itemName, kind: "Expiring-Soon", severity: "warning", message: `${item.itemName} expires in ${days} days`, createdAt: now.toISOString(), acknowledged: false });
        }
      }
    }
    mutate((s) => ({ ...s, inventoryAlerts: alerts }));
  }

  function acknowledgeInventoryAlert(id: string) {
    mutate((s) => ({ ...s, inventoryAlerts: s.inventoryAlerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) }));
  }

  // ---- M9: Staff ----
  function addStaff(st: Omit<StaffMember, "id" | "createdAt" | "updatedAt">): StaffMember {
    const member: StaffMember = { ...st, id: uid("stf"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((s) => ({ ...s, staff: [member, ...s.staff] }));
    addAuditLog({ userId: currentUserId ?? "system", userName: currentUser?.name ?? "System", action: "Create Staff", module: "Staff", description: `Added staff member: ${member.fullName}`, date: nowISO().slice(0, 10), time: new Date().toLocaleTimeString("en-GB"), ipAddress: "192.168.1.10" });
    return member;
  }

  function updateStaff(id: string, patch: Partial<StaffMember>) {
    mutate((s) => ({ ...s, staff: s.staff.map((st) => (st.id === id ? { ...st, ...patch, updatedAt: nowISO() } : st)) }));
    addAuditLog({ userId: currentUserId ?? "system", userName: currentUser?.name ?? "System", action: "Update Staff", module: "Staff", description: `Updated staff ID: ${id}`, date: nowISO().slice(0, 10), time: new Date().toLocaleTimeString("en-GB"), ipAddress: "192.168.1.10" });
  }

  function deleteStaff(id: string) {
    mutate((s) => ({ ...s, staff: s.staff.filter((st) => st.id !== id) }));
  }

  // ---- M9: Departments ----
  function addDepartment(d: Omit<Department, "id" | "createdAt">): Department {
    const dept: Department = { ...d, id: uid("dept"), createdAt: nowISO() };
    mutate((s) => ({ ...s, departments: [...s.departments, dept] }));
    return dept;
  }

  function updateDepartment(id: string, patch: Partial<Department>) {
    mutate((s) => ({ ...s, departments: s.departments.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  }

  function deleteDepartment(id: string) {
    mutate((s) => ({ ...s, departments: s.departments.filter((d) => d.id !== id) }));
  }

  // ---- M9: Admin Users ----
  function addAdminUser(u: Omit<AdminUser, "id" | "createdAt" | "updatedAt">): AdminUser {
    const user: AdminUser = { ...u, id: uid("u"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((s) => ({ ...s, adminUsers: [...s.adminUsers, user] }));
    addAuditLog({ userId: currentUserId ?? "system", userName: currentUser?.name ?? "System", action: "Create User", module: "Users", description: `Created user: ${user.name}`, date: nowISO().slice(0, 10), time: new Date().toLocaleTimeString("en-GB"), ipAddress: "192.168.1.10" });
    return user;
  }

  function updateAdminUser(id: string, patch: Partial<AdminUser>) {
    mutate((s) => ({ ...s, adminUsers: s.adminUsers.map((u) => (u.id === id ? { ...u, ...patch, updatedAt: nowISO() } : u)) }));
    addAuditLog({ userId: currentUserId ?? "system", userName: currentUser?.name ?? "System", action: "Update User", module: "Users", description: `Updated user ID: ${id}`, date: nowISO().slice(0, 10), time: new Date().toLocaleTimeString("en-GB"), ipAddress: "192.168.1.10" });
  }

  function deleteAdminUser(id: string) {
    mutate((s) => ({ ...s, adminUsers: s.adminUsers.filter((u) => u.id !== id) }));
  }

  // ---- M9: Attendance ----
  function addAttendance(a: Omit<AttendanceRecord, "id" | "createdAt">): AttendanceRecord {
    const rec: AttendanceRecord = { ...a, id: uid("att"), createdAt: nowISO() };
    mutate((s) => ({ ...s, attendance: [rec, ...s.attendance] }));
    return rec;
  }

  function updateAttendance(id: string, patch: Partial<AttendanceRecord>) {
    mutate((s) => ({ ...s, attendance: s.attendance.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  }

  function clockIn(staffId: string) {
    const member = state.staff.find((st) => st.id === staffId);
    if (!member) return;
    const today = nowISO().slice(0, 10);
    const existing = state.attendance.find((a) => a.staffId === staffId && a.date === today);
    if (existing) return;
    const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const hour = parseInt(time.slice(0, 2));
    const status = hour > 8 ? "Late" : "Present";
    addAttendance({ staffId, staffName: member.fullName, department: member.department, date: today, clockIn: time, workingHours: 0, status, notes: "" });
  }

  function clockOut(staffId: string) {
    const today = nowISO().slice(0, 10);
    const existing = state.attendance.find((a) => a.staffId === staffId && a.date === today);
    if (!existing || !existing.clockIn) return;
    const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const [inH, inM] = existing.clockIn.split(":").map(Number);
    const [outH, outM] = time.split(":").map(Number);
    const hours = (outH * 60 + outM - inH * 60 - inM) / 60;
    updateAttendance(existing.id, { clockOut: time, workingHours: Math.max(0, hours) });
  }

  // ---- M9: Leave ----
  function addLeaveRequest(l: Omit<LeaveRequest, "id" | "createdAt" | "updatedAt">): LeaveRequest {
    const req: LeaveRequest = { ...l, id: uid("lv"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((s) => ({ ...s, leaveRequests: [req, ...s.leaveRequests] }));
    return req;
  }

  function updateLeaveRequest(id: string, patch: Partial<LeaveRequest>) {
    mutate((s) => ({ ...s, leaveRequests: s.leaveRequests.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: nowISO() } : l)) }));
  }

  function deleteLeaveRequest(id: string) {
    mutate((s) => ({ ...s, leaveRequests: s.leaveRequests.filter((l) => l.id !== id) }));
  }

  function approveLeaveRequest(id: string, approverId: string, approverName: string) {
    updateLeaveRequest(id, { status: "Approved", approvedBy: approverId, approvedByName: approverName, approvedAt: nowISO() });
    addAuditLog({ userId: currentUserId ?? "system", userName: currentUser?.name ?? "System", action: "Approve Leave", module: "Staff", description: `Approved leave request: ${id}`, date: nowISO().slice(0, 10), time: new Date().toLocaleTimeString("en-GB"), ipAddress: "192.168.1.10" });
  }

  function rejectLeaveRequest(id: string, approverId: string, approverName: string) {
    updateLeaveRequest(id, { status: "Rejected", approvedBy: approverId, approvedByName: approverName, approvedAt: nowISO() });
  }

  // ---- M9: Schedule ----
  function addScheduleEntry(se: Omit<ScheduleEntry, "id" | "createdAt">): ScheduleEntry {
    const entry: ScheduleEntry = { ...se, id: uid("sch"), createdAt: nowISO() };
    mutate((s) => ({ ...s, schedule: [entry, ...s.schedule] }));
    return entry;
  }

  function updateScheduleEntry(id: string, patch: Partial<ScheduleEntry>) {
    mutate((s) => ({ ...s, schedule: s.schedule.map((se) => (se.id === id ? { ...se, ...patch } : se)) }));
  }

  function deleteScheduleEntry(id: string) {
    mutate((s) => ({ ...s, schedule: s.schedule.filter((se) => se.id !== id) }));
  }

  // ---- M9: Audit Logs ----
  function addAuditLog(entry: Omit<AuditLogEntry, "id" | "createdAt">) {
    const log: AuditLogEntry = { ...entry, id: uid("aud"), createdAt: nowISO() };
    setState((s) => ({ ...s, auditLogs: [log, ...s.auditLogs].slice(0, 500) }));
  }

  // ---- M9: System Settings ----
  function updateSystemSettings(patch: Partial<SystemSettings>) {
    mutate((s) => ({ ...s, systemSettings: { ...s.systemSettings, ...patch, updatedAt: nowISO() } }));
    addAuditLog({ userId: currentUserId ?? "system", userName: currentUser?.name ?? "System", action: "Update Settings", module: "Settings", description: "Updated system settings", date: nowISO().slice(0, 10), time: new Date().toLocaleTimeString("en-GB"), ipAddress: "192.168.1.10" });
  }

  // ---- M10: Messaging ----
  function sendMessage(m: Omit<ChatMessage, "id" | "sentAt" | "read">): ChatMessage {
    const msg: ChatMessage = { ...m, id: uid("msg"), sentAt: nowISO(), read: false };
    mutate((s) => ({ ...s, messages: [msg, ...s.messages] }));
    return msg;
  }

  function markMessageRead(id: string) {
    mutate((s) => ({ ...s, messages: s.messages.map((m) => (m.id === id ? { ...m, read: true, readAt: nowISO() } : m)) }));
  }

  // ---- M10: Reminders ----
  function addReminder(r: Omit<Reminder, "id" | "createdAt" | "dismissed">): Reminder {
    const rem: Reminder = { ...r, id: uid("rem"), createdAt: nowISO(), dismissed: false };
    mutate((s) => ({ ...s, reminders: [rem, ...s.reminders] }));
    return rem;
  }

  function dismissReminder(id: string) {
    mutate((s) => ({ ...s, reminders: s.reminders.map((r) => (r.id === id ? { ...r, dismissed: true } : r)) }));
  }

  function refreshReminders() {
    const now = new Date();
    const newReminders: Reminder[] = [];
    // Upcoming appointments
    for (const appt of state.appointments) {
      if (appt.status === "Scheduled" || appt.status === "Checked-In") {
        const apptDate = new Date(appt.date);
        const days = Math.round((apptDate.getTime() - now.getTime()) / 86400000);
        if (days >= 0 && days <= 3) {
          const patient = state.patients.find((p) => p.id === appt.patientId);
          newReminders.push({ id: `rem-appt-${appt.id}`, kind: "Upcoming Appointment", patientId: appt.patientId, patientName: patient ? `${patient.firstName} ${patient.lastName}` : "", title: "Upcoming Appointment", message: `Appointment on ${appt.date} at ${appt.time}`, dueDate: appt.date, dismissed: false, createdAt: now.toISOString() });
        }
      }
    }
    // Outstanding bills
    for (const inv of state.invoices) {
      if (inv.paymentStatus === "Unpaid" || inv.paymentStatus === "Partially-Paid") {
        const patient = state.patients.find((p) => p.id === inv.patientId);
        newReminders.push({ id: `rem-bill-${inv.id}`, kind: "Outstanding Bill", patientId: inv.patientId, patientName: patient ? `${patient.firstName} ${patient.lastName}` : "", title: "Outstanding Bill", message: `Invoice ${inv.invoiceNumber} has balance due`, dueDate: inv.dueDate ?? now.toISOString().slice(0, 10), dismissed: false, createdAt: now.toISOString() });
      }
    }
    // Pending lab orders
    for (const lab of state.labOrders) {
      if (lab.status === "Ordered" || lab.status === "Sample-Collected" || lab.status === "In-Progress") {
        const patient = state.patients.find((p) => p.id === lab.patientId);
        newReminders.push({ id: `rem-lab-${lab.id}`, kind: "Laboratory Reminder", patientId: lab.patientId, patientName: patient ? `${patient.firstName} ${patient.lastName}` : "", title: "Lab Test Pending", message: `Lab order for ${lab.tests.map((t) => t.testName).join(", ")} is ${lab.status.toLowerCase()}`, dueDate: now.toISOString().slice(0, 10), dismissed: false, createdAt: now.toISOString() });
      }
    }
    mutate((s) => ({ ...s, reminders: [...newReminders, ...s.reminders.filter((r) => !r.id.startsWith("rem-appt-") && !r.id.startsWith("rem-bill-") && !r.id.startsWith("rem-lab-"))] }));
  }

  // ---- M10: Telemedicine ----
  function addTelemedicineSession(t: Omit<TelemedicineSession, "id" | "createdAt" | "updatedAt">): TelemedicineSession {
    const session: TelemedicineSession = { ...t, id: uid("tel"), createdAt: nowISO(), updatedAt: nowISO() };
    mutate((s) => ({ ...s, telemedicineSessions: [session, ...s.telemedicineSessions] }));
    return session;
  }

  function updateTelemedicineSession(id: string, patch: Partial<TelemedicineSession>) {
    mutate((s) => ({ ...s, telemedicineSessions: s.telemedicineSessions.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowISO() } : t)) }));
  }

  function deleteTelemedicineSession(id: string) {
    mutate((s) => ({ ...s, telemedicineSessions: s.telemedicineSessions.filter((t) => t.id !== id) }));
  }

  function addTelemedicineChat(id: string, sender: string, message: string) {
    mutate((s) => ({ ...s, telemedicineSessions: s.telemedicineSessions.map((t) => (t.id === id ? { ...t, chatLog: [...t.chatLog, { sender, message, timestamp: nowISO() }], updatedAt: nowISO() } : t)) }));
  }

  // ---- M11: Notifications ----
  function addNotification(n: Omit<AppNotification, "id" | "createdAt" | "read">) {
    const ntf: AppNotification = { ...n, id: uid("ntf"), createdAt: nowISO(), read: false };
    setState((s) => ({ ...s, notifications: [ntf, ...s.notifications].slice(0, 100) }));
  }

  function markNotificationRead(id: string) {
    mutate((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  }

  function markAllNotificationsRead() {
    mutate((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  }

  function refreshNotifications() {
    const now = new Date();
    const notifs: AppNotification[] = [];
    // Low inventory
    for (const item of state.generalInventory) {
      if (item.quantity <= 0) notifs.push({ id: `ntf-inv-${item.id}-oos`, kind: "Low Inventory", title: "Out of Stock", message: `${item.itemName} is out of stock`, severity: "danger", linkRoute: "inv-dashboard", read: false, createdAt: now.toISOString() });
      else if (item.quantity < item.minimumStock) notifs.push({ id: `ntf-inv-${item.id}-low`, kind: "Low Inventory", title: "Low Stock", message: `${item.itemName} is low (${item.quantity} units)`, severity: "warning", linkRoute: "inv-dashboard", read: false, createdAt: now.toISOString() });
    }
    // Pending payments
    for (const inv of state.invoices) {
      if (inv.paymentStatus === "Unpaid" || inv.paymentStatus === "Overdue") notifs.push({ id: `ntf-pay-${inv.id}`, kind: "Pending Payment", title: "Pending Payment", message: `Invoice ${inv.invoiceNumber} ${inv.paymentStatus.toLowerCase()}`, severity: "warning", linkRoute: "invoices", read: false, createdAt: now.toISOString() });
    }
    // Staff leave
    for (const lv of state.leaveRequests) {
      if (lv.status === "Pending") notifs.push({ id: `ntf-leave-${lv.id}`, kind: "Staff Leave", title: "Leave Request", message: `${lv.staffName} requests ${lv.leaveType}`, severity: "info", linkRoute: "admin-leave", read: false, createdAt: now.toISOString() });
    }
    // PO updates
    for (const po of state.procurementPOs) {
      if (po.status === "Submitted") notifs.push({ id: `ntf-po-${po.id}`, kind: "Purchase Order", title: "PO Submitted", message: `${po.poNumber} awaiting approval`, severity: "info", linkRoute: "inv-procurement", read: false, createdAt: now.toISOString() });
    }
    // Unread messages
    const unread = state.messages.filter((m) => !m.read).length;
    if (unread > 0) notifs.push({ id: `ntf-msg-unread`, kind: "Unread Message", title: "Unread Messages", message: `${unread} unread message${unread > 1 ? "s" : ""}`, severity: "info", linkRoute: "messaging", read: false, createdAt: now.toISOString() });
    mutate((s) => ({ ...s, notifications: [...notifs, ...s.notifications.filter((n) => !n.id.startsWith("ntf-inv-") && !n.id.startsWith("ntf-pay-") && !n.id.startsWith("ntf-leave-") && !n.id.startsWith("ntf-po-") && !n.id.startsWith("ntf-msg-"))] }));
  }

  // ---- M11: Holidays ----
  function addHoliday(h: Omit<HolidayEntry, "id">): HolidayEntry {
    const hol: HolidayEntry = { ...h, id: uid("hol") };
    mutate((s) => ({ ...s, holidays: [...s.holidays, hol] }));
    return hol;
  }

  function updateHoliday(id: string, patch: Partial<HolidayEntry>) {
    mutate((s) => ({ ...s, holidays: s.holidays.map((h) => (h.id === id ? { ...h, ...patch } : h)) }));
  }

  function deleteHoliday(id: string) {
    mutate((s) => ({ ...s, holidays: s.holidays.filter((h) => h.id !== id) }));
  }

  // ---- M11: Business Hours ----
  function updateBusinessHours(patch: Partial<BusinessHours>) {
    mutate((s) => ({ ...s, businessHours: { ...s.businessHours, ...patch } }));
  }

  // ---- M11: Global Search ----
  function globalSearch(query: string): GlobalSearchResult[] {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase();
    const results: GlobalSearchResult[] = [];
    for (const p of state.patients) {
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      if (name.includes(q) || p.phone.includes(q) || p.email.toLowerCase().includes(q)) results.push({ type: "Patient", id: p.id, title: `${p.firstName} ${p.lastName}`, subtitle: `${p.phone} · ${p.gender}`, route: "patient-detail", routeParams: { id: p.id } });
    }
    for (const a of state.appointments) {
      const patient = state.patients.find((p) => p.id === a.patientId);
      if (patient && (`${patient.firstName} ${patient.lastName}`.toLowerCase().includes(q) || a.date.includes(q))) results.push({ type: "Appointment", id: a.id, title: `${patient.firstName} ${patient.lastName} — ${a.date}`, subtitle: `${a.time} · ${a.type}`, route: "appointments" });
    }
    for (const lab of state.labOrders) {
      const patient = state.patients.find((p) => p.id === lab.patientId);
      if (patient && (`${patient.firstName} ${patient.lastName}`.toLowerCase().includes(q) || lab.tests.some((t) => t.testName.toLowerCase().includes(q)))) results.push({ type: "Lab Order", id: lab.id, title: `${patient.firstName} ${patient.lastName} — Lab`, subtitle: lab.tests.map((t) => t.testName).join(", "), route: "labs" });
    }
    for (const rx of state.prescriptions) {
      const patient = state.patients.find((p) => p.id === rx.patientId);
      if (patient && (`${patient.firstName} ${patient.lastName}`.toLowerCase().includes(q) || rx.diagnosis.toLowerCase().includes(q))) results.push({ type: "Prescription", id: rx.id, title: `${patient.firstName} ${patient.lastName} — Rx`, subtitle: rx.diagnosis, route: "prescriptions" });
    }
    for (const inv of state.invoices) {
      const patient = state.patients.find((p) => p.id === inv.patientId);
      if (patient && (`${patient.firstName} ${patient.lastName}`.toLowerCase().includes(q) || inv.invoiceNumber.toLowerCase().includes(q))) results.push({ type: "Invoice", id: inv.id, title: inv.invoiceNumber, subtitle: `${patient.firstName} ${patient.lastName} · ${inv.paymentStatus}`, route: "invoices" });
    }
    for (const st of state.staff) {
      if (st.fullName.toLowerCase().includes(q) || st.position.toLowerCase().includes(q) || st.email.toLowerCase().includes(q)) results.push({ type: "Staff", id: st.id, title: st.fullName, subtitle: `${st.position} · ${st.department}`, route: "admin-staff" });
    }
    for (const sup of state.suppliers) {
      if (sup.name.toLowerCase().includes(q) || sup.contactPerson.toLowerCase().includes(q)) results.push({ type: "Supplier", id: sup.id, title: sup.name, subtitle: sup.contactPerson, route: "inv-suppliers" });
    }
    for (const gi of state.generalInventory) {
      if (gi.itemName.toLowerCase().includes(q) || gi.itemCode.toLowerCase().includes(q)) results.push({ type: "Inventory", id: gi.id, title: gi.itemName, subtitle: `${gi.itemCode} · ${gi.department}`, route: "inv-medical" });
    }
    for (const ast of state.assets) {
      if (ast.assetName.toLowerCase().includes(q) || ast.assetId.toLowerCase().includes(q)) results.push({ type: "Asset", id: ast.id, title: ast.assetName, subtitle: `${ast.assetId} · ${ast.department}`, route: "inv-assets" });
    }
    for (const po of state.procurementPOs) {
      if (po.poNumber.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q)) results.push({ type: "Purchase Order", id: po.id, title: po.poNumber, subtitle: `${po.supplierName} · ${po.status}`, route: "inv-procurement" });
    }
    for (const d of state.departments) {
      if (d.name.toLowerCase().includes(q)) results.push({ type: "Department", id: d.id, title: d.name, subtitle: d.description, route: "admin-departments" });
    }
    return results.slice(0, 30);
  }

  // ---- M12: Referrals ----
  function generateReferralId(): string {
    const year = new Date().getFullYear();
    const seq = String(state.referrals.length + 1).padStart(4, "0");
    return `REF-${year}-${seq}`;
  }

  function addReferral(r: Omit<Referral, "id" | "referralId" | "timeline" | "createdAt" | "updatedAt">): Referral {
    const now = nowISO();
    const refId = generateReferralId();
    const clinicianName = state.users.find((u) => u.id === r.referringClinicianId)?.name ?? "Unknown";
    const timeline: ReferralTimelineEntry[] = [
      { id: uid("tl"), status: r.status, at: now, actorName: clinicianName, note: "Referral created" },
    ];
    const referral: Referral = {
      ...r,
      id: uid("ref"),
      referralId: refId,
      timeline,
      createdAt: now,
      updatedAt: now,
    };
    mutate((s) => ({ ...s, referrals: [referral, ...s.referrals] }));
    logActivity({
      kind: "prescription",
      title: "Referral created",
      description: `${refId} for ${state.patients.find((p) => p.id === r.patientId)?.lastName ?? "patient"}`,
      actorId: r.referringClinicianId,
      actorName: clinicianName,
    });
    return referral;
  }

  function updateReferral(id: string, patch: Partial<Referral>) {
    mutate((s) => ({
      ...s,
      referrals: s.referrals.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: nowISO() } : r)),
    }));
  }

  function deleteReferral(id: string) {
    mutate((s) => ({ ...s, referrals: s.referrals.filter((r) => r.id !== id) }));
  }

  function advanceReferralStatus(id: string, status: ReferralStatus, actorName: string, note?: string) {
    mutate((s) => ({
      ...s,
      referrals: s.referrals.map((r) => {
        if (r.id !== id) return r;
        const entry: ReferralTimelineEntry = {
          id: uid("tl"),
          status,
          at: nowISO(),
          actorName,
          note: note ?? `Status changed to ${status}`,
        };
        return { ...r, status, timeline: [...r.timeline, entry], updatedAt: nowISO() };
      }),
    }));
  }

  function resetDemoData() {
    setSchemaVersion("9.0.0");
    save(STORAGE_KEY, initialSeedState);
    setState(initialSeedState);
  }

  const value: AppContextValue = {
    ...state,
    currentUserId,
    currentUser,
    login,
    logout,
    addPatient,
    updatePatient,
    deletePatient,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addVitals,
    addSoapNote,
    updateSoapNote,
    deleteSoapNote,
    addLabOrder,
    updateLabOrder,
    deleteLabOrder,
    addPrescription,
    updatePrescription,
    deletePrescription,
    addDispense,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    adjustInventory,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    addControlledEntry,
    updateControlledEntry,
    deleteControlledEntry,
    addPricingItem,
    updatePricingItem,
    deletePricingItem,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addPayment,
    updatePayment,
    deletePayment,
    addClaim,
    updateClaim,
    deleteClaim,
    addInsurancePolicy,
    updateInsurancePolicy,
    deleteInsurancePolicy,
    addRefund,
    updateRefund,
    deleteRefund,
    markBillingNotificationRead,
    refreshBillingNotifications,
    logActivity,
    acknowledgeAlert,
    refreshAlerts,
    // M8
    addGeneralInventoryItem,
    updateGeneralInventoryItem,
    deleteGeneralInventoryItem,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addProcurementPO,
    updateProcurementPO,
    deleteProcurementPO,
    receiveProcurementPO,
    addStockMovement,
    addAsset,
    updateAsset,
    deleteAsset,
    refreshInventoryAlerts,
    acknowledgeInventoryAlert,
    // M9
    addStaff,
    updateStaff,
    deleteStaff,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addAdminUser,
    updateAdminUser,
    deleteAdminUser,
    addAttendance,
    updateAttendance,
    clockIn,
    clockOut,
    addLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    addScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry,
    addAuditLog,
    updateSystemSettings,
    // M10
    sendMessage,
    markMessageRead,
    addReminder,
    dismissReminder,
    refreshReminders,
    addTelemedicineSession,
    updateTelemedicineSession,
    deleteTelemedicineSession,
    addTelemedicineChat,
    // M11
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    refreshNotifications,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    updateBusinessHours,
    globalSearch,
    // M12
    addReferral,
    updateReferral,
    deleteReferral,
    advanceReferralStatus,
    resetDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// ============================================================================
// Derived helpers / alert computation
// ============================================================================

export function computeAlerts(inventory: InventoryItem[]): StockAlert[] {
  const now = new Date();
  const alerts: StockAlert[] = [];
  for (const inv of inventory) {
    if (inv.quantity <= 0) {
      alerts.push({ id: `alert-${inv.id}-oos`, inventoryId: inv.id, drugName: inv.drugName, kind: "Out-of-Stock", severity: "danger", message: `${inv.drugName} is out of stock`, createdAt: now.toISOString(), acknowledged: false });
    } else if (inv.quantity <= inv.reorderLevel) {
      alerts.push({ id: `alert-${inv.id}-low`, inventoryId: inv.id, drugName: inv.drugName, kind: "Low-Stock", severity: "warning", message: `${inv.drugName} is low on stock (${inv.quantity} ${inv.unitCost ? "" : ""})`, createdAt: now.toISOString(), acknowledged: false });
    }
    const expiry = new Date(inv.expiryDate);
    const daysToExpiry = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysToExpiry < 0) {
      alerts.push({ id: `alert-${inv.id}-exp`, inventoryId: inv.id, drugName: inv.drugName, kind: "Expired", severity: "danger", message: `${inv.drugName} expired on ${inv.expiryDate}`, createdAt: now.toISOString(), acknowledged: false });
    } else if (daysToExpiry <= 60) {
      alerts.push({ id: `alert-${inv.id}-soon`, inventoryId: inv.id, drugName: inv.drugName, kind: "Expiring-Soon", severity: "warning", message: `${inv.drugName} expires in ${daysToExpiry} days (${inv.expiryDate})`, createdAt: now.toISOString(), acknowledged: false });
    }
  }
  return alerts;
}

// Re-exported for convenience
export { MED_CATALOG_NAMES };
