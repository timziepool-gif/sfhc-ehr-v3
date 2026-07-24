import { useState } from "react";
import { HeartPulse, Lock, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useApp } from "@/lib/store";

export default function Login() {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const user = login(email, password);
      if (!user) {
        setError("Invalid email or password. Try one of the demo accounts below.");
      }
      setLoading(false);
    }, 300);
  }

  function quick(email: string, pw: string) {
    setEmail(email);
    setPassword(pw);
    setError("");
    setLoading(true);
    setTimeout(() => {
      const user = login(email, pw);
      if (!user) setError("Could not sign in with selected demo account.");
      setLoading(false);
    }, 200);
  }

  const demos = [
    { label: "Administrator", email: "admin@sfhc.org", pw: "admin123" },
    { label: "Physician", email: "fatou@sfhc.org", pw: "doc123" },
    { label: "Pharmacist", email: "pharmacy@sfhc.org", pw: "pharm123" },
    { label: "Lab Tech", email: "lab@sfhc.org", pw: "lab123" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 20% 30%, #0d9488 0%, transparent 50%), radial-gradient(circle at 80% 70%, #0891b2 0%, transparent 50%)" }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <HeartPulse size={24} className="text-white" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">Sahel Family Health Clinic</p>
              <p className="text-xs text-slate-400">Electronic Health Record System</p>
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight leading-tight">
              Comprehensive care,<br />
              <span className="text-teal-400">one unified record.</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-md leading-relaxed">
              An integrated EHR spanning patient management, appointments, clinical documentation,
              laboratory services, pharmacy, billing, inventory, telemedicine, and administration.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-md pt-4">
              {["Patient Management", "Appointments", "Clinical Documentation", "Laboratory", "Pharmacy & Dispensing", "Controlled Drugs"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">A fictional educational project. Not for clinical use.</p>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <HeartPulse size={22} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">SFHC EHR</p>
              <p className="text-xs text-slate-500">Sahel Family Health Clinic</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="text-sm text-slate-500 mt-1">Sign in to access the EHR dashboard.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-3 text-sm text-rose-700 animate-fade-in">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="you@sfhc.org"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Demo accounts — one click</p>
            <div className="grid grid-cols-2 gap-2">
              {demos.map((d) => (
                <button
                  key={d.email}
                  onClick={() => quick(d.email, d.pw)}
                  className="text-left rounded-lg border border-slate-200 px-3 py-2.5 hover:border-teal-400 hover:bg-teal-50/50 transition-colors"
                >
                  <p className="text-sm font-medium text-slate-800">{d.label}</p>
                  <p className="text-[11px] text-slate-500 truncate">{d.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
