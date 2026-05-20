import { useLocation } from "wouter";
import { useAdminAuthStore } from "@/lib/store";
import { useGetAdminPaymentSettings, useUpdatePaymentSetting, getGetAdminPaymentSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { D } from "./_shared";
import { AdminLayout } from "./layout";

const CHANNEL_META: Record<string, { color: string; abbr: string; desc: string }> = {
  airtel_money:    { color: "#ef4444", abbr: "A",    desc: "Airtel mobile wallet"    },
  mtn_money:       { color: "#eab308", abbr: "MTN",  desc: "MTN MoMo account"       },
  zamtel_money:    { color: "#22c55e", abbr: "ZM",   desc: "Zamtel Kwacha wallet"   },
  visa_mastercard: { color: "#3b82f6", abbr: "CARD", desc: "Debit or credit card"   },
  bank_transfer:   { color: "#6366f1", abbr: "BNK",  desc: "Direct bank transfer"   },
  cash_on_delivery:{ color: "#f59e0b", abbr: "COD",  desc: "Pay on delivery"        },
};

export default function AdminSettings() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAdminAuthStore();
  const queryClient = useQueryClient();

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

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-2xl">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className={cn("text-2xl font-bold", D.text)}>Settings</h1>
          <p className={cn("text-sm mt-1", D.muted)}>Manage payment channels shown to customers at checkout.</p>
        </div>

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
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>
                    <span className="font-bold" style={{ color: meta.color, fontSize: "0.5rem" }}>{meta.abbr}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", D.text)}>{ch.label}</p>
                    <p className={cn("text-xs mt-0.5", D.muted)}>{meta.desc}</p>
                  </div>
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border",
                    ch.enabled
                      ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                      : "bg-white/5 text-slate-500 border-white/10")}>
                    {ch.enabled ? "Active" : "Disabled"}
                  </span>
                  <button onClick={() => handleToggle(ch.channelId, !ch.enabled)}
                    className="flex-shrink-0 transition-opacity hover:opacity-80"
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
        <p className={cn("text-xs mt-4", D.muted)}>
          Changes take effect immediately — disabled channels disappear from the customer checkout page at once.
        </p>
      </div>
    </AdminLayout>
  );
}
