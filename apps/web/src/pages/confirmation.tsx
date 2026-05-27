import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { getGetOrderQueryKey, getGetPaymentQueryKey, useGetOrder, useGetPayment, useRefreshPayment } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { PAGE_BG, CARD_BG, CARD_BORDER, GOLD, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM, fmtMoney, fmtDate } from "@/components/purchase-ui";
import { StepIndicator } from "@/components/purchase-ui";
import { Package, Phone, Truck, Download, Loader2 } from "lucide-react";
import { generateReceiptPdf } from "@/lib/generate-receipt";

const PAYMENT_POLL_TIMEOUT_MS = 3 * 60 * 1000;
const PAYMENT_POLL_INTERVALS_MS = [5000, 7000, 10000] as const;

export default function Confirmation() {
  const { currentOrderId, currentPaymentId, clearCart } = useCartStore();
  const [downloading, setDownloading] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const queryOrderId = Number(params.get("order_id") ?? "") || null;
  const queryPaymentId = Number(params.get("payment_id") ?? "") || null;
  const orderId = currentOrderId ?? queryOrderId;
  const paymentId = currentPaymentId ?? queryPaymentId;

  const { data: order } = useGetOrder(orderId!, {
    query: { enabled: !!orderId, queryKey: getGetOrderQueryKey(orderId!) },
  });
  const { data: standalonePayment } = useGetPayment(paymentId!, {
    query: { enabled: !!paymentId, queryKey: getGetPaymentQueryKey(paymentId!) },
  });
  const refreshPayment = useRefreshPayment();

  // Prefer the dedicated payment fetch; fall back to the payment embedded in the order
  const payment = standalonePayment ?? order?.payment ?? null;

  useEffect(() => {
    const timer = setTimeout(() => clearCart(), 30000);
    return () => clearTimeout(timer);
  }, [clearCart]);

  useEffect(() => {
    if (!paymentId || !payment || payment.method === "mobile_money_on_delivery" || payment.status !== "pending") return;

    let active = true;

    void (async () => {
      const startedAt = Date.now();
      let attempt = 0;

      while (active && Date.now() - startedAt < PAYMENT_POLL_TIMEOUT_MS) {
        const delay = PAYMENT_POLL_INTERVALS_MS[Math.min(attempt, PAYMENT_POLL_INTERVALS_MS.length - 1)];
        await new Promise((resolve) => setTimeout(resolve, delay));
        const refreshed = await refreshPayment.mutateAsync({ id: paymentId }).catch(() => null);
        if (!refreshed) {
          break;
        }
        if (!active || refreshed.status !== "pending") {
          break;
        }
        attempt += 1;
      }
    })();

    return () => {
      active = false;
    };
  }, [payment, paymentId, refreshPayment]);

  const issuedDate = fmtDate(new Date());

  const methodLabel = payment?.method
    ? payment.method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  const canDownload = !!(order && payment) && !downloading;

  async function handleDownload() {
    if (!order || !payment) return;
    setDownloading(true);
    try {
      await generateReceiptPdf({
        orderId:          order.id,
        fullName:         order.fullName,
        phone:            order.phone,
        email:            order.email,
        deliveryAddress:  order.deliveryAddress,
        city:             order.city,
        productType:      order.productType,
        quantity:         order.quantity,
        totalAmount:      order.totalAmount,
        notes:            order.notes,
        paymentMethod:    methodLabel,
        paymentReference: payment.reference,
        paymentStatus:    payment.status,
        issuedDate,
      });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ minHeight: "100svh", background: PAGE_BG, position: "relative" }}
      className="pt-[4.5rem] pb-24 overflow-hidden">

      <div className="absolute top-[8%] left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{
          width: "700px", height: "600px",
          background: "radial-gradient(ellipse, hsl(42,78%,46%,0.1) 0%, hsl(42,70%,80%,0.2) 38%, transparent 70%)",
          filter: "blur(20px)",
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 pt-14 max-w-3xl">

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <StepIndicator current={3} />
        </motion.div>

        {/* ── Hero ── */}
        <motion.div className="flex flex-col items-center text-center mb-14"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

          <div className="relative flex items-center justify-center mb-10">
            <motion.div className="absolute rounded-full"
              animate={{ scale: [1, 1.6, 1], opacity: [0.12, 0, 0.12] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
              style={{ width: 120, height: 120, background: "hsl(42,78%,46%,0.15)" }} />
            <motion.div className="absolute rounded-full"
              animate={{ scale: [1, 1.35, 1], opacity: [0.18, 0, 0.18] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
              style={{ width: 100, height: 100, background: "hsl(42,78%,46%,0.12)" }} />
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
              className="relative flex items-center justify-center w-20 h-20 rounded-full"
              style={{ background: GOLD, boxShadow: "0 0 60px hsl(42,78%,46%,0.45), 0 0 120px hsl(42,78%,46%,0.15)" }}>
              <motion.span
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.3 }}
                className="text-3xl font-bold" style={{ color: "#fff" }}>✓</motion.span>
            </motion.div>
          </div>

          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="font-sans text-[0.58rem] tracking-[0.38em] uppercase font-semibold mb-4"
            style={{ color: GOLD }}>Order Confirmed</motion.p>

          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
            className="font-display text-4xl lg:text-5xl font-bold mb-5 leading-tight"
            style={{ color: TEXT_PRIMARY }}>Your book is on its way.</motion.h1>

          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="font-serif text-base leading-relaxed max-w-md" style={{ color: TEXT_MUTED }}>
            Thank you for ordering <em>Uncommon Denominators</em>. Our team will be in touch within 24 hours
            to arrange delivery.
          </motion.p>
        </motion.div>

        {/* ── Receipt card ── */}
        {(order || payment) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="rounded-2xl mb-10"
            style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>

            <div className="flex items-center justify-between px-7 py-4"
              style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
              <div className="flex items-center gap-3">
                <h2 className="font-sans text-[0.6rem] font-bold tracking-[0.28em] uppercase"
                  style={{ color: TEXT_DIM }}>Receipt</h2>
                {payment?.status === "successful" ? (
                  <span className="font-sans text-[0.54rem] tracking-[0.18em] uppercase font-semibold px-2.5 py-1 rounded-sm"
                    style={{ background: "hsl(152,60%,95%)", border: "1px solid hsl(152,60%,78%)", color: "hsl(152,62%,36%)" }}>
                    Paid
                  </span>
                ) : payment?.status === "pending" ? (
                  <span className="font-sans text-[0.54rem] tracking-[0.18em] uppercase font-semibold px-2.5 py-1 rounded-sm"
                    style={{ background: "hsl(38,90%,95%)", border: "1px solid hsl(38,80%,78%)", color: "hsl(38,80%,38%)" }}>
                    Unpaid
                  </span>
                ) : null}
              </div>

              {/* Download button with loader */}
              <motion.button
                whileHover={{ scale: canDownload ? 1.05 : 1 }}
                whileTap={{ scale: canDownload ? 0.96 : 1 }}
                onClick={handleDownload}
                disabled={!canDownload}
                className="flex items-center gap-2 rounded-full px-3.5 py-2 transition-colors disabled:opacity-50"
                style={{
                  background: "hsl(42,78%,46%,0.1)",
                  border: "1px solid hsl(42,78%,46%,0.25)",
                  color: GOLD,
                  cursor: canDownload ? "pointer" : "default",
                  minWidth: "9rem",
                  justifyContent: "center",
                }}>
                <AnimatePresence mode="wait">
                  {downloading ? (
                    <motion.span key="loading" className="flex items-center gap-2"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="font-sans text-[0.62rem] tracking-[0.12em] uppercase font-semibold">
                        Downloading…
                      </span>
                    </motion.span>
                  ) : (
                    <motion.span key="idle" className="flex items-center gap-2"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Download className="h-3.5 w-3.5" />
                      <span className="font-sans text-[0.62rem] tracking-[0.12em] uppercase font-semibold">
                        Download Receipt
                      </span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            <div className="px-7 py-6">
              <div className="space-y-3.5">
                {order && (
                  <>
                    <ReceiptRow label="Order ID"    value={`#${order.id}`} mono />
                    <ReceiptRow label="Name"        value={order.fullName} />
                    <ReceiptRow label="Phone"       value={order.phone} />
                    <ReceiptRow label="Email"       value={order.email} />
                    <ReceiptRow label="Delivery"    value={`${order.deliveryAddress}, ${order.city}`} />
                    <ReceiptRow label="Edition"     value={<span className="capitalize">{order.productType}</span>} />
                    <ReceiptRow label="Quantity"    value={order.quantity} />
                    {order.notes && <ReceiptRow label="Notes" value={order.notes} />}
                  </>
                )}
                {payment && (
                  <>
                    <ReceiptRow label="Payment" value={methodLabel} />
                    <ReceiptRow label="Reference"
                      value={<span className="font-mono text-[0.68rem] px-2 py-0.5 rounded-full"
                        style={{ background: "hsl(40,14%,92%)", color: TEXT_MUTED }}>{payment.reference}</span>} />
                  </>
                )}
              </div>

              {order && (
                <div className="flex justify-between items-center mt-6 pt-5"
                  style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                  <span className="font-sans text-[0.65rem] uppercase tracking-[0.14em] font-semibold"
                    style={{ color: TEXT_DIM }}>Total Paid</span>
                  <span className="font-display text-2xl font-bold" style={{ color: GOLD }}>
                    {fmtMoney(order.totalAmount)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── What happens next ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Package, n: 1, title: "Order Received",  desc: "We have received your order and payment confirmation." },
            { icon: Phone,   n: 2, title: "We'll Call You",  desc: "Our team contacts you within 24 hours to arrange delivery." },
            { icon: Truck,   n: 3, title: "Fast Delivery",   desc: "Most orders delivered within 2–5 business days." },
          ].map(({ icon: Icon, n, title, desc }) => (
            <div key={title} className="rounded-xl p-5"
              style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(42,78%,46%,0.1)", border: "1px solid hsl(42,78%,46%,0.2)" }}>
                  <span className="font-sans text-[0.58rem] font-bold" style={{ color: GOLD }}>{n}</span>
                </div>
                <Icon size={14} style={{ color: TEXT_DIM }} />
                <h3 className="font-sans text-[0.72rem] font-semibold" style={{ color: TEXT_PRIMARY }}>{title}</h3>
              </div>
              <p className="font-sans text-[0.7rem] leading-relaxed" style={{ color: TEXT_DIM }}>{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Actions ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
          className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" className="font-sans uppercase w-full sm:w-auto"
              style={{ height: "2.75rem", color: TEXT_MUTED, background: "transparent" }}>
              Back to Home
            </Button>
          </Link>
          <motion.div whileHover={{ scale: canDownload ? 1.02 : 1, y: canDownload ? -1 : 0 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleDownload}
              disabled={!canDownload}
              variant="outline"
              className="font-sans uppercase w-full sm:w-auto flex items-center gap-2 disabled:opacity-40"
              style={{ height: "2.75rem", color: GOLD, background: "transparent", minWidth: "11rem" }}>
              {downloading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Downloading…</>
                : <><Download className="h-3.5 w-3.5" />Download Receipt</>
              }
            </Button>
          </motion.div>
          <Link href="/shop">
            <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
              <Button className="font-sans uppercase w-full sm:w-auto"
                style={{ height: "2.75rem",
                  background: GOLD, color: "#fff", fontWeight: 700, boxShadow: "0 4px 20px rgba(141,107,61,0.25)" }}>
                Order Another Copy
              </Button>
            </motion.div>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}

function ReceiptRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="font-sans text-[0.72rem] flex-shrink-0" style={{ color: TEXT_DIM }}>{label}</span>
      <span className={`font-sans text-[0.76rem] font-medium text-right ${mono ? "font-mono" : ""}`}
        style={{ color: TEXT_PRIMARY }}>{value}</span>
    </div>
  );
}
