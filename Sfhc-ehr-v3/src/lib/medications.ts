import type { DrugInteraction, MedicationCatalogEntry } from "./types";

// ============================================================================
// Realistic medication catalogue
// ============================================================================

export const MEDICATION_CATALOG: MedicationCatalogEntry[] = [
  // Antibiotics
  { id: "med-amox", name: "Amoxicillin", genericName: "Amoxicillin", category: "Antibiotic", form: "Capsule", strength: "500mg", unit: "capsule", controlled: false, manufacturer: "GlobalPharma", defaultDose: "500mg", defaultRoute: "Oral", defaultFrequency: "TID", commonAllergies: ["Penicillin"], typicalCost: 0.4 },
  { id: "med-cipro", name: "Ciprofloxacin", genericName: "Ciprofloxacin", category: "Antibiotic", form: "Tablet", strength: "500mg", unit: "tablet", controlled: false, manufacturer: "MedLine", defaultDose: "500mg", defaultRoute: "Oral", defaultFrequency: "BID", commonAllergies: ["Fluoroquinolones"], typicalCost: 0.6 },
  { id: "med-azith", name: "Azithromycin", genericName: "Azithromycin", category: "Antibiotic", form: "Tablet", strength: "250mg", unit: "tablet", controlled: false, manufacturer: "GlobalPharma", defaultDose: "250mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: ["Macrolides"], typicalCost: 0.7 },
  { id: "med-ceft", name: "Ceftriaxone", genericName: "Ceftriaxone", category: "Antibiotic", form: "Vial", strength: "1g", unit: "vial", controlled: false, manufacturer: "BioGenix", defaultDose: "1g", defaultRoute: "IV", defaultFrequency: "OD", commonAllergies: ["Cephalosporins", "Penicillin"], typicalCost: 2.5 },
  { id: "med-metro", name: "Metronidazole", genericName: "Metronidazole", category: "Antibiotic", form: "Tablet", strength: "400mg", unit: "tablet", controlled: false, manufacturer: "MedLine", defaultDose: "400mg", defaultRoute: "Oral", defaultFrequency: "TID", commonAllergies: [], typicalCost: 0.3 },

  // Analgesics
  { id: "med-para", name: "Paracetamol", genericName: "Acetaminophen", category: "Analgesic", form: "Tablet", strength: "500mg", unit: "tablet", controlled: false, manufacturer: "CareWell", defaultDose: "1g", defaultRoute: "Oral", defaultFrequency: "QID", commonAllergies: [], typicalCost: 0.1 },
  { id: "med-ibup", name: "Ibuprofen", genericName: "Ibuprofen", category: "Analgesic", form: "Tablet", strength: "400mg", unit: "tablet", controlled: false, manufacturer: "CareWell", defaultDose: "400mg", defaultRoute: "Oral", defaultFrequency: "TID", commonAllergies: ["NSAIDs"], typicalCost: 0.15 },
  { id: "med-diclo", name: "Diclofenac", genericName: "Diclofenac", category: "Analgesic", form: "Tablet", strength: "50mg", unit: "tablet", controlled: false, manufacturer: "MedLine", defaultDose: "50mg", defaultRoute: "Oral", defaultFrequency: "BID", commonAllergies: ["NSAIDs"], typicalCost: 0.2 },
  { id: "med-tram", name: "Tramadol", genericName: "Tramadol", category: "Analgesic", form: "Capsule", strength: "50mg", unit: "capsule", controlled: true, schedule: "Schedule IV", manufacturer: "BioGenix", defaultDose: "50mg", defaultRoute: "Oral", defaultFrequency: "QID", commonAllergies: ["Opioids"], typicalCost: 0.5 },
  { id: "med-morph", name: "Morphine", genericName: "Morphine Sulfate", category: "Analgesic", form: "Ampule", strength: "10mg/mL", unit: "ampule", controlled: true, schedule: "Schedule II", manufacturer: "BioGenix", defaultDose: "10mg", defaultRoute: "IM", defaultFrequency: "PRN", commonAllergies: ["Opioids"], typicalCost: 3.0 },

  // Antihypertensives
  { id: "med-amlod", name: "Amlodipine", genericName: "Amlodipine", category: "Antihypertensive", form: "Tablet", strength: "5mg", unit: "tablet", controlled: false, manufacturer: "CardioCare", defaultDose: "5mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: [], typicalCost: 0.2 },
  { id: "med-lis", name: "Lisinopril", genericName: "Lisinopril", category: "Antihypertensive", form: "Tablet", strength: "10mg", unit: "tablet", controlled: false, manufacturer: "CardioCare", defaultDose: "10mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: ["ACE-inhibitors"], typicalCost: 0.25 },
  { id: "med-los", name: "Losartan", genericName: "Losartan", category: "Antihypertensive", form: "Tablet", strength: "50mg", unit: "tablet", controlled: false, manufacturer: "CardioCare", defaultDose: "50mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: [], typicalCost: 0.3 },
  { id: "med-hctz", name: "Hydrochlorothiazide", genericName: "Hydrochlorothiazide", category: "Antihypertensive", form: "Tablet", strength: "25mg", unit: "tablet", controlled: false, manufacturer: "CardioCare", defaultDose: "25mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: ["Sulfonamides"], typicalCost: 0.2 },

  // Antidiabetics
  { id: "med-met", name: "Metformin", genericName: "Metformin", category: "Antidiabetic", form: "Tablet", strength: "500mg", unit: "tablet", controlled: false, manufacturer: "GlucoMed", defaultDose: "500mg", defaultRoute: "Oral", defaultFrequency: "BID", commonAllergies: [], typicalCost: 0.2 },
  { id: "med-ins", name: "Insulin (Regular)", genericName: "Insulin", category: "Antidiabetic", form: "Vial", strength: "100IU/mL", unit: "vial", controlled: false, manufacturer: "GlucoMed", defaultDose: "10 IU", defaultRoute: "Subcutaneous", defaultFrequency: "TID", commonAllergies: [], typicalCost: 12.0 },
  { id: "med-glip", name: "Glipizide", genericName: "Glipizide", category: "Antidiabetic", form: "Tablet", strength: "5mg", unit: "tablet", controlled: false, manufacturer: "GlucoMed", defaultDose: "5mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: ["Sulfonamides"], typicalCost: 0.25 },

  // Antimalarials
  { id: "med-artem", name: "Artemether-Lumefantrine", genericName: "Artemether/Lumefantrine", category: "Antimalarial", form: "Tablet", strength: "20/120mg", unit: "tablet", controlled: false, manufacturer: "TropiMed", defaultDose: "4 tablets", defaultRoute: "Oral", defaultFrequency: "BID", commonAllergies: [], typicalCost: 1.2 },
  { id: "med-chlor", name: "Chloroquine", genericName: "Chloroquine Phosphate", category: "Antimalarial", form: "Tablet", strength: "250mg", unit: "tablet", controlled: false, manufacturer: "TropiMed", defaultDose: "500mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: [], typicalCost: 0.3 },

  // Cardiac
  { id: "med-warf", name: "Warfarin", genericName: "Warfarin", category: "Cardiac", form: "Tablet", strength: "5mg", unit: "tablet", controlled: false, manufacturer: "CardioCare", defaultDose: "5mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: [], typicalCost: 0.4 },
  { id: "med-asa", name: "Aspirin", genericName: "Acetylsalicylic Acid", category: "Cardiac", form: "Tablet", strength: "75mg", unit: "tablet", controlled: false, manufacturer: "CareWell", defaultDose: "75mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: ["NSAIDs", "Salicylates"], typicalCost: 0.05 },
  { id: "med-atorv", name: "Atorvastatin", genericName: "Atorvastatin", category: "Cardiac", form: "Tablet", strength: "20mg", unit: "tablet", controlled: false, manufacturer: "CardioCare", defaultDose: "20mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: [], typicalCost: 0.3 },
  { id: "med-dig", name: "Digoxin", genericName: "Digoxin", category: "Cardiac", form: "Tablet", strength: "0.25mg", unit: "tablet", controlled: false, manufacturer: "CardioCare", defaultDose: "0.25mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: [], typicalCost: 0.4 },

  // Respiratory
  { id: "med-salb", name: "Salbutamol", genericName: "Salbutamol", category: "Respiratory", form: "Inhaler", strength: "100mcg", unit: "puff", controlled: false, manufacturer: "RespCare", defaultDose: "2 puffs", defaultRoute: "Inhalation", defaultFrequency: "PRN", commonAllergies: [], typicalCost: 6.0 },
  { id: "med-becl", name: "Beclomethasone", genericName: "Beclomethasone", category: "Respiratory", form: "Inhaler", strength: "250mcg", unit: "puff", controlled: false, manufacturer: "RespCare", defaultDose: "2 puffs", defaultRoute: "Inhalation", defaultFrequency: "BID", commonAllergies: [], typicalCost: 8.0 },

  // Gastrointestinal
  { id: "med-omep", name: "Omeprazole", genericName: "Omeprazole", category: "Gastrointestinal", form: "Capsule", strength: "20mg", unit: "capsule", controlled: false, manufacturer: "GastroMed", defaultDose: "20mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: [], typicalCost: 0.3 },
  { id: "med-lora", name: "Loperamide", genericName: "Loperamide", category: "Gastrointestinal", form: "Tablet", strength: "2mg", unit: "tablet", controlled: false, manufacturer: "GastroMed", defaultDose: "4mg", defaultRoute: "Oral", defaultFrequency: "PRN", commonAllergies: [], typicalCost: 0.2 },

  // Vitamins
  { id: "med-iron", name: "Ferrous Sulfate", genericName: "Iron", category: "Vitamin", form: "Tablet", strength: "325mg", unit: "tablet", controlled: false, manufacturer: "NutriCare", defaultDose: "325mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: [], typicalCost: 0.1 },
  { id: "med-folic", name: "Folic Acid", genericName: "Folic Acid", category: "Vitamin", form: "Tablet", strength: "5mg", unit: "tablet", controlled: false, manufacturer: "NutriCare", defaultDose: "5mg", defaultRoute: "Oral", defaultFrequency: "OD", commonAllergies: [], typicalCost: 0.08 },
];

export const MED_CATALOG: MedicationCatalogEntry[] = MEDICATION_CATALOG;

export const MED_CATEGORIES: { value: string; label: string }[] = [
  { value: "Antibiotic", label: "Antibiotics" },
  { value: "Analgesic", label: "Analgesics" },
  { value: "Antihypertensive", label: "Antihypertensives" },
  { value: "Antidiabetic", label: "Antidiabetics" },
  { value: "Antimalarial", label: "Antimalarials" },
  { value: "Cardiac", label: "Cardiac" },
  { value: "Respiratory", label: "Respiratory" },
  { value: "Gastrointestinal", label: "Gastrointestinal" },
  { value: "Vitamin", label: "Vitamins" },
];

export function findMed(id: string): MedicationCatalogEntry | undefined {
  return MEDICATION_CATALOG.find((m) => m.id === id);
}

export const FREQUENCY_OPTIONS = ["OD", "BID", "TID", "QID", "PRN", "Q4H", "Q6H", "Q8H", "Q12H", "STAT", "Weekly"];

export const ROUTE_OPTIONS: { value: string; label: string }[] = [
  { value: "Oral", label: "Oral (PO)" },
  { value: "IV", label: "Intravenous (IV)" },
  { value: "IM", label: "Intramuscular (IM)" },
  { value: "Subcutaneous", label: "Subcutaneous (SC)" },
  { value: "Topical", label: "Topical" },
  { value: "Inhalation", label: "Inhalation" },
  { value: "Sublingual", label: "Sublingual (SL)" },
  { value: "Rectal", label: "Rectal (PR)" },
];

// ============================================================================
// Drug interaction reference table
// ============================================================================

export const DRUG_INTERACTIONS: DrugInteraction[] = [
  { medA: "Warfarin", medB: "Ibuprofen", severity: "High", description: "NSAIDs potentiate warfarin anticoagulation and increase GI bleeding risk.", recommendation: "Avoid combination. Consider paracetamol for analgesia; monitor INR if combination unavoidable." },
  { medA: "Warfarin", medB: "Diclofenac", severity: "High", description: "NSAIDs increase bleeding risk with warfarin.", recommendation: "Avoid combination. Use paracetamol instead." },
  { medA: "Warfarin", medB: "Aspirin", severity: "High", description: "Combined anticoagulant and antiplatelet effect markedly increases bleeding risk.", recommendation: "Avoid unless specifically indicated for cardiovascular protection. Monitor closely." },
  { medA: "Warfarin", medB: "Amoxicillin", severity: "Moderate", description: "Broad-spectrum antibiotics may alter gut flora and vitamin K production, increasing INR.", recommendation: "Monitor INR within 3-5 days. Adjust warfarin dose if needed." },
  { medA: "Warfarin", medB: "Ciprofloxacin", severity: "Moderate", description: "Ciprofloxacin inhibits CYP1A2, increasing warfarin levels.", recommendation: "Monitor INR closely. Consider dose reduction of warfarin." },
  { medA: "Warfarin", medB: "Metronidazole", severity: "High", description: "Metronidazole inhibits warfarin metabolism (CYP2C9), sharply increasing INR.", recommendation: "Avoid combination if possible. If required, reduce warfarin dose by 25-50% and monitor INR daily." },
  { medA: "Lisinopril", medB: "Spironolactone", severity: "High", description: "ACE-inhibitor + potassium-sparing diuretic increases risk of hyperkalemia.", recommendation: "Monitor serum potassium. Consider alternative diuretic." },
  { medA: "Lisinopril", medB: "Ibuprofen", severity: "Moderate", description: "NSAIDs reduce antihypertensive effect and may worsen renal function.", recommendation: "Monitor blood pressure and renal function. Use short courses only." },
  { medA: "Metformin", medB: "Ciprofloxacin", severity: "Moderate", description: "Fluoroquinolones may potentiate metformin hypoglycemic effect.", recommendation: "Monitor blood glucose. Adjust metformin dose if hypoglycemia occurs." },
  { medA: "Metformin", medB: "Ibuprofen", severity: "Mild", description: "NSAIDs may increase risk of lactic acidosis with metformin in renal impairment.", recommendation: "Ensure adequate hydration; monitor renal function in elderly." },
  { medA: "Digoxin", medB: "Diclofenac", severity: "Moderate", description: "NSAIDs may increase digoxin levels via renal effects.", recommendation: "Monitor digoxin levels and renal function." },
  { medA: "Ciprofloxacin", medB: "Warfarin", severity: "Moderate", description: "CYP inhibition increases INR.", recommendation: "Monitor INR." },
  { medA: "Amoxicillin", medB: "Metformin", severity: "Mild", description: "Possible altered glycemic control.", recommendation: "Monitor blood glucose." },
];

export function findInteraction(nameA: string, nameB: string): DrugInteraction | undefined {
  return DRUG_INTERACTIONS.find(
    (i) =>
      (matchesMed(i.medA, nameA) && matchesMed(i.medB, nameB)) ||
      (matchesMed(i.medA, nameB) && matchesMed(i.medB, nameA)),
  );
}

function matchesMed(pattern: string, name: string): boolean {
  const p = pattern.toLowerCase();
  const n = name.toLowerCase();
  return n.includes(p) || p.includes(n);
}

// ============================================================================
// Allergy cross-reference helpers
// ============================================================================

export interface AllergyWarning {
  medicationName: string;
  allergen: string;
  severity: "Mild" | "Moderate" | "Severe";
  recommendation: string;
  alternative?: string;
}

const ALTERNATIVES: Record<string, string> = {
  Penicillin: "Macrolide (Azithromycin)",
  Cephalosporins: "Azithromycin",
  "Fluoroquinolones": "Azithromycin or Doxycycline",
  Macrolides: "Amoxicillin or Ceftriaxone",
  NSAIDs: "Paracetamol",
  Salicylates: "Paracetamol",
  Opioids: "Tramadol with caution; consider non-opioid analgesia",
  "ACE-inhibitors": "Losartan (ARB class)",
  Sulfonamides: "Alternative diuretic or antidiabetic",
};

export function checkAllergy(
  medicationName: string,
  medicationAllergens: string[],
  patientAllergens: string[],
): AllergyWarning | null {
  for (const allergen of medicationAllergens) {
    for (const patient of patientAllergens) {
      if (allergen.toLowerCase() === patient.toLowerCase()) {
        return {
          medicationName,
          allergen,
          severity: "Severe",
          recommendation: `Avoid ${medicationName} — patient is allergic to ${allergen}.`,
          alternative: ALTERNATIVES[allergen],
        };
      }
      // partial match for class groupings
      if (patient.toLowerCase().includes(allergen.toLowerCase()) || allergen.toLowerCase().includes(patient.toLowerCase())) {
        return {
          medicationName,
          allergen: patient,
          severity: "Moderate",
          recommendation: `Use ${medicationName} with caution — patient has related allergy to ${patient}.`,
          alternative: ALTERNATIVES[allergen],
        };
      }
    }
  }
  return null;
}
