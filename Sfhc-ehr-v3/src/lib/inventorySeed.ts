import type {
  GeneralInventoryItem,
  ProcurementPurchaseOrder,
  Supplier,
  StockMovement,
  Asset,
  InventoryAlert,
} from "./types";

const now = new Date();
const isoDate = (d: Date) => d.toISOString();
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

// ---- Suppliers ----
export const SEED_SUPPLIERS: Supplier[] = [
  {
    id: "sup-001", name: "MediSource Ltd", contactPerson: "John Adebayo", phone: "+234 803 111 2222", email: "sales@medisource.ng",
    address: "15 Industrial Rd, Lagos", productsSupplied: ["Medical Consumables", "Laboratory Reagents", "Medical Equipment"],
    performanceRating: 4.5, contractStatus: "Active", purchaseHistory: 23, createdAt: isoDate(addDays(now, -120)), updatedAt: isoDate(now),
  },
  {
    id: "sup-002", name: "PharmaDistributors NG", contactPerson: "Fatima Ibrahim", phone: "+234 805 222 3333", email: "orders@pharmadist.ng",
    address: "42 Garki Rd, Abuja", productsSupplied: ["Pharmacy Medications", "Vaccines"],
    performanceRating: 4.8, contractStatus: "Active", purchaseHistory: 35, createdAt: isoDate(addDays(now, -200)), updatedAt: isoDate(now),
  },
  {
    id: "sup-003", name: "LabEquip Africa", contactPerson: "Michael Okafor", phone: "+234 807 333 4444", email: "info@labequip.africa",
    address: "8 Port Harcourt Rd, Aba", productsSupplied: ["Laboratory Equipment", "Laboratory Consumables"],
    performanceRating: 4.2, contractStatus: "Active", purchaseHistory: 12, createdAt: isoDate(addDays(now, -90)), updatedAt: isoDate(now),
  },
  {
    id: "sup-004", name: "OfficePlus Supplies", contactPerson: "Grace Eze", phone: "+234 809 444 5555", email: "sales@officeplus.ng",
    address: "100 Wuse 2, Abuja", productsSupplied: ["Office Supplies", "IT Equipment", "Furniture"],
    performanceRating: 3.8, contractStatus: "Active", purchaseHistory: 18, createdAt: isoDate(addDays(now, -150)), updatedAt: isoDate(now),
  },
  {
    id: "sup-005", name: "CleanCare Products", contactPerson: "Samuel Yusuf", phone: "+234 802 555 6666", email: "info@cleancare.ng",
    address: "33 Maiduguri Rd, Kano", productsSupplied: ["Cleaning Supplies"],
    performanceRating: 4.0, contractStatus: "Pending", purchaseHistory: 7, createdAt: isoDate(addDays(now, -60)), updatedAt: isoDate(now),
  },
];

// ---- General Inventory ----
export const SEED_GENERAL_INVENTORY: GeneralInventoryItem[] = [
  // Laboratory Reagents
  {
    id: "gi-001", itemCode: "INV-LAB-001", itemName: "Hemoglobin Reagent (Drabkin)", category: "Laboratory Reagents", department: "Laboratory",
    manufacturer: "HumaClot", supplierId: "sup-003", supplierName: "LabEquip Africa", batchNumber: "HC-2024-08",
    quantity: 45, minimumStock: 20, maximumStock: 100, unitCost: 15.50, sellingPrice: 25.00,
    expiryDate: dateOnly(addDays(now, 120)), storageLocation: "Lab Store - Shelf A1", status: "Active", notes: "Used for CBC tests",
    createdAt: isoDate(addDays(now, -30)), updatedAt: isoDate(now),
  },
  {
    id: "gi-002", itemCode: "INV-LAB-002", itemName: "Glucose Test Strips (50pk)", category: "Laboratory Consumables", department: "Laboratory",
    manufacturer: "Accu-Chek", supplierId: "sup-003", supplierName: "LabEquip Africa", batchNumber: "AC-2024-15",
    quantity: 8, minimumStock: 15, maximumStock: 60, unitCost: 22.00, sellingPrice: 35.00,
    expiryDate: dateOnly(addDays(now, 25)), storageLocation: "Lab Store - Shelf A2", status: "Active", notes: "Low stock - reorder needed",
    createdAt: isoDate(addDays(now, -45)), updatedAt: isoDate(now),
  },
  {
    id: "gi-003", itemCode: "INV-LAB-003", itemName: "Microscope Slides (100pk)", category: "Laboratory Consumables", department: "Laboratory",
    manufacturer: "Globe Scientific", supplierId: "sup-003", supplierName: "LabEquip Africa", batchNumber: "GS-2024-03",
    quantity: 120, minimumStock: 30, maximumStock: 200, unitCost: 8.00, sellingPrice: 12.00,
    storageLocation: "Lab Store - Shelf B1", status: "Active", notes: "",
    createdAt: isoDate(addDays(now, -60)), updatedAt: isoDate(now),
  },
  {
    id: "gi-004", itemCode: "INV-LAB-004", itemName: "Wright Stain (500ml)", category: "Laboratory Reagents", department: "Laboratory",
    manufacturer: "Sigma-Aldrich", supplierId: "sup-003", supplierName: "LabEquip Africa", batchNumber: "SA-2024-09",
    quantity: 0, minimumStock: 10, maximumStock: 40, unitCost: 45.00, sellingPrice: 65.00,
    expiryDate: dateOnly(addDays(now, 200)), storageLocation: "Lab Store - Shelf C1", status: "Active", notes: "OUT OF STOCK",
    createdAt: isoDate(addDays(now, -50)), updatedAt: isoDate(now),
  },
  // Pharmacy Medications (general inventory tracking)
  {
    id: "gi-005", itemCode: "INV-PHM-001", itemName: "Amoxicillin 500mg (1000ct)", category: "Pharmacy Medications", department: "Pharmacy",
    manufacturer: "Cipla", supplierId: "sup-002", supplierName: "PharmaDistributors NG", batchNumber: "CP-2024-11",
    quantity: 200, minimumStock: 50, maximumStock: 500, unitCost: 0.25, sellingPrice: 0.50,
    expiryDate: dateOnly(addDays(now, 365)), storageLocation: "Pharmacy Store - Rack 1", status: "Active", notes: "Bulk container",
    createdAt: isoDate(addDays(now, -20)), updatedAt: isoDate(now),
  },
  // Vaccines
  {
    id: "gi-006", itemCode: "INV-VAC-001", itemName: "MMR Vaccine (10 dose vial)", category: "Vaccines", department: "Pharmacy",
    manufacturer: "Serum Institute", supplierId: "sup-002", supplierName: "PharmaDistributors NG", batchNumber: "SI-2024-06",
    quantity: 15, minimumStock: 10, maximumStock: 50, unitCost: 35.00, sellingPrice: 50.00,
    expiryDate: dateOnly(addDays(now, 15)), storageLocation: "Cold Storage - Fridge 1", status: "Active", notes: "Requires cold chain 2-8°C",
    createdAt: isoDate(addDays(now, -15)), updatedAt: isoDate(now),
  },
  // Medical Equipment
  {
    id: "gi-007", itemCode: "INV-EQP-001", itemName: "Digital Thermometer", category: "Medical Equipment", department: "Medical",
    manufacturer: "Omron", supplierId: "sup-001", supplierName: "MediSource Ltd", batchNumber: "OM-2024-01",
    serialNumber: "OM-DT-001", quantity: 30, minimumStock: 10, maximumStock: 60, unitCost: 12.00, sellingPrice: 20.00,
    storageLocation: "Medical Store - Cabinet 3", status: "Active", notes: "",
    createdAt: isoDate(addDays(now, -40)), updatedAt: isoDate(now),
  },
  // Medical Consumables
  {
    id: "gi-008", itemCode: "INV-CON-001", itemName: "Examination Gloves (100ct)", category: "Medical Consumables", department: "Medical",
    manufacturer: "MediGlove", supplierId: "sup-001", supplierName: "MediSource Ltd", batchNumber: "MG-2024-05",
    quantity: 500, minimumStock: 100, maximumStock: 1000, unitCost: 5.00, sellingPrice: 8.00,
    storageLocation: "Medical Store - Shelf D1", status: "Active", notes: "Latex-free",
    createdAt: isoDate(addDays(now, -25)), updatedAt: isoDate(now),
  },
  {
    id: "gi-009", itemCode: "INV-CON-002", itemName: "Surgical Masks (50pk)", category: "Medical Consumables", department: "Medical",
    manufacturer: "SafeMask", supplierId: "sup-001", supplierName: "MediSource Ltd", batchNumber: "SM-2024-02",
    quantity: 12, minimumStock: 30, maximumStock: 200, unitCost: 3.50, sellingPrice: 6.00,
    storageLocation: "Medical Store - Shelf D2", status: "Active", notes: "Low stock",
    createdAt: isoDate(addDays(now, -35)), updatedAt: isoDate(now),
  },
  // Office Supplies
  {
    id: "gi-010", itemCode: "INV-OFC-001", itemName: "A4 Paper (500 sheets)", category: "Office Supplies", department: "Administration",
    manufacturer: "Double A", supplierId: "sup-004", supplierName: "OfficePlus Supplies", batchNumber: "DA-2024-01",
    quantity: 80, minimumStock: 20, maximumStock: 200, unitCost: 4.00, sellingPrice: 0,
    storageLocation: "Office Store - Cabinet 1", status: "Active", notes: "",
    createdAt: isoDate(addDays(now, -10)), updatedAt: isoDate(now),
  },
  // Cleaning Supplies
  {
    id: "gi-011", itemCode: "INV-CLN-001", itemName: "Surface Disinfectant (5L)", category: "Cleaning Supplies", department: "Maintenance",
    manufacturer: "CleanCare", supplierId: "sup-005", supplierName: "CleanCare Products", batchNumber: "CC-2024-03",
    quantity: 25, minimumStock: 10, maximumStock: 60, unitCost: 8.50, sellingPrice: 0,
    expiryDate: dateOnly(addDays(now, 300)), storageLocation: "Utility Room", status: "Active", notes: "",
    createdAt: isoDate(addDays(now, -18)), updatedAt: isoDate(now),
  },
  // IT Equipment
  {
    id: "gi-012", itemCode: "INV-IT-001", itemName: "USB Keyboard", category: "IT Equipment", department: "ICT",
    manufacturer: "Logitech", supplierId: "sup-004", supplierName: "OfficePlus Supplies", batchNumber: "LG-2024-01",
    serialNumber: "LG-KB-001", quantity: 15, minimumStock: 5, maximumStock: 30, unitCost: 18.00, sellingPrice: 0,
    storageLocation: "ICT Store - Cabinet 2", status: "Active", notes: "",
    createdAt: isoDate(addDays(now, -22)), updatedAt: isoDate(now),
  },
  // Furniture
  {
    id: "gi-013", itemCode: "INV-FUR-001", itemName: "Office Chair", category: "Furniture", department: "Administration",
    manufacturer: "ErgoChair", supplierId: "sup-004", supplierName: "OfficePlus Supplies", batchNumber: "EC-2024-01",
    quantity: 40, minimumStock: 10, maximumStock: 80, unitCost: 65.00, sellingPrice: 0,
    storageLocation: "Furniture Store", status: "Active", notes: "",
    createdAt: isoDate(addDays(now, -55)), updatedAt: isoDate(now),
  },
  // Expired item
  {
    id: "gi-014", itemCode: "INV-LAB-005", itemName: "Pregnancy Test Strips (20pk)", category: "Laboratory Consumables", department: "Laboratory",
    manufacturer: "OneStep", supplierId: "sup-003", supplierName: "LabEquip Africa", batchNumber: "OS-2023-12",
    quantity: 30, minimumStock: 15, maximumStock: 60, unitCost: 10.00, sellingPrice: 15.00,
    expiryDate: dateOnly(addDays(now, -10)), storageLocation: "Lab Store - Shelf A3", status: "Active", notes: "EXPIRED - needs disposal",
    createdAt: isoDate(addDays(now, -100)), updatedAt: isoDate(now),
  },
  // Overstock item
  {
    id: "gi-015", itemCode: "INV-CON-003", itemName: "Cotton Wool (500g)", category: "Medical Consumables", department: "Medical",
    manufacturer: "MediSoft", supplierId: "sup-001", supplierName: "MediSource Ltd", batchNumber: "MS-2024-04",
    quantity: 350, minimumStock: 30, maximumStock: 100, unitCost: 6.00, sellingPrice: 10.00,
    storageLocation: "Medical Store - Shelf D3", status: "Active", notes: "Overstocked",
    createdAt: isoDate(addDays(now, -12)), updatedAt: isoDate(now),
  },
];

// ---- Procurement Purchase Orders ----
export const SEED_PROCUREMENT_POS: ProcurementPurchaseOrder[] = [
  {
    id: "po-m8-001", poNumber: "PO-2024-001", supplierId: "sup-001", supplierName: "MediSource Ltd",
    department: "Medical", requestedBy: "u-003", requestedByName: "Nurse Joy", approvedBy: "u-001", approvedByName: "Dr. Admin",
    status: "Received", orderDate: dateOnly(addDays(now, -30)), expectedDate: dateOnly(addDays(now, -20)),
    receivedDate: dateOnly(addDays(now, -18)),
    lines: [
      { id: "pol-001", itemCode: "INV-CON-001", itemName: "Examination Gloves (100ct)", category: "Medical Consumables", quantity: 200, unitCost: 5.00, receivedQuantity: 200 },
      { id: "pol-002", itemCode: "INV-CON-002", itemName: "Surgical Masks (50pk)", category: "Medical Consumables", quantity: 100, unitCost: 3.50, receivedQuantity: 100 },
    ],
    total: 1350, notes: "Routine restock", createdAt: isoDate(addDays(now, -30)), updatedAt: isoDate(addDays(now, -18)),
  },
  {
    id: "po-m8-002", poNumber: "PO-2024-002", supplierId: "sup-003", supplierName: "LabEquip Africa",
    department: "Laboratory", requestedBy: "u-005", requestedByName: "Lab Tech", approvedBy: "u-001", approvedByName: "Dr. Admin",
    status: "Ordered", orderDate: dateOnly(addDays(now, -5)), expectedDate: dateOnly(addDays(now, 5)),
    lines: [
      { id: "pol-003", itemCode: "INV-LAB-004", itemName: "Wright Stain (500ml)", category: "Laboratory Reagents", quantity: 20, unitCost: 45.00, receivedQuantity: 0 },
      { id: "pol-004", itemCode: "INV-LAB-002", itemName: "Glucose Test Strips (50pk)", category: "Laboratory Consumables", quantity: 30, unitCost: 22.00, receivedQuantity: 0 },
    ],
    total: 1560, notes: "Urgent - out of stock items", createdAt: isoDate(addDays(now, -5)), updatedAt: isoDate(addDays(now, -3)),
  },
  {
    id: "po-m8-003", poNumber: "PO-2024-003", supplierId: "sup-002", supplierName: "PharmaDistributors NG",
    department: "Pharmacy", requestedBy: "u-004", requestedByName: "Pharmacist", status: "Submitted",
    orderDate: dateOnly(addDays(now, -2)), expectedDate: dateOnly(addDays(now, 10)),
    lines: [
      { id: "pol-005", itemCode: "INV-VAC-001", itemName: "MMR Vaccine (10 dose vial)", category: "Vaccines", quantity: 20, unitCost: 35.00, receivedQuantity: 0 },
    ],
    total: 700, notes: "Vaccine restock for immunization program", createdAt: isoDate(addDays(now, -2)), updatedAt: isoDate(addDays(now, -2)),
  },
  {
    id: "po-m8-004", poNumber: "PO-2024-004", supplierId: "sup-004", supplierName: "OfficePlus Supplies",
    department: "Administration", requestedBy: "u-001", requestedByName: "Dr. Admin", status: "Draft",
    orderDate: dateOnly(now), expectedDate: dateOnly(addDays(now, 14)),
    lines: [
      { id: "pol-006", itemCode: "INV-OFC-001", itemName: "A4 Paper (500 sheets)", category: "Office Supplies", quantity: 50, unitCost: 4.00, receivedQuantity: 0 },
    ],
    total: 200, notes: "Draft - not yet submitted", createdAt: isoDate(now), updatedAt: isoDate(now),
  },
];

// ---- Stock Movements ----
export const SEED_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: "sm-001", itemId: "gi-008", itemCode: "INV-CON-001", itemName: "Examination Gloves (100ct)",
    movementType: "Received", quantity: 200, toDepartment: "Medical", staffId: "u-003", staffName: "Nurse Joy",
    department: "Medical", reason: "PO-2024-001 received", referenceNumber: "PO-2024-001",
    date: dateOnly(addDays(now, -18)), createdAt: isoDate(addDays(now, -18)),
  },
  {
    id: "sm-002", itemId: "gi-008", itemCode: "INV-CON-001", itemName: "Examination Gloves (100ct)",
    movementType: "Issued", quantity: 50, fromDepartment: "Medical", staffId: "u-003", staffName: "Nurse Joy",
    department: "Medical", reason: "Daily issue to examination rooms", referenceNumber: "ISS-001",
    date: dateOnly(addDays(now, -10)), createdAt: isoDate(addDays(now, -10)),
  },
  {
    id: "sm-003", itemId: "gi-009", itemCode: "INV-CON-002", itemName: "Surgical Masks (50pk)",
    movementType: "Issued", quantity: 38, fromDepartment: "Medical", staffId: "u-003", staffName: "Nurse Joy",
    department: "Medical", reason: "Issued to clinical staff", referenceNumber: "ISS-002",
    date: dateOnly(addDays(now, -5)), createdAt: isoDate(addDays(now, -5)),
  },
  {
    id: "sm-004", itemId: "gi-014", itemCode: "INV-LAB-005", itemName: "Pregnancy Test Strips (20pk)",
    movementType: "Expired", quantity: 30, staffId: "u-005", staffName: "Lab Tech",
    department: "Laboratory", reason: "Expired stock - pending disposal", referenceNumber: "EXP-001",
    date: dateOnly(addDays(now, -2)), createdAt: isoDate(addDays(now, -2)),
  },
  {
    id: "sm-005", itemId: "gi-001", itemCode: "INV-LAB-001", itemName: "Hemoglobin Reagent (Drabkin)",
    movementType: "Issued", quantity: 5, fromDepartment: "Laboratory", staffId: "u-005", staffName: "Lab Tech",
    department: "Laboratory", reason: "Used for CBC lab tests", referenceNumber: "LAB-ISS-001",
    date: dateOnly(addDays(now, -1)), createdAt: isoDate(addDays(now, -1)),
  },
];

// ---- Assets ----
export const SEED_ASSETS: Asset[] = [
  {
    id: "ast-001", assetId: "AST-001", assetName: "Hematology Analyzer", category: "Laboratory Equipment", department: "Laboratory",
    location: "Lab Room 1", assignedStaffId: "u-005", assignedStaffName: "Lab Tech",
    purchaseDate: dateOnly(addDays(now, -800)), purchaseCost: 15000, warrantyExpiry: dateOnly(addDays(now, 200)),
    lastMaintenanceDate: dateOnly(addDays(now, -60)), nextMaintenanceDate: dateOnly(addDays(now, 30)),
    serviceStatus: "In Service", condition: "Good", depreciation: 3000, notes: "Annual maintenance due",
    createdAt: isoDate(addDays(now, -800)), updatedAt: isoDate(now),
  },
  {
    id: "ast-002", assetId: "AST-002", assetName: "Microscope (Olympus CX23)", category: "Laboratory Equipment", department: "Laboratory",
    location: "Lab Room 2", assignedStaffId: "u-005", assignedStaffName: "Lab Tech",
    purchaseDate: dateOnly(addDays(now, -1200)), purchaseCost: 3500, warrantyExpiry: dateOnly(addDays(now, -100)),
    lastMaintenanceDate: dateOnly(addDays(now, -90)), nextMaintenanceDate: dateOnly(addDays(now, 7)),
    serviceStatus: "Under Maintenance", condition: "Fair", depreciation: 700, notes: "Lens alignment being serviced",
    createdAt: isoDate(addDays(now, -1200)), updatedAt: isoDate(now),
  },
  {
    id: "ast-003", assetId: "AST-003", assetName: "Desktop Computer (HP EliteDesk)", category: "IT Equipment", department: "Reception",
    location: "Reception Desk", assignedStaffId: "u-006", assignedStaffName: "Receptionist",
    purchaseDate: dateOnly(addDays(now, -400)), purchaseCost: 800, warrantyExpiry: dateOnly(addDays(now, 325)),
    lastMaintenanceDate: dateOnly(addDays(now, -30)), nextMaintenanceDate: dateOnly(addDays(now, 335)),
    serviceStatus: "In Service", condition: "Excellent", depreciation: 160, notes: "",
    createdAt: isoDate(addDays(now, -400)), updatedAt: isoDate(now),
  },
  {
    id: "ast-004", assetId: "AST-004", assetName: "Printer (HP LaserJet Pro)", category: "IT Equipment", department: "Administration",
    location: "Admin Office", assignedStaffId: "u-001", assignedStaffName: "Dr. Admin",
    purchaseDate: dateOnly(addDays(now, -500)), purchaseCost: 350, warrantyExpiry: dateOnly(addDays(now, -50)),
    lastMaintenanceDate: dateOnly(addDays(now, -120)), nextMaintenanceDate: dateOnly(addDays(now, 15)),
    serviceStatus: "In Service", condition: "Good", depreciation: 70, notes: "Warranty expired",
    createdAt: isoDate(addDays(now, -500)), updatedAt: isoDate(now),
  },
  {
    id: "ast-005", assetId: "AST-005", assetName: "Generator (10KVA)", category: "Infrastructure", department: "Maintenance",
    location: "Generator House", assignedStaffId: "u-001", assignedStaffName: "Dr. Admin",
    purchaseDate: dateOnly(addDays(now, -1000)), purchaseCost: 5000, warrantyExpiry: dateOnly(addDays(now, -200)),
    lastMaintenanceDate: dateOnly(addDays(now, -45)), nextMaintenanceDate: dateOnly(addDays(now, 45)),
    serviceStatus: "In Service", condition: "Good", depreciation: 1000, notes: "Serviced every 3 months",
    createdAt: isoDate(addDays(now, -1000)), updatedAt: isoDate(now),
  },
  {
    id: "ast-006", assetId: "AST-006", assetName: "Hospital Bed (Electric)", category: "Medical Equipment", department: "Medical",
    location: "Ward 1 - Bed 3", assignedStaffId: "u-003", assignedStaffName: "Nurse Joy",
    purchaseDate: dateOnly(addDays(now, -600)), purchaseCost: 1200, warrantyExpiry: dateOnly(addDays(now, 100)),
    lastMaintenanceDate: dateOnly(addDays(now, -180)), nextMaintenanceDate: dateOnly(addDays(now, 20)),
    serviceStatus: "In Service", condition: "Good", depreciation: 240, notes: "",
    createdAt: isoDate(addDays(now, -600)), updatedAt: isoDate(now),
  },
  {
    id: "ast-007", assetId: "AST-007", assetName: "Air Conditioner (2HP)", category: "Infrastructure", department: "Administration",
    location: "Admin Office", assignedStaffId: "u-001", assignedStaffName: "Dr. Admin",
    purchaseDate: dateOnly(addDays(now, -700)), purchaseCost: 600, warrantyExpiry: dateOnly(addDays(now, 50)),
    lastMaintenanceDate: dateOnly(addDays(now, -90)), nextMaintenanceDate: dateOnly(addDays(now, 5)),
    serviceStatus: "In Service", condition: "Fair", depreciation: 140, notes: "Gas top-up needed",
    createdAt: isoDate(addDays(now, -700)), updatedAt: isoDate(now),
  },
  {
    id: "ast-008", assetId: "AST-008", assetName: "Centrifuge (Hettich EBA 200)", category: "Laboratory Equipment", department: "Laboratory",
    location: "Lab Room 1", assignedStaffId: "u-005", assignedStaffName: "Lab Tech",
    purchaseDate: dateOnly(addDays(now, -900)), purchaseCost: 2000, warrantyExpiry: dateOnly(addDays(now, -100)),
    lastMaintenanceDate: dateOnly(addDays(now, -200)), nextMaintenanceDate: dateOnly(addDays(now, 60)),
    serviceStatus: "In Service", condition: "Good", depreciation: 400, notes: "",
    createdAt: isoDate(addDays(now, -900)), updatedAt: isoDate(now),
  },
];

// ---- Inventory Alerts (computed at runtime but seeded for initial display) ----
export const SEED_INVENTORY_ALERTS: InventoryAlert[] = [];
