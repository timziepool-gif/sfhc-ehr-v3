import { type ReactNode, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  FlaskConical,
  Pill,
  HeartPulse,
  LogOut,
  ChevronDown,
  Bell,
  Search,
  Menu,
  X,
  Receipt,
  CreditCard,
  ShieldCheck,
  BarChart3,
  FileText,
  Banknote,
  Package,
  Truck,
  Warehouse,
  ArrowLeftRight,
  Boxes,
  Wrench,
  ClipboardList,
  Building2,
  UserCog,
  KeyRound,
  Clock,
  CalendarClock,
  CalendarRange,
  ScrollText,
  Settings,
  Video,
  MessageSquare,
  Monitor,
  TrendingUp,
  FileBarChart,
  Send,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { computeAlerts } from "@/lib/store";

export type Route =
  | "dashboard"
  | "patients"
  | "patient-detail"
  | "appointments"
  | "clinical"
  | "soap"
  | "labs"
  | "pharmacy-dashboard"
  | "prescriptions"
  | "dispensing"
  | "inventory"
  | "purchase-orders"
  | "stock-alerts"
  | "controlled-drugs"
  | "medication-history"
  | "medications"
  | "billing-dashboard"
  | "invoices"
  | "insurance"
  | "payments"
  | "revenue-reports"
  | "claims"
  | "pricing-catalogue"
  // M8: Inventory
  | "inv-dashboard"
  | "inv-medical"
  | "inv-laboratory"
  | "inv-pharmacy"
  | "inv-procurement"
  | "inv-suppliers"
  | "inv-adjustments"
  | "inv-transfers"
  | "inv-assets"
  // M9: Administration
  | "admin-staff"
  | "admin-departments"
  | "admin-users"
  | "admin-roles"
  | "admin-attendance"
  | "admin-leave"
  | "admin-schedule"
  | "admin-audit"
  | "admin-settings"
  // M10: Patient Portal, Telemedicine, Messaging
  | "patient-portal"
  | "telemedicine"
  | "messaging"
  // M11: Reporting, Executive Dashboard
  | "reports"
  | "executive-dashboard"
  // M12: Referrals
  | "referrals";

export interface NavItem {
  id: Route;
  label: string;
  icon: ReactNode;
  badge?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  route: Route;
  onNavigate: (r: Route, params?: Record<string, string>) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ route, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  const { inventory, prescriptions, currentUser, logout, invoices, claims, insurancePolicies } = useApp();
  const lowStock = inventory.filter((i) => i.quantity <= i.reorderLevel).length;
  const pendingRx = prescriptions.filter((p) => p.status === "Pending").length;
  const alerts = computeAlerts(inventory).filter((a) => !a.acknowledged).length;
  const outstandingInvoices = invoices.filter((i) => i.balance > 0).length;
  const pendingClaims = claims.filter((c) => c.status === "Submitted" || c.status === "Under Review").length;

  const sections: NavSection[] = [
    {
      title: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
      ],
    },
    {
      title: "Clinical",
      items: [
        { id: "patients", label: "Patients", icon: <Users size={18} /> },
        { id: "appointments", label: "Appointments", icon: <CalendarDays size={18} /> },
        { id: "clinical", label: "Clinical Docs", icon: <Stethoscope size={18} /> },
        { id: "labs", label: "Laboratory", icon: <FlaskConical size={18} /> },
        { id: "referrals", label: "Referrals", icon: <Send size={18} /> },
      ],
    },
    {
      title: "Pharmacy",
      items: [
        { id: "pharmacy-dashboard", label: "Pharmacy Dashboard", icon: <Pill size={18} /> },
        { id: "prescriptions", label: "Prescriptions", icon: <HeartPulse size={18} />, badge: pendingRx },
        { id: "dispensing", label: "Medication Dispensing", icon: <Pill size={18} /> },
        { id: "inventory", label: "Drug Inventory", icon: <Pill size={18} />, badge: lowStock },
        { id: "purchase-orders", label: "Purchase Orders", icon: <Pill size={18} /> },
        { id: "stock-alerts", label: "Stock Alerts", icon: <Bell size={18} />, badge: alerts },
        { id: "controlled-drugs", label: "Controlled Drugs", icon: <Pill size={18} /> },
        { id: "medication-history", label: "Medication History", icon: <Pill size={18} /> },
        { id: "medications", label: "Medication Catalogue", icon: <Pill size={18} /> },
      ],
    },
    {
      title: "Billing",
      items: [
        { id: "billing-dashboard", label: "Billing Dashboard", icon: <BarChart3 size={18} /> },
        { id: "invoices", label: "Patient Invoices", icon: <FileText size={18} />, badge: outstandingInvoices },
        { id: "insurance", label: "Insurance / HMO", icon: <ShieldCheck size={18} /> },
        { id: "payments", label: "Payments", icon: <CreditCard size={18} /> },
        { id: "revenue-reports", label: "Revenue Reports", icon: <BarChart3 size={18} /> },
        { id: "claims", label: "Claims Management", icon: <Receipt size={18} />, badge: pendingClaims },
        { id: "pricing-catalogue", label: "Pricing Catalogue", icon: <Banknote size={18} /> },
      ],
    },
    {
      title: "Inventory",
      items: [
        { id: "inv-dashboard", label: "Inventory Dashboard", icon: <BarChart3 size={18} /> },
        { id: "inv-medical", label: "Medical Inventory", icon: <Boxes size={18} /> },
        { id: "inv-laboratory", label: "Laboratory Inventory", icon: <FlaskConical size={18} /> },
        { id: "inv-pharmacy", label: "Pharmacy Inventory", icon: <Pill size={18} /> },
        { id: "inv-procurement", label: "Procurement", icon: <ClipboardList size={18} /> },
        { id: "inv-suppliers", label: "Suppliers", icon: <Truck size={18} /> },
        { id: "inv-adjustments", label: "Stock Adjustments", icon: <Package size={18} /> },
        { id: "inv-transfers", label: "Stock Transfers", icon: <ArrowLeftRight size={18} /> },
        { id: "inv-assets", label: "Asset Management", icon: <Wrench size={18} /> },
      ],
    },
    {
      title: "Administration",
      items: [
        { id: "admin-staff", label: "Staff Directory", icon: <Users size={18} /> },
        { id: "admin-departments", label: "Departments", icon: <Building2 size={18} /> },
        { id: "admin-users", label: "User Management", icon: <UserCog size={18} /> },
        { id: "admin-roles", label: "Roles & Permissions", icon: <KeyRound size={18} /> },
        { id: "admin-attendance", label: "Attendance", icon: <Clock size={18} /> },
        { id: "admin-leave", label: "Leave Management", icon: <CalendarClock size={18} /> },
        { id: "admin-schedule", label: "Staff Schedule", icon: <CalendarRange size={18} /> },
        { id: "admin-audit", label: "Audit Logs", icon: <ScrollText size={18} /> },
        { id: "admin-settings", label: "System Settings", icon: <Settings size={18} /> },
      ],
    },
    {
      title: "Portal & Telemedicine",
      items: [
        { id: "patient-portal", label: "Patient Portal", icon: <Monitor size={18} /> },
        { id: "telemedicine", label: "Telemedicine", icon: <Video size={18} /> },
        { id: "messaging", label: "Messaging", icon: <MessageSquare size={18} /> },
      ],
    },
    {
      title: "Analytics",
      items: [
        { id: "executive-dashboard", label: "Executive Dashboard", icon: <TrendingUp size={18} /> },
        { id: "reports", label: "Reports & Analytics", icon: <FileBarChart size={18} /> },
      ],
    },
  ];

  const isActive = (r: Route) => {
    if (r === "patient-detail") return route === "patient-detail" || route === "patients";
    return route === r;
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} aria-hidden />
      )}
      <aside
        className={`fixed lg:sticky top-0 z-40 lg:z-10 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ flexShrink: 0 }}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <HeartPulse size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white tracking-tight truncate">SFHC EHR</p>
            <p className="text-[11px] text-slate-400 truncate">Sahel Family Health Clinic</p>
          </div>
          <button className="ml-auto lg:hidden text-slate-400 hover:text-white" onClick={onCloseMobile} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{section.title}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-teal-600/90 text-white font-medium shadow-sm"
                          : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
                      }`}
                    >
                      <span className={active ? "text-white" : "text-slate-400"}>{item.icon}</span>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {typeof item.badge === "number" && item.badge > 0 && (
                        <span className={`rounded-full text-[10px] font-semibold px-1.5 py-0.5 ${active ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-400"}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-slate-800/80 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
              style={{ backgroundColor: currentUser?.avatarColor ?? "#0d9488" }}
            >
              {currentUser?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
              <p className="text-[11px] text-slate-400 capitalize truncate">{currentUser?.role.replace("_", " ")}</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-rose-400 hover:bg-slate-800 p-1.5 rounded-lg transition-colors" aria-label="Sign out" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ----------------------------------------------------------------------------
// Header
// ----------------------------------------------------------------------------

interface HeaderProps {
  title: string;
  onOpenMobile: () => void;
  onGlobalSearch: (q: string) => void;
  searchValue: string;
  onNavigate: (r: Route, params?: Record<string, string>) => void;
}

export function Header({ title, onOpenMobile, onGlobalSearch, searchValue, onNavigate }: HeaderProps) {
  const { inventory, currentUser, globalSearch, notifications, markNotificationRead, markAllNotificationsRead, refreshNotifications } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const alertCount = computeAlerts(inventory).filter((a) => !a.acknowledged).length;
  const recentAlerts = computeAlerts(inventory).slice(0, 5);
  const unreadNotifs = notifications.filter((n) => !n.read);
  const recentNotifs = notifications.slice(0, 8);
  const searchResults = searchValue.trim().length >= 2 ? globalSearch(searchValue) : [];

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-16">
        <button className="lg:hidden text-slate-600 hover:bg-slate-100 p-2 rounded-lg" onClick={onOpenMobile} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-slate-900 tracking-tight hidden sm:block">{title}</h1>

        <div className="flex-1 max-w-md mx-auto hidden md:block">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onGlobalSearch(e.target.value)}
              placeholder="Search patients, meds, inventory, staff…"
              className="input pl-9 py-2"
            />
            {searchResults.length > 0 && (
              <div className="absolute mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-80 overflow-y-auto animate-scale-in">
                {searchResults.map((r) => (
                  <button key={`${r.type}-${r.id}`} onClick={() => { onGlobalSearch(""); onNavigate(r.route as Route, r.routeParams); }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="badge-teal text-xs shrink-0">{r.type}</span>
                      <div className="min-w-0"><p className="text-sm font-medium text-slate-900 truncate">{r.title}</p><p className="text-xs text-slate-500 truncate">{r.subtitle}</p></div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => { setNotifOpen((v) => !v); refreshNotifications(); }}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {(alertCount > 0 || unreadNotifs.length > 0) && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center">
                  {alertCount + unreadNotifs.length}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-scale-in overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Notification Center</p>
                  <div className="flex items-center gap-2">
                    {unreadNotifs.length > 0 && <button onClick={() => markAllNotificationsRead()} className="text-xs text-teal-600 hover:underline">Mark all read</button>}
                    <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {recentNotifs.length === 0 && recentAlerts.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-slate-500 text-center">No new notifications</p>
                  ) : (
                    <>
                      {recentNotifs.map((n) => (
                        <button key={n.id} onClick={() => { markNotificationRead(n.id); if (n.linkRoute) { onNavigate(n.linkRoute as Route, n.linkParams); setNotifOpen(false); } }}
                          className={`w-full px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 text-left ${!n.read ? "bg-teal-50/50" : ""}`}>
                          <div className="flex items-start gap-2">
                            <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.severity === "danger" ? "bg-rose-500" : n.severity === "warning" ? "bg-amber-500" : n.severity === "success" ? "bg-green-500" : "bg-blue-400"}`} />
                            <div className="min-w-0"><p className="text-sm font-medium text-slate-900 truncate">{n.title}</p><p className="text-xs text-slate-500">{n.message}</p><p className="text-xs text-slate-400 mt-0.5">{n.kind}</p></div>
                          </div>
                        </button>
                      ))}
                      {recentAlerts.length > 0 && (
                        <div className="px-4 py-2 bg-slate-50"><p className="text-xs font-medium text-slate-600 mb-1">Pharmacy Alerts</p></div>
                      )}
                      {recentAlerts.map((a) => (
                        <div key={a.id} className="px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                          <div className="flex items-start gap-2">
                            <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${a.severity === "danger" ? "bg-rose-500" : "bg-amber-500"}`} />
                            <div className="min-w-0"><p className="text-sm text-slate-800 truncate">{a.drugName}</p><p className="text-xs text-slate-500">{a.message}</p></div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pl-2 ml-1 border-l border-slate-200">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{ backgroundColor: currentUser?.avatarColor ?? "#0d9488" }}
            >
              {currentUser?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-slate-900 leading-tight">{currentUser?.name}</p>
              <p className="text-[11px] text-slate-500 capitalize leading-tight">{currentUser?.role.replace("_", " ")}</p>
            </div>
            <ChevronDown size={14} className="hidden sm:block text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
