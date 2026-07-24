import type {
  Invoice,
  InvoiceLine,
  Payment,
  Refund,
  InsuranceClaim,
  InsurancePolicy,
  BillingNotification,
  Patient,
  Appointment,
  LabOrder,
  Prescription,
  SoapNote,
  User,
  PricingItem,
  BillingCategory,
  PaymentMethod,
  PaymentStatus,
} from "./types";

// ============================================================================
// Invoice number / receipt number / claim number generators
// ============================================================================

export function generateInvoiceNumber(existing: Invoice[]): string {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const nums = existing
    .map((i) => i.invoiceNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, ""), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

export function generateReceiptNumber(existing: Payment[]): string {
  const year = new Date().getFullYear();
  const prefix = `RCP-${year}-`;
  const nums = existing
    .map((p) => p.receiptNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, ""), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

export function generateClaimNumber(existing: InsuranceClaim[]): string {
  const year = new Date().getFullYear();
  const prefix = `CLM-${year}-`;
  const nums = existing
    .map((c) => c.claimNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, ""), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

export function generateRefundNumber(existing: Refund[]): string {
  const year = new Date().getFullYear();
  const prefix = `RFD-${year}-`;
  const nums = existing
    .map((r) => r.refundNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, ""), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

// ============================================================================
// Invoice calculations
// ============================================================================

export function computeLineTotal(line: InvoiceLine): {
  gross: number;
  discount: number;
  tax: number;
  net: number;
} {
  const gross = line.quantity * line.unitPrice;
  const discount = (gross * line.discount) / 100;
  const taxable = gross - discount;
  const tax = (taxable * line.taxRate) / 100;
  const net = taxable + tax;
  return { gross, discount, tax, net: Math.round(net * 100) / 100 };
}

export function computeInvoiceTotals(lines: InvoiceLine[]): {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
} {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  for (const line of lines) {
    const t = computeLineTotal(line);
    subtotal += t.gross;
    discountTotal += t.discount;
    taxTotal += t.tax;
  }
  const grandTotal = subtotal - discountTotal + taxTotal;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

export function derivePaymentStatus(
  grandTotal: number,
  amountPaid: number,
  dueDate: string,
  currentStatus: PaymentStatus,
): PaymentStatus {
  if (currentStatus === "Cancelled" || currentStatus === "Refunded" || currentStatus === "Draft") {
    return currentStatus;
  }
  if (amountPaid >= grandTotal && grandTotal > 0) return "Paid";
  if (amountPaid > 0 && amountPaid < grandTotal) {
    const due = new Date(dueDate);
    if (due.getTime() < Date.now()) return "Overdue";
    return "Partially-Paid";
  }
  if (amountPaid <= 0) {
    const due = new Date(dueDate);
    if (due.getTime() < Date.now()) return "Overdue";
    return "Unpaid";
  }
  return "Unpaid";
}

export function computeBalance(invoice: Invoice): number {
  return Math.round((invoice.grandTotal - invoice.amountPaid) * 100) / 100;
}

// ============================================================================
// Insurance coverage calculation
// ============================================================================

export function computeInsuranceCoverage(
  grandTotal: number,
  policy?: InsurancePolicy | null,
): number {
  if (!policy || !policy.active) return 0;
  const today = new Date();
  const expiry = new Date(policy.expiryDate);
  if (expiry.getTime() < today.getTime()) return 0;
  return Math.round((grandTotal * policy.coveragePercent) / 100);
}

// ============================================================================
// Invoice generation from source records
// ============================================================================

export function lineFromPricing(item: PricingItem, qty = 1): InvoiceLine {
  return {
    id: `il-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: item.name,
    category: item.category,
    quantity: qty,
    unitPrice: item.unitPrice,
    discount: 0,
    taxRate: 0,
    sourceType: "Manual",
    reference: item.code,
  };
}

export function invoiceFromAppointment(
  appt: Appointment,
  patientId: string,
  clinicianId: string,
  pricing: PricingItem[],
  existingInvoices: Invoice[],
): Omit<Invoice, "id" | "createdAt" | "updatedAt"> {
  const consult = pricing.find((p) => p.category === "Consultation" && p.active);
  const lines: InvoiceLine[] = consult
    ? [
        {
          id: `il-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          description: `Consultation — ${appt.type}`,
          category: "Consultation",
          quantity: 1,
          unitPrice: consult.unitPrice,
          discount: 0,
          taxRate: 0,
          sourceType: "Appointment",
          sourceId: appt.id,
          reference: appt.type,
        },
      ]
    : [];
  const totals = computeInvoiceTotals(lines);
  const due = new Date();
  due.setDate(due.getDate() + 30);
  return {
    invoiceNumber: generateInvoiceNumber(existingInvoices),
    patientId,
    clinicianId,
    department: "Consultation",
    date: new Date().toISOString(),
    dueDate: due.toISOString(),
    lines,
    ...totals,
    amountPaid: 0,
    balance: totals.grandTotal,
    paymentStatus: "Unpaid",
    source: "Appointment",
    sourceRefId: appt.id,
    insuranceCovered: 0,
    notes: `Auto-generated from appointment: ${appt.reason}`,
  };
}

export function invoiceFromLabOrder(
  lab: LabOrder,
  patientId: string,
  clinicianId: string,
  pricing: PricingItem[],
  existingInvoices: Invoice[],
): Omit<Invoice, "id" | "createdAt" | "updatedAt"> {
  const lines: InvoiceLine[] = lab.tests.map((t) => {
    const priceItem = pricing.find(
      (p) => p.active && (p.code === t.testCode || p.name.toLowerCase() === t.testName.toLowerCase()),
    );
    return {
      id: `il-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${t.id}`,
      description: `Lab: ${t.testName}`,
      category: "Laboratory" as BillingCategory,
      quantity: 1,
      unitPrice: priceItem?.unitPrice ?? 25,
      discount: 0,
      taxRate: 0,
      sourceType: "Laboratory" as InvoiceSource,
      sourceId: lab.id,
      reference: t.testCode,
    };
  });
  const totals = computeInvoiceTotals(lines);
  const due = new Date();
  due.setDate(due.getDate() + 30);
  return {
    invoiceNumber: generateInvoiceNumber(existingInvoices),
    patientId,
    clinicianId,
    department: "Laboratory",
    date: new Date().toISOString(),
    dueDate: due.toISOString(),
    lines,
    ...totals,
    amountPaid: 0,
    balance: totals.grandTotal,
    paymentStatus: "Unpaid",
    source: "Laboratory",
    sourceRefId: lab.id,
    insuranceCovered: 0,
    notes: `Auto-generated from lab order: ${lab.id}`,
  };
}

export function invoiceFromPrescription(
  rx: Prescription,
  patientId: string,
  clinicianId: string,
  pricing: PricingItem[],
  existingInvoices: Invoice[],
): Omit<Invoice, "id" | "createdAt" | "updatedAt"> {
  const lines: InvoiceLine[] = rx.lines.map((l) => {
    const priceItem = pricing.find(
      (p) => p.active && p.category === "Pharmacy" && (p.name.toLowerCase().includes(l.medicationName.toLowerCase().split(" ")[0]) || p.code === l.medicationId),
    );
    return {
      id: `il-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${l.id}`,
      description: `Pharmacy: ${l.medicationName}`,
      category: "Pharmacy" as BillingCategory,
      quantity: l.quantity,
      unitPrice: priceItem?.unitPrice ?? 2,
      discount: 0,
      taxRate: 0,
      sourceType: "Pharmacy" as InvoiceSource,
      sourceId: rx.id,
      reference: l.medicationName,
    };
  });
  const totals = computeInvoiceTotals(lines);
  const due = new Date();
  due.setDate(due.getDate() + 30);
  return {
    invoiceNumber: generateInvoiceNumber(existingInvoices),
    patientId,
    clinicianId,
    department: "Pharmacy",
    date: new Date().toISOString(),
    dueDate: due.toISOString(),
    lines,
    ...totals,
    amountPaid: 0,
    balance: totals.grandTotal,
    paymentStatus: "Unpaid",
    source: "Pharmacy",
    sourceRefId: rx.id,
    insuranceCovered: 0,
    notes: `Auto-generated from prescription: ${rx.id}`,
  };
}

export function invoiceFromConsultation(
  soap: SoapNote,
  patientId: string,
  clinicianId: string,
  pricing: PricingItem[],
  existingInvoices: Invoice[],
): Omit<Invoice, "id" | "createdAt" | "updatedAt"> {
  const consult = pricing.find((p) => p.category === "Consultation" && p.active);
  const lines: InvoiceLine[] = consult
    ? [
        {
          id: `il-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          description: `Consultation — ${soap.diagnosis} (${soap.diagnosisCode})`,
          category: "Consultation",
          quantity: 1,
          unitPrice: consult.unitPrice,
          discount: 0,
          taxRate: 0,
          sourceType: "Consultation",
          sourceId: soap.id,
          reference: soap.diagnosisCode,
        },
      ]
    : [];
  const totals = computeInvoiceTotals(lines);
  const due = new Date();
  due.setDate(due.getDate() + 30);
  return {
    invoiceNumber: generateInvoiceNumber(existingInvoices),
    patientId,
    clinicianId,
    department: "Consultation",
    date: new Date().toISOString(),
    dueDate: due.toISOString(),
    lines,
    ...totals,
    amountPaid: 0,
    balance: totals.grandTotal,
    paymentStatus: "Unpaid",
    source: "Consultation",
    sourceRefId: soap.id,
    insuranceCovered: 0,
    notes: `Auto-generated from clinical encounter: ${soap.id}`,
  };
}

type InvoiceSource_union = Invoice["source"];

// ============================================================================
// Notification generation
// ============================================================================

export function generateBillingNotifications(
  invoices: Invoice[],
  claims: InsuranceClaim[],
  policies: InsurancePolicy[],
  refunds: Refund[],
  patients: Patient[],
): BillingNotification[] {
  const notifications: BillingNotification[] = [];
  const now = Date.now();

  for (const inv of invoices) {
    const patient = patients.find((p) => p.id === inv.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Patient";

    if (inv.paymentStatus === "Overdue") {
      notifications.push({
        id: `bill-notif-overdue-${inv.id}`,
        kind: "overdue-invoice",
        title: "Overdue Invoice",
        message: `Invoice ${inv.invoiceNumber} for ${patientName} is overdue (Balance: $${inv.balance.toFixed(2)})`,
        patientId: inv.patientId,
        invoiceId: inv.id,
        severity: "danger",
        createdAt: inv.dueDate,
        read: false,
      });
    }

    if (inv.paymentStatus === "Unpaid" && inv.balance > 500) {
      notifications.push({
        id: `bill-notif-large-${inv.id}`,
        kind: "large-unpaid",
        title: "Large Unpaid Balance",
        message: `Invoice ${inv.invoiceNumber} has a large unpaid balance of $${inv.balance.toFixed(2)}`,
        patientId: inv.patientId,
        invoiceId: inv.id,
        severity: "warning",
        createdAt: inv.createdAt,
        read: false,
      });
    }
  }

  for (const claim of claims) {
    if (claim.status === "Approved") {
      notifications.push({
        id: `bill-notif-claim-approve-${claim.id}`,
        kind: "claim-approved",
        title: "Claim Approved",
        message: `Claim ${claim.claimNumber} has been approved for $${claim.amount.toFixed(2)}`,
        claimId: claim.id,
        severity: "success",
        createdAt: claim.updatedAt,
        read: false,
      });
    }
    if (claim.status === "Rejected") {
      notifications.push({
        id: `bill-notif-claim-reject-${claim.id}`,
        kind: "claim-rejected",
        title: "Claim Rejected",
        message: `Claim ${claim.claimNumber} has been rejected`,
        claimId: claim.id,
        severity: "danger",
        createdAt: claim.updatedAt,
        read: false,
      });
    }
  }

  for (const policy of policies) {
    const expiry = new Date(policy.expiryDate).getTime();
    const daysLeft = Math.round((expiry - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30 && daysLeft >= 0 && policy.active) {
      const patient = patients.find((p) => p.id === policy.patientId);
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Patient";
      notifications.push({
        id: `bill-notif-ins-exp-${policy.id}`,
        kind: "insurance-expiry",
        title: "Insurance Expiring Soon",
        message: `Policy ${policy.policyNumber} for ${patientName} expires in ${daysLeft} days`,
        patientId: policy.patientId,
        severity: "warning",
        createdAt: policy.updatedAt,
        read: false,
      });
    }
  }

  for (const refund of refunds) {
    if (refund.status === "Completed") {
      notifications.push({
        id: `bill-notif-refund-${refund.id}`,
        kind: "refund-completed",
        title: "Refund Completed",
        message: `Refund ${refund.refundNumber} of $${refund.amount.toFixed(2)} has been completed`,
        invoiceId: refund.invoiceId,
        severity: "info",
        createdAt: refund.updatedAt,
        read: false,
      });
    }
  }

  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ============================================================================
// Financial timeline (per patient)
// ============================================================================

export interface TimelineEvent {
  id: string;
  date: string;
  type: "invoice" | "payment" | "claim" | "refund" | "lab-charge" | "pharmacy-charge" | "appointment";
  title: string;
  description: string;
  amount?: number;
  status?: string;
}

export function buildPatientFinancialTimeline(
  patientId: string,
  invoices: Invoice[],
  payments: Payment[],
  claims: InsuranceClaim[],
  refunds: Refund[],
  labOrders: LabOrder[],
  prescriptions: Prescription[],
  appointments: Appointment[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const inv of invoices.filter((i) => i.patientId === patientId)) {
    events.push({
      id: `tl-inv-${inv.id}`,
      date: inv.date,
      type: "invoice",
      title: `Invoice ${inv.invoiceNumber}`,
      description: `${inv.department} — ${inv.lines.length} item(s)`,
      amount: inv.grandTotal,
      status: inv.paymentStatus,
    });
  }

  for (const pay of payments.filter((p) => p.patientId === patientId)) {
    events.push({
      id: `tl-pay-${pay.id}`,
      date: pay.date,
      type: "payment",
      title: `Payment ${pay.receiptNumber}`,
      description: `${pay.method} — Ref: ${pay.reference || "N/A"}`,
      amount: pay.amountPaid,
      status: "Completed",
    });
  }

  for (const claim of claims.filter((c) => c.patientId === patientId)) {
    events.push({
      id: `tl-claim-${claim.id}`,
      date: claim.submissionDate,
      type: "claim",
      title: `Claim ${claim.claimNumber}`,
      description: `${claim.insurerName} — ${claim.status}`,
      amount: claim.amount,
      status: claim.status,
    });
  }

  for (const ref of refunds.filter((r) => r.patientId === patientId)) {
    events.push({
      id: `tl-refund-${ref.id}`,
      date: ref.createdAt,
      type: "refund",
      title: `Refund ${ref.refundNumber}`,
      description: ref.reason,
      amount: ref.amount,
      status: ref.status,
    });
  }

  for (const lab of labOrders.filter((l) => l.patientId === patientId)) {
    const labInv = invoices.find((i) => i.sourceRefId === lab.id && i.source === "Laboratory");
    if (!labInv) {
      events.push({
        id: `tl-lab-${lab.id}`,
        date: lab.orderedAt,
        type: "lab-charge",
        title: `Lab Order ${lab.id}`,
        description: lab.tests.map((t) => t.testName).join(", "),
        status: lab.status,
      });
    }
  }

  for (const rx of prescriptions.filter((r) => r.patientId === patientId)) {
    const rxInv = invoices.find((i) => i.sourceRefId === rx.id && i.source === "Pharmacy");
    if (!rxInv) {
      events.push({
        id: `tl-rx-${rx.id}`,
        date: rx.createdAt,
        type: "pharmacy-charge",
        title: `Prescription ${rx.id}`,
        description: rx.lines.map((l) => l.medicationName).join(", "),
        status: rx.status,
      });
    }
  }

  for (const appt of appointments.filter((a) => a.patientId === patientId)) {
    const apptInv = invoices.find((i) => i.sourceRefId === appt.id && i.source === "Appointment");
    if (!apptInv) {
      events.push({
        id: `tl-appt-${appt.id}`,
        date: appt.date,
        type: "appointment",
        title: `Appointment — ${appt.type}`,
        description: appt.reason,
        status: appt.status,
      });
    }
  }

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ============================================================================
// Revenue report aggregation
// ============================================================================

export type ReportGroupBy = "date" | "department" | "provider" | "method" | "insurance" | "service";

export interface RevenueReportRow {
  key: string;
  label: string;
  totalRevenue: number;
  collectedRevenue: number;
  outstandingRevenue: number;
  refunds: number;
  insurancePayments: number;
  cashPayments: number;
  count: number;
}

export function buildRevenueReport(
  invoices: Invoice[],
  payments: Payment[],
  refunds: Refund[],
  policies: InsurancePolicy[],
  users: User[],
  groupBy: ReportGroupBy,
  dateFrom?: string,
  dateTo?: string,
): RevenueReportRow[] {
  const from = dateFrom ? new Date(dateFrom).getTime() : 0;
  const to = dateTo ? new Date(dateTo).getTime() + 86400000 : Date.now() + 86400000;

  const filteredInvoices = invoices.filter((i) => {
    const t = new Date(i.date).getTime();
    return t >= from && t <= to;
  });
  const filteredPayments = payments.filter((p) => {
    const t = new Date(p.date).getTime();
    return t >= from && t <= to;
  });
  const filteredRefunds = refunds.filter((r) => {
    const t = new Date(r.createdAt).getTime();
    return t >= from && t <= to;
  });

  const map = new Map<string, RevenueReportRow>();

  function ensureRow(key: string, label: string): RevenueReportRow {
    if (!map.has(key)) {
      map.set(key, {
        key,
        label,
        totalRevenue: 0,
        collectedRevenue: 0,
        outstandingRevenue: 0,
        refunds: 0,
        insurancePayments: 0,
        cashPayments: 0,
        count: 0,
      });
    }
    return map.get(key)!;
  }

  for (const inv of filteredInvoices) {
    let key = "";
    let label = "";
    switch (groupBy) {
      case "date":
        key = inv.date.slice(0, 10);
        label = key;
        break;
      case "department":
        key = inv.department;
        label = inv.department;
        break;
      case "provider":
        key = inv.clinicianId ?? "unknown";
        label = users.find((u) => u.id === inv.clinicianId)?.name ?? "Unknown";
        break;
      case "method":
        key = inv.paymentMethod ?? "Unpaid";
        label = inv.paymentMethod ?? "Unpaid";
        break;
      case "insurance":
        key = inv.insurancePolicyId ?? "cash";
        label = inv.insurancePolicyId
          ? policies.find((p) => p.id === inv.insurancePolicyId)?.insurerName ?? "Insurance"
          : "Cash / Self-Pay";
        break;
      case "service":
        key = inv.source;
        label = inv.source;
        break;
    }
    const row = ensureRow(key, label);
    row.totalRevenue += inv.grandTotal;
    row.collectedRevenue += inv.amountPaid;
    row.outstandingRevenue += inv.balance;
    row.count += 1;
  }

  for (const pay of filteredPayments) {
    const inv = filteredInvoices.find((i) => i.id === pay.invoiceId);
    if (!inv) continue;
    let key = "";
    let label = "";
    switch (groupBy) {
      case "date":
        key = pay.date.slice(0, 10);
        label = key;
        break;
      case "department":
        key = inv.department;
        label = inv.department;
        break;
      case "provider":
        key = inv.clinicianId ?? "unknown";
        label = users.find((u) => u.id === inv.clinicianId)?.name ?? "Unknown";
        break;
      case "method":
        key = pay.method;
        label = pay.method;
        break;
      case "insurance":
        key = inv.insurancePolicyId ?? "cash";
        label = inv.insurancePolicyId
          ? policies.find((p) => p.id === inv.insurancePolicyId)?.insurerName ?? "Insurance"
          : "Cash / Self-Pay";
        break;
      case "service":
        key = inv.source;
        label = inv.source;
        break;
    }
    const row = ensureRow(key, label);
    if (pay.method === "Insurance") {
      row.insurancePayments += pay.amountPaid;
    } else {
      row.cashPayments += pay.amountPaid;
    }
  }

  for (const ref of filteredRefunds) {
    if (ref.status !== "Completed") continue;
    const inv = filteredInvoices.find((i) => i.id === ref.invoiceId);
    if (!inv) continue;
    let key = "";
    let label = "";
    switch (groupBy) {
      case "date":
        key = ref.createdAt.slice(0, 10);
        label = key;
        break;
      case "department":
        key = inv.department;
        label = inv.department;
        break;
      case "provider":
        key = inv.clinicianId ?? "unknown";
        label = users.find((u) => u.id === inv.clinicianId)?.name ?? "Unknown";
        break;
      case "method":
        key = ref.paymentMethod;
        label = ref.paymentMethod;
        break;
      case "insurance":
        key = inv.insurancePolicyId ?? "cash";
        label = inv.insurancePolicyId
          ? policies.find((p) => p.id === inv.insurancePolicyId)?.insurerName ?? "Insurance"
          : "Cash / Self-Pay";
        break;
      case "service":
        key = inv.source;
        label = inv.source;
        break;
    }
    const row = ensureRow(key, label);
    row.refunds += ref.amount;
  }

  return Array.from(map.values());
}

// ============================================================================
// Print templates — Invoice & Receipt
// ============================================================================

export function invoicePrintHTML(inv: Invoice, patient: Patient, clinician?: User, payments?: Payment[]): string {
  const pName = `${patient.firstName} ${patient.lastName}`;
  const clinicianName = clinician?.name ?? "—";
  const paymentsList = payments?.filter((p) => p.invoiceId === inv.id) ?? [];
  const totalPaid = paymentsList.reduce((s, p) => s + p.amountPaid, 0);

  const rows = inv.lines
    .map(
      (l) => `
    <tr>
      <td>${l.description}</td>
      <td style="text-align:center">${l.quantity}</td>
      <td style="text-align:right">$${l.unitPrice.toFixed(2)}</td>
      <td style="text-align:right">${l.discount}%</td>
      <td style="text-align:right">${l.taxRate}%</td>
      <td style="text-align:right">$${computeLineTotal(l).net.toFixed(2)}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice ${inv.invoiceNumber}</title>
<style>
  * { font-family: 'Segoe UI', Arial, sans-serif; }
  body { margin: 0; padding: 32px; color: #1e293b; }
  .invoice { max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0d9488; padding-bottom: 20px; margin-bottom: 24px; }
  .brand { font-size: 22px; font-weight: 700; color: #0d9488; }
  .brand-sub { font-size: 12px; color: #64748b; }
  .inv-num { font-size: 28px; font-weight: 700; color: #1e293b; }
  .inv-status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${inv.paymentStatus === "Paid" ? "#d1fae5" : inv.paymentStatus === "Overdue" ? "#fee2e2" : "#fef3c7"}; color: ${inv.paymentStatus === "Paid" ? "#065f46" : inv.paymentStatus === "Overdue" ? "#991b1b" : "#92400e"}; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .meta-box { background: #f8fafc; padding: 16px; border-radius: 8px; }
  .meta-label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 4px; }
  .meta-value { font-size: 14px; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #0d9488; color: white; padding: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; }
  th:first-child { text-align: left; }
  td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  td:first-child { text-align: left; }
  .totals { margin-left: auto; width: 320px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
  .totals-grand { border-top: 2px solid #0d9488; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 700; }
  .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } }
</style></head>
<body><div class="invoice">
  <div class="header">
    <div><div class="brand">Sahel Family Health Clinic</div><div class="brand-sub">Quality healthcare for the Sahel region</div></div>
    <div style="text-align:right"><div class="inv-num">${inv.invoiceNumber}</div><div class="inv-status">${inv.paymentStatus}</div></div>
  </div>
  <div class="meta">
    <div class="meta-box"><div class="meta-label">Patient</div><div class="meta-value">${pName}</div><div style="font-size:12px;color:#64748b;margin-top:2px">${patient.id} · ${patient.phone}</div></div>
    <div class="meta-box"><div class="meta-label">Clinician / Department</div><div class="meta-value">${clinicianName}</div><div style="font-size:12px;color:#64748b;margin-top:2px">${inv.department}</div></div>
    <div class="meta-box"><div class="meta-label">Invoice Date</div><div class="meta-value">${new Date(inv.date).toLocaleDateString("en-GB")}</div></div>
    <div class="meta-box"><div class="meta-label">Due Date</div><div class="meta-value">${new Date(inv.dueDate).toLocaleDateString("en-GB")}</div></div>
  </div>
  <table><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Disc</th><th>Tax</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>$${inv.subtotal.toFixed(2)}</span></div>
    <div class="totals-row"><span>Discount</span><span>-$${inv.discountTotal.toFixed(2)}</span></div>
    <div class="totals-row"><span>Tax</span><span>+$${inv.taxTotal.toFixed(2)}</span></div>
    <div class="totals-row"><span>Insurance Coverage</span><span>-$${inv.insuranceCovered.toFixed(2)}</span></div>
    <div class="totals-row totals-grand"><span>Grand Total</span><span>$${inv.grandTotal.toFixed(2)}</span></div>
    <div class="totals-row"><span>Amount Paid</span><span>$${totalPaid.toFixed(2)}</span></div>
    <div class="totals-row" style="font-weight:600;color:#0d9488"><span>Balance Due</span><span>$${inv.balance.toFixed(2)}</span></div>
  </div>
  <div class="footer">This is a computer-generated invoice from Sahel Family Health Clinic EHR System.<br/>Thank you for choosing our healthcare services.</div>
</div></body></html>`;
}

export function receiptPrintHTML(payment: Payment, invoice: Invoice, patient: Patient, cashier: User): string {
  const pName = `${patient.firstName} ${patient.lastName}`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt ${payment.receiptNumber}</title>
<style>
  * { font-family: 'Segoe UI', Arial, sans-serif; }
  body { margin: 0; padding: 32px; color: #1e293b; }
  .receipt { max-width: 480px; margin: 0 auto; border: 2px dashed #0d9488; border-radius: 12px; padding: 28px; }
  .center { text-align: center; }
  .brand { font-size: 20px; font-weight: 700; color: #0d9488; }
  .brand-sub { font-size: 11px; color: #64748b; margin-bottom: 16px; }
  .rnum { font-size: 24px; font-weight: 700; margin: 12px 0; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px dotted #e2e8f0; }
  .row:last-child { border-bottom: none; }
  .amount { font-size: 28px; font-weight: 700; color: #0d9488; text-align: center; margin: 16px 0; }
  .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; }
  .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; }
  @media print { body { padding: 0; } }
</style></head>
<body><div class="receipt">
  <div class="center"><div class="brand">Sahel Family Health Clinic</div><div class="brand-sub">Official Payment Receipt</div></div>
  <div class="rnum center">${payment.receiptNumber}</div>
  <div class="row"><span class="label">Date</span><span>${new Date(payment.date).toLocaleString("en-GB")}</span></div>
  <div class="row"><span class="label">Patient</span><span>${pName}</span></div>
  <div class="row"><span class="label">Invoice</span><span>${invoice.invoiceNumber}</span></div>
  <div class="row"><span class="label">Payment Method</span><span>${payment.method}</span></div>
  <div class="row"><span class="label">Reference</span><span>${payment.reference || "N/A"}</span></div>
  <div class="row"><span class="label">Cashier</span><span>${cashier.name}</span></div>
  <div class="amount">$${payment.amountPaid.toFixed(2)}</div>
  <div class="row"><span class="label">Invoice Total</span><span>$${invoice.grandTotal.toFixed(2)}</span></div>
  <div class="row"><span class="label">Balance After</span><span>$${payment.balanceAfter.toFixed(2)}</span></div>
  <div class="row"><span class="label">Notes</span><span>${payment.notes || "—"}</span></div>
  <div class="footer">This is a computer-generated receipt.<br/>Thank you for your payment.</div>
</div></body></html>`;
}

// ============================================================================
// Permission checks
// ============================================================================

export function canAccessBilling(role: UserRole): boolean {
  return role === "admin" || role === "finance" || role === "receptionist" || role === "physician" || role === "pharmacist" || role === "lab_tech";
}

export function canManageBilling(role: UserRole): boolean {
  return role === "admin" || role === "finance" || role === "receptionist";
}

export function canEditPayments(role: UserRole): boolean {
  return role === "admin" || role === "finance";
}

export function canDeleteFinancialRecords(role: UserRole): boolean {
  return role === "admin" || role === "finance";
}

export function canGenerateInvoice(role: UserRole): boolean {
  return role === "admin" || role === "finance" || role === "receptionist" || role === "physician" || role === "pharmacist" || role === "lab_tech";
}

// re-export for internal use
import type { InvoiceSource } from "./types";
import type { UserRole } from "./types";
