import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAgentAuthStore } from "@/lib/store";
import { AgentLayout } from "./_layout";
import { Loader2, Copy, CheckCheck, Share2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const TIER_PRICES: Record<string, Record<string, number>> = {
  paperback: { standard: 400, bulk: 360, institutional: 320 },
  hardcover: { standard: 500, bulk: 450, institutional: 400 },
};

function resolveTier(qty: number) {
  if (qty >= 50) return "institutional";
  if (qty >= 10) return "bulk";
  return "standard";
}

function calcTotal(type: string, qty: number, overrideTier?: string) {
  const tier = overrideTier ?? resolveTier(qty);
  return (TIER_PRICES[type]?.[tier] ?? 0) * qty;
}

interface CreatedOrder {
  id: number;
  fullName: string;
  totalAmount: number;
  pricingTier: string;
  paymentLink: string;
}

export default function AgentNewOrder() {
  const [, navigate] = useLocation();
  const { token, isAuthenticated } = useAgentAuthStore();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    deliveryAddress: "",
    city: "",
    productType: "paperback",
    quantity: 1,
    notes: "",
    overrideTier: "" as string,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedOrder | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/agent/login");
  }, [isAuthenticated, navigate]);

  const autoTier = resolveTier(form.quantity);
  const activeTier = form.overrideTier || autoTier;
  const total = calcTotal(form.productType, form.quantity, form.overrideTier || undefined);
  const unitPrice = TIER_PRICES[form.productType]?.[activeTier] ?? 0;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = k === "quantity" ? Math.max(1, Number(e.target.value)) : e.target.value;
    setForm(prev => ({ ...prev, [k]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/agent/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          quantity: form.quantity,
          overrideTier: form.overrideTier || undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create order"); return; }
      setCreated(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fullPaymentLink = created ? `${window.location.origin}${created.paymentLink}` : "";

  const handleCopy = async () => {
    if (!fullPaymentLink) return;
    await navigator.clipboard.writeText(fullPaymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (!fullPaymentLink || !created) return;
    const text = `Hi ${created.fullName.split(" ")[0]},\n\nYour order for Uncommon Denominators is ready.\nTotal: K${created.totalAmount.toLocaleString()}\n\nPay here: ${fullPaymentLink}`;
    if (navigator.share) {
      await navigator.share({ title: "Payment Link", text });
    } else {
      await handleCopy();
    }
  };

  if (created) {
    return (
      <AgentLayout>
        <div className="px-4 py-8 max-w-lg mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "rgba(52,211,153,0.12)", border: "1.5px solid rgba(52,211,153,0.35)" }}>
            <CheckCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Order Created</h1>
            <p className="text-slate-400 text-sm mt-1">Share the payment link with {created.fullName.split(" ")[0]}</p>
          </div>

          {/* Summary */}
          <div className="rounded-2xl p-4 bg-white border border-slate-200 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Customer</span>
              <span className="text-slate-100 font-medium">{created.fullName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Amount</span>
              <span className="text-emerald-400 font-bold">K{created.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Pricing tier</span>
              <span className="text-slate-100 capitalize">{created.pricingTier}</span>
            </div>
          </div>

          {/* Payment link */}
          <div className="rounded-2xl p-4 bg-white border border-slate-200 space-y-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Payment Link</p>
            <div className="rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-xs text-slate-300 break-all text-left">
              {fullPaymentLink}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleCopy}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-300 hover:border-[#8d6b3d] hover:text-[#b08a58] transition-colors">
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button onClick={handleShare}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #8d6b3d, #b08a58)" }}>
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          <button onClick={() => { setCreated(null); setForm({ fullName: "", phone: "", email: "", deliveryAddress: "", city: "", productType: "paperback", quantity: 1, notes: "", overrideTier: "" }); }}
            className="w-full py-3 rounded-xl border border-slate-200 text-slate-300 text-sm font-medium hover:border-[#8d6b3d] transition-colors">
            Create Another Order
          </button>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="px-4 py-5 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-100">New Order</h1>
          <p className="text-slate-400 text-sm mt-0.5">Record a customer sale and generate a payment link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product selection */}
          <div className="grid grid-cols-2 gap-3">
            {(["paperback", "hardcover"] as const).map(type => (
              <button key={type} type="button"
                onClick={() => setForm(p => ({ ...p, productType: type }))}
                className={cn(
                  "rounded-2xl p-4 border text-left transition-all",
                  form.productType === type
                    ? "border-[#8d6b3d] bg-[#8d6b3d]/10"
                    : "border-slate-200 bg-white hover:border-[#8d6b3d]/50",
                )}>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className={cn("w-4 h-4", form.productType === type ? "text-[#b08a58]" : "text-slate-500")} />
                  <span className={cn("text-sm font-semibold capitalize", form.productType === type ? "text-[#b08a58]" : "text-slate-300")}>
                    {type}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  K{TIER_PRICES[type].standard} / copy
                </p>
              </button>
            ))}
          </div>

          {/* Quantity + tier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Quantity</label>
              <input type="number" min={1} value={form.quantity} onChange={set("quantity")} required
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-100 focus:outline-none focus:border-[#8d6b3d] transition-colors text-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Pricing Tier</label>
              <select value={form.overrideTier} onChange={set("overrideTier")}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-100 focus:outline-none focus:border-[#8d6b3d] transition-colors text-base">
                <option value="">Auto ({autoTier})</option>
                <option value="standard">Standard (K{TIER_PRICES[form.productType].standard})</option>
                <option value="bulk">Bulk 10+ (K{TIER_PRICES[form.productType].bulk})</option>
                <option value="institutional">Institutional 50+ (K{TIER_PRICES[form.productType].institutional})</option>
              </select>
            </div>
          </div>

          {/* Price preview */}
          <div className="rounded-xl px-4 py-3 bg-white border border-slate-200 flex items-center justify-between">
            <span className="text-slate-400 text-sm">Total ({form.quantity} × K{unitPrice})</span>
            <span className="text-emerald-400 font-bold text-lg">K{total.toLocaleString()}</span>
          </div>

          {/* Customer details */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-300 border-b border-slate-200 pb-2">Customer Details</p>
            {[
              { key: "fullName", label: "Full Name", type: "text", placeholder: "John Banda", required: true },
              { key: "phone", label: "Phone Number", type: "tel", placeholder: "0971 234 567", required: true },
              { key: "email", label: "Email Address", type: "email", placeholder: "john@email.com", required: true },
              { key: "deliveryAddress", label: "Delivery Address", type: "text", placeholder: "Plot 12, Cairo Road", required: true },
              { key: "city", label: "City", type: "text", placeholder: "Lusaka", required: true },
            ].map(({ key, label, type, placeholder, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
                <input type={type} value={form[key as keyof typeof form] as string}
                  onChange={set(key as keyof typeof form)} required={required} placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#8d6b3d] transition-colors text-base" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Notes (optional)</label>
              <textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="Any special instructions…"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#8d6b3d] transition-colors text-base resize-none" />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-300 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
            style={{ background: "linear-gradient(135deg, #8d6b3d, #b08a58)" }}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating Order…" : "Create Order & Get Payment Link"}
          </button>
        </form>
      </div>
    </AgentLayout>
  );
}
