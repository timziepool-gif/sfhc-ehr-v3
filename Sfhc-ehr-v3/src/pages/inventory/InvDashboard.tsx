import { useMemo } from "react";
import { Package, AlertTriangle, XCircle, CalendarClock, CalendarX, ClipboardList, Wrench, Activity, TrendingUp, Truck } from "lucide-react";
import { useApp } from "@/lib/store";
import { KpiCard, PageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { BarChart, DonutChart } from "@/components/Charts";
import { currency, formatDate, relativeTime } from "@/lib/format";
import type { Route } from "@/components/Sidebar";

export default function InvDashboard({ onNavigate }: { onNavigate: (r: Route, params?: Record<string, string>) => void }) {
  const { generalInventory, procurementPOs, assets, suppliers, stockMovements, inventoryAlerts } = useApp();

  const stats = useMemo(() => {
    const totalValue = generalInventory.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    const lowStock = generalInventory.filter((i) => i.quantity > 0 && i.quantity < i.minimumStock);
    const outOfStock = generalInventory.filter((i) => i.quantity <= 0);
    const now = new Date();
    const expiring = generalInventory.filter((i) => {
      if (!i.expiryDate) return false;
      const days = Math.round((new Date(i.expiryDate).getTime() - now.getTime()) / 86400000);
      return days >= 0 && days <= 30;
    });
    const expired = generalInventory.filter((i) => i.expiryDate && new Date(i.expiryDate) < now);
    const pendingPOs = procurementPOs.filter((p) => p.status === "Submitted" || p.status === "Approved" || p.status === "Ordered");
    const assetsInService = assets.filter((a) => a.serviceStatus === "In Service");
    const assetsMaintenance = assets.filter((a) => a.serviceStatus === "Under Maintenance");
    return { totalValue, lowStock, outOfStock, expiring, expired, pendingPOs, assetsInService, assetsMaintenance };
  }, [generalInventory, procurementPOs, assets]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of generalInventory) {
      map.set(item.category, (map.get(item.category) ?? 0) + item.quantity * item.unitCost);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [generalInventory]);

  const deptData = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of generalInventory) {
      map.set(item.department, (map.get(item.department) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [generalInventory]);

  const recentMovements = useMemo(() => [...stockMovements].slice(0, 8), [stockMovements]);
  const activeAlerts = inventoryAlerts.filter((a) => !a.acknowledged);

  return (
    <div className="space-y-5">
      <PageHeader title="Inventory Dashboard" subtitle="Inventory, procurement and asset management overview" icon={<Package size={20} />} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Inventory Value" value={currency(stats.totalValue)} icon={<TrendingUp size={18} />} tone="teal" />
        <KpiCard label="Low Stock Items" value={stats.lowStock.length} icon={<AlertTriangle size={18} />} tone="amber" />
        <KpiCard label="Out of Stock" value={stats.outOfStock.length} icon={<XCircle size={18} />} tone="rose" />
        <KpiCard label="Expiring Soon" value={stats.expiring.length} icon={<CalendarClock size={18} />} tone="amber" />
        <KpiCard label="Expired Items" value={stats.expired.length} icon={<CalendarX size={18} />} tone="rose" />
        <KpiCard label="Pending POs" value={stats.pendingPOs.length} icon={<ClipboardList size={18} />} tone="blue" />
        <KpiCard label="Assets In Service" value={stats.assetsInService.length} icon={<Package size={18} />} tone="green" />
        <KpiCard label="Assets Under Maintenance" value={stats.assetsMaintenance.length} icon={<Wrench size={18} />} tone="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header"><p className="card-title">Inventory Value by Category</p></div>
          <div className="card-body"><BarChart data={categoryData} height={220} color="#0d9488" formatValue={(v) => `$${v.toFixed(0)}`} /></div>
        </div>
        <div className="card">
          <div className="card-header"><p className="card-title">Items by Department</p></div>
          <div className="card-body flex justify-center"><DonutChart data={deptData.map((d, i) => ({ ...d, color: `hsl(${i * 60}, 60%, 50%)` }))} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">
            <p className="card-title">Recent Stock Activity</p>
            <button className="text-xs text-teal-600 hover:underline" onClick={() => onNavigate("inv-adjustments")}>View all</button>
          </div>
          {recentMovements.length === 0 ? <EmptyState title="No stock movements" /> : (
            <div className="divide-y divide-slate-50">
              {recentMovements.map((m) => (
                <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><Activity size={14} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{m.itemName}</p>
                    <p className="text-xs text-slate-500 truncate">{m.movementType} · {m.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold tabular-nums">{m.movementType === "Received" ? "+" : "-"}{m.quantity}</span>
                    <p className="text-xs text-slate-400">{relativeTime(m.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <p className="card-title">Active Stock Alerts</p>
            <span className="text-xs text-slate-400">{activeAlerts.length} active</span>
          </div>
          {activeAlerts.length === 0 ? <EmptyState title="No active alerts" description="Inventory levels are healthy." /> : (
            <div className="divide-y divide-slate-50">
              {activeAlerts.slice(0, 8).map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.severity === "danger" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                    <AlertTriangle size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{a.itemName}</p>
                    <p className="text-xs text-slate-500 truncate">{a.message}</p>
                  </div>
                  <span className={`badge-${a.severity === "danger" ? "rose" : "amber"}`}>{a.kind}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <p className="card-title">Supplier Activity</p>
          <Truck size={16} className="text-teal-600" />
        </div>
        {suppliers.length === 0 ? <EmptyState title="No suppliers" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Supplier</th><th>Contact</th><th>Products</th><th>Rating</th><th>Contract</th><th>Orders</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.slice(0, 5).map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-slate-900">{s.name}</td>
                    <td className="text-sm text-slate-500">{s.contactPerson}</td>
                    <td className="text-sm text-slate-500">{s.productsSupplied.join(", ")}</td>
                    <td><span className="text-sm font-medium text-amber-600">{"★".repeat(Math.round(s.performanceRating))}</span></td>
                    <td><StatusBadge status={s.contractStatus} /></td>
                    <td className="text-sm tabular-nums">{s.purchaseHistory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
