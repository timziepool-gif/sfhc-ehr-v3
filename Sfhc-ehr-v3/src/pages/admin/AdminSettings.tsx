import { useState } from "react";
import { Settings, Save, Building2, Bell, Palette, Database, Calendar, Globe, Clock, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/ui";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDate } from "@/lib/format";
import Modal from "@/components/Modal";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AdminSettings() {
  const { systemSettings, updateSystemSettings, businessHours, updateBusinessHours, holidays, addHoliday, deleteHoliday } = useApp();
  const [form, setForm] = useState(systemSettings);
  const [bh, setBh] = useState(businessHours);
  const [saved, setSaved] = useState(false);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [deleteHolidayId, setDeleteHolidayId] = useState<string | null>(null);
  const [newHoliday, setNewHoliday] = useState<{ name: string; date: string; type: "Public Holiday" | "Clinic Holiday" | "Half Day"; notes: string }>({ name: "", date: "", type: "Public Holiday", notes: "" });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings(form);
    updateBusinessHours(bh);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="System Settings" subtitle="Configure clinic, branding, and system preferences" icon={<Settings size={20} />} />

      <form onSubmit={handleSave} className="space-y-5">
        {/* Clinic Profile */}
        <div className="card">
          <div className="card-header"><div className="flex items-center gap-2"><Building2 size={18} className="text-teal-600" /><p className="card-title">Clinic Profile</p></div></div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Clinic Name</label><input className="input" value={form.clinicName} onChange={(e) => setForm({ ...form, clinicName: e.target.value })} /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Phone</label><input className="input" value={form.clinicPhone} onChange={(e) => setForm({ ...form, clinicPhone: e.target.value })} /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Email</label><input type="email" className="input" value={form.clinicEmail} onChange={(e) => setForm({ ...form, clinicEmail: e.target.value })} /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Website</label><input className="input" value={form.clinicWebsite} onChange={(e) => setForm({ ...form, clinicWebsite: e.target.value })} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Address</label><input className="input" value={form.clinicAddress} onChange={(e) => setForm({ ...form, clinicAddress: e.target.value })} /></div>
          </div>
        </div>

        {/* Branding */}
        <div className="card">
          <div className="card-header"><div className="flex items-center gap-2"><ImageIcon size={18} className="text-teal-600" /><p className="card-title">Branding</p></div></div>
          <div className="card-body">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">{form.clinicName[0] ?? "S"}</div>
              <div>
                <button type="button" className="btn-secondary btn-sm"><ImageIcon size={14} /> Upload Logo (placeholder)</button>
                <p className="text-xs text-slate-500 mt-2">Logo upload is a placeholder. The clinic name initial is used as the logo.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="card">
          <div className="card-header"><p className="card-title">Financial Settings</p></div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Currency</label><select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}><option>USD</option><option>NGN</option><option>EUR</option><option>GBP</option></select></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Tax Rate (%)</label><input type="number" step="0.1" className="input" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: +e.target.value })} /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Backup Frequency</label><select className="input" value={form.backupFrequency} onChange={(e) => setForm({ ...form, backupFrequency: e.target.value })}><option>Daily</option><option>Weekly</option><option>Monthly</option></select></div>
          </div>
        </div>

        {/* Notification & Alert Settings */}
        <div className="card">
          <div className="card-header"><div className="flex items-center gap-2"><Bell size={18} className="text-teal-600" /><p className="card-title">Notification & Alert Settings</p></div></div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Low Stock Threshold</label><input type="number" className="input" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: +e.target.value })} /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Expiry Alert (days)</label><input type="number" className="input" value={form.expiryAlertDays} onChange={(e) => setForm({ ...form, expiryAlertDays: +e.target.value })} /></div>
            <div className="flex items-end"><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.emailNotifications} onChange={(e) => setForm({ ...form, emailNotifications: e.target.checked })} /> Email Notifications</label></div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="card">
          <div className="card-header"><div className="flex items-center gap-2"><Clock size={18} className="text-teal-600" /><p className="card-title">Business Hours</p></div></div>
          <div className="card-body space-y-2">
            {DAYS.map((day, i) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 w-24">{DAY_LABELS[i]}</span>
                <label className="flex items-center gap-1.5 text-sm text-slate-500">
                  <input type="checkbox" checked={!bh[day].closed} onChange={(e) => setBh({ ...bh, [day]: { ...bh[day], closed: !e.target.checked } })} /> Open
                </label>
                {!bh[day].closed && (
                  <div className="flex items-center gap-2">
                    <input type="time" className="input w-28" value={bh[day].open} onChange={(e) => setBh({ ...bh, [day]: { ...bh[day], open: e.target.value } })} />
                    <span className="text-slate-400 text-sm">to</span>
                    <input type="time" className="input w-28" value={bh[day].close} onChange={(e) => setBh({ ...bh, [day]: { ...bh[day], close: e.target.value } })} />
                  </div>
                )}
                {bh[day].closed && <span className="text-sm text-slate-400">Closed</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Holiday Calendar */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2"><Calendar size={18} className="text-teal-600" /><p className="card-title">Holiday Calendar</p></div>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setShowHolidayForm(true)}><Plus size={14} /> Add Holiday</button>
          </div>
          {holidays.length === 0 ? <EmptyState title="No holidays configured" /> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Name</th><th>Date</th><th>Type</th><th>Notes</th><th>Actions</th></tr></thead>
                <tbody>
                  {holidays.map((h) => (
                    <tr key={h.id}>
                      <td className="font-medium text-slate-900">{h.name}</td>
                      <td className="text-sm text-slate-500">{formatDate(h.date)}</td>
                      <td><span className="badge-amber">{h.type}</span></td>
                      <td className="text-sm text-slate-500">{h.notes}</td>
                      <td><button className="btn-ghost btn-sm text-rose-600" onClick={() => setDeleteHolidayId(h.id)}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Theme & Language */}
        <div className="card">
          <div className="card-header"><div className="flex items-center gap-2"><Palette size={18} className="text-teal-600" /><p className="card-title">Theme & Localization</p></div></div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Theme</label><select className="input" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value as "light" | "dark" })}><option value="light">Light</option><option value="dark">Dark (coming soon)</option></select></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Language</label><select className="input" defaultValue="en"><option value="en">English</option><option value="fr">French (placeholder)</option><option value="ha">Hausa (placeholder)</option></select></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Time Zone</label><select className="input" defaultValue="Africa/Lagos"><option>Africa/Lagos</option><option>Africa/Abuja</option><option>UTC</option></select></div>
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="card">
          <div className="card-header"><div className="flex items-center gap-2"><Database size={18} className="text-teal-600" /><p className="card-title">Backup & Restore (Placeholder)</p></div></div>
          <div className="card-body space-y-3">
            <p className="text-sm text-slate-500">Data is stored in browser localStorage. Backup and restore to external storage will be available in a future update.</p>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary btn-sm" onClick={() => alert("Backup is a mock in this demo.")}><Database size={14} /> Backup Now</button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => alert("Restore is a mock in this demo.")}><Database size={14} /> Restore</button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {saved && <span className="text-sm text-teal-600 self-center">Settings saved!</span>}
          <button type="submit" className="btn-primary"><Save size={16} /> Save Settings</button>
        </div>
      </form>

      {showHolidayForm && (
        <Modal open onClose={() => setShowHolidayForm(false)} title="Add Holiday" size="md">
          <form onSubmit={(e) => { e.preventDefault(); addHoliday(newHoliday); setShowHolidayForm(false); setNewHoliday({ name: "", date: "", type: "Public Holiday", notes: "" }); }} className="space-y-4">
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Name</label><input className="input" value={newHoliday.name} onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })} required /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Date</label><input type="date" className="input" value={newHoliday.date} onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })} required /></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Type</label><select className="input" value={newHoliday.type} onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value as "Public Holiday" | "Clinic Holiday" | "Half Day" })}><option>Public Holiday</option><option>Clinic Holiday</option><option>Half Day</option></select></div>
            <div><label className="block text-xs font-medium text-slate-600 mb-1">Notes</label><input className="input" value={newHoliday.notes} onChange={(e) => setNewHoliday({ ...newHoliday, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn-secondary" onClick={() => setShowHolidayForm(false)}>Cancel</button><button type="submit" className="btn-primary">Add Holiday</button></div>
          </form>
        </Modal>
      )}

      <ConfirmDialog open={!!deleteHolidayId} title="Delete Holiday" message="Delete this holiday?" onConfirm={() => { if (deleteHolidayId) deleteHoliday(deleteHolidayId); setDeleteHolidayId(null); }} onCancel={() => setDeleteHolidayId(null)} />
    </div>
  );
}
