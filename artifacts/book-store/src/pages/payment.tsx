import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/lib/store";
import { useInitiatePayment, useSimulatePayment, useGetOrder } from "@workspace/api-client-react";
import { getGetOrderQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { StepIndicator, MiniBook,
  PAGE_BG, CARD_BG, CARD_BORDER, GOLD, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM } from "@/components/purchase-ui";

const METHODS = [
  { id: "airtel_money",    label: "Airtel Money",       accent: "hsl(0,82%,52%)",    abbr: "A",    subtext: "Airtel mobile wallet" },
  { id: "mtn_money",       label: "MTN Mobile Money",   accent: "hsl(48,100%,48%)",  abbr: "MTN",  subtext: "MTN MoMo account" },
  { id: "zamtel_money",    label: "Zamtel Money",        accent: "hsl(152,62%,44%)",  abbr: "ZM",   subtext: "Zamtel Kwacha wallet" },
  { id: "visa_mastercard", label: "Visa / Mastercard",  accent: "hsl(215,80%,56%)",  abbr: "CARD", subtext: "Debit or credit card" },
  { id: "bank_transfer",   label: "Bank Transfer",       accent: "hsl(220,38%,44%)",  abbr: "BNK",  subtext: "Direct bank transfer" },
] as const;

type Method = (typeof METHODS)[number]["id"];

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

export default function Payment() {
  const [, navigate] = useLocation();
  const { currentOrderId, setCurrentPaymentId } = useCartStore();
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [phone, setPhone] = useState("");
  const [accountName, setAccountName] = useState("");
  const [stage, setStage] = useState<"select" | "processing" | "success" | "failed">("select");

  const { data: order } = useGetOrder(currentOrderId!, {
    query: { enabled: !!currentOrderId, queryKey: getGetOrderQueryKey(currentOrderId!) },
  });

  const initiatePayment = useInitiatePayment();
  const simulatePayment = useSimulatePayment();

  const isMobileMoney = !!(selectedMethod && ["airtel_money", "mtn_money", "zamtel_money"].includes(selectedMethod));

  const handlePay = async () => {
    if (!selectedMethod || !currentOrderId) return;
    setStage("processing");
    try {
      const payment = await initiatePayment.mutateAsync({
        data: {
          orderId: currentOrderId,
          method: selectedMethod,
          phoneNumber: isMobileMoney ? phone : null,
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

      {/* Page atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, hsl(222,65%,13%,0.7) 0%, transparent 65%)", zIndex: 0 }} />

      <div className="relative z-10 container mx-auto px-6 pt-14 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <StepIndicator current={2} />
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-10">

          {/* ── LEFT: Payment panel ── */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <h1 className="font-display text-[2.1rem] font-bold mb-2 leading-tight" style={{ color: TEXT_PRIMARY }}>
              Payment
            </h1>
            {order && (
              <p className="font-serif text-sm mb-10" style={{ color: TEXT_MUTED }}>
                Order #{order.id} — <span className="capitalize">{order.productType}</span> ×{order.quantity}
                {" — "}
                <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>K{order.totalAmount}</span>
              </p>
            )}
            {!order && <div className="mb-10" />}

            <AnimatePresence mode="wait">

              {/* ── SELECT stage ── */}
              {stage === "select" && (
                <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {/* Manual payment notice */}
                  <div className="flex gap-3.5 rounded-xl p-4 mb-8"
                    style={{ background: "hsl(42,60%,10%)", border: "1px solid hsl(42,78%,30%,0.35)" }}>
                    <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "hsl(42,78%,46%,0.12)", border: "1px solid hsl(42,78%,46%,0.2)" }}>
                      <span className="text-base">📞</span>
                    </div>
                    <div>
                      <p className="font-sans text-[0.75rem] font-semibold mb-0.5" style={{ color: TEXT_PRIMARY }}>
                        Prefer to pay manually?
                      </p>
                      <p className="font-sans text-[0.72rem]" style={{ color: TEXT_MUTED }}>
                        Call or WhatsApp{" "}
                        <span className="font-bold" style={{ color: GOLD }}>0979 697 853</span>{" "}
                        to arrange payment directly.
                      </p>
                    </div>
                  </div>

                  {/* Method heading */}
                  <h2 className="font-sans text-[0.62rem] font-bold tracking-[0.28em] uppercase mb-4"
                    style={{ color: TEXT_DIM }}>
                    Choose Payment Method
                  </h2>

                  {/* Payment method tiles */}
                  <div className="space-y-2.5 mb-8">
                    {METHODS.map(({ id, label, accent, abbr, subtext }) => {
                      const sel = selectedMethod === id;
                      return (
                        <motion.button key={id} type="button" onClick={() => setSelectedMethod(id)}
                          whileHover={{ x: 2 }}
                          className="w-full text-left rounded-xl flex items-center gap-4 p-4 transition-all"
                          style={{
                            background: sel ? "hsl(222,52%,11%)" : CARD_BG,
                            border: `1px solid ${sel ? GOLD : CARD_BORDER}`,
                            boxShadow: sel ? `0 0 0 1px ${GOLD}, 0 4px 20px hsl(42,78%,46%,0.06)` : "none",
                          }}>
                          {/* Icon circle */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                              background: sel ? `${accent}18` : "hsl(220,38%,11%)",
                              border: `1px solid ${sel ? `${accent}45` : "hsl(220,38%,15%)"}`,
                            }}>
                            <span className="font-sans font-bold" style={{
                              fontSize: abbr.length > 2 ? "0.45rem" : abbr.length > 1 ? "0.5rem" : "0.7rem",
                              letterSpacing: "0.04em",
                              color: sel ? accent : TEXT_DIM,
                            }}>
                              {abbr}
                            </span>
                          </div>
                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className="font-sans text-[0.8rem] font-medium" style={{ color: TEXT_PRIMARY }}>
                              {label}
                            </p>
                            <p className="font-sans text-[0.68rem] mt-0.5" style={{ color: TEXT_DIM }}>
                              {subtext}
                            </p>
                          </div>
                          {/* Selected check */}
                          {sel && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: GOLD }}>
                              <span className="text-[0.58rem] font-bold" style={{ color: "hsl(222,58%,8%)" }}>✓</span>
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Selected method extra fields */}
                  <AnimatePresence>
                    {selectedMethod && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }} className="space-y-4 mb-8 overflow-hidden">

                        {isMobileMoney && (
                          <div>
                            <FieldLabel>Mobile Money Number *</FieldLabel>
                            <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                              placeholder="e.g. 0977 123 456"
                              style={inputStyle}
                              className="placeholder:text-[hsl(220,18%,28%)] focus-visible:ring-1 focus-visible:ring-[hsl(42,78%,46%,0.3)] focus-visible:ring-offset-0" />
                            <p className="mt-2 font-sans text-[0.66rem]" style={{ color: TEXT_DIM }}>
                              You'll receive a payment prompt on your phone.
                            </p>
                          </div>
                        )}

                        {selectedMethod === "bank_transfer" && (
                          <div className="rounded-xl p-5 space-y-2.5"
                            style={{ background: "hsl(222,52%,7%)", border: `1px solid ${CARD_BORDER}` }}>
                            <p className="font-sans text-[0.62rem] tracking-[0.18em] uppercase font-semibold mb-3"
                              style={{ color: TEXT_DIM }}>Bank Transfer Details</p>
                            {[
                              ["Bank",      "First National Bank Zambia"],
                              ["Account",   "1234567890"],
                              ["Name",      "Lumina Publications Ltd"],
                              ["Reference", `Order #${currentOrderId ?? "—"}`],
                            ].map(([k, v]) => (
                              <div key={k} className="flex justify-between items-center">
                                <span className="font-sans text-[0.72rem]" style={{ color: TEXT_DIM }}>{k}</span>
                                <span className="font-sans text-[0.72rem] font-medium" style={{ color: TEXT_PRIMARY }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedMethod === "visa_mastercard" && (
                          <div className="space-y-4">
                            <div>
                              <FieldLabel>Cardholder Name</FieldLabel>
                              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)}
                                placeholder="Name on card"
                                style={inputStyle}
                                className="placeholder:text-[hsl(220,18%,28%)] focus-visible:ring-1 focus-visible:ring-[hsl(42,78%,46%,0.3)] focus-visible:ring-offset-0" />
                            </div>
                            <div>
                              <FieldLabel>Card Number <span style={{ color: TEXT_DIM }}>(demo)</span></FieldLabel>
                              <Input placeholder="4242 4242 4242 4242" disabled
                                style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }}
                                className="placeholder:text-[hsl(220,18%,28%)]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <FieldLabel>Expiry</FieldLabel>
                                <Input placeholder="MM/YY" disabled
                                  style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }}
                                  className="placeholder:text-[hsl(220,18%,28%)]" />
                              </div>
                              <div>
                                <FieldLabel>CVC</FieldLabel>
                                <Input placeholder="123" disabled
                                  style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }}
                                  className="placeholder:text-[hsl(220,18%,28%)]" />
                              </div>
                            </div>
                            <p className="font-sans text-[0.66rem]" style={{ color: TEXT_DIM }}>
                              Simulated payment — no real card data collected.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="h-px mb-6" style={{ background: CARD_BORDER }} />

                  <motion.div whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" className="w-full border-0 font-sans tracking-[0.14em] uppercase"
                      onClick={handlePay}
                      disabled={!selectedMethod || (isMobileMoney && !phone)}
                      style={{ fontSize: "0.7rem", height: "3rem",
                        background: selectedMethod ? GOLD : "hsl(220,38%,12%)",
                        color: selectedMethod ? "#fff" : TEXT_DIM, fontWeight: selectedMethod ? 700 : undefined,
                        boxShadow: selectedMethod ? "0 4px 24px hsl(42,78%,46%,0.28)" : "none",
                        transition: "all 0.2s" }}>
                      Pay K{order?.totalAmount ?? 0}
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {/* ── PROCESSING stage ── */}
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
                  {isMobileMoney && (
                    <p className="font-sans text-[0.72rem] mt-3" style={{ color: TEXT_DIM }}>
                      Check your phone for a payment prompt.
                    </p>
                  )}
                </motion.div>
              )}

              {/* ── SUCCESS stage ── */}
              {stage === "success" && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center">
                  <motion.div className="relative mb-8"
                    initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: GOLD, boxShadow: "0 0 40px hsl(42,78%,46%,0.4)" }}>
                      <span className="text-2xl font-bold" style={{ color: "hsl(222,58%,8%)" }}>✓</span>
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

              {/* ── FAILED stage ── */}
              {stage === "failed" && (
                <motion.div key="failed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-8"
                    style={{ background: "hsl(0,60%,14%)", border: "1px solid hsl(0,60%,26%)" }}>
                    <span className="text-2xl" style={{ color: "hsl(0,72%,58%)" }}>✕</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-3" style={{ color: TEXT_PRIMARY }}>
                    Payment Failed
                  </h2>
                  <p className="font-serif text-sm mb-8" style={{ color: TEXT_MUTED }}>
                    Something went wrong. Please try again or call{" "}
                    <span style={{ color: GOLD }}>0979 697 853</span>.
                  </p>
                  <Button onClick={() => setStage("select")}
                    className="font-sans tracking-[0.14em] uppercase border-0"
                    style={{ background: GOLD, color: "#fff", fontWeight: 700, boxShadow: "0 4px 20px hsl(42,78%,46%,0.25)" }}>
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

              {/* Book visual */}
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
                      ["Edition", <span className="capitalize">{order.productType}</span>],
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
