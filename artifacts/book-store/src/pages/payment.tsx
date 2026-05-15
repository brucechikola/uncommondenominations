import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/lib/store";
import { useInitiatePayment, useSimulatePayment, useGetOrder, useGetPaymentSettings } from "@workspace/api-client-react";
import { getGetOrderQueryKey, getGetPaymentSettingsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Smartphone, CreditCard, Landmark, Check, X } from "lucide-react";
import { StepIndicator, MiniBook,
  PAGE_BG, CARD_BG, CARD_BORDER, GOLD, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM } from "@/components/purchase-ui";

const ALL_METHODS = [
  { id: "airtel_money",    label: "Airtel Money",      accent: "hsl(0,82%,52%)",    bg: "hsl(0,70%,10%)",    borderCol: "hsl(0,70%,22%)",    abbr: "A",   network: "Airtel",  tab: "mobile" },
  { id: "mtn_money",       label: "MTN Mobile Money",  accent: "hsl(48,100%,48%)",  bg: "hsl(48,80%,9%)",    borderCol: "hsl(48,80%,22%)",   abbr: "MTN", network: "MTN",     tab: "mobile" },
  { id: "zamtel_money",    label: "Zamtel Money",       accent: "hsl(152,62%,44%)",  bg: "hsl(152,50%,8%)",   borderCol: "hsl(152,50%,20%)",  abbr: "ZM",  network: "Zamtel",  tab: "mobile" },
  { id: "visa_mastercard", label: "Visa / Mastercard",  accent: "hsl(215,80%,56%)",  bg: "",                  borderCol: "",                  abbr: "CARD",network: "",        tab: "card"   },
  { id: "bank_transfer",   label: "Bank Transfer",      accent: "hsl(220,38%,55%)",  bg: "",                  borderCol: "",                  abbr: "BNK", network: "",        tab: "bank"   },
] as const;

type Method = (typeof ALL_METHODS)[number]["id"];
type Tab = "mobile" | "card" | "bank";

const TABS: { id: Tab; label: string; icon: React.ElementType; subtext: string }[] = [
  { id: "mobile", label: "Mobile Money", icon: Smartphone, subtext: "Airtel · MTN · Zamtel" },
  { id: "card",   label: "Card",         icon: CreditCard, subtext: "Visa / Mastercard" },
  { id: "bank",   label: "Bank Transfer",icon: Landmark,   subtext: "Direct to account" },
];

const inputStyle: React.CSSProperties = {
  background: "hsl(222,54%,8%)",
  borderColor: "hsl(220,38%,17%)",
  color: TEXT_PRIMARY,
  height: "3rem",
  borderRadius: "12px",
  fontSize: "0.875rem",
  fontFamily: "var(--app-font-sans)",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-sans text-[0.67rem] tracking-[0.14em] uppercase font-medium mb-2"
      style={{ color: "hsl(40,18%,48%)" }}>
      {children}
    </label>
  );
}

function NetworkBadge({ abbr, accent, size = 42 }: { abbr: string; accent: string; size?: number }) {
  const fontSize = abbr.length > 2 ? "0.42rem" : abbr.length > 1 ? "0.52rem" : "0.72rem";
  return (
    <div className="rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: `${accent}18`, border: `1.5px solid ${accent}40` }}>
      <span className="font-sans font-black" style={{ fontSize, letterSpacing: "0.04em", color: accent }}>
        {abbr}
      </span>
    </div>
  );
}

export default function Payment() {
  const [, navigate] = useLocation();
  const { currentOrderId, setCurrentPaymentId } = useCartStore();
  const [activeTab, setActiveTab] = useState<Tab>("mobile");
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [phone, setPhone] = useState("");
  const [accountName, setAccountName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [stage, setStage] = useState<"select" | "processing" | "success" | "failed">("select");

  const { data: order } = useGetOrder(currentOrderId!, {
    query: { enabled: !!currentOrderId, queryKey: getGetOrderQueryKey(currentOrderId!) },
  });

  const { data: enabledSettings } = useGetPaymentSettings({
    query: { queryKey: getGetPaymentSettingsQueryKey() },
  });

  const enabledIds = enabledSettings
    ? new Set((enabledSettings as { channelId: string }[]).map((s) => s.channelId))
    : null;

  const METHODS = enabledIds
    ? ALL_METHODS.filter((m) => enabledIds.has(m.id))
    : ALL_METHODS;

  const enabledTabs = new Set(METHODS.map((m) => m.tab));

  const initiatePayment = useInitiatePayment();
  const simulatePayment = useSimulatePayment();

  const isMobile = activeTab === "mobile";
  const selectedMobileMethod = selectedMethod && METHODS.find((m) => m.id === selectedMethod && m.tab === "mobile");
  const isMobilePending = isMobile && !!selectedMobileMethod;

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setSelectedMethod(null);
    setPhone("");
  }

  function effectiveMethod(): Method | null {
    if (activeTab === "card") return "visa_mastercard";
    if (activeTab === "bank") return "bank_transfer";
    return selectedMethod;
  }

  function canPay(): boolean {
    if (stage !== "select") return false;
    if (activeTab === "mobile") return !!selectedMethod && phone.trim().length >= 8;
    if (activeTab === "card") return true;
    if (activeTab === "bank") return true;
    return false;
  }

  const handlePay = async () => {
    const method = effectiveMethod();
    if (!method || !currentOrderId) return;
    setStage("processing");
    try {
      const payment = await initiatePayment.mutateAsync({
        data: {
          orderId: currentOrderId,
          method,
          phoneNumber: activeTab === "mobile" ? phone : null,
          accountName: accountName || null,
        },
      });
      setCurrentPaymentId(payment.id);
      await new Promise((r) => setTimeout(r, 2500));
      const result = await simulatePayment.mutateAsync({ id: payment.id, data: { outcome: "successful" } });
      if (result.status === "successful") {
        setStage("success");
        setTimeout(() => navigate("/confirmation"), 1800);
      } else {
        setStage("failed");
      }
    } catch {
      setStage("failed");
    }
  };

  return (
    <div style={{ minHeight: "100svh", background: PAGE_BG, position: "relative" }}
      className="pt-[4.5rem] pb-24">

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, hsl(222,65%,13%,0.7) 0%, transparent 65%)", zIndex: 0 }} />

      <div className="relative z-10 container mx-auto px-6 pt-14 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <StepIndicator current={2} />
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-10">

          {/* ── LEFT ── */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h1 className="font-display text-[2.1rem] font-bold mb-2 leading-tight" style={{ color: TEXT_PRIMARY }}>
              Payment
            </h1>
            {order && (
              <p className="font-serif text-sm mb-8" style={{ color: TEXT_MUTED }}>
                Order #{order.id} — <span className="capitalize">{order.productType}</span> ×{order.quantity}
                {" — "}
                <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>K{order.totalAmount}</span>
              </p>
            )}
            {!order && <div className="mb-8" />}

            <AnimatePresence mode="wait">

              {stage === "select" && (
                <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {/* ── TAB BAR ── */}
                  <div className="flex gap-2 mb-6 p-1 rounded-2xl"
                    style={{ background: "hsl(222,52%,7%)", border: `1px solid ${CARD_BORDER}` }}>
                    {TABS.filter((t) => enabledTabs.has(t.id)).map((tab) => {
                      const active = activeTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button key={tab.id} type="button"
                          onClick={() => handleTabChange(tab.id)}
                          className="relative flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl transition-all"
                          style={{ background: active ? CARD_BG : "transparent" }}>
                          {active && (
                            <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-xl"
                              style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, boxShadow: `0 0 0 1px hsl(42,78%,46%,0.18), 0 2px 12px hsl(42,78%,46%,0.06)` }}
                              transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                          )}
                          <div className="relative z-10 flex flex-col items-center gap-1">
                            <Icon size={18}
                              style={{ color: active ? GOLD : TEXT_DIM,
                                filter: active ? `drop-shadow(0 0 6px hsl(42,78%,46%,0.5))` : "none",
                                transition: "color 0.2s, filter 0.2s" }} />
                            <span className="font-sans text-[0.72rem] font-semibold"
                              style={{ color: active ? TEXT_PRIMARY : TEXT_DIM, transition: "color 0.2s" }}>
                              {tab.label}
                            </span>
                            <span className="font-sans text-[0.58rem]"
                              style={{ color: active ? TEXT_DIM : "hsl(220,18%,26%)", transition: "color 0.2s" }}>
                              {tab.subtext}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* ── TAB CONTENT ── */}
                  <AnimatePresence mode="wait">

                    {/* MOBILE MONEY */}
                    {activeTab === "mobile" && (
                      <motion.div key="mobile"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>

                        <div className="rounded-2xl overflow-hidden mb-6"
                          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>

                          {METHODS.filter((m) => m.tab === "mobile").map((m, idx, arr) => {
                            const sel = selectedMethod === m.id;
                            return (
                              <button key={m.id} type="button"
                                onClick={() => setSelectedMethod(m.id)}
                                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all group"
                                style={{
                                  background: sel ? `${m.bg}` : "transparent",
                                  borderBottom: idx < arr.length - 1 ? `1px solid ${CARD_BORDER}` : "none",
                                }}>
                                <NetworkBadge abbr={m.abbr} accent={m.accent} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-sans text-[0.82rem] font-semibold" style={{ color: TEXT_PRIMARY }}>
                                    {m.label}
                                  </p>
                                  <p className="font-sans text-[0.68rem] mt-0.5" style={{ color: TEXT_DIM }}>
                                    {m.network} mobile wallet
                                  </p>
                                </div>
                                <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                                  style={{
                                    background: sel ? m.accent : "transparent",
                                    border: `2px solid ${sel ? m.accent : "hsl(220,28%,20%)"}`,
                                    transition: "all 0.18s",
                                  }}>
                                  {sel && <Check size={11} style={{ color: "white" }} strokeWidth={3} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Phone number field — appears when a network is chosen */}
                        <AnimatePresence>
                          {selectedMethod && isMobilePending && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.2 }}
                              className="mb-6">
                              <div className="rounded-2xl p-5"
                                style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                                <div className="flex items-center gap-3 mb-4">
                                  <NetworkBadge abbr={selectedMobileMethod!.abbr} accent={selectedMobileMethod!.accent} size={36} />
                                  <div>
                                    <p className="font-sans text-[0.75rem] font-semibold" style={{ color: TEXT_PRIMARY }}>
                                      {selectedMobileMethod!.label}
                                    </p>
                                    <p className="font-sans text-[0.65rem]" style={{ color: TEXT_DIM }}>
                                      Enter the number linked to your wallet
                                    </p>
                                  </div>
                                </div>
                                <FieldLabel>Mobile Money Number *</FieldLabel>
                                <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                                  placeholder="e.g. 0977 123 456" autoFocus
                                  style={inputStyle}
                                  className="placeholder:text-[hsl(220,18%,28%)] focus-visible:ring-1 focus-visible:ring-[hsl(42,78%,46%,0.3)] focus-visible:ring-offset-0" />
                                <p className="mt-2.5 font-sans text-[0.65rem] flex items-center gap-1.5" style={{ color: TEXT_DIM }}>
                                  <Smartphone size={11} />
                                  A payment prompt will be sent to this number.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* CARD */}
                    {activeTab === "card" && (
                      <motion.div key="card"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>

                        <div className="rounded-2xl overflow-hidden mb-6"
                          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>

                          {/* Card art header */}
                          <div className="relative px-6 pt-6 pb-5 overflow-hidden"
                            style={{ background: "linear-gradient(135deg, hsl(215,60%,12%) 0%, hsl(222,58%,8%) 100%)", borderBottom: `1px solid ${CARD_BORDER}` }}>
                            <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
                              style={{ background: "radial-gradient(circle, hsl(215,80%,56%,0.08) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-sans text-[0.6rem] tracking-[0.24em] uppercase font-bold mb-3"
                                  style={{ color: "hsl(215,60%,60%)" }}>Debit / Credit Card</p>
                                <div className="flex items-center gap-2 mb-4">
                                  {/* Visa badge */}
                                  <div className="px-2.5 py-1 rounded-md"
                                    style={{ background: "hsl(215,80%,56%,0.15)", border: "1px solid hsl(215,80%,56%,0.3)" }}>
                                    <span className="font-sans font-black text-[0.72rem] italic"
                                      style={{ color: "hsl(215,80%,66%)" }}>VISA</span>
                                  </div>
                                  {/* Mastercard circles */}
                                  <div className="flex">
                                    <div className="w-6 h-6 rounded-full"
                                      style={{ background: "hsl(0,82%,52%,0.85)", marginRight: "-8px" }} />
                                    <div className="w-6 h-6 rounded-full"
                                      style={{ background: "hsl(38,100%,50%,0.85)" }} />
                                  </div>
                                </div>
                              </div>
                              <CreditCard size={28} style={{ color: "hsl(215,60%,45%)", marginTop: 2 }} />
                            </div>
                            <p className="font-mono text-[0.78rem]" style={{ color: "hsl(220,20%,38%)", letterSpacing: "0.16em" }}>
                              •••• •••• •••• ••••
                            </p>
                          </div>

                          <div className="p-5 space-y-4">
                            <div>
                              <FieldLabel>Cardholder Name</FieldLabel>
                              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)}
                                placeholder="Name on card"
                                style={inputStyle}
                                className="placeholder:text-[hsl(220,18%,28%)] focus-visible:ring-1 focus-visible:ring-[hsl(42,78%,46%,0.3)] focus-visible:ring-offset-0" />
                            </div>
                            <div>
                              <FieldLabel>Card Number <span style={{ color: TEXT_DIM }}>(demo)</span></FieldLabel>
                              <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="4242 4242 4242 4242"
                                style={inputStyle}
                                className="placeholder:text-[hsl(220,18%,28%)] focus-visible:ring-1 focus-visible:ring-[hsl(42,78%,46%,0.3)] focus-visible:ring-offset-0" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <FieldLabel>Expiry</FieldLabel>
                                <Input value={expiry} onChange={(e) => setExpiry(e.target.value)}
                                  placeholder="MM / YY"
                                  style={inputStyle}
                                  className="placeholder:text-[hsl(220,18%,28%)] focus-visible:ring-1 focus-visible:ring-[hsl(42,78%,46%,0.3)] focus-visible:ring-offset-0" />
                              </div>
                              <div>
                                <FieldLabel>CVC</FieldLabel>
                                <Input value={cvc} onChange={(e) => setCvc(e.target.value)}
                                  placeholder="•••"
                                  style={inputStyle}
                                  className="placeholder:text-[hsl(220,18%,28%)] focus-visible:ring-1 focus-visible:ring-[hsl(42,78%,46%,0.3)] focus-visible:ring-offset-0" />
                              </div>
                            </div>
                            <p className="font-sans text-[0.65rem] flex items-center gap-1.5" style={{ color: TEXT_DIM }}>
                              <span className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                                style={{ background: "hsl(152,62%,44%,0.3)", border: "1px solid hsl(152,62%,44%,0.5)" }} />
                              Simulated payment — no real card data is collected or processed.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* BANK TRANSFER */}
                    {activeTab === "bank" && (
                      <motion.div key="bank"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>

                        <div className="rounded-2xl overflow-hidden mb-6"
                          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>

                          {/* Header */}
                          <div className="flex items-center gap-3.5 px-5 py-4"
                            style={{ background: "hsl(222,52%,7%)", borderBottom: `1px solid ${CARD_BORDER}` }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: "hsl(220,38%,55%,0.12)", border: "1px solid hsl(220,38%,55%,0.25)" }}>
                              <Landmark size={18} style={{ color: "hsl(220,60%,66%)" }} />
                            </div>
                            <div>
                              <p className="font-sans text-[0.8rem] font-semibold" style={{ color: TEXT_PRIMARY }}>
                                Direct Bank Transfer
                              </p>
                              <p className="font-sans text-[0.68rem]" style={{ color: TEXT_DIM }}>
                                Transfer to our account and send proof of payment
                              </p>
                            </div>
                          </div>

                          {/* Bank details */}
                          <div className="p-5 space-y-0">
                            {[
                              { label: "Bank",      value: "First National Bank Zambia", highlight: false },
                              { label: "Account",   value: "1234567890",                 highlight: true  },
                              { label: "Name",      value: "Lumina Publications Ltd",     highlight: false },
                              { label: "Reference", value: `Order #${currentOrderId ?? "—"}`, highlight: true },
                            ].map(({ label, value, highlight }, i, arr) => (
                              <div key={label}
                                className="flex justify-between items-center py-3.5"
                                style={{ borderBottom: i < arr.length - 1 ? `1px solid ${CARD_BORDER}` : "none" }}>
                                <span className="font-sans text-[0.7rem]" style={{ color: TEXT_DIM }}>{label}</span>
                                <span className="font-sans text-[0.78rem] font-semibold"
                                  style={{ color: highlight ? TEXT_PRIMARY : TEXT_MUTED }}>
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* WhatsApp CTA */}
                          <div className="px-5 pb-5">
                            <div className="rounded-xl p-4 flex items-center gap-3"
                              style={{ background: "hsl(142,60%,6%)", border: "1px solid hsl(142,60%,18%)" }}>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: "hsl(142,60%,10%)", border: "1px solid hsl(142,60%,22%)" }}>
                                <span className="text-sm">📲</span>
                              </div>
                              <div>
                                <p className="font-sans text-[0.72rem] font-semibold" style={{ color: TEXT_PRIMARY }}>
                                  Send proof of payment
                                </p>
                                <p className="font-sans text-[0.66rem]" style={{ color: TEXT_DIM }}>
                                  WhatsApp receipt to{" "}
                                  <span className="font-bold" style={{ color: GOLD }}>0979 697 853</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Manual payment notice */}
                  <div className="flex gap-3 rounded-xl p-4 mb-6"
                    style={{ background: "hsl(42,60%,7%)", border: "1px solid hsl(42,78%,26%,0.3)" }}>
                    <span className="text-base flex-shrink-0 mt-0.5">📞</span>
                    <p className="font-sans text-[0.7rem]" style={{ color: TEXT_DIM }}>
                      Prefer to pay in person?{" "}
                      <span className="font-semibold" style={{ color: GOLD }}>Call 0979 697 853</span>{" "}
                      to arrange.
                    </p>
                  </div>

                  <div className="h-px mb-6" style={{ background: CARD_BORDER }} />

                  <motion.div whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" className="w-full font-sans uppercase"
                      onClick={handlePay}
                      disabled={!canPay()}
                      style={{
                        height: "3rem",
                        background: canPay() ? GOLD : "hsl(220,38%,12%)",
                        color: canPay() ? "#fff" : TEXT_DIM,
                        fontWeight: canPay() ? 700 : undefined,
                        boxShadow: canPay() ? "0 4px 24px rgba(141,107,61,0.28)" : "none",
                        transition: "all 0.2s",
                      }}>
                      {activeTab === "bank" ? `Confirm Order — K${order?.totalAmount ?? 0}` : `Pay K${order?.totalAmount ?? 0}`}
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {/* PROCESSING */}
              {stage === "processing" && (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="relative mb-8">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: "hsl(42,78%,46%,0.1)", border: "1px solid hsl(42,78%,46%,0.2)" }}>
                      <Loader2 className="h-7 w-7 animate-spin" style={{ color: GOLD }} />
                    </div>
                    <motion.div className="absolute inset-0 rounded-full"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0, 0.15] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      style={{ background: "hsl(42,78%,46%,0.15)" }} />
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-3" style={{ color: TEXT_PRIMARY }}>
                    Processing Payment
                  </h2>
                  <p className="font-serif text-sm" style={{ color: TEXT_MUTED }}>
                    Please wait while we confirm your transaction…
                  </p>
                  {activeTab === "mobile" && (
                    <p className="font-sans text-[0.72rem] mt-3" style={{ color: TEXT_DIM }}>
                      Check your phone for a payment prompt.
                    </p>
                  )}
                </motion.div>
              )}

              {/* SUCCESS */}
              {stage === "success" && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center">
                  <motion.div className="relative mb-8"
                    initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: GOLD, boxShadow: "0 0 40px hsl(42,78%,46%,0.4)" }}>
                      <Check size={28} strokeWidth={3} style={{ color: "hsl(222,58%,8%)" }} />
                    </div>
                  </motion.div>
                  <h2 className="font-display text-2xl font-bold mb-3" style={{ color: TEXT_PRIMARY }}>
                    Payment Successful!
                  </h2>
                  <p className="font-serif text-sm" style={{ color: TEXT_MUTED }}>
                    Redirecting to your confirmation…
                  </p>
                </motion.div>
              )}

              {/* FAILED */}
              {stage === "failed" && (
                <motion.div key="failed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-8"
                    style={{ background: "hsl(0,60%,14%)", border: "1px solid hsl(0,60%,26%)" }}>
                    <X size={28} style={{ color: "hsl(0,72%,58%)" }} />
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-3" style={{ color: TEXT_PRIMARY }}>
                    Payment Failed
                  </h2>
                  <p className="font-serif text-sm mb-8" style={{ color: TEXT_MUTED }}>
                    Something went wrong. Please try again or call{" "}
                    <span style={{ color: GOLD }}>0979 697 853</span>.
                  </p>
                  <Button onClick={() => setStage("select")}
                    className="font-sans uppercase"
                    style={{ background: GOLD, color: "#fff", fontWeight: 700, boxShadow: "0 4px 20px rgba(141,107,61,0.25)" }}>
                    Try Again
                  </Button>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

          {/* ── RIGHT: sticky order summary ── */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}
            className="lg:sticky lg:top-24 self-start hidden lg:block">
            <div className="rounded-2xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>

              <div className="flex items-center justify-center py-8"
                style={{ background: "hsl(222,58%,6%)", borderBottom: `1px solid ${CARD_BORDER}` }}>
                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", inset: "-20px",
                    background: "radial-gradient(ellipse, hsl(42,78%,46%,0.08) 0%, transparent 70%)",
                    filter: "blur(8px)",
                  }} />
                  <MiniBook size={100} />
                </div>
              </div>

              <div className="p-6">
                <h2 className="font-sans text-[0.58rem] font-bold tracking-[0.28em] uppercase mb-5"
                  style={{ color: TEXT_DIM }}>Order Summary</h2>

                {order ? (
                  <div className="space-y-3">
                    {[
                      ["Edition",  <span className="capitalize">{order.productType}</span>],
                      ["Quantity", order.quantity],
                      ["Delivery", order.city],
                    ].map(([k, v]) => (
                      <div key={String(k)} className="flex justify-between items-center">
                        <span className="font-sans text-[0.7rem]" style={{ color: TEXT_DIM }}>{k}</span>
                        <span className="font-sans text-[0.75rem] font-medium" style={{ color: TEXT_PRIMARY }}>{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4"
                      style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                      <span className="font-sans text-[0.65rem] uppercase tracking-[0.14em]" style={{ color: TEXT_DIM }}>
                        Total
                      </span>
                      <span className="font-display text-2xl font-bold" style={{ color: GOLD }}>
                        K{order.totalAmount}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="font-sans text-[0.72rem]" style={{ color: TEXT_DIM }}>Loading order details…</p>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
