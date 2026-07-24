import type {
  ActivityLog,
  Appointment,
  ControlledDrugEntry,
  DispenseRecord,
  InventoryItem,
  LabOrder,
  MedicationHistoryEntry,
  Patient,
  Prescription,
  PurchaseOrder,
  SoapNote,
  StockAlert,
  User,
  Vitals,
} from "./types";

// ============================================================================
// Seed users (local auth)
// ============================================================================

export const SEED_USERS: User[] = [
  { id: "u-admin", name: "Dr. Amadou Diallo", email: "admin@sfhc.org", role: "admin", password: "admin123", avatarColor: "#0d9488" },
  { id: "u-doc-1", name: "Dr. Fatou Sané", email: "fatou@sfhc.org", role: "physician", password: "doc123", avatarColor: "#2563eb" },
  { id: "u-doc-2", name: "Dr. Kwame Mensah", email: "kwame@sfhc.org", role: "physician", password: "doc123", avatarColor: "#0891b2" },
  { id: "u-nurse-1", name: "Nurse Aisha Bello", email: "aisha@sfhc.org", role: "nurse", password: "nurse123", avatarColor: "#7c3aed" },
  { id: "u-pharm-1", name: "Pharm. Chidi Okafor", email: "pharmacy@sfhc.org", role: "pharmacist", password: "pharm123", avatarColor: "#db2777" },
  { id: "u-lab-1", name: "Lab Tech Laila Hassan", email: "lab@sfhc.org", role: "lab_tech", password: "lab123", avatarColor: "#ea580c" },
  { id: "u-recep-1", name: "Receptionist Mariam Touré", email: "reception@sfhc.org", role: "receptionist", password: "recep123", avatarColor: "#16a34a" },
];

export function userName(id: string): string {
  return SEED_USERS.find((u) => u.id === id)?.name ?? "Unknown";
}

// ============================================================================
// Seed patients
// ============================================================================

export const SEED_PATIENTS: Patient[] = [
  {
    id: "p-1001", firstName: "Ibrahim", lastName: "Traoré", dateOfBirth: "1985-03-15", gender: "Male",
    bloodType: "O+", phone: "+223 76 12 34 56", email: "ibrahim.t@example.com", address: "12 Rue des Mangoiers", city: "Bamako",
    emergencyContactName: "Awa Traoré", emergencyContactPhone: "+223 76 98 76 54",
    insuranceProvider: "Allianz Africa", insuranceNumber: "AZ-44120",
    allergies: [{ id: "a-1", substance: "Penicillin", severity: "Severe", reaction: "Anaphylaxis" }],
    chronicConditions: ["Hypertension"], createdAt: "2024-11-10T09:00:00Z", updatedAt: "2025-01-20T11:00:00Z",
  },
  {
    id: "p-1002", firstName: "Sofia", lastName: "Keïta", dateOfBirth: "1992-08-22", gender: "Female",
    bloodType: "A+", phone: "+223 65 22 11 09", email: "sofia.k@example.com", address: "45 Avenue de l'Indépendance", city: "Bamako",
    emergencyContactName: "Modibo Keïta", emergencyContactPhone: "+223 65 88 44 33",
    insuranceProvider: "NSIA", insuranceNumber: "NS-88201",
    allergies: [{ id: "a-2", substance: "NSAIDs", severity: "Moderate", reaction: "Gastric upset" }],
    chronicConditions: ["Type 2 Diabetes"], createdAt: "2024-12-01T10:30:00Z", updatedAt: "2025-02-02T08:00:00Z",
  },
  {
    id: "p-1003", firstName: "Moussa", lastName: "Cissé", dateOfBirth: "1970-01-05", gender: "Male",
    bloodType: "B+", phone: "+223 90 11 22 33", email: "moussa.c@example.com", address: "78 Quartier du Fleuve", city: "Mopti",
    emergencyContactName: "Kadiatou Cissé", emergencyContactPhone: "+223 90 55 66 77",
    insuranceProvider: "SUNU Assurances", insuranceNumber: "SN-77501",
    allergies: [{ id: "a-3", substance: "Sulfonamides", severity: "Severe", reaction: "Skin rash" }],
    chronicConditions: ["Atrial Fibrillation", "Hypertension"], createdAt: "2024-10-05T14:00:00Z", updatedAt: "2025-01-12T10:00:00Z",
  },
  {
    id: "p-1004", firstName: "Aminata", lastName: "Diarra", dateOfBirth: "2001-06-18", gender: "Female",
    bloodType: "AB+", phone: "+223 78 65 43 21", email: "aminata.d@example.com", address: "3 Rue de l'Hôpital", city: "Sikasso",
    emergencyContactName: "Seydou Diarra", emergencyContactPhone: "+223 78 33 22 11",
    insuranceProvider: "None", insuranceNumber: "",
    allergies: [], chronicConditions: [], createdAt: "2025-01-08T08:15:00Z", updatedAt: "2025-02-10T09:30:00Z",
  },
  {
    id: "p-1005", firstName: "Oumar", lastName: "Sidibé", dateOfBirth: "1965-12-30", gender: "Male",
    bloodType: "O-", phone: "+223 77 12 56 90", email: "oumar.s@example.com", address: "22 Avenue de la Paix", city: "Bamako",
    emergencyContactName: "Rokia Sidibé", emergencyContactPhone: "+223 77 90 12 56",
    insuranceProvider: "Allianz Africa", insuranceNumber: "AZ-44121",
    allergies: [{ id: "a-4", substance: "Aspirin", severity: "Moderate", reaction: "Bronchospasm" }],
    chronicConditions: ["COPD", "Type 2 Diabetes", "Hypertension"], createdAt: "2024-09-12T11:45:00Z", updatedAt: "2025-02-12T16:00:00Z",
  },
  {
    id: "p-1006", firstName: "Mariam", lastName: "Konaté", dateOfBirth: "1998-04-09", gender: "Female",
    bloodType: "A-", phone: "+223 76 33 22 11", email: "mariam.k@example.com", address: "5 Rue du Marché", city: "Bamako",
    emergencyContactName: "Salimata Konaté", emergencyContactPhone: "+223 76 11 22 33",
    insuranceProvider: "NSIA", insuranceNumber: "NS-88202",
    allergies: [{ id: "a-5", substance: "Penicillin", severity: "Mild", reaction: "Mild rash" }],
    chronicConditions: [], createdAt: "2025-01-15T09:00:00Z", updatedAt: "2025-02-11T13:00:00Z",
  },
];

// ============================================================================
// Seed appointments
// ============================================================================

const today = new Date();
function dayOffset(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const SEED_APPOINTMENTS: Appointment[] = [
  { id: "ap-1", patientId: "p-1001", clinicianId: "u-doc-1", date: dayOffset(0), time: "09:00", type: "Follow-Up", reason: "Hypertension review", status: "Scheduled", notes: "", createdAt: "2025-02-10T10:00:00Z" },
  { id: "ap-2", patientId: "p-1002", clinicianId: "u-doc-2", date: dayOffset(0), time: "10:30", type: "Consultation", reason: "Glucose management", status: "Checked-In", notes: "", createdAt: "2025-02-10T10:05:00Z" },
  { id: "ap-3", patientId: "p-1003", clinicianId: "u-doc-1", date: dayOffset(0), time: "11:00", type: "Consultation", reason: "AFib medication review", status: "Completed", notes: "", createdAt: "2025-02-09T09:00:00Z" },
  { id: "ap-4", patientId: "p-1005", clinicianId: "u-doc-2", date: dayOffset(1), time: "14:00", type: "Check-Up", reason: "COPD follow-up", status: "Scheduled", notes: "", createdAt: "2025-02-10T11:00:00Z" },
  { id: "ap-5", patientId: "p-1004", clinicianId: "u-doc-1", date: dayOffset(-2), time: "08:30", type: "Vaccination", reason: "Tetanus booster", status: "Completed", notes: "", createdAt: "2025-02-09T08:00:00Z" },
  { id: "ap-6", patientId: "p-1006", clinicianId: "u-doc-2", date: dayOffset(2), time: "15:00", type: "Consultation", reason: "Skin rash assessment", status: "Scheduled", notes: "", createdAt: "2025-02-10T09:30:00Z" },
];

// ============================================================================
// Seed SOAP notes & vitals
// ============================================================================

export const SEED_VITALS: Vitals[] = [
  {
    id: "v-1", patientId: "p-1001", encounterId: "enc-1", temperatureC: 37.0, bloodPressureSystolic: 152, bloodPressureDiastolic: 95,
    heartRate: 82, respiratoryRate: 18, oxygenSaturation: 98, weightKg: 78, heightCm: 175,
    recordedBy: "u-nurse-1", recordedAt: "2025-02-10T08:50:00Z",
  },
  {
    id: "v-2", patientId: "p-1002", encounterId: "enc-2", temperatureC: 36.8, bloodPressureSystolic: 128, bloodPressureDiastolic: 80,
    heartRate: 76, respiratoryRate: 16, oxygenSaturation: 99, weightKg: 69, heightCm: 162,
    recordedBy: "u-nurse-1", recordedAt: "2025-02-10T10:25:00Z",
  },
  {
    id: "v-3", patientId: "p-1003", encounterId: "enc-3", temperatureC: 36.9, bloodPressureSystolic: 138, bloodPressureDiastolic: 88,
    heartRate: 92, respiratoryRate: 20, oxygenSaturation: 96, weightKg: 82, heightCm: 170,
    recordedBy: "u-nurse-1", recordedAt: "2025-02-10T10:50:00Z",
  },
  {
    id: "v-4", patientId: "p-1005", encounterId: "enc-4", temperatureC: 37.4, bloodPressureSystolic: 146, bloodPressureDiastolic: 90,
    heartRate: 88, respiratoryRate: 22, oxygenSaturation: 93, weightKg: 71, heightCm: 168,
    recordedBy: "u-nurse-1", recordedAt: "2025-02-09T08:20:00Z",
  },
];

export const SEED_SOAP_NOTES: SoapNote[] = [
  {
    id: "soap-1", patientId: "p-1001", clinicianId: "u-doc-1", encounterDate: "2025-02-10", type: "Progress",
    subjective: "Patient reports intermittent headaches in the morning, occasional dizziness on standing. Compliance with amlodipine is good.",
    objective: "BP 152/95. HR 82. No peripheral oedema. Heart sounds normal.",
    assessment: "Sub-optimally controlled hypertension. Morning headaches likely related to elevated BP.",
    plan: "Increase Amlodipine to 10mg daily. Recheck BP in 2 weeks. Lifestyle advice reinforced.",
    diagnosis: "Essential Hypertension", diagnosisCode: "I10", vitalsId: "v-1", createdAt: "2025-02-10T09:30:00Z",
  },
  {
    id: "soap-2", patientId: "p-1002", clinicianId: "u-doc-2", encounterDate: "2025-02-10", type: "Progress",
    subjective: "Reports increased thirst and nocturia. Diet adherence fair.",
    objective: "BP 128/80. Weight stable. Random glucose 11.2 mmol/L.",
    assessment: "Type 2 Diabetes — sub-optimal control on metformin alone.",
    plan: "Continue Metformin 1g BID. Add Glipizide 5mg OD. Refer to diabetic educator. Fasting glucose in 1 month.",
    diagnosis: "Type 2 Diabetes Mellitus", diagnosisCode: "E11", vitalsId: "v-2", createdAt: "2025-02-10T10:45:00Z",
  },
  {
    id: "soap-3", patientId: "p-1003", clinicianId: "u-doc-1", encounterDate: "2025-02-10", type: "Progress",
    subjective: "Palpitations less frequent. No chest pain. No syncope.",
    objective: "BP 138/88. Irregular pulse 92. No signs of heart failure.",
    assessment: "Atrial fibrillation — rate controlled. On warfarin — INR in range last check.",
    plan: "Continue Warfarin 5mg OD. INR check in 1 week. Continue Digoxin 0.25mg OD.",
    diagnosis: "Atrial Fibrillation", diagnosisCode: "I48", vitalsId: "v-3", createdAt: "2025-02-10T11:15:00Z",
  },
  {
    id: "soap-4", patientId: "p-1005", clinicianId: "u-doc-2", encounterDate: "2025-02-09", type: "Progress",
    subjective: "Progressive exertional dyspnoea, chronic cough with scanty sputum. Uses salbutamol 3-4x/day.",
    objective: "BP 146/90. SpO2 93% on room air. Wheeze bilaterally. HR 88.",
    assessment: "COPD exacerbation — moderate. Sub-optimally controlled hypertension.",
    plan: "Salbutamol PRN, add Beclomethasone inhaler BID. Continue Metformin. Adjust Amlodipine to 10mg OD. Chest X-ray ordered.",
    diagnosis: "COPD with acute exacerbation", diagnosisCode: "J44.1", vitalsId: "v-4", createdAt: "2025-02-09T09:00:00Z",
  },
];

// ============================================================================
// Seed lab orders
// ============================================================================

export const SEED_LAB_ORDERS: LabOrder[] = [
  {
    id: "lab-1", patientId: "p-1002", clinicianId: "u-doc-2", priority: "Routine", status: "Completed",
    specimen: "Blood", clinicalIndication: "Diabetes monitoring — HbA1c",
    tests: [
      { id: "t-1", testCode: "HBA1C", testName: "HbA1c", category: "Biochemistry", specimen: "Blood", result: "8.4", unit: "%", referenceRange: "< 5.7", flag: "Abnormal", notes: "Poor control" },
      { id: "t-2", testCode: "FPG", testName: "Fasting Plasma Glucose", category: "Biochemistry", specimen: "Blood", result: "9.1", unit: "mmol/L", referenceRange: "3.9-6.1", flag: "Abnormal", notes: "" },
    ],
    orderedAt: "2025-02-08T10:00:00Z", collectedAt: "2025-02-08T11:00:00Z", completedAt: "2025-02-09T07:30:00Z",
    labTechId: "u-lab-1", notes: "Sample haemolysis minimal.",
  },
  {
    id: "lab-2", patientId: "p-1003", clinicianId: "u-doc-1", priority: "Routine", status: "In-Progress",
    specimen: "Blood", clinicalIndication: "INR monitoring on warfarin",
    tests: [
      { id: "t-3", testCode: "INR", testName: "INR / PT", category: "Coagulation", specimen: "Blood", result: "", unit: "INR", referenceRange: "2.0-3.0", flag: "Pending", notes: "" },
    ],
    orderedAt: "2025-02-10T11:30:00Z", collectedAt: "2025-02-10T13:00:00Z", labTechId: "u-lab-1", notes: "",
  },
  {
    id: "lab-3", patientId: "p-1005", clinicianId: "u-doc-2", priority: "Urgent", status: "Sample-Collected",
    specimen: "Blood", clinicalIndication: "COPD exacerbation workup",
    tests: [
      { id: "t-4", testCode: "CBC", testName: "Full Blood Count", category: "Haematology", specimen: "Blood", result: "", unit: "", referenceRange: "Multiple", flag: "Pending", notes: "" },
      { id: "t-5", testCode: "CXR", testName: "Chest X-Ray", category: "Radiology", specimen: "Other", result: "", unit: "", referenceRange: "N/A", flag: "Pending", notes: "Awaiting read" },
    ],
    orderedAt: "2025-02-09T09:30:00Z", collectedAt: "2025-02-09T10:30:00Z", labTechId: "u-lab-1", notes: "",
  },
  {
    id: "lab-4", patientId: "p-1001", clinicianId: "u-doc-1", priority: "Routine", status: "Ordered",
    specimen: "Blood", clinicalIndication: "Annual cardiovascular risk check",
    tests: [
      { id: "t-6", testCode: "LIPID", testName: "Lipid Panel", category: "Biochemistry", specimen: "Blood", result: "", unit: "mmol/L", referenceRange: "Multiple", flag: "Pending", notes: "" },
      { id: "t-7", testCode: "ELECTRO", testName: "Electrolytes U&E", category: "Biochemistry", specimen: "Blood", result: "", unit: "mmol/L", referenceRange: "Multiple", flag: "Pending", notes: "" },
    ],
    orderedAt: "2025-02-10T09:35:00Z", notes: "",
  },
];

// ============================================================================
// Seed inventory
// ============================================================================

function expiryOffset(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
function expiryOffsetPast(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export const SEED_INVENTORY: InventoryItem[] = [
  { id: "inv-1", drugName: "Amoxicillin 500mg", medicationId: "med-amox", category: "Antibiotic", batchNumber: "AMX-2401", manufacturer: "GlobalPharma", expiryDate: expiryOffset(14), quantity: 420, minimumStock: 100, reorderLevel: 150, unitCost: 0.4, supplier: "Pharma Distributors", location: "A1-01", controlled: false, createdAt: "2024-12-01T10:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-2", drugName: "Paracetamol 500mg", medicationId: "med-para", category: "Analgesic", batchNumber: "PAR-2398", manufacturer: "CareWell", expiryDate: expiryOffset(24), quantity: 1850, minimumStock: 200, reorderLevel: 300, unitCost: 0.1, supplier: "CareWell Direct", location: "A2-04", controlled: false, createdAt: "2024-11-15T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-3", drugName: "Ibuprofen 400mg", medicationId: "med-ibup", category: "Analgesic", batchNumber: "IBU-2311", manufacturer: "CareWell", expiryDate: expiryOffset(8), quantity: 65, minimumStock: 100, reorderLevel: 150, unitCost: 0.15, supplier: "CareWell Direct", location: "A2-05", controlled: false, createdAt: "2024-10-20T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-4", drugName: "Amlodipine 5mg", medicationId: "med-amlod", category: "Antihypertensive", batchNumber: "AML-2403", manufacturer: "CardioCare", expiryDate: expiryOffset(18), quantity: 320, minimumStock: 80, reorderLevel: 120, unitCost: 0.2, supplier: "CardioCare Supplies", location: "B1-02", controlled: false, createdAt: "2024-12-10T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-5", drugName: "Lisinopril 10mg", medicationId: "med-lis", category: "Antihypertensive", batchNumber: "LIS-2402", manufacturer: "CardioCare", expiryDate: expiryOffset(10), quantity: 240, minimumStock: 80, reorderLevel: 120, unitCost: 0.25, supplier: "CardioCare Supplies", location: "B1-03", controlled: false, createdAt: "2024-11-22T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-6", drugName: "Metformin 500mg", medicationId: "med-met", category: "Antidiabetic", batchNumber: "MET-2398", manufacturer: "GlucoMed", expiryDate: expiryOffset(20), quantity: 480, minimumStock: 100, reorderLevel: 150, unitCost: 0.2, supplier: "GlucoMed Direct", location: "C1-01", controlled: false, createdAt: "2024-12-05T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-7", drugName: "Warfarin 5mg", medicationId: "med-warf", category: "Cardiac", batchNumber: "WAR-2390", manufacturer: "CardioCare", expiryDate: expiryOffset(1), quantity: 90, minimumStock: 50, reorderLevel: 80, unitCost: 0.4, supplier: "CardioCare Supplies", location: "B2-01", controlled: false, createdAt: "2024-09-15T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-8", drugName: "Salbutamol Inhaler", medicationId: "med-salb", category: "Respiratory", batchNumber: "SAL-2401", manufacturer: "RespCare", expiryDate: expiryOffset(16), quantity: 28, minimumStock: 20, reorderLevel: 30, unitCost: 6.0, supplier: "RespCare Direct", location: "D1-01", controlled: false, createdAt: "2024-12-15T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-9", drugName: "Morphine 10mg/mL", medicationId: "med-morph", category: "Analgesic", batchNumber: "MOR-2401", manufacturer: "BioGenix", expiryDate: expiryOffset(12), quantity: 40, minimumStock: 20, reorderLevel: 30, unitCost: 3.0, supplier: "BioGenix", location: "Vault-A1", controlled: true, createdAt: "2024-12-20T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-10", drugName: "Tramadol 50mg", medicationId: "med-tram", category: "Analgesic", batchNumber: "TRA-2395", manufacturer: "BioGenix", expiryDate: expiryOffset(6), quantity: 0, minimumStock: 50, reorderLevel: 80, unitCost: 0.5, supplier: "BioGenix", location: "A2-08", controlled: true, createdAt: "2024-10-10T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-11", drugName: "Ciprofloxacin 500mg", medicationId: "med-cipro", category: "Antibiotic", batchNumber: "CIP-2388", manufacturer: "MedLine", expiryDate: expiryOffset(3), quantity: 180, minimumStock: 80, reorderLevel: 120, unitCost: 0.6, supplier: "MedLine", location: "A1-03", controlled: false, createdAt: "2024-11-05T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-12", drugName: "Diclofenac 50mg", medicationId: "med-diclo", category: "Analgesic", batchNumber: "DIC-2377", manufacturer: "MedLine", expiryDate: expiryOffsetPast(2), quantity: 60, minimumStock: 60, reorderLevel: 100, unitCost: 0.2, supplier: "MedLine", location: "A2-06", controlled: false, createdAt: "2024-09-01T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-13", drugName: "Artemether-Lumefantrine", medicationId: "med-artem", category: "Antimalarial", batchNumber: "ART-2401", manufacturer: "TropiMed", expiryDate: expiryOffset(9), quantity: 240, minimumStock: 80, reorderLevel: 120, unitCost: 1.2, supplier: "TropiMed Direct", location: "E1-01", controlled: false, createdAt: "2024-12-22T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-14", drugName: "Atorvastatin 20mg", medicationId: "med-atorv", category: "Cardiac", batchNumber: "ATR-2402", manufacturer: "CardioCare", expiryDate: expiryOffset(22), quantity: 200, minimumStock: 60, reorderLevel: 100, unitCost: 0.3, supplier: "CardioCare Supplies", location: "B2-03", controlled: false, createdAt: "2024-12-28T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
  { id: "inv-15", drugName: "Omeprazole 20mg", medicationId: "med-omep", category: "Gastrointestinal", batchNumber: "OME-2398", manufacturer: "GastroMed", expiryDate: expiryOffset(15), quantity: 150, minimumStock: 60, reorderLevel: 90, unitCost: 0.3, supplier: "GastroMed Direct", location: "F1-01", controlled: false, createdAt: "2024-12-18T09:00:00Z", updatedAt: "2025-02-10T10:00:00Z" },
];

// ============================================================================
// Seed prescriptions
// ============================================================================

export const SEED_PRESCRIPTIONS: Prescription[] = [
  {
    id: "rx-1001", patientId: "p-1001", clinicianId: "u-doc-1", soapNoteId: "soap-1", date: "2025-02-10", diagnosis: "Essential Hypertension",
    lines: [
      { id: "rxl-1", medicationId: "med-amlod", medicationName: "Amlodipine 5mg", dose: "10mg", route: "Oral", frequency: "OD", duration: "30 days", quantity: 30, refills: 1, instructions: "Take in the morning. Avoid grapefruit." },
    ],
    status: "Pending", notes: "Increase dose from 5mg.", createdAt: "2025-02-10T09:35:00Z",
  },
  {
    id: "rx-1002", patientId: "p-1002", clinicianId: "u-doc-2", soapNoteId: "soap-2", date: "2025-02-10", diagnosis: "Type 2 Diabetes Mellitus",
    lines: [
      { id: "rxl-2", medicationId: "med-met", medicationName: "Metformin 500mg", dose: "1g", route: "Oral", frequency: "BID", duration: "30 days", quantity: 60, refills: 3, instructions: "Take with meals." },
      { id: "rxl-3", medicationId: "med-glip", medicationName: "Glipizide 5mg", dose: "5mg", route: "Oral", frequency: "OD", duration: "30 days", quantity: 30, refills: 2, instructions: "Take before breakfast." },
    ],
    status: "Reviewed", notes: "Reviewed by pharmacist.", createdAt: "2025-02-10T10:50:00Z", reviewedAt: "2025-02-10T12:00:00Z",
  },
  {
    id: "rx-1003", patientId: "p-1003", clinicianId: "u-doc-1", soapNoteId: "soap-3", date: "2025-02-10", diagnosis: "Atrial Fibrillation",
    lines: [
      { id: "rxl-4", medicationId: "med-warf", medicationName: "Warfarin 5mg", dose: "5mg", route: "Oral", frequency: "OD", duration: "30 days", quantity: 30, refills: 1, instructions: "Take at same time daily. INR weekly." },
      { id: "rxl-5", medicationId: "med-dig", medicationName: "Digoxin 0.25mg", dose: "0.25mg", route: "Oral", frequency: "OD", duration: "30 days", quantity: 30, refills: 1, instructions: "Monitor pulse daily." },
    ],
    status: "Pending", notes: "Patient on warfarin — check INR.", createdAt: "2025-02-10T11:20:00Z",
  },
  {
    id: "rx-1004", patientId: "p-1005", clinicianId: "u-doc-2", soapNoteId: "soap-4", date: "2025-02-09", diagnosis: "COPD with acute exacerbation",
    lines: [
      { id: "rxl-6", medicationId: "med-salb", medicationName: "Salbutamol Inhaler", dose: "2 puffs", route: "Inhalation", frequency: "PRN", duration: "30 days", quantity: 1, refills: 1, instructions: "Use up to 4x daily as needed for breathlessness." },
      { id: "rxl-7", medicationId: "med-becl", medicationName: "Beclomethasone Inhaler", dose: "2 puffs", route: "Inhalation", frequency: "BID", duration: "30 days", quantity: 1, refills: 2, instructions: "Rinse mouth after use." },
      { id: "rxl-8", medicationId: "med-amlod", medicationName: "Amlodipine 5mg", dose: "10mg", route: "Oral", frequency: "OD", duration: "30 days", quantity: 30, refills: 1, instructions: "For hypertension." },
    ],
    status: "Dispensed", notes: "All medications dispensed.", createdAt: "2025-02-09T09:15:00Z", reviewedAt: "2025-02-09T10:00:00Z", dispensedAt: "2025-02-09T14:30:00Z", pharmacistId: "u-pharm-1",
  },
];

// ============================================================================
// Seed dispense records
// ============================================================================

export const SEED_DISPENSES: DispenseRecord[] = [
  {
    id: "dsp-1", prescriptionId: "rx-1004", patientId: "p-1005", pharmacistId: "u-pharm-1",
    medicationId: "med-salb", medicationName: "Salbutamol Inhaler", quantityDispensed: 1, remainingQuantity: 27,
    date: "2025-02-09", time: "14:30",
    steps: [
      { stage: "Received", actorId: "u-pharm-1", actorName: "Pharm. Chidi Okafor", at: "2025-02-09T10:30:00Z", notes: "Prescription received" },
      { stage: "Prepared", actorId: "u-pharm-1", actorName: "Pharm. Chidi Okafor", at: "2025-02-09T13:45:00Z", notes: "Verified against chart" },
      { stage: "Verified", actorId: "u-pharm-1", actorName: "Pharm. Chidi Okafor", at: "2025-02-09T14:00:00Z", notes: "Counselled patient" },
      { stage: "Dispensed", actorId: "u-pharm-1", actorName: "Pharm. Chidi Okafor", at: "2025-02-09T14:30:00Z", notes: "" },
      { stage: "Completed", actorId: "u-pharm-1", actorName: "Pharm. Chidi Okafor", at: "2025-02-09T14:35:00Z", notes: "" },
    ],
    notes: "Patient counselled on inhaler technique.", createdAt: "2025-02-09T14:35:00Z",
  },
];

// ============================================================================
// Seed controlled drug register entries
// ============================================================================

export const SEED_CONTROLLED_ENTRIES: ControlledDrugEntry[] = [
  { id: "cd-1", drugName: "Morphine 10mg/mL", medicationId: "med-morph", schedule: "Schedule II", transactionType: "Received", quantity: 50, runningBalance: 50, prescriberId: "u-admin", prescriberName: "Dr. Amadou Diallo", pharmacistId: "u-pharm-1", pharmacistName: "Pharm. Chidi Okafor", patientId: "", patientName: "— Stock Receipt —", date: "2024-12-20", reference: "PO-2024-1220", notes: "Opening stock" },
  { id: "cd-2", drugName: "Morphine 10mg/mL", medicationId: "med-morph", schedule: "Schedule II", transactionType: "Dispensed", quantity: 10, runningBalance: 40, prescriberId: "u-doc-2", prescriberName: "Dr. Kwame Mensah", pharmacistId: "u-pharm-1", pharmacistName: "Pharm. Chidi Okafor", patientId: "p-1005", patientName: "Oumar Sidibé", date: "2025-01-18", reference: "rx-emergency-001", notes: "Severe pain — post-op" },
  { id: "cd-3", drugName: "Tramadol 50mg", medicationId: "med-tram", schedule: "Schedule IV", transactionType: "Received", quantity: 200, runningBalance: 200, prescriberId: "u-admin", prescriberName: "Dr. Amadou Diallo", pharmacistId: "u-pharm-1", pharmacistName: "Pharm. Chidi Okafor", patientId: "", patientName: "— Stock Receipt —", date: "2024-10-10", reference: "PO-2024-1010", notes: "Opening stock" },
  { id: "cd-4", drugName: "Tramadol 50mg", medicationId: "med-tram", schedule: "Schedule IV", transactionType: "Dispensed", quantity: 200, runningBalance: 0, prescriberId: "u-doc-1", prescriberName: "Dr. Fatou Sané", pharmacistId: "u-pharm-1", pharmacistName: "Pharm. Chidi Okafor", patientId: "p-1001", patientName: "Ibrahim Traoré", date: "2025-01-25", reference: "rx-0987", notes: "Trauma pain" },
];

// ============================================================================
// Seed purchase orders
// ============================================================================

export const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "po-1", supplier: "CardioCare Supplies", status: "Received", orderDate: "2024-12-28", expectedDate: "2025-01-05", receivedDate: "2025-01-04",
    lines: [
      { id: "pol-1", medicationId: "med-amlod", drugName: "Amlodipine 5mg", quantity: 500, unitCost: 0.2, receivedQuantity: 500 },
      { id: "pol-2", medicationId: "med-atorv", drugName: "Atorvastatin 20mg", quantity: 300, unitCost: 0.3, receivedQuantity: 300 },
    ],
    total: 190, notes: "Standard restock", createdBy: "u-pharm-1", createdAt: "2024-12-28T10:00:00Z",
  },
  {
    id: "po-2", supplier: "BioGenix", status: "Submitted", orderDate: "2025-02-10", expectedDate: "2025-02-18",
    lines: [
      { id: "pol-3", medicationId: "med-tram", drugName: "Tramadol 50mg", quantity: 300, unitCost: 0.5, receivedQuantity: 0 },
      { id: "pol-4", medicationId: "med-morph", drugName: "Morphine 10mg/mL", quantity: 30, unitCost: 3.0, receivedQuantity: 0 },
    ],
    total: 240, notes: "Controlled substance restock — requires sign-off", createdBy: "u-pharm-1", createdAt: "2025-02-10T11:00:00Z",
  },
];

// ============================================================================
// Seed stock alerts
// ============================================================================

export const SEED_STOCK_ALERTS: StockAlert[] = [];

// ============================================================================
// Seed activity log
// ============================================================================

export const SEED_ACTIVITY: ActivityLog[] = [
  { id: "act-1", kind: "dispense", title: "Medication dispensed", description: "Salbutamol Inhaler dispensed for Oumar Sidibé", actorId: "u-pharm-1", actorName: "Pharm. Chidi Okafor", at: "2025-02-09T14:35:00Z" },
  { id: "act-2", kind: "prescription", title: "Prescription created", description: "rx-1003 for Moussa Cissé — Atrial Fibrillation", actorId: "u-doc-1", actorName: "Dr. Fatou Sané", at: "2025-02-10T11:20:00Z" },
  { id: "act-3", kind: "purchase", title: "Purchase order submitted", description: "po-2 to BioGenix — controlled substances", actorId: "u-pharm-1", actorName: "Pharm. Chidi Okafor", at: "2025-02-10T11:00:00Z" },
  { id: "act-4", kind: "inventory", title: "Stock low", description: "Ibuprofen 400mg below reorder level", actorId: "system", actorName: "System", at: "2025-02-10T08:00:00Z" },
];

// ============================================================================
// Seed medication history (per patient)
// ============================================================================

export const SEED_MEDICATION_HISTORY: MedicationHistoryEntry[] = [
  { id: "mh-1", patientId: "p-1005", prescriptionId: "rx-1004", dispenseId: "dsp-1", medicationName: "Salbutamol Inhaler", eventType: "Dispensed", date: "2025-02-09", actorName: "Pharm. Chidi Okafor", details: "2 puffs PRN — 30 days" },
  { id: "mh-2", patientId: "p-1005", prescriptionId: "rx-1004", medicationName: "Beclomethasone Inhaler", eventType: "Dispensed", date: "2025-02-09", actorName: "Pharm. Chidi Okafor", details: "2 puffs BID — 30 days" },
  { id: "mh-3", patientId: "p-1005", prescriptionId: "rx-1004", medicationName: "Amlodipine 5mg", eventType: "Dispensed", date: "2025-02-09", actorName: "Pharm. Chidi Okafor", details: "10mg OD — 30 days" },
  { id: "mh-4", patientId: "p-1001", prescriptionId: "rx-1001", medicationName: "Amlodipine 5mg", eventType: "Prescribed", date: "2025-02-10", actorName: "Dr. Fatou Sané", details: "10mg OD — 30 days — Pending" },
  { id: "mh-5", patientId: "p-1003", prescriptionId: "rx-1003", medicationName: "Warfarin 5mg", eventType: "Prescribed", date: "2025-02-10", actorName: "Dr. Fatou Sané", details: "5mg OD — 30 days — Pending" },
  { id: "mh-6", patientId: "p-1003", prescriptionId: "rx-1003", medicationName: "Digoxin 0.25mg", eventType: "Prescribed", date: "2025-02-10", actorName: "Dr. Fatou Sané", details: "0.25mg OD — 30 days — Pending" },
];
