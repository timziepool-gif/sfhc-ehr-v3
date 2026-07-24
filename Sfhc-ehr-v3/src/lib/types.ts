// ============================================================================
// Core domain types for the Sahel Family Health Clinic EHR
// ============================================================================

export type UserRole = "admin" | "physician" | "nurse" | "pharmacist" | "lab_tech" | "receptionist" | "finance";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string; // plaintext for demo; localStorage only
  avatarColor: string;
}

export type Gender = "Male" | "Female" | "Other";
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown";

export interface Allergy {
  id: string;
  substance: string;
  severity: "Mild" | "Moderate" | "Severe";
  reaction: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date
  gender: Gender;
  bloodType: BloodType;
  phone: string;
  email: string;
  address: string;
  city: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  insuranceProvider: string;
  insuranceNumber: string;
  allergies: Allergy[];
  chronicConditions: string[];
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = "Scheduled" | "Checked-In" | "In-Progress" | "Completed" | "Cancelled" | "No-Show";
export type AppointmentType = "Consultation" | "Follow-Up" | "Emergency" | "Vaccination" | "Check-Up" | "Lab Visit";

export interface Appointment {
  id: string;
  patientId: string;
  clinicianId: string;
  date: string; // ISO date
  time: string; // HH:MM
  type: AppointmentType;
  reason: string;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
}

export type VitalsUnit = "celsius" | "fahrenheit";

export interface Vitals {
  id: string;
  patientId: string;
  encounterId: string;
  temperatureC: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  weightKg: number;
  heightCm: number;
  recordedBy: string;
  recordedAt: string;
}

export type SoapNoteType = "Initial" | "Progress" | "Discharge" | "Emergency";

export interface SoapNote {
  id: string;
  patientId: string;
  clinicianId: string;
  encounterDate: string;
  type: SoapNoteType;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  diagnosis: string;
  diagnosisCode: string;
  vitalsId?: string;
  createdAt: string;
}

export type LabStatus = "Ordered" | "Sample-Collected" | "In-Progress" | "Completed" | "Cancelled";
export type LabPriority = "Routine" | "Urgent" | "STAT";
export type LabSpecimen = "Blood" | "Urine" | "Sputum" | "Stool" | "Swab" | "Tissue" | "Other";

export interface LabTestItem {
  id: string;
  testCode: string;
  testName: string;
  category: string;
  specimen: LabSpecimen;
  result: string;
  unit: string;
  referenceRange: string;
  flag: "Normal" | "Abnormal" | "Critical" | "Pending";
  notes: string;
}

export interface LabOrder {
  id: string;
  patientId: string;
  clinicianId: string;
  priority: LabPriority;
  status: LabStatus;
  specimen: LabSpecimen;
  clinicalIndication: string;
  tests: LabTestItem[];
  orderedAt: string;
  collectedAt?: string;
  completedAt?: string;
  labTechId?: string;
  notes: string;
}

// ============================================================================
// Pharmacy domain types
// ============================================================================

export type MedicationCategory =
  | "Antibiotic"
  | "Analgesic"
  | "Antihypertensive"
  | "Antidiabetic"
  | "Antimalarial"
  | "Antifungal"
  | "Antiviral"
  | "Cardiac"
  | "Respiratory"
  | "Gastrointestinal"
  | "Vitamin"
  | "Other";

export type MedicationRoute = "Oral" | "IV" | "IM" | "Subcutaneous" | "Topical" | "Inhalation" | "Sublingual" | "Rectal";

export interface MedicationCatalogEntry {
  id: string;
  name: string;
  genericName: string;
  category: MedicationCategory;
  form: string; // tablet, capsule, syrup...
  strength: string; // 500mg
  unit: string;
  controlled: boolean; // controlled substance
  schedule?: string; // Schedule II/III/IV if controlled
  manufacturer: string;
  defaultDose: string;
  defaultRoute: MedicationRoute;
  defaultFrequency: string;
  commonAllergies: string[]; // substances that contra-indicate this med
  typicalCost: number;
}

export type PrescriptionStatus = "Pending" | "Reviewed" | "Dispensed" | "Cancelled";

export interface PrescriptionLine {
  id: string;
  medicationId: string;
  medicationName: string;
  dose: string;
  route: MedicationRoute;
  frequency: string;
  duration: string;
  quantity: number;
  refills: number;
  instructions: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  clinicianId: string;
  pharmacistId?: string;
  soapNoteId?: string;
  date: string;
  diagnosis: string;
  lines: PrescriptionLine[];
  status: PrescriptionStatus;
  notes: string;
  createdAt: string;
  reviewedAt?: string;
  dispensedAt?: string;
  cancelledAt?: string;
}

export type DispenseStage = "Received" | "Prepared" | "Verified" | "Dispensed" | "Completed";

export interface DispenseStep {
  stage: DispenseStage;
  actorId: string;
  actorName: string;
  at: string;
  notes: string;
}

export interface DispenseRecord {
  id: string;
  prescriptionId: string;
  patientId: string;
  pharmacistId: string;
  medicationId: string;
  medicationName: string;
  quantityDispensed: number;
  remainingQuantity: number;
  date: string;
  time: string;
  steps: DispenseStep[];
  notes: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  drugName: string;
  medicationId?: string;
  category: MedicationCategory;
  batchNumber: string;
  manufacturer: string;
  expiryDate: string;
  quantity: number;
  minimumStock: number;
  reorderLevel: number;
  unitCost: number;
  supplier: string;
  location: string;
  controlled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus = "Draft" | "Submitted" | "Approved" | "Received" | "Cancelled";

export interface PurchaseOrderLine {
  id: string;
  medicationId?: string;
  drugName: string;
  quantity: number;
  unitCost: number;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate: string;
  receivedDate?: string;
  lines: PurchaseOrderLine[];
  total: number;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface ControlledDrugEntry {
  id: string;
  drugName: string;
  medicationId?: string;
  schedule: string;
  transactionType: "Received" | "Dispensed" | "Destroyed" | "Adjusted";
  quantity: number;
  runningBalance: number;
  prescriberId: string;
  prescriberName: string;
  pharmacistId: string;
  pharmacistName: string;
  patientId: string;
  patientName: string;
  date: string;
  reference: string;
  notes: string;
}

export interface DrugInteraction {
  medA: string;
  medB: string;
  severity: "Mild" | "Moderate" | "High" | "Contraindicated";
  description: string;
  recommendation: string;
}

export type StockAlertKind = "Low-Stock" | "Out-of-Stock" | "Expiring-Soon" | "Expired";
export interface StockAlert {
  id: string;
  inventoryId: string;
  drugName: string;
  kind: StockAlertKind;
  severity: "info" | "warning" | "danger";
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

export type ActivityKind =
  | "prescription"
  | "dispense"
  | "inventory"
  | "purchase"
  | "controlled"
  | "alert"
  | "billing";

export interface ActivityLog {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  actorId: string;
  actorName: string;
  at: string;
}

export interface MedicationHistoryEntry {
  id: string;
  patientId: string;
  prescriptionId?: string;
  dispenseId?: string;
  medicationName: string;
  eventType: "Prescribed" | "Dispensed" | "Refilled" | "Stopped" | "Cancelled";
  date: string;
  actorName: string;
  details: string;
}

// ============================================================================
// Billing & Revenue Cycle Management (Milestone 7)
// ============================================================================

export type BillingCategory =
  | "Consultation"
  | "Laboratory"
  | "Radiology"
  | "Pharmacy"
  | "Procedures"
  | "Vaccination"
  | "Admission"
  | "Emergency"
  | "Dental"
  | "Other Services";

export interface PricingItem {
  id: string;
  code: string;
  name: string;
  category: BillingCategory;
  unitPrice: number;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus =
  | "Draft"
  | "Unpaid"
  | "Partially-Paid"
  | "Paid"
  | "Overdue"
  | "Cancelled"
  | "Refunded";

export type PaymentMethod =
  | "Cash"
  | "Card"
  | "Transfer"
  | "POS"
  | "Insurance"
  | "Mobile Money"
  | "Split Payment";

export type InvoiceSource =
  | "Manual"
  | "Appointment"
  | "Laboratory"
  | "Pharmacy"
  | "Procedure"
  | "Consultation";

export interface InvoiceLine {
  id: string;
  description: string;
  category: BillingCategory;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  sourceId?: string;
  sourceType?: InvoiceSource;
  reference?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  clinicianId?: string;
  cashierId?: string;
  department: BillingCategory;
  date: string;
  dueDate: string;
  lines: InvoiceLine[];
  discountTotal: number;
  taxTotal: number;
  subtotal: number;
  grandTotal: number;
  amountPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  insurancePolicyId?: string;
  insuranceCovered: number;
  source: InvoiceSource;
  sourceRefId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ClaimStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Paid";

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  invoiceId: string;
  patientId: string;
  policyId: string;
  insurerName: string;
  amount: number;
  status: ClaimStatus;
  submissionDate: string;
  reviewDate?: string;
  paymentDate?: string;
  notes: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export type InsuranceType =
  | "Cash"
  | "Insurance"
  | "Corporate"
  | "NHIA"
  | "Private HMO"
  | "Self Pay";

export interface InsurancePolicy {
  id: string;
  patientId: string;
  type: InsuranceType;
  insurerName: string;
  policyNumber: string;
  memberId: string;
  employer?: string;
  coveragePercent: number;
  expiryDate: string;
  authorizationNumber?: string;
  claimStatus: ClaimStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RefundStatus = "Pending" | "Approved" | "Completed" | "Rejected";

export interface Refund {
  id: string;
  refundNumber: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  approvedBy?: string;
  approvedAt?: string;
  processedBy: string;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  patientId: string;
  amountPaid: number;
  balanceAfter: number;
  cashierId: string;
  cashierName: string;
  date: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
  createdAt: string;
}

export type BillingNotificationKind =
  | "overdue-invoice"
  | "claim-approved"
  | "claim-rejected"
  | "outstanding-balance"
  | "large-unpaid"
  | "insurance-expiry"
  | "payment-success"
  | "refund-completed";

export interface BillingNotification {
  id: string;
  kind: BillingNotificationKind;
  title: string;
  message: string;
  patientId?: string;
  invoiceId?: string;
  claimId?: string;
  severity: "info" | "warning" | "danger" | "success";
  createdAt: string;
  read: boolean;
}

// ============================================================================
// Milestone 8 — Inventory, Procurement & Asset Management
// ============================================================================

export type InventoryCategory =
  | "Laboratory Reagents"
  | "Laboratory Consumables"
  | "Pharmacy Medications"
  | "Vaccines"
  | "Medical Equipment"
  | "Medical Consumables"
  | "Office Supplies"
  | "Cleaning Supplies"
  | "IT Equipment"
  | "Furniture";

export type InventoryDepartment =
  | "Laboratory"
  | "Pharmacy"
  | "Medical"
  | "Nursing"
  | "Administration"
  | "Finance"
  | "Reception"
  | "Records"
  | "ICT"
  | "Maintenance";

export type InventoryItemStatus = "Active" | "Inactive" | "Discontinued";

export interface GeneralInventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: InventoryCategory;
  department: InventoryDepartment;
  manufacturer: string;
  supplierId: string;
  supplierName: string;
  batchNumber: string;
  serialNumber?: string;
  quantity: number;
  minimumStock: number;
  maximumStock: number;
  unitCost: number;
  sellingPrice?: number;
  expiryDate?: string;
  storageLocation: string;
  status: InventoryItemStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ProcurementPOStatus =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Ordered"
  | "Received"
  | "Cancelled";

export interface ProcurementPOLine {
  id: string;
  itemCode: string;
  itemName: string;
  category: InventoryCategory;
  quantity: number;
  unitCost: number;
  receivedQuantity: number;
}

export interface ProcurementPurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  department: InventoryDepartment;
  requestedBy: string;
  requestedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  status: ProcurementPOStatus;
  orderDate: string;
  expectedDate: string;
  receivedDate?: string;
  lines: ProcurementPOLine[];
  total: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ContractStatus = "Active" | "Expired" | "Suspended" | "Pending";

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  productsSupplied: string[];
  performanceRating: number; // 1-5
  contractStatus: ContractStatus;
  purchaseHistory: number; // total orders
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType =
  | "Received"
  | "Issued"
  | "Transferred"
  | "Returned"
  | "Damaged"
  | "Expired"
  | "Adjusted";

export interface StockMovement {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  movementType: StockMovementType;
  quantity: number;
  fromDepartment?: InventoryDepartment;
  toDepartment?: InventoryDepartment;
  staffId: string;
  staffName: string;
  department: InventoryDepartment;
  reason: string;
  referenceNumber: string;
  date: string;
  createdAt: string;
}

export type AssetCategory =
  | "Medical Equipment"
  | "Laboratory Equipment"
  | "IT Equipment"
  | "Office Equipment"
  | "Furniture"
  | "Infrastructure";

export type AssetServiceStatus = "In Service" | "Under Maintenance" | "Decommissioned" | "In Storage";
export type AssetCondition = "Excellent" | "Good" | "Fair" | "Poor" | "Damaged";

export interface Asset {
  id: string;
  assetId: string;
  assetName: string;
  category: AssetCategory;
  department: InventoryDepartment;
  location: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  purchaseDate: string;
  purchaseCost: number;
  warrantyExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  serviceStatus: AssetServiceStatus;
  condition: AssetCondition;
  depreciation: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryAlertKind =
  | "Low-Stock"
  | "Out-of-Stock"
  | "Expiring-Soon"
  | "Expired"
  | "Overstock"
  | "Reorder-Required";

export interface InventoryAlert {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  kind: InventoryAlertKind;
  severity: "info" | "warning" | "danger";
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

// ============================================================================
// Milestone 9 — Administration & Staff Management
// ============================================================================

export type StaffStatus = "Active" | "On Leave" | "Suspended" | "Terminated" | "Probation";

export interface StaffMember {
  id: string;
  staffId: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  department: string;
  position: string;
  professionalLicenseNumber?: string;
  employmentDate: string;
  status: StaffStatus;
  emergencyContactName: string;
  emergencyContactPhone: string;
  qualifications: string[];
  specialization: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  headOfDepartment?: string;
  headOfDepartmentName?: string;
  description: string;
  staffCount: number;
  createdAt: string;
}

export type AdminUserRole =
  | "Administrator"
  | "Physician"
  | "Medical Laboratory Scientist"
  | "Pharmacist"
  | "Finance Officer"
  | "Receptionist"
  | "Nurse"
  | "Inventory Officer"
  | "Department Head"
  | "System Auditor";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  department?: string;
  departmentName?: string;
  staffId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = "Present" | "Late" | "Absent" | "Half-Day" | "Remote";

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  workingHours: number;
  status: AttendanceStatus;
  notes: string;
  createdAt: string;
}

export type LeaveType = "Annual Leave" | "Sick Leave" | "Maternity Leave" | "Compassionate Leave" | "Unpaid Leave";
export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ShiftType = "Morning" | "Afternoon" | "Night" | "On-Call";

export interface ScheduleEntry {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  date: string;
  shift: ShiftType;
  startTime: string;
  endTime: string;
  notes: string;
  createdAt: string;
}

export type AuditModule =
  | "Auth"
  | "Patients"
  | "Appointments"
  | "Clinical"
  | "Laboratory"
  | "Pharmacy"
  | "Billing"
  | "Inventory"
  | "Procurement"
  | "Assets"
  | "Staff"
  | "Users"
  | "Settings";

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: AuditModule;
  description: string;
  date: string;
  time: string;
  ipAddress: string;
  createdAt: string;
}

export interface SystemSettings {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicWebsite: string;
  currency: string;
  taxRate: number;
  theme: "light" | "dark";
  emailNotifications: boolean;
  lowStockThreshold: number;
  expiryAlertDays: number;
  backupFrequency: string;
  updatedAt: string;
}

// ============================================================================
// Milestone 10 — Patient Portal, Telemedicine, Messaging, Reminders
// ============================================================================

export type MessageChannel = "Patient" | "Physician" | "Laboratory" | "Pharmacy" | "Reception";

export interface ChatMessage {
  id: string;
  threadId: string;
  fromChannel: MessageChannel;
  fromName: string;
  fromId: string;
  toChannel: MessageChannel;
  toName: string;
  toId: string;
  subject: string;
  body: string;
  read: boolean;
  attachmentName?: string;
  sentAt: string;
  readAt?: string;
}

export type ReminderKind =
  | "Upcoming Appointment"
  | "Medication Reminder"
  | "Laboratory Reminder"
  | "Outstanding Bill"
  | "Follow-up";

export interface Reminder {
  id: string;
  kind: ReminderKind;
  patientId?: string;
  patientName?: string;
  title: string;
  message: string;
  dueDate: string;
  dismissed: boolean;
  createdAt: string;
}

export type TelemedicineStatus = "Scheduled" | "Waiting" | "In Progress" | "Completed" | "Cancelled";

export interface TelemedicineSession {
  id: string;
  sessionId: string;
  patientId: string;
  patientName: string;
  physicianId: string;
  physicianName: string;
  scheduledDate: string;
  scheduledTime: string;
  status: TelemedicineStatus;
  meetingLink: string;
  chatLog: { sender: string; message: string; timestamp: string }[];
  consultationNotes: string;
  visitSummary: string;
  followUpDate?: string;
  prescriptionId?: string;
  labOrderId?: string;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Milestone 11 — Reporting, Executive Analytics, Global Search, Notifications
// ============================================================================

export type NotificationKind =
  | "Critical Lab Result"
  | "Low Inventory"
  | "Upcoming Appointment"
  | "Pending Payment"
  | "Insurance Claim Update"
  | "Staff Leave"
  | "Purchase Order"
  | "System Alert"
  | "Unread Message";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  severity: "info" | "warning" | "danger" | "success";
  linkRoute?: string;
  linkParams?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

export interface HolidayEntry {
  id: string;
  name: string;
  date: string;
  type: "Public Holiday" | "Clinic Holiday" | "Half Day";
  notes: string;
}

export interface BusinessHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

export interface GlobalSearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  route: string;
  routeParams?: Record<string, string>;
}

// ============================================================================
// Milestone 12 — Referrals Management
// ============================================================================

export type ReferralUrgency = "Routine" | "Urgent" | "Emergency";
export type ReferralStatus =
  | "Draft"
  | "Sent"
  | "Accepted"
  | "Appointment Scheduled"
  | "Completed"
  | "Closed";

export interface ReferralTimelineEntry {
  id: string;
  status: ReferralStatus;
  at: string;
  actorName: string;
  note: string;
}

export interface Referral {
  id: string;
  referralId: string;
  patientId: string;
  referringClinicianId: string;
  receivingFacility: string;
  receivingSpecialist: string;
  specialty: string;
  reason: string;
  clinicalSummary: string;
  urgency: ReferralUrgency;
  attachments: string[];
  date: string;
  status: ReferralStatus;
  timeline: ReferralTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}


