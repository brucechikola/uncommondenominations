import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/lib/store";
import { useGetOrder, useGetPaymentSettings, useInitiatePayment, useRefreshPayment } from "@workspace/api-client-react";
import { getGetOrderQueryKey, getGetPaymentSettingsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Smartphone, CreditCard, Landmark, Check, X, PackageCheck } from "lucide-react";
import { StepIndicator, MiniBook,
  PAGE_BG, CARD_BG, CARD_BORDER, GOLD, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM, fmtMoney } from "@/components/purchase-ui";
import { detectMobileNetwork, extractZambianSubscriberDigits, MOBILE_NETWORK_META, toNormalizedZambianPhone, type MobileNetworkMethod } from "@/lib/mobile-money";

const ALL_METHODS = [
  { id: "airtel_money",      ...MOBILE_NETWORK_META.airtel_money, tab: "mobile" },
  { id: "mtn_money",         ...MOBILE_NETWORK_META.mtn_money, tab: "mobile" },
  { id: "zamtel_money",      ...MOBILE_NETWORK_META.zamtel_money, tab: "mobile" },
  { id: "visa_mastercard",   label: "Visa / Mastercard",  accent: "hsl(215,80%,56%)",  bg: "",                  abbr: "CARD",network: "",        tab: "card"   },
  { id: "bank_transfer",     label: "Bank Transfer",      accent: "hsl(220,38%,55%)",  bg: "",                  abbr: "BNK", network: "",        tab: "bank"   },
  { id: "mobile_money_on_delivery",  label: "Mobile Money on Delivery",   accent: "hsl(42,78%,46%)",   bg: "",                  abbr: "MOD", network: "",        tab: "cod"    },
] as const;

type Method = (typeof ALL_METHODS)[number]["id"];
type Tab = "cod" | "mobile" | "card" | "bank";

type MobileMethod = MobileNetworkMethod;
const MOBILE_POLL_TIMEOUT_MS = 3 * 60 * 1000;
const MOBILE_POLL_INTERVALS_MS = [5000, 7000, 10000] as const;
const TABS: { id: Tab; label: string; icon: React.ElementType; subtext: string }[] = [
  { id: "cod",    label: "Pay on Delivery",  icon: PackageCheck, subtext: "Pay when it arrives" },
  { id: "mobile", label: "Mobile Money",     icon: Smartphone,   subtext: "Airtel · MTN · Zamtel" },
  { id: "card",   label: "Card",             icon: CreditCard,   subtext: "Visa / Mastercard" },
  { id: "bank",   label: "Bank Transfer",    icon: Landmark,     subtext: "Direct to account" },
];

const inputStyle: React.CSSProperties = {
  background: "hsl(40,28%,99%)",
  borderColor: CARD_BORDER,
  color: TEXT_PRIMARY,
  height: "3rem",
  borderRadius: "12px",
  fontSize: "0.875rem",
  fontFamily: "var(--app-font-sans)",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-sans text-[0.67rem] tracking-[0.14em] uppercase font-medium mb-2"
      style={{ color: TEXT_DIM }}>
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

function NetworkLogo({ method, size = 40 }: { method: MobileMethod; size?: number }) {
  const meta = ALL_METHODS.find((item) => item.id === method);
  return (
    <div
      className="overflow-hidden rounded-xl flex items-center justify-center flex-shrink-0 bg-white"
      style={{
        width: size,
        height: size,
        border: `1px solid ${meta?.accent ?? CARD_BORDER}`,
        boxShadow: `0 0 0 3px ${meta?.accent ?? "#000"}12`,
      }}
    >
      <img
        src={MOBILE_NETWORK_META[method].logo}
        alt={ALL_METHODS.find((item) => item.id === method)?.label ?? method}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default function Payment() {
  const [, navigate] = useLocation();
  const { currentOrderId, setCurrentPaymentId } = useCartStore();
  const [activeTab, setActiveTab] = useState<Tab>("mobile");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<"select" | "processing" | "success" | "order_confirmed" | "failed">("select");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  const visibleTabs = TABS.filter((t) => enabledTabs.has(t.id));

  const initiatePayment = useInitiatePayment();
  const refreshPayment = useRefreshPayment();

  const isMobile = activeTab === "mobile";
  const subscriberDigits = isMobile ? extractZambianSubscriberDigits(phone) : "";
  const normalizedMobileNumber = subscriberDigits.length > 0 ? toNormalizedZambianPhone(subscriberDigits) : "";
  const detectedMobileNetwork = isMobile ? detectMobileNetwork(subscriberDigits) : null;
  const detectedMobileMethod = detectedMobileNetwork
    ? METHODS.find((m) => m.id === detectedMobileNetwork && m.tab === "mobile") ?? null
    : null;
  const detectedAccent = detectedMobileMethod?.accent ?? GOLD;
  const detectedSoftBg = detectedMobileMethod ? `${detectedMobileMethod.accent}12` : "hsl(40,18%,96%)";
  const detectedSoftBorder = detectedMobileMethod ? `${detectedMobileMethod.accent}40` : CARD_BORDER;
  const detectedFieldBg = detectedMobileMethod ? `${detectedMobileMethod.accent}0D` : "hsl(40,28%,99%)";
  const detectedFieldBorder = detectedMobileMethod ? detectedMobileMethod.accent : CARD_BORDER;

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setPhone("");
    setErrorMessage(null);
  }

  function effectiveMethod(): Method | null {
    if (activeTab === "card")  return "visa_mastercard";
    if (activeTab === "bank")  return "bank_transfer";
    if (activeTab === "cod")   return "mobile_money_on_delivery";
    return detectedMobileNetwork;
  }

  function canPay(): boolean {
    if (stage !== "select") return false;
    if (activeTab === "mobile") return !!detectedMobileNetwork && normalizedMobileNumber.length === 12;
    return true;
  }

  async function pollPaymentStatus(paymentId: number) {
    const startedAt = Date.now();
    let attempt = 0;

    while (Date.now() - startedAt < MOBILE_POLL_TIMEOUT_MS) {
      const delay = MOBILE_POLL_INTERVALS_MS[Math.min(attempt, MOBILE_POLL_INTERVALS_MS.length - 1)];
      await new Promise((resolve) => setTimeout(resolve, delay));
      const refreshed = await refreshPayment.mutateAsync({ id: paymentId });
      if (refreshed.status === "successful" || refreshed.status === "failed") {
        return refreshed;
      }
      attempt += 1;
    }

    return refreshPayment.mutateAsync({ id: paymentId });
  }

  const handlePay = async () => {
    const method = effectiveMethod();
    if (!method || !currentOrderId) return;
    setErrorMessage(null);
    setStage("processing");

    try {
      const payment = await initiatePayment.mutateAsync({
        data: {
          orderId: currentOrderId,
          method,
          phoneNumber: activeTab === "mobile" ? normalizedMobileNumber : null,
          accountName: null,
        },
      });
      setCurrentPaymentId(payment.id);

      if (activeTab === "cod") {
        // Cash on delivery — leave payment as pending, confirm the order view
        await new Promise((r) => setTimeout(r, 1600));
        setStage("order_confirmed");
        setTimeout(() => navigate("/confirmation"), 1800);
        return;
      }

      if (activeTab === "mobile") {
        const result = await pollPaymentStatus(payment.id);
        if (result.status === "successful") {
          setStage("success");
          setTimeout(() => navigate("/confirmation"), 1800);
          return;
        }

        if (result.status === "pending") {
          navigate("/confirmation");
          return;
        }

        setErrorMessage(result.failureReason || "The payment was not completed.");
        setStage("failed");
        return;
      }

      if (payment.gatewayCheckoutUrl) {
        window.location.assign(payment.gatewayCheckoutUrl);
        return;
      }

      setErrorMessage("The payment session could not be created.");
      setStage("failed");
    } catch (error) {
      let message = "Something went wrong while starting the payment.";
      if (error && typeof error === "object" && "data" in error) {
        const data = (error as { data?: unknown }).data;
        if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
          message = data.error;
        } else if ("message" in (error as Record<string, unknown>) && typeof (error as Record<string, unknown>).message === "string") {
          message = (error as Record<string, string>).message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      setErrorMessage(message);
      setStage("failed");
    }
  };

  const payBtnLabel = (() => {
    if (activeTab === "cod")  return `Confirm Order — ${fmtMoney(order?.totalAmount ?? 0)}`;
    if (activeTab === "mobile") return `Send Prompt — ${fmtMoney(order?.totalAmount ?? 0)}`;
    if (activeTab === "card") return `Continue to Secure Checkout — ${fmtMoney(order?.totalAmount ?? 0)}`;
    if (activeTab === "bank") return `Continue to Secure Checkout — ${fmtMoney(order?.totalAmount ?? 0)}`;
    return `Pay ${fmtMoney(order?.totalAmount ?? 0)}`;
  })();

  return (
    <div style={{ minHeight: "100svh", background: PAGE_BG, position: "relative" }}
      className="pt-[4.5rem] pb-24">

      <div className="absolute inset-x-0 top-0 h-[420px] overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px]"
          style={{ background: "radial-gradient(ellipse, hsl(42,70%,80%,0.3) 0%, transparent 65%)" }} />
      </div>

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
                <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{fmtMoney(order.totalAmount)}</span>
              </p>
            )}
            {!order && <div className="mb-8" />}

            <AnimatePresence mode="wait">

              {stage === "select" && (
                <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {/* ── TAB BAR — 2×2 grid ── */}
                  <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-2xl"
                    style={{ background: "hsl(40,18%,94%)", border: `1px solid ${CARD_BORDER}` }}>
                    {visibleTabs.map((tab) => {
                      const active = activeTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button key={tab.id} type="button"
                          onClick={() => handleTabChange(tab.id)}
                          className="relative flex items-center gap-3 py-3 px-3.5 rounded-xl transition-all text-left">
                          {active && (
                            <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-xl"
                              style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, boxShadow: `0 0 0 1px hsl(42,78%,46%,0.18), 0 2px 12px hsl(42,78%,46%,0.06)` }}
                              transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                          )}
                          <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              background: active ? "hsl(42,78%,46%,0.12)" : "hsl(40,14%,90%)",
                              border: `1px solid ${active ? "hsl(42,78%,46%,0.28)" : CARD_BORDER}`,
                              transition: "all 0.2s",
                            }}>
                            <Icon size={15}
                              style={{ color: active ? GOLD : TEXT_DIM, transition: "color 0.2s",
                                filter: active ? `drop-shadow(0 0 4px hsl(42,78%,46%,0.5))` : "none" }} />
                          </div>
                          <div className="relative z-10 min-w-0">
                            <p className="font-sans text-[0.72rem] font-semibold leading-tight"
                              style={{ color: active ? TEXT_PRIMARY : TEXT_DIM, transition: "color 0.2s" }}>
                              {tab.label}
                            </p>
                            <p className="font-sans text-[0.58rem] leading-tight mt-0.5"
                              style={{ color: TEXT_DIM, transition: "color 0.2s" }}>
                              {tab.subtext}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* ── TAB CONTENT ── */}
                  <AnimatePresence mode="wait">

                    {/* CASH ON DELIVERY */}
                    {activeTab === "cod" && (
                      <motion.div key="cod"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>

                        <div className="rounded-2xl overflow-hidden mb-6"
                          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>

                          {/* Header */}
                          <div className="flex items-center gap-3.5 px-5 py-4"
                            style={{ background: "hsl(42,78%,97%)", borderBottom: `1px solid hsl(42,78%,46%,0.2)` }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: "hsl(42,78%,46%,0.12)", border: "1px solid hsl(42,78%,46%,0.28)" }}>
                              <PackageCheck size={18} style={{ color: GOLD }} />
                            </div>
                            <div>
                              <p className="font-sans text-[0.82rem] font-semibold" style={{ color: TEXT_PRIMARY }}>
                                Pay on Delivery
                              </p>
                              <p className="font-sans text-[0.68rem]" style={{ color: TEXT_DIM }}>
                                No payment needed now — pay when your book arrives
                              </p>
                            </div>
                          </div>

                          {/* Steps */}
                          <div className="p-5 space-y-0">
                            {[
                              { n: "1", title: "Place your order",   desc: "Submit your details and we'll confirm your order." },
                              { n: "2", title: "We contact you",     desc: "Our team calls within 24 hours to arrange delivery." },
                              { n: "3", title: "Pay on arrival",     desc: "Hand over payment in cash when your book is delivered." },
                            ].map(({ n, title, desc }, i, arr) => (
                              <div key={n} className="flex gap-4 py-4"
                                style={{ borderBottom: i < arr.length - 1 ? `1px solid ${CARD_BORDER}` : "none" }}>
                                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                  style={{ background: "hsl(42,78%,46%,0.1)", border: "1px solid hsl(42,78%,46%,0.25)" }}>
                                  <span className="font-sans text-[0.58rem] font-bold" style={{ color: GOLD }}>{n}</span>
                                </div>
                                <div>
                                  <p className="font-sans text-[0.78rem] font-semibold mb-0.5" style={{ color: TEXT_PRIMARY }}>
                                    {title}
                                  </p>
                                  <p className="font-sans text-[0.68rem] leading-relaxed" style={{ color: TEXT_DIM }}>
                                    {desc}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Contact note */}
                          <div className="px-5 pb-5">
                            <div className="rounded-xl p-3.5 flex items-center gap-3"
                              style={{ background: "hsl(40,18%,96%)", border: `1px solid ${CARD_BORDER}` }}>
                              <span className="text-sm flex-shrink-0">📞</span>
                              <p className="font-sans text-[0.68rem]" style={{ color: TEXT_DIM }}>
                                Questions? Call or WhatsApp{" "}
                                <span className="font-bold" style={{ color: GOLD }}>0979 697 853</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* COD disclaimer */}
                        <div className="rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5"
                          style={{ background: "hsl(42,78%,97%)", border: "1px solid hsl(42,78%,46%,0.2)" }}>
                          <span className="text-sm flex-shrink-0 mt-0.5">⚠️</span>
                          <p className="font-sans text-[0.68rem] leading-relaxed" style={{ color: TEXT_DIM }}>
                            Your receipt will show <span className="font-semibold" style={{ color: TEXT_MUTED }}>Unpaid</span> until
                            payment is collected on delivery. You can download it as proof of order.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* MOBILE MONEY */}
                    {activeTab === "mobile" && (
                      <motion.div key="mobile"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>

                        <div className="rounded-2xl p-5 mb-6" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ background: "hsl(42,78%,46%,0.12)", border: "1px solid hsl(42,78%,46%,0.28)" }}>
                              <Smartphone size={18} style={{ color: GOLD }} />
                            </div>
                            <div>
                              <p className="font-sans text-[0.82rem] font-semibold" style={{ color: TEXT_PRIMARY }}>Mobile Money</p>
                              <p className="font-sans text-[0.68rem]" style={{ color: TEXT_DIM }}>
                                Enter the customer&apos;s number and we&apos;ll detect the correct network automatically.
                              </p>
                            </div>
                          </div>

                          <FieldLabel>Mobile Money Number *</FieldLabel>
                          <div
                            className="flex items-center rounded-xl border px-3"
                            style={{
                              background: detectedFieldBg,
                              borderColor: detectedFieldBorder,
                              height: "3rem",
                              borderWidth: detectedMobileMethod ? "1.5px" : "1px",
                              boxShadow: detectedMobileMethod ? `0 0 0 3px ${detectedMobileMethod.accent}18` : "none",
                            }}
                          >
                            <span className="font-sans text-[0.8rem] font-semibold mr-2" style={{ color: detectedMobileMethod ? detectedAccent : TEXT_PRIMARY }}>
                              +260
                            </span>
                            <input
                              value={subscriberDigits}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="977 123 456"
                              autoFocus
                              inputMode="numeric"
                              className="w-full bg-transparent outline-none text-sm placeholder:text-[hsl(220,22%,72%)]"
                              style={{ color: detectedMobileMethod ? detectedAccent : TEXT_PRIMARY, fontFamily: "var(--app-font-sans)" }}
                            />
                          </div>

                          <div className="mt-3 rounded-xl p-3.5"
                            style={{ background: detectedSoftBg, border: `1px solid ${detectedSoftBorder}` }}>
                            {detectedMobileMethod ? (
                              <div className="flex items-center gap-3">
                                <NetworkLogo method={detectedMobileMethod.id as MobileMethod} size={38} />
                                <div>
                                  <p className="font-sans text-[0.72rem] font-semibold" style={{ color: detectedAccent }}>
                                    Detected: {detectedMobileMethod.label}
                                  </p>
                                  <p className="font-sans text-[0.64rem]" style={{ color: TEXT_DIM }}>
                                    Normalized number: {normalizedMobileNumber}. A payment prompt will be sent to this wallet.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="font-sans text-[0.7rem] font-semibold" style={{ color: TEXT_PRIMARY }}>
                                  Supported prefixes
                                </p>
                                <p className="font-sans text-[0.64rem] mt-1" style={{ color: TEXT_DIM }}>
                                  Airtel: 097 / 077 · MTN: 096 / 076 · Zamtel: 095 / 075
                                </p>
                                <p className="font-sans text-[0.64rem] mt-1" style={{ color: TEXT_DIM }}>
                                  We normalize every number to `260XXXXXXXXX` and require exactly 12 digits in total.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* CARD */}
                    {activeTab === "card" && (
                      <motion.div key="card"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>
                        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                          <div className="relative px-6 pt-6 pb-5 overflow-hidden"
                            style={{ background: "linear-gradient(135deg, hsl(215,60%,96%) 0%, hsl(215,40%,92%) 100%)", borderBottom: `1px solid ${CARD_BORDER}` }}>
                            <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
                              style={{ background: "radial-gradient(circle, hsl(215,80%,56%,0.1) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-sans text-[0.6rem] tracking-[0.24em] uppercase font-bold mb-3" style={{ color: "hsl(215,60%,40%)" }}>Debit / Credit Card</p>
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="px-2.5 py-1 rounded-md" style={{ background: "hsl(215,80%,56%,0.12)", border: "1px solid hsl(215,80%,56%,0.25)" }}>
                                    <span className="font-sans font-black text-[0.72rem] italic" style={{ color: "hsl(215,80%,46%)" }}>VISA</span>
                                  </div>
                                  <div className="flex">
                                    <div className="w-6 h-6 rounded-full" style={{ background: "hsl(0,82%,52%,0.85)", marginRight: "-8px" }} />
                                    <div className="w-6 h-6 rounded-full" style={{ background: "hsl(38,100%,50%,0.85)" }} />
                                  </div>
                                </div>
                              </div>
                              <CreditCard size={28} style={{ color: "hsl(215,60%,50%)", marginTop: 2 }} />
                            </div>
                            <p className="font-mono text-[0.78rem]" style={{ color: "hsl(220,22%,52%)", letterSpacing: "0.16em" }}>CARD CHECKOUT</p>
                          </div>
                          <div className="p-5 space-y-4">
                            <div className="rounded-xl p-4"
                              style={{ background: "linear-gradient(135deg, hsl(215,80%,56%,0.08) 0%, hsl(215,60%,97%) 100%)", border: `1px solid ${CARD_BORDER}` }}>
                              <p className="font-sans text-[0.76rem] font-semibold mb-2" style={{ color: TEXT_PRIMARY }}>
                                Pay with card
                              </p>
                              <p className="font-sans text-[0.68rem] leading-relaxed" style={{ color: TEXT_DIM }}>
                                When you continue, you&apos;ll be taken to the card payment page to finish the payment. Card details are entered there, not on this page.
                              </p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { title: "Step 1", desc: "Open the payment page" },
                                { title: "Step 2", desc: "Enter card details" },
                                { title: "Step 3", desc: "Return after payment" },
                              ].map((step) => (
                                <div key={step.title} className="rounded-xl p-3"
                                  style={{ background: "hsl(40,18%,96%)", border: `1px solid ${CARD_BORDER}` }}>
                                  <p className="font-sans text-[0.58rem] font-bold tracking-[0.16em] uppercase mb-2" style={{ color: GOLD }}>
                                    {step.title}
                                  </p>
                                  <p className="font-sans text-[0.64rem] leading-relaxed" style={{ color: TEXT_DIM }}>
                                    {step.desc}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* BANK TRANSFER */}
                    {activeTab === "bank" && (
                      <motion.div key="bank"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>
                        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                            <div className="flex items-center gap-3.5 px-5 py-4" style={{ background: "hsl(215,60%,97%)", borderBottom: `1px solid ${CARD_BORDER}` }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(215,80%,56%,0.1)", border: "1px solid hsl(215,80%,56%,0.2)" }}>
                              <Landmark size={18} style={{ color: "hsl(215,60%,46%)" }} />
                            </div>
                            <div>
                              <p className="font-sans text-[0.8rem] font-semibold" style={{ color: TEXT_PRIMARY }}>Bank and other payment options</p>
                              <p className="font-sans text-[0.68rem]" style={{ color: TEXT_DIM }}>Continue to the payment page to choose an available option.</p>
                            </div>
                          </div>
                          <div className="p-5 space-y-0">
                            {[
                              { label: "Payment", value: "Checkout page", highlight: false },
                              { label: "Flow", value: "Choose an available payment option and complete the payment there", highlight: false },
                              { label: "Reference", value: `Order #${currentOrderId ?? "—"}`, highlight: true },
                              { label: "Currency", value: "ZMW", highlight: true },
                            ].map(({ label, value, highlight }, i, arr) => (
                              <div key={label} className="flex justify-between items-center py-3.5"
                                style={{ borderBottom: i < arr.length - 1 ? `1px solid ${CARD_BORDER}` : "none" }}>
                                <span className="font-sans text-[0.7rem]" style={{ color: TEXT_DIM }}>{label}</span>
                                <span className="font-sans text-[0.78rem] font-semibold" style={{ color: highlight ? TEXT_PRIMARY : TEXT_MUTED }}>{value}</span>
                              </div>
                            ))}
                          </div>
                          <div className="px-5 pb-5">
                            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "hsl(215,60%,97%)", border: `1px solid ${CARD_BORDER}` }}>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "hsl(215,80%,56%,0.1)", border: "1px solid hsl(215,80%,56%,0.2)" }}>
                                <span className="text-sm">🏦</span>
                              </div>
                              <div>
                                <p className="font-sans text-[0.72rem] font-semibold" style={{ color: TEXT_PRIMARY }}>Continue to payment</p>
                                <p className="font-sans text-[0.66rem]" style={{ color: TEXT_DIM }}>
                                  We&apos;ll open the payment page so you can choose an available option and complete the order there.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Manual payment notice */}
                  {errorMessage && (
                    <div className="rounded-xl px-4 py-3 mb-4"
                      style={{ background: "hsl(0,55%,96%)", border: "1px solid hsl(0,60%,84%)", color: "hsl(0,52%,38%)" }}>
                      <p className="font-sans text-[0.7rem] leading-relaxed">{errorMessage}</p>
                    </div>
                  )}

                  <div className="h-px mb-6" style={{ background: CARD_BORDER }} />

                  <motion.div whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" className="w-full font-sans uppercase"
                      onClick={handlePay}
                      disabled={!canPay()}
                      style={{
                        height: "3rem",
                        background: canPay() ? GOLD : "hsl(40,14%,88%)",
                        color: canPay() ? "#fff" : TEXT_DIM,
                        fontWeight: canPay() ? 700 : undefined,
                        boxShadow: canPay() ? "0 4px 24px rgba(141,107,61,0.28)" : "none",
                        transition: "all 0.2s",
                      }}>
                      {payBtnLabel}
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
                    {activeTab === "cod" ? "Confirming your order…" : activeTab === "mobile" ? "Processing Payment" : "Opening payment page…"}
                  </h2>
                  <p className="font-serif text-sm" style={{ color: TEXT_MUTED }}>
                    {activeTab === "cod"
                      ? "Setting up your cash on delivery order…"
                      : activeTab === "mobile"
                        ? "Please wait while we confirm your transaction. This can take up to 3 minutes."
                        : "Opening the payment page…"}
                  </p>
                  {activeTab === "mobile" && (
                    <p className="font-sans text-[0.72rem] mt-3" style={{ color: TEXT_DIM }}>
                      Check your phone for a payment prompt.
                    </p>
                  )}
                </motion.div>
              )}

              {/* ORDER CONFIRMED (COD) */}
              {stage === "order_confirmed" && (
                <motion.div key="order_confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center">
                  <motion.div className="relative mb-8"
                    initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: GOLD, boxShadow: "0 0 40px hsl(42,78%,46%,0.4)" }}>
                      <PackageCheck size={28} strokeWidth={2.5} style={{ color: "#fff" }} />
                    </div>
                  </motion.div>
                  <h2 className="font-display text-2xl font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Order Confirmed!</h2>
                  <p className="font-serif text-sm" style={{ color: TEXT_MUTED }}>
                    We'll call you to arrange delivery and collect payment.
                  </p>
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
                      <Check size={28} strokeWidth={3} style={{ color: "#fff" }} />
                    </div>
                  </motion.div>
                  <h2 className="font-display text-2xl font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Payment Successful!</h2>
                  <p className="font-serif text-sm" style={{ color: TEXT_MUTED }}>Redirecting to your confirmation…</p>
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
                  <h2 className="font-display text-2xl font-bold mb-3" style={{ color: TEXT_PRIMARY }}>Payment Failed</h2>
                  <p className="font-serif text-sm mb-8" style={{ color: TEXT_MUTED }}>
                    {errorMessage || "Something went wrong. Please try again or call "}
                    {!errorMessage && (
                      <>
                        <span style={{ color: GOLD }}>0979 697 853</span>.
                      </>
                    )}
                    {errorMessage && " "}
                    {errorMessage && (
                      <>
                        Call <span style={{ color: GOLD }}>0979 697 853</span> if the issue persists.
                      </>
                    )}
                  </p>
                  <Button onClick={() => setStage("select")} className="font-sans uppercase"
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
                style={{ background: "hsl(40,22%,94%)", borderBottom: `1px solid ${CARD_BORDER}` }}>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", inset: "-20px", background: "radial-gradient(ellipse, hsl(42,78%,46%,0.08) 0%, transparent 70%)", filter: "blur(8px)" }} />
                  <MiniBook size={100} />
                </div>
              </div>
              <div className="p-6">
                <h2 className="font-sans text-[0.58rem] font-bold tracking-[0.28em] uppercase mb-5" style={{ color: TEXT_DIM }}>Order Summary</h2>
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
                    <div className="flex justify-between items-center pt-4" style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                      <span className="font-sans text-[0.65rem] uppercase tracking-[0.14em]" style={{ color: TEXT_DIM }}>Total</span>
                      <span className="font-display text-2xl font-bold" style={{ color: GOLD }}>{fmtMoney(order.totalAmount)}</span>
                    </div>
                    {activeTab === "cod" && (
                      <p className="font-sans text-[0.62rem] pt-2 leading-relaxed" style={{ color: TEXT_DIM }}>
                        Payment collected on delivery.
                      </p>
                    )}
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
