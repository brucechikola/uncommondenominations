import { useState } from "react";
import { useLocation } from "wouter";
import { useCourierAuthStore } from "@/lib/store";
import { Truck, Eye, EyeOff, Loader2 } from "lucide-react";

export default function CourierLogin() {
  const [, navigate] = useLocation();
  const { setAuth } = useCourierAuthStore();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/courier/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      setAuth(data.token, data.courier);
      navigate("/courier");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(34,211,238,0.1)", border: "1.5px solid rgba(34,211,238,0.3)" }}>
            <Truck className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Courier Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Uncommon Denominators Deliveries</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              autoComplete="tel"
              placeholder="0970 000 000"
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-600 transition-colors text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••"
                className="w-full px-4 py-3 pr-11 rounded-xl bg-white border border-slate-200 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-600 transition-colors text-base"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 bg-cyan-700 hover:bg-cyan-600"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-8">
          Authorised couriers only — contact admin for access
        </p>
      </div>
    </div>
  );
}
