import { useEffect, useMemo, useState } from "react";
import { AppProvider, useApp } from "@/lib/store";
import Login from "@/components/Login";
import Sidebar, { Header, type Route } from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import PatientDetail from "@/pages/PatientDetail";
import Appointments from "@/pages/Appointments";
import Clinical from "@/pages/Clinical";
import Labs from "@/pages/Labs";
import PharmacyDashboard from "@/pages/pharmacy/PharmacyDashboard";
import Prescriptions from "@/pages/pharmacy/Prescriptions";
import Dispensing from "@/pages/pharmacy/Dispensing";
import Inventory from "@/pages/pharmacy/Inventory";
import PurchaseOrders from "@/pages/pharmacy/PurchaseOrders";
import StockAlerts from "@/pages/pharmacy/StockAlerts";
import ControlledDrugs from "@/pages/pharmacy/ControlledDrugs";
import MedicationHistory from "@/pages/pharmacy/MedicationHistory";
import MedicationCatalogue from "@/pages/pharmacy/MedicationCatalogue";
import BillingDashboard from "@/pages/billing/BillingDashboard";
import Invoices from "@/pages/billing/Invoices";
import Insurance from "@/pages/billing/Insurance";
import Payments from "@/pages/billing/Payments";
import RevenueReports from "@/pages/billing/RevenueReports";
import Claims from "@/pages/billing/Claims";
import PricingCatalogue from "@/pages/billing/PricingCatalogue";
import InvDashboard from "@/pages/inventory/InvDashboard";
import InvMedical from "@/pages/inventory/InvMedical";
import InvLaboratory from "@/pages/inventory/InvLaboratory";
import InvPharmacy from "@/pages/inventory/InvPharmacy";
import InvProcurement from "@/pages/inventory/InvProcurement";
import InvSuppliers from "@/pages/inventory/InvSuppliers";
import InvAdjustments from "@/pages/inventory/InvAdjustments";
import InvTransfers from "@/pages/inventory/InvTransfers";
import InvAssets from "@/pages/inventory/InvAssets";
import AdminStaff from "@/pages/admin/AdminStaff";
import AdminDepartments from "@/pages/admin/AdminDepartments";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminRoles from "@/pages/admin/AdminRoles";
import AdminAttendance from "@/pages/admin/AdminAttendance";
import AdminLeave from "@/pages/admin/AdminLeave";
import AdminSchedule from "@/pages/admin/AdminSchedule";
import AdminAudit from "@/pages/admin/AdminAudit";
import AdminSettings from "@/pages/admin/AdminSettings";
import PatientPortal from "@/pages/portal/PatientPortal";
import Telemedicine from "@/pages/portal/Telemedicine";
import Messaging from "@/pages/portal/Messaging";
import Reports from "@/pages/analytics/Reports";
import ExecutiveDashboard from "@/pages/analytics/ExecutiveDashboard";
import Referrals from "@/pages/Referrals";

const ROUTE_TITLES: Record<Route, string> = {
  dashboard: "SFHC EHR Dashboard",
  patients: "Patient Management",
  "patient-detail": "Patient Profile",
  appointments: "Appointment Management",
  clinical: "Clinical Documentation",
  soap: "Clinical Documentation",
  labs: "Laboratory Information System",
  "pharmacy-dashboard": "Pharmacy Dashboard",
  prescriptions: "Prescriptions",
  dispensing: "Medication Dispensing",
  inventory: "Drug Inventory",
  "purchase-orders": "Purchase Orders",
  "stock-alerts": "Stock Alerts",
  "controlled-drugs": "Controlled Drugs Register",
  "medication-history": "Medication History",
  medications: "Medication Catalogue",
  "billing-dashboard": "Billing Dashboard",
  invoices: "Patient Invoices",
  insurance: "Insurance / HMO",
  payments: "Payments",
  "revenue-reports": "Revenue Reports",
  claims: "Claims Management",
  "pricing-catalogue": "Pricing Catalogue",
  "inv-dashboard": "Inventory Dashboard",
  "inv-medical": "Medical Inventory",
  "inv-laboratory": "Laboratory Inventory",
  "inv-pharmacy": "Pharmacy Inventory",
  "inv-procurement": "Procurement",
  "inv-suppliers": "Suppliers",
  "inv-adjustments": "Stock Adjustments",
  "inv-transfers": "Stock Transfers",
  "inv-assets": "Asset Management",
  "admin-staff": "Staff Directory",
  "admin-departments": "Departments",
  "admin-users": "User Management",
  "admin-roles": "Roles & Permissions",
  "admin-attendance": "Attendance",
  "admin-leave": "Leave Management",
  "admin-schedule": "Staff Schedule",
  "admin-audit": "Audit Logs",
  "admin-settings": "System Settings",
  "patient-portal": "Patient Portal",
  "telemedicine": "Telemedicine",
  "messaging": "Secure Messaging",
  "reports": "Reports & Analytics",
  "executive-dashboard": "Executive Dashboard",
  referrals: "Referrals",
};

function Shell() {
  const { currentUser, refreshAlerts } = useApp();
  const [route, setRoute] = useState<Route>("dashboard");
  const [params, setParams] = useState<Record<string, string>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  function navigate(r: Route, p: Record<string, string> = {}) {
    setRoute(r);
    setParams(p);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    refreshAlerts();
  }, [refreshAlerts]);

  const title = ROUTE_TITLES[route];

  const page = useMemo(() => {
    switch (route) {
      case "dashboard": return <Dashboard onNavigate={navigate} />;
      case "patients": return <Patients onNavigate={navigate} />;
      case "patient-detail": return <PatientDetail patientId={params.id ?? ""} onNavigate={navigate} onBack={() => navigate("patients")} />;
      case "appointments": return <Appointments onNavigate={navigate} />;
      case "clinical":
      case "soap": return <Clinical onNavigate={navigate} />;
      case "labs": return <Labs onNavigate={navigate} />;
      case "pharmacy-dashboard": return <PharmacyDashboard onNavigate={navigate} />;
      case "prescriptions": return <Prescriptions onNavigate={navigate} />;
      case "dispensing": return <Dispensing initialRxId={params.rxId} onNavigate={navigate} />;
      case "inventory": return <Inventory />;
      case "purchase-orders": return <PurchaseOrders onNavigate={navigate} />;
      case "stock-alerts": return <StockAlerts />;
      case "controlled-drugs": return <ControlledDrugs />;
      case "medication-history": return <MedicationHistory onNavigate={navigate} />;
      case "medications": return <MedicationCatalogue />;
      case "billing-dashboard": return <BillingDashboard onNavigate={navigate} />;
      case "invoices": return <Invoices onNavigate={navigate} />;
      case "insurance": return <Insurance />;
      case "payments": return <Payments onNavigate={navigate} />;
      case "revenue-reports": return <RevenueReports />;
      case "claims": return <Claims onNavigate={navigate} />;
      case "pricing-catalogue": return <PricingCatalogue />;
      // M8: Inventory
      case "inv-dashboard": return <InvDashboard onNavigate={navigate} />;
      case "inv-medical": return <InvMedical />;
      case "inv-laboratory": return <InvLaboratory />;
      case "inv-pharmacy": return <InvPharmacy />;
      case "inv-procurement": return <InvProcurement onNavigate={navigate} />;
      case "inv-suppliers": return <InvSuppliers />;
      case "inv-adjustments": return <InvAdjustments />;
      case "inv-transfers": return <InvTransfers />;
      case "inv-assets": return <InvAssets />;
      // M9: Administration
      case "admin-staff": return <AdminStaff />;
      case "admin-departments": return <AdminDepartments />;
      case "admin-users": return <AdminUsers />;
      case "admin-roles": return <AdminRoles />;
      case "admin-attendance": return <AdminAttendance />;
      case "admin-leave": return <AdminLeave />;
      case "admin-schedule": return <AdminSchedule />;
      case "admin-audit": return <AdminAudit />;
      case "admin-settings": return <AdminSettings />;
      // M10: Portal & Telemedicine
      case "patient-portal": return <PatientPortal onNavigate={navigate} />;
      case "telemedicine": return <Telemedicine onNavigate={navigate} />;
      case "messaging": return <Messaging />;
      // M11: Analytics
      case "reports": return <Reports />;
      case "executive-dashboard": return <ExecutiveDashboard onNavigate={navigate} />;
      case "referrals": return <Referrals onNavigate={navigate} />;
      default: return <Dashboard onNavigate={navigate} />;
    }
  }, [route, params]);

  if (!currentUser) return <Login />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar route={route} onNavigate={navigate} collapsed={false} onToggleCollapse={() => {}} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header title={title} onOpenMobile={() => setMobileOpen(true)} onGlobalSearch={setSearch} searchValue={search} onNavigate={navigate} />
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          <div key={route + JSON.stringify(params)} className="animate-fade-in">
            {page}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
