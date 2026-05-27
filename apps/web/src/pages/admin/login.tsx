import { useLocation } from "wouter";
import { useAdminAuthStore } from "@/lib/store";
import { useAdminLogin } from "@workspace/api-client-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const setToken = useAdminAuthStore((s) => s.setToken);
  const adminLogin = useAdminLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const result = await adminLogin.mutateAsync({ data: { username, password } });
      setToken(result.token);
      navigate("/admin");
    } catch {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">

        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#8d6b3d]/10 mb-6 mx-auto border border-[#8d6b3d]/20">
          <Lock className="h-5 w-5 text-[#8d6b3d]" />
        </div>

        <h1 className="font-serif text-2xl font-bold text-center text-slate-800 mb-1">Admin Login</h1>
        <p className="text-sm text-slate-500 text-center mb-8">Uncommon Denominators — Dashboard</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 uppercase">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#8d6b3d] focus:ring-1 focus:ring-[#8d6b3d]/30 text-sm transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#8d6b3d] focus:ring-1 focus:ring-[#8d6b3d]/30 text-sm transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={adminLogin.isPending}
            className="w-full py-3 rounded-xl font-medium text-sm bg-[#8d6b3d] text-white hover:bg-[#7a5c34] disabled:opacity-50 transition-colors"
          >
            {adminLogin.isPending ? "Logging in…" : "Log In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
