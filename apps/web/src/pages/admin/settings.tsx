import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAdminAuthStore } from "@/lib/store";
import { useGetAdminPaymentSettings, useUpdatePaymentSetting, getGetAdminPaymentSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ToggleLeft, ToggleRight, PackageCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { D } from "./_shared";
import { AdminLayout } from "./layout";

interface ProductStock {
  id: number;
  type: string;
  name: string;
  priceKwacha: number;
  stockQuantity: number;
}

interface PaymentGatewaySettings {
  id?: number;
  provider: string;
  enabled: boolean;
  baseUrl: string;
  clientId: string | null;
  clientSecret: string | null;
  callbackUrl: string | null;
  successUrl: string | null;
  cancelUrl: string | null;
  publicWebUrl: string | null;
  publicApiUrl: string | null;
  notes: string | null;
}

type GatewayFieldKey =
  | "baseUrl"
  | "clientId"
  | "clientSecret"
  | "callbackUrl"
  | "successUrl"
  | "cancelUrl"
  | "publicWebUrl"
  | "publicApiUrl";

const LOW_STOCK_THRESHOLD = 20;

const CHANNEL_META: Record<string, { color: string; abbr: string; desc: string }> = {
  airtel_money:    { color: "#ef4444", abbr: "A",    desc: "Airtel mobile wallet"    },
  mtn_money:       { color: "#eab308", abbr: "MTN",  desc: "MTN MoMo account"       },
  zamtel_money:    { color: "#22c55e", abbr: "ZM",   desc: "Zamtel Kwacha wallet"   },
  visa_mastercard: { color: "#3b82f6", abbr: "CARD", desc: "Debit or credit card"   },
  bank_transfer:   { color: "#6366f1", abbr: "BNK",  desc: "Direct bank transfer"   },
  cash_on_delivery:{ color: "#f59e0b", abbr: "COD",  desc: "Pay on delivery"        },
};

const GATEWAY_FIELDS: Array<{ label: string; key: GatewayFieldKey; placeholder: string }> = [
  { label: "Base URL", key: "baseUrl", placeholder: "https://testpayments.probasegroup.com" },
  { label: "Client ID", key: "clientId", placeholder: "MERC-15-4566" },
  { label: "Client Secret", key: "clientSecret", placeholder: "secret key" },
  { label: "Callback URL", key: "callbackUrl", placeholder: "https://api.example.com/api/payments/probase/callback" },
  { label: "Success URL", key: "successUrl", placeholder: "https://example.com/confirmation?..." },
  { label: "Cancel URL", key: "cancelUrl", placeholder: "https://example.com/payment?cancelled=1" },
  { label: "Public Web URL", key: "publicWebUrl", placeholder: "https://example.com" },
  { label: "Public API URL", key: "publicApiUrl", placeholder: "https://api.example.com/api" },
];

export default function AdminSettings() {
  const [, navigate] = useLocation();
  const { isAuthenticated, token } = useAdminAuthStore();
  const queryClient = useQueryClient();

  const [stock, setStock] = useState<ProductStock[]>([]);
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
  const [savingStock, setSavingStock] = useState<string | null>(null);
  const [gatewaySettings, setGatewaySettings] = useState<PaymentGatewaySettings>({
    provider: "probase",
    enabled: true,
    baseUrl: "https://testpayments.probasegroup.com",
    clientId: "",
    clientSecret: "",
    callbackUrl: "",
    successUrl: "",
    cancelUrl: "",
    publicWebUrl: "",
    publicApiUrl: "",
    notes: "",
  });
  const [loadingGateway, setLoadingGateway] = useState(true);
  const [savingGateway, setSavingGateway] = useState(false);

  if (!isAuthenticated) { navigate("/admin/login"); return null; }

  const { data: paymentSettings } = useGetAdminPaymentSettings({
    query: { queryKey: getGetAdminPaymentSettingsQueryKey() },
  });
  const updatePaymentSetting = useUpdatePaymentSetting();

  const channels = Array.isArray(paymentSettings) ? paymentSettings : [];

  const handleToggle = async (channelId: string, enabled: boolean) => {
    await updatePaymentSetting.mutateAsync({ channelId, data: { enabled } });
    await queryClient.invalidateQueries({ queryKey: getGetAdminPaymentSettingsQueryKey() });
  };

  useEffect(() => {
    fetch("/api/admin/stock", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: ProductStock[]) => {
        setStock(data);
        const inputs: Record<string, string> = {};
        data.forEach(p => { inputs[p.type] = String(p.stockQuantity); });
        setStockInputs(inputs);
      });
  }, [token]);

  useEffect(() => {
    fetch("/api/admin/payment-gateway-settings", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: PaymentGatewaySettings | null) => {
        if (data) {
          setGatewaySettings({
            provider: data.provider,
            enabled: data.enabled,
            baseUrl: data.baseUrl ?? "https://testpayments.probasegroup.com",
            clientId: data.clientId ?? "",
            clientSecret: data.clientSecret ?? "",
            callbackUrl: data.callbackUrl ?? "",
            successUrl: data.successUrl ?? "",
            cancelUrl: data.cancelUrl ?? "",
            publicWebUrl: data.publicWebUrl ?? "",
            publicApiUrl: data.publicApiUrl ?? "",
            notes: data.notes ?? "",
          });
        }
      })
      .finally(() => setLoadingGateway(false));
  }, [token]);

  const handleStockSave = async (type: string) => {
    const qty = parseInt(stockInputs[type] ?? "0");
    if (isNaN(qty) || qty < 0) return;
    setSavingStock(type);
    const res = await fetch(`/api/admin/stock/${type}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stockQuantity: qty }),
    });
    if (res.ok) {
      const updated: ProductStock = await res.json();
      setStock(prev => prev.map(p => p.type === type ? updated : p));
      setStockInputs(prev => ({ ...prev, [type]: String(updated.stockQuantity) }));
    }
    setSavingStock(null);
  };

  const handleGatewaySave = async () => {
    setSavingGateway(true);
    const res = await fetch("/api/admin/payment-gateway-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...gatewaySettings,
        clientId: gatewaySettings.clientId || null,
        clientSecret: gatewaySettings.clientSecret || null,
        callbackUrl: gatewaySettings.callbackUrl || null,
        successUrl: gatewaySettings.successUrl || null,
        cancelUrl: gatewaySettings.cancelUrl || null,
        publicWebUrl: gatewaySettings.publicWebUrl || null,
        publicApiUrl: gatewaySettings.publicApiUrl || null,
        notes: gatewaySettings.notes || null,
      }),
    });
    if (res.ok) {
      const saved: PaymentGatewaySettings = await res.json();
      setGatewaySettings({
        provider: saved.provider,
        enabled: saved.enabled,
        baseUrl: saved.baseUrl ?? "https://testpayments.probasegroup.com",
        clientId: saved.clientId ?? "",
        clientSecret: saved.clientSecret ?? "",
        callbackUrl: saved.callbackUrl ?? "",
        successUrl: saved.successUrl ?? "",
        cancelUrl: saved.cancelUrl ?? "",
        publicWebUrl: saved.publicWebUrl ?? "",
        publicApiUrl: saved.publicApiUrl ?? "",
        notes: saved.notes ?? "",
      });
    }
    setSavingGateway(false);
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-2xl space-y-8">
        {/* Page heading */}
        <div>
          <h1 className={cn("text-2xl font-bold", D.text)}>Settings</h1>
          <p className={cn("text-sm mt-1", D.muted)}>Manage stock levels and payment channels.</p>
        </div>

        {/* ── Stock management ──────────────────────────────── */}
        <div className={cn("rounded-2xl border overflow-hidden", D.card, D.border)}>
          <div className={cn("px-5 py-4 border-b flex items-center gap-2", D.border)}>
            <PackageCheck className="w-4 h-4 text-[#b08a58]" />
            <div>
              <h2 className={cn("text-sm font-semibold", D.text)}>Stock Levels</h2>
              <p className={cn("text-xs mt-0.5", D.muted)}>Update available quantity per edition. Low stock alert below {LOW_STOCK_THRESHOLD} copies.</p>
            </div>
          </div>
          <div className={cn("divide-y", D.divide)}>
            {stock.length === 0 && (
              <div className={cn("py-10 text-center text-sm", D.muted)}>Loading stock…</div>
            )}
            {stock.map(product => {
              const isLow = product.stockQuantity < LOW_STOCK_THRESHOLD;
              const isSaving = savingStock === product.type;
              return (
                <div key={product.type} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-medium capitalize", D.text)}>{product.type}</p>
                      {isLow && (
                        <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-orange-400/15 text-orange-300 border border-orange-400/30 font-medium">
                          Low Stock
                        </span>
                      )}
                    </div>
                    <p className={cn("text-xs mt-0.5", D.muted)}>
                      K{product.priceKwacha.toLocaleString()} · Currently {product.stockQuantity} in stock
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={stockInputs[product.type] ?? product.stockQuantity}
                      onChange={e => setStockInputs(prev => ({ ...prev, [product.type]: e.target.value }))}
                      className={cn("w-20 px-3 py-1.5 rounded-lg text-sm border text-center focus:outline-none focus:border-[#8d6b3d] transition-colors", D.card2, D.border, D.text)}
                    />
                    <button
                      onClick={() => handleStockSave(product.type)}
                      disabled={isSaving || stockInputs[product.type] === String(product.stockQuantity)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40 transition-all"
                      style={{ background: "linear-gradient(135deg, #8d6b3d, #b08a58)" }}
                    >
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Payment channels ──────────────────────────────── */}
        <div className={cn("rounded-2xl border overflow-hidden", D.card, D.border)}>
          <div className={cn("px-5 py-4 border-b", D.border)}>
            <h2 className={cn("text-sm font-semibold", D.text)}>Payment Channels</h2>
            <p className={cn("text-xs mt-0.5", D.muted)}>Toggle which payment methods appear on the checkout page.</p>
          </div>

          <div className={cn("divide-y", D.divide)}>
            {channels.length === 0 && (
              <div className={cn("py-12 text-center text-sm", D.muted)}>Loading channels…</div>
            )}
            {channels.map((ch) => {
              const meta = CHANNEL_META[ch.channelId] ?? { color: "#b08a58", abbr: "?", desc: "" };
              return (
                <div key={ch.channelId} className="flex items-center gap-4 px-5 py-4">
                  <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>
                    <span className="font-bold" style={{ color: meta.color, fontSize: "0.5rem" }}>{meta.abbr}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", D.text)}>{ch.label}</p>
                    <p className={cn("text-xs mt-0.5", D.muted)}>{meta.desc}</p>
                  </div>
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border",
                    ch.enabled
                      ? "bg-emerald-50 text-emerald-400 border-emerald-400/20"
                      : "bg-slate-100 text-slate-500 border-slate-200")}>
                    {ch.enabled ? "Active" : "Disabled"}
                  </span>
                  <button onClick={() => handleToggle(ch.channelId, !ch.enabled)}
                    className="shrink-0 transition-opacity hover:opacity-80"
                    title={ch.enabled ? "Disable" : "Enable"}>
                    {ch.enabled
                      ? <ToggleRight className="h-8 w-8 text-emerald-400" />
                      : <ToggleLeft className="h-8 w-8 text-slate-600" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className={cn("rounded-2xl border overflow-hidden", D.card, D.border)}>
          <div className={cn("px-5 py-4 border-b", D.border)}>
            <h2 className={cn("text-sm font-semibold", D.text)}>Probase Gateway</h2>
            <p className={cn("text-xs mt-0.5", D.muted)}>Store Probase credentials and callback URLs used by the live payment engine.</p>
          </div>

          {loadingGateway ? (
            <div className={cn("py-12 text-center text-sm", D.muted)}>Loading gateway settings…</div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: "rgba(176,138,88,0.2)" }}>
                <div>
                  <p className={cn("text-sm font-medium", D.text)}>Gateway Enabled</p>
                  <p className={cn("text-xs mt-0.5", D.muted)}>Disable this to block new Probase payment attempts.</p>
                </div>
                <button onClick={() => setGatewaySettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className="shrink-0 transition-opacity hover:opacity-80"
                  title={gatewaySettings.enabled ? "Disable gateway" : "Enable gateway"}>
                  {gatewaySettings.enabled
                    ? <ToggleRight className="h-8 w-8 text-emerald-400" />
                    : <ToggleLeft className="h-8 w-8 text-slate-600" />}
                </button>
              </div>

              {GATEWAY_FIELDS.map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className={cn("block text-xs font-medium mb-1.5", D.text)}>{label}</label>
                  <input
                    value={gatewaySettings[key] ?? ""}
                    onChange={(e) => setGatewaySettings(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={cn("w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:border-[#8d6b3d] transition-colors", D.card2, D.border, D.text)}
                  />
                </div>
              ))}

              <div>
                <label className={cn("block text-xs font-medium mb-1.5", D.text)}>Notes</label>
                <textarea
                  value={gatewaySettings.notes ?? ""}
                  onChange={(e) => setGatewaySettings(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes about the current payment gateway setup"
                  rows={3}
                  className={cn("w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:border-[#8d6b3d] transition-colors", D.card2, D.border, D.text)}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGatewaySave}
                  disabled={savingGateway || !gatewaySettings.baseUrl.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-all"
                  style={{ background: "linear-gradient(135deg, #8d6b3d, #b08a58)" }}
                >
                  {savingGateway ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {savingGateway ? "Saving…" : "Save Gateway Settings"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className={cn("text-xs", D.muted)}>
          Payment channel and gateway setting changes take effect immediately.
        </p>
      </div>
    </AdminLayout>
  );
}
