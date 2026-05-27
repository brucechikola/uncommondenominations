import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuthStore } from "@/lib/store";
import { AdminLayout } from "./layout";
import { D, STATUS_COLORS } from "./_shared";
import { cn } from "@/lib/utils";
import { UserPlus, Power, PowerOff, KeyRound, Loader2, ShoppingBag, X } from "lucide-react";

interface Agent {
  id: number;
  name: string;
  phone: string;
  email: string;
  active: boolean;
  totalOrders: number;
  createdAt: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export default function AdminAgents() {
  const [, navigate] = useLocation();
  const { isAuthenticated, token } = useAdminAuthStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormData>({ name: "", phone: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [resetting, setResetting] = useState(false);

  if (!isAuthenticated) { navigate("/admin/login"); return null; }

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = () => {
    setLoading(true);
    fetch("/api/admin/agents", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setAgents)
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/agents", { method: "POST", headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error ?? "Failed to create agent"); return; }
      setAgents(prev => [data, ...prev]);
      setShowCreate(false);
      setForm({ name: "", phone: "", email: "", password: "" });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (agent: Agent) => {
    const res = await fetch(`/api/admin/agents/${agent.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ active: !agent.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, ...updated } : a));
    }
  };

  const handleResetPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetId) return;
    setResetting(true);
    const res = await fetch(`/api/admin/agents/${resetId}/reset-password`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ password: resetPw }),
    });
    if (res.ok) { setResetId(null); setResetPw(""); }
    setResetting(false);
  };

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <AdminLayout>
      <div className={cn("px-4 sm:px-6 py-6 max-w-4xl mx-auto", D.bg)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={cn("text-2xl font-bold", D.text)}>Agents</h1>
            <p className={cn("text-sm mt-0.5", D.muted)}>{agents.length} registered</p>
          </div>
          <button onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: "linear-gradient(135deg, #8d6b3d, #b08a58)" }}>
            <UserPlus className="w-4 h-4" />
            Add Agent
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate} className={cn("rounded-2xl p-5 border mb-6 space-y-4", D.card, D.border)}>
            <div className="flex items-center justify-between mb-1">
              <h2 className={cn("font-semibold", D.text)}>New Agent</h2>
              <button type="button" onClick={() => setShowCreate(false)} className={D.muted}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {([
                { k: "name",     label: "Full Name",  type: "text",     placeholder: "Jane Mwila"         },
                { k: "phone",    label: "Phone",       type: "tel",      placeholder: "0970 000 001"       },
                { k: "email",    label: "Email",       type: "email",    placeholder: "jane@example.com"   },
                { k: "password", label: "Password",    type: "password", placeholder: "Min. 6 characters"  },
              ] as const).map(({ k, label, type, placeholder }) => (
                <div key={k}>
                  <label className={cn("block text-xs font-medium mb-1", D.muted)}>{label}</label>
                  <input type={type} value={form[k]} onChange={set(k)} required
                    placeholder={placeholder}
                    className={cn("w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-[#8d6b3d] transition-colors", D.card2, D.border, D.text, "placeholder-slate-600")} />
                </div>
              ))}
            </div>
            {createError && (
              <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-300 text-sm">{createError}</div>
            )}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={creating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #8d6b3d, #b08a58)" }}>
                {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Agent
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                className={cn("px-4 py-2 rounded-xl text-sm font-medium border transition-colors", D.border, D.muted, "hover:text-slate-200")}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Password reset modal */}
        {resetId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <form onSubmit={handleResetPw} className={cn("w-full max-w-sm rounded-2xl p-6 space-y-4 border", D.card, D.border)}>
              <div className="flex items-center justify-between">
                <h2 className={cn("font-semibold", D.text)}>Reset Password</h2>
                <button type="button" onClick={() => { setResetId(null); setResetPw(""); }} className={D.muted}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className={cn("block text-xs font-medium mb-1", D.muted)}>New Password</label>
                <input type="password" value={resetPw} onChange={e => setResetPw(e.target.value)}
                  required minLength={6} placeholder="Min. 6 characters"
                  className={cn("w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-[#8d6b3d] transition-colors", D.card2, D.border, D.text, "placeholder-slate-600")} />
              </div>
              <button type="submit" disabled={resetting}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #8d6b3d, #b08a58)" }}>
                {resetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Update Password
              </button>
            </form>
          </div>
        )}

        {/* Agents list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className={cn("h-20 rounded-2xl border animate-pulse", D.card, D.border)} />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className={cn("text-center py-20", D.muted)}>
            <p className="text-base font-medium">No agents yet</p>
            <p className="text-sm mt-1">Add your first agent to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map(agent => (
              <div key={agent.id} className={cn("rounded-2xl p-4 border flex items-start gap-4", D.card, D.border)}>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ background: "rgba(141,107,61,0.15)", color: "#b08a58", border: "1px solid rgba(141,107,61,0.3)" }}>
                  {agent.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("font-medium text-sm", D.text)}>{agent.name}</span>
                    <span className={cn("text-[0.6rem] px-2 py-0.5 rounded-full", agent.active ? STATUS_COLORS.delivered : STATUS_COLORS.cancelled)}>
                      {agent.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className={cn("text-xs mt-0.5", D.muted)}>{agent.phone} · {agent.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ShoppingBag className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-500">{agent.totalOrders} orders</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => { setResetId(agent.id); setResetPw(""); }}
                    title="Reset password"
                    className={cn("p-2 rounded-lg transition-colors", D.muted, "hover:text-[#b08a58] hover:bg-[#8d6b3d]/10")}>
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleActive(agent)}
                    title={agent.active ? "Deactivate" : "Activate"}
                    className={cn("p-2 rounded-lg transition-colors",
                      agent.active ? cn(D.muted, "hover:text-red-300 hover:bg-red-50") : cn(D.muted, "hover:text-emerald-300 hover:bg-emerald-50"))}>
                    {agent.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
