import type {
  PricingItem,
  Invoice,
  Payment,
  InsuranceClaim,
  InsurancePolicy,
  Refund,
  BillingNotification,
  User,
  InvoiceLine,
} from "./types";

// ============================================================================
// Finance user
// ============================================================================

export const SEED_FINANCE_USER: User = {
  id: "u-finance-1",
  name: "Finance Officer Aminata Traoré",
  email: "finance@sfhc.org",
  role: "finance",
  password: "finance123",
  avatarColor: "#d97706",
};

// ============================================================================
// Pricing Catalogue
// ============================================================================

const now = new Date().toISOString();

export const SEED_PRICING: PricingItem[] = [
  // Consultation
  { id: "prc-1", code: "CONS-GEN", name: "General Consultation", category: "Consultation", unitPrice: 50, description: "Standard GP consultation", active: true, createdAt: now, updatedAt: now },
  { id: "prc-2", code: "CONS-SPEC", name: "Specialist Consultation", category: "Consultation", unitPrice: 120, description: "Specialist referral consultation", active: true, createdAt: now, updatedAt: now },
  { id: "prc-3", code: "CONS-FUP", name: "Follow-Up Consultation", category: "Consultation", unitPrice: 30, description: "Follow-up visit", active: true, createdAt: now, updatedAt: now },
  { id: "prc-4", code: "CONS-EMR", name: "Emergency Consultation", category: "Consultation", unitPrice: 150, description: "Emergency department consultation", active: true, createdAt: now, updatedAt: now },

  // Laboratory
  { id: "prc-5", code: "HBA1C", name: "HbA1c", category: "Laboratory", unitPrice: 35, description: "Glycated haemoglobin", active: true, createdAt: now, updatedAt: now },
  { id: "prc-6", code: "FPG", name: "Fasting Plasma Glucose", category: "Laboratory", unitPrice: 15, description: "Fasting blood sugar", active: true, createdAt: now, updatedAt: now },
  { id: "prc-7", code: "CBC", name: "Full Blood Count", category: "Laboratory", unitPrice: 25, description: "Complete blood count", active: true, createdAt: now, updatedAt: now },
  { id: "prc-8", code: "LIPID", name: "Lipid Panel", category: "Laboratory", unitPrice: 40, description: "Cholesterol & lipids", active: true, createdAt: now, updatedAt: now },
  { id: "prc-9", code: "ELECTRO", name: "Electrolytes U&E", category: "Laboratory", unitPrice: 30, description: "Urea & electrolytes", active: true, createdAt: now, updatedAt: now },
  { id: "prc-10", code: "INR", name: "INR / PT", category: "Laboratory", unitPrice: 20, description: "Coagulation studies", active: true, createdAt: now, updatedAt: now },

  // Radiology (placeholder)
  { id: "prc-11", code: "CXR", name: "Chest X-Ray", category: "Radiology", unitPrice: 80, description: "Plain chest radiograph", active: true, createdAt: now, updatedAt: now },
  { id: "prc-12", code: "US-ABD", name: "Abdominal Ultrasound", category: "Radiology", unitPrice: 120, description: "Abdominal sonography", active: true, createdAt: now, updatedAt: now },

  // Pharmacy
  { id: "prc-13", code: "PHARM-AMX", name: "Amoxicillin 500mg", category: "Pharmacy", unitPrice: 0.8, description: "Per tablet", active: true, createdAt: now, updatedAt: now },
  { id: "prc-14", code: "PHARM-PAR", name: "Paracetamol 500mg", category: "Pharmacy", unitPrice: 0.2, description: "Per tablet", active: true, createdAt: now, updatedAt: now },
  { id: "prc-15", code: "PHARM-AMLOD", name: "Amlodipine 5mg", category: "Pharmacy", unitPrice: 0.4, description: "Per tablet", active: true, createdAt: now, updatedAt: now },
  { id: "prc-16", code: "PHARM-MET", name: "Metformin 500mg", category: "Pharmacy", unitPrice: 0.4, description: "Per tablet", active: true, createdAt: now, updatedAt: now },
  { id: "prc-17", code: "PHARM-WARF", name: "Warfarin 5mg", category: "Pharmacy", unitPrice: 0.8, description: "Per tablet", active: true, createdAt: now, updatedAt: now },
  { id: "prc-18", code: "PHARM-SALB", name: "Salbutamol Inhaler", category: "Pharmacy", unitPrice: 12, description: "Per inhaler", active: true, createdAt: now, updatedAt: now },
  { id: "prc-19", code: "PHARM-ATORV", name: "Atorvastatin 20mg", category: "Pharmacy", unitPrice: 0.6, description: "Per tablet", active: true, createdAt: now, updatedAt: now },

  // Procedures
  { id: "prc-20", code: "PROC-WOUND", name: "Wound Dressing", category: "Procedures", unitPrice: 25, description: "Wound care & dressing", active: true, createdAt: now, updatedAt: now },
  { id: "prc-21", code: "PROC-SUT", name: "Suture Removal", category: "Procedures", unitPrice: 20, description: "Stitch removal", active: true, createdAt: now, updatedAt: now },
  { id: "prc-22", code: "PROC-INJ", name: "Intramuscular Injection", category: "Procedures", unitPrice: 15, description: "IM injection", active: true, createdAt: now, updatedAt: now },

  // Vaccination
  { id: "prc-23", code: "VAC-TET", name: "Tetanus Booster", category: "Vaccination", unitPrice: 35, description: "Tetanus toxoid booster", active: true, createdAt: now, updatedAt: now },
  { id: "prc-24", code: "VAC-FLU", name: "Influenza Vaccine", category: "Vaccination", unitPrice: 40, description: "Seasonal flu vaccine", active: true, createdAt: now, updatedAt: now },
  { id: "prc-25", code: "VAC-YF", name: "Yellow Fever Vaccine", category: "Vaccination", unitPrice: 55, description: "Yellow fever vaccination", active: true, createdAt: now, updatedAt: now },

  // Admission
  { id: "prc-26", code: "ADM-WARD", name: "Ward Admission (per day)", category: "Admission", unitPrice: 100, description: "General ward per day", active: true, createdAt: now, updatedAt: now },
  { id: "prc-27", code: "ADM-ICU", name: "ICU Admission (per day)", category: "Admission", unitPrice: 350, description: "Intensive care per day", active: true, createdAt: now, updatedAt: now },

  // Emergency
  { id: "prc-28", code: "EMR-TRIAGE", name: "Emergency Triage", category: "Emergency", unitPrice: 75, description: "Emergency triage & assessment", active: true, createdAt: now, updatedAt: now },
  { id: "prc-29", code: "EMR-RESUS", name: "Resuscitation", category: "Emergency", unitPrice: 250, description: "Emergency resuscitation", active: true, createdAt: now, updatedAt: now },

  // Dental
  { id: "prc-30", code: "DEN-EXT", name: "Tooth Extraction", category: "Dental", unitPrice: 60, description: "Simple tooth extraction", active: true, createdAt: now, updatedAt: now },
  { id: "prc-31", code: "DEN-CLEAN", name: "Dental Cleaning", category: "Dental", unitPrice: 80, description: "Scaling & polishing", active: true, createdAt: now, updatedAt: now },

  // Other
  { id: "prc-32", code: "OTH-ECG", name: "ECG (12-lead)", category: "Other Services", unitPrice: 45, description: "Electrocardiogram", active: true, createdAt: now, updatedAt: now },
  { id: "prc-33", code: "OTH-NEB", name: "Nebulisation", category: "Other Services", unitPrice: 20, description: "Nebuliser therapy", active: true, createdAt: now, updatedAt: now },
  { id: "prc-34", code: "OTH-IVF", name: "IV Fluids (per bag)", category: "Other Services", unitPrice: 18, description: "Intravenous fluids", active: true, createdAt: now, updatedAt: now },

  // Inactive example
  { id: "prc-35", code: "CONS-HOME", name: "Home Visit", category: "Consultation", unitPrice: 200, description: "Home visit — inactive", active: false, createdAt: now, updatedAt: now },
];

// ============================================================================
// Insurance Policies
// ============================================================================

export const SEED_INSURANCE_POLICIES: InsurancePolicy[] = [
  {
    id: "pol-1", patientId: "p-1001", type: "Insurance", insurerName: "Allianz Africa", policyNumber: "AZ-44120",
    memberId: "M-44120", employer: "Bamako Trading Co.", coveragePercent: 80, expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    authorizationNumber: "AUTH-2024-001", claimStatus: "Approved", active: true, createdAt: now, updatedAt: now,
  },
  {
    id: "pol-2", patientId: "p-1002", type: "Private HMO", insurerName: "NSIA", policyNumber: "NS-88201",
    memberId: "M-88201", employer: "City Bank Mali", coveragePercent: 70, expiryDate: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
    authorizationNumber: "AUTH-2024-002", claimStatus: "Submitted", active: true, createdAt: now, updatedAt: now,
  },
  {
    id: "pol-3", patientId: "p-1003", type: "Insurance", insurerName: "SUNU Assurances", policyNumber: "SN-77501",
    memberId: "M-77501", employer: "Mopti Logistics", coveragePercent: 60, expiryDate: new Date(Date.now() + 200 * 86400000).toISOString().slice(0, 10),
    authorizationNumber: "AUTH-2024-003", claimStatus: "Draft", active: true, createdAt: now, updatedAt: now,
  },
  {
    id: "pol-4", patientId: "p-1005", type: "NHIA", insurerName: "Allianz Africa", policyNumber: "AZ-44121",
    memberId: "M-44121", employer: "Retired", coveragePercent: 50, expiryDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    authorizationNumber: "AUTH-2024-004", claimStatus: "Approved", active: true, createdAt: now, updatedAt: now,
  },
  {
    id: "pol-5", patientId: "p-1006", type: "Private HMO", insurerName: "NSIA", policyNumber: "NS-88202",
    memberId: "M-88202", employer: "Sikasso Foods Ltd", coveragePercent: 75, expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
    authorizationNumber: "AUTH-2024-005", claimStatus: "Paid", active: true, createdAt: now, updatedAt: now,
  },
];

// ============================================================================
// Helper to make invoice lines
// ============================================================================

function makeLine(id: string, desc: string, cat: InvoiceLine["category"], qty: number, price: number, sourceType: InvoiceLine["sourceType"], sourceId?: string, ref?: string): InvoiceLine {
  return { id, description: desc, category: cat, quantity: qty, unitPrice: price, discount: 0, taxRate: 0, sourceType, sourceId, reference: ref };
}

function dayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function dayOffsetDate(days: number): string {
  return dayOffset(days).slice(0, 10);
}

// ============================================================================
// Seed Invoices
// ============================================================================

export const SEED_INVOICES: Invoice[] = [
  {
    id: "inv-1", invoiceNumber: "INV-2025-00001", patientId: "p-1001", clinicianId: "u-doc-1", cashierId: "u-recep-1",
    department: "Consultation", date: dayOffset(-5), dueDate: dayOffset(25),
    lines: [
      makeLine("il-1", "General Consultation — Follow-Up", "Consultation", 1, 50, "Appointment", "ap-1", "Follow-Up"),
      makeLine("il-2", "ECG (12-lead)", "Other Services", 1, 45, "Manual"),
    ],
    discountTotal: 0, taxTotal: 0, subtotal: 95, grandTotal: 95, amountPaid: 95, balance: 0,
    paymentStatus: "Paid", paymentMethod: "Cash", insurancePolicyId: "pol-1", insuranceCovered: 76,
    source: "Appointment", sourceRefId: "ap-1", notes: "Consultation + ECG", createdAt: dayOffset(-5), updatedAt: dayOffset(-5),
  },
  {
    id: "inv-2", invoiceNumber: "INV-2025-00002", patientId: "p-1002", clinicianId: "u-doc-2", cashierId: "u-recep-1",
    department: "Laboratory", date: dayOffset(-3), dueDate: dayOffset(27),
    lines: [
      makeLine("il-3", "Lab: HbA1c", "Laboratory", 1, 35, "Laboratory", "lab-1", "HBA1C"),
      makeLine("il-4", "Lab: Fasting Plasma Glucose", "Laboratory", 1, 15, "Laboratory", "lab-1", "FPG"),
    ],
    discountTotal: 0, taxTotal: 0, subtotal: 50, grandTotal: 50, amountPaid: 35, balance: 15,
    paymentStatus: "Partially-Paid", paymentMethod: "Insurance", insurancePolicyId: "pol-2", insuranceCovered: 35,
    source: "Laboratory", sourceRefId: "lab-1", notes: "Diabetes monitoring labs", createdAt: dayOffset(-3), updatedAt: dayOffset(-3),
  },
  {
    id: "inv-3", invoiceNumber: "INV-2025-00003", patientId: "p-1005", clinicianId: "u-doc-2", cashierId: "u-recep-1",
    department: "Pharmacy", date: dayOffset(-2), dueDate: dayOffset(28),
    lines: [
      makeLine("il-5", "Pharmacy: Salbutamol Inhaler", "Pharmacy", 1, 12, "Pharmacy", "rx-1004", "Salbutamol Inhaler"),
      makeLine("il-6", "Pharmacy: Amlodipine 5mg", "Pharmacy", 30, 0.4, "Pharmacy", "rx-1004", "Amlodipine 5mg"),
    ],
    discountTotal: 0, taxTotal: 0, subtotal: 24, grandTotal: 24, amountPaid: 12, balance: 12,
    paymentStatus: "Partially-Paid", paymentMethod: "Split Payment", insurancePolicyId: "pol-4", insuranceCovered: 12,
    source: "Pharmacy", sourceRefId: "rx-1004", notes: "COPD prescription", createdAt: dayOffset(-2), updatedAt: dayOffset(-2),
  },
  {
    id: "inv-4", invoiceNumber: "INV-2025-00004", patientId: "p-1003", clinicianId: "u-doc-1",
    department: "Consultation", date: dayOffset(-35), dueDate: dayOffset(-5),
    lines: [
      makeLine("il-7", "Specialist Consultation — AFib", "Consultation", 1, 120, "Consultation", "soap-3", "I48"),
    ],
    discountTotal: 0, taxTotal: 0, subtotal: 120, grandTotal: 120, amountPaid: 0, balance: 120,
    paymentStatus: "Overdue", insurancePolicyId: "pol-3", insuranceCovered: 72,
    source: "Consultation", sourceRefId: "soap-3", notes: "AFib consultation — overdue", createdAt: dayOffset(-35), updatedAt: dayOffset(-35),
  },
  {
    id: "inv-5", invoiceNumber: "INV-2025-00005", patientId: "p-1001", clinicianId: "u-doc-1",
    department: "Laboratory", date: dayOffset(-1), dueDate: dayOffset(29),
    lines: [
      makeLine("il-8", "Lab: Lipid Panel", "Laboratory", 1, 40, "Laboratory", "lab-4", "LIPID"),
      makeLine("il-9", "Lab: Electrolytes U&E", "Laboratory", 1, 30, "Laboratory", "lab-4", "ELECTRO"),
    ],
    discountTotal: 0, taxTotal: 0, subtotal: 70, grandTotal: 70, amountPaid: 0, balance: 70,
    paymentStatus: "Unpaid", source: "Laboratory", sourceRefId: "lab-4", notes: "Cardiovascular risk panel", createdAt: dayOffset(-1), updatedAt: dayOffset(-1),
    insuranceCovered: 0,
  },
  {
    id: "inv-6", invoiceNumber: "INV-2025-00006", patientId: "p-1006", clinicianId: "u-doc-2", cashierId: "u-recep-1",
    department: "Consultation", date: dayOffset(0), dueDate: dayOffset(30),
    lines: [
      makeLine("il-10", "General Consultation", "Consultation", 1, 50, "Manual"),
    ],
    discountTotal: 5, taxTotal: 0, subtotal: 50, grandTotal: 45, amountPaid: 45, balance: 0,
    paymentStatus: "Paid", paymentMethod: "Card", insuranceCovered: 0,
    source: "Manual", notes: "Skin rash assessment — 10% discount", createdAt: dayOffset(0), updatedAt: dayOffset(0),
  },
];

// ============================================================================
// Seed Payments
// ============================================================================

export const SEED_PAYMENTS: Payment[] = [
  {
    id: "pay-1", receiptNumber: "RCP-2025-00001", invoiceId: "inv-1", patientId: "p-1001", amountPaid: 95, balanceAfter: 0,
    cashierId: "u-recep-1", cashierName: "Receptionist Mariam Touré", date: dayOffset(-5), method: "Cash",
    reference: "CASH-001", notes: "Full payment at reception", createdAt: dayOffset(-5),
  },
  {
    id: "pay-2", receiptNumber: "RCP-2025-00002", invoiceId: "inv-2", patientId: "p-1002", amountPaid: 35, balanceAfter: 15,
    cashierId: "u-recep-1", cashierName: "Receptionist Mariam Touré", date: dayOffset(-3), method: "Insurance",
    reference: "INS-CLM-001", notes: "Insurance partial payment — NSIA", createdAt: dayOffset(-3),
  },
  {
    id: "pay-3", receiptNumber: "RCP-2025-00003", invoiceId: "inv-3", patientId: "p-1005", amountPaid: 12, balanceAfter: 12,
    cashierId: "u-recep-1", cashierName: "Receptionist Mariam Touré", date: dayOffset(-2), method: "Split Payment",
    reference: "SPLIT-001", notes: "Half cash, half insurance", createdAt: dayOffset(-2),
  },
  {
    id: "pay-4", receiptNumber: "RCP-2025-00004", invoiceId: "inv-6", patientId: "p-1006", amountPaid: 45, balanceAfter: 0,
    cashierId: "u-recep-1", cashierName: "Receptionist Mariam Touré", date: dayOffset(0), method: "Card",
    reference: "CARD-POS-006", notes: "POS card payment", createdAt: dayOffset(0),
  },
];

// ============================================================================
// Seed Insurance Claims
// ============================================================================

export const SEED_CLAIMS: InsuranceClaim[] = [
  {
    id: "clm-1", claimNumber: "CLM-2025-00001", invoiceId: "inv-2", patientId: "p-1002", policyId: "pol-2",
    insurerName: "NSIA", amount: 35, status: "Submitted", submissionDate: dayOffset(-3),
    notes: "Lab charges — diabetes monitoring", documents: ["lab-report.pdf", "invoice.pdf"], createdAt: dayOffset(-3), updatedAt: dayOffset(-3),
  },
  {
    id: "clm-2", claimNumber: "CLM-2025-00002", invoiceId: "inv-3", patientId: "p-1005", policyId: "pol-4",
    insurerName: "Allianz Africa", amount: 12, status: "Under Review", submissionDate: dayOffset(-2),
    notes: "Pharmacy charges — COPD", documents: ["prescription.pdf"], createdAt: dayOffset(-2), updatedAt: dayOffset(-2),
  },
  {
    id: "clm-3", claimNumber: "CLM-2025-00003", invoiceId: "inv-1", patientId: "p-1001", policyId: "pol-1",
    insurerName: "Allianz Africa", amount: 76, status: "Paid", submissionDate: dayOffset(-10),
    reviewDate: dayOffset(-7), paymentDate: dayOffset(-5),
    notes: "Consultation + ECG — fully paid by insurer", documents: ["invoice.pdf", "ecg-report.pdf"], createdAt: dayOffset(-10), updatedAt: dayOffset(-5),
  },
  {
    id: "clm-4", claimNumber: "CLM-2025-00004", invoiceId: "inv-4", patientId: "p-1003", policyId: "pol-3",
    insurerName: "SUNU Assurances", amount: 72, status: "Rejected", submissionDate: dayOffset(-30),
    reviewDate: dayOffset(-20), notes: "Rejected — missing authorization number", documents: [], createdAt: dayOffset(-30), updatedAt: dayOffset(-20),
  },
];

// ============================================================================
// Seed Refunds
// ============================================================================

export const SEED_REFUNDS: Refund[] = [
  {
    id: "rfd-1", refundNumber: "RFD-2025-00001", invoiceId: "inv-6", patientId: "p-1006", amount: 10,
    reason: "Duplicate charge for unused service", status: "Completed", approvedBy: "u-admin", approvedAt: dayOffset(-1),
    processedBy: "u-finance-1", paymentMethod: "Cash", notes: "Approved by admin", createdAt: dayOffset(-1), updatedAt: dayOffset(-1),
  },
];

// ============================================================================
// Seed Billing Notifications (computed at runtime, but seed some)
// ============================================================================

export const SEED_BILLING_NOTIFICATIONS: BillingNotification[] = [];
