import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { useGetOrder, useGetPayment, getGetOrderQueryKey, getGetPaymentQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { PAGE_BG, CARD_BG, CARD_BORDER, GOLD, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM } from "@/components/purchase-ui";
import { StepIndicator } from "@/components/purchase-ui";
import { Package, Phone, Truck } from "lucide-react";

export default function Confirmation() {
  const { currentOrderId, currentPaymentId, clearCart } = useCartStore();

  const { data: order } = useGetOrder(currentOrderId!, {
    query: { enabled: !!currentOrderId, queryKey: getGetOrderQueryKey(currentOrderId!) },
  });
  const { data: payment } = useGetPayment(currentPaymentId!, {
    query: { enabled: !!currentPaymentId, queryKey: getGetPaymentQueryKey(currentPaymentId!) },
  });

  useEffect(() => {
    const timer = setTimeout(() => clearCart(), 30000);
    return () => clearTimeout(timer);
  }, [clearCart]);

  return (
    <div style={{ minHeight: "100svh", background: PAGE_BG, position: "relative" }}
      className="pt-[4.5rem] pb-24 overflow-hidden">

      {/* Atmospheric glow — warm gold bloom */}
      <div className="absolute top-[8%] left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{
          width: "700px", height: "600px",
          background: "radial-gradient(ellipse, hsl(42,78%,46%,0.07) 0%, hsl(222,65%,14%,0.6) 38%, transparent 70%)",
          filter: "blur(20px)",
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 pt-14 max-w-3xl">

        {/* Step indicator */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <StepIndicator current={3} />
        </motion.div>

        {/* ── Hero: animated gold ring ── */}
        <motion.div className="flex flex-col items-center text-center mb-14"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

          {/* Gold check ring with pulse rings */}
          <div className="relative flex items-center justify-center mb-10">
            {/* Outer pulse ring 1 */}
            <motion.div className="absolute rounded-full"
              animate={{ scale: [1, 1.6, 1], opacity: [0.12, 0, 0.12] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
              style={{ width: 120, height: 120, background: "hsl(42,78%,46%,0.15)" }} />
            {/* Outer pulse ring 2 */}
            <motion.div className="absolute rounded-full"
              animate={{ scale: [1, 1.35, 1], opacity: [0.18, 0, 0.18] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
              style={{ width: 100, height: 100, background: "hsl(42,78%,46%,0.12)" }} />
            {/* Main ring */}
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
                className="text-3xl font-bold" style={{ color: "hsl(222,58%,8%)" }}>
                ✓
              </motion.span>
            </motion.div>
          </div>

          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="font-sans text-[0.58rem] tracking-[0.38em] uppercase font-semibold mb-4"
            style={{ color: GOLD }}>
            Order Confirmed
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
            className="font-display text-4xl lg:text-5xl font-bold mb-5 leading-tight"
            style={{ color: TEXT_PRIMARY }}>
            Your book is on its way.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="font-serif text-base leading-relaxed max-w-md" style={{ color: TEXT_MUTED }}>
            Thank you for ordering <em>The Luminous Path</em>. Our team will be in touch within 24 hours
            to arrange delivery.
          </motion.p>
        </motion.div>

        {/* ── Receipt card ── */}
        {(order || payment) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="rounded-sm mb-10" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>

            {/* Card header */}
            <div className="flex items-center justify-between px-7 py-4"
              style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
              <h2 className="font-sans text-[0.6rem] font-bold tracking-[0.28em] uppercase"
                style={{ color: TEXT_DIM }}>Receipt</h2>
              {payment?.status === "successful" && (
                <span className="font-sans text-[0.54rem] tracking-[0.18em] uppercase font-semibold px-2.5 py-1 rounded-sm"
                  style={{ background: "hsl(152,60%,14%)", border: "1px solid hsl(152,60%,24%)", color: "hsl(152,62%,50%)" }}>
                  Paid
                </span>
              )}
            </div>

            <div className="px-7 py-6">
              <div className="space-y-3.5">
                {order && (
                  <>
                    <ReceiptRow label="Order ID" value={`#${order.id}`} mono />
                    <ReceiptRow label="Name" value={order.fullName} />
                    <ReceiptRow label="Edition" value={<span className="capitalize">{order.productType}</span>} />
                    <ReceiptRow label="Quantity" value={order.quantity} />
                    <ReceiptRow label="Delivery to" value={order.city} />
                  </>
                )}
                {payment && (
                  <>
                    <ReceiptRow label="Payment Method"
                      value={payment.method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} />
                    <ReceiptRow label="Reference"
                      value={<span className="font-mono text-[0.68rem] px-2 py-0.5 rounded-sm"
                        style={{ background: "hsl(220,38%,10%)", color: TEXT_MUTED }}>{payment.reference}</span>} />
                  </>
                )}
              </div>

              {order && (
                <div className="flex justify-between items-center mt-6 pt-5"
                  style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                  <span className="font-sans text-[0.65rem] uppercase tracking-[0.14em] font-semibold"
                    style={{ color: TEXT_DIM }}>Total Paid</span>
                  <span className="font-display text-2xl font-bold" style={{ color: GOLD }}>
                    K{order.totalAmount}
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
            { icon: Package, n: 1, title: "Order Received",   desc: "We have received your order and payment confirmation." },
            { icon: Phone,   n: 2, title: "We'll Call You",   desc: "Our team contacts you within 24 hours to arrange delivery." },
            { icon: Truck,   n: 3, title: "Fast Delivery",    desc: "Most orders delivered within 2–5 business days." },
          ].map(({ icon: Icon, n, title, desc }) => (
            <div key={title} className="rounded-sm p-5"
              style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(42,78%,46%,0.1)", border: "1px solid hsl(42,78%,46%,0.2)" }}>
                  <span className="font-sans text-[0.58rem] font-bold" style={{ color: GOLD }}>{n}</span>
                </div>
                <h3 className="font-sans text-[0.72rem] font-semibold" style={{ color: TEXT_PRIMARY }}>{title}</h3>
              </div>
              <p className="font-sans text-[0.7rem] leading-relaxed" style={{ color: TEXT_DIM }}>{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Action buttons ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
          className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" className="font-sans tracking-[0.12em] uppercase w-full sm:w-auto"
              style={{ fontSize: "0.68rem", height: "2.75rem", borderColor: CARD_BORDER, color: TEXT_MUTED,
                background: "transparent" }}>
              Back to Home
            </Button>
          </Link>
          <Link href="/shop">
            <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
              <Button className="font-sans tracking-[0.12em] uppercase border-0 w-full sm:w-auto"
                style={{ fontSize: "0.68rem", height: "2.75rem",
                  background: GOLD, color: "hsl(222,58%,7%)",
                  boxShadow: "0 4px 20px hsl(42,78%,46%,0.25)" }}>
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
    <div className="flex justify-between items-center">
      <span className="font-sans text-[0.72rem]" style={{ color: TEXT_DIM }}>{label}</span>
      <span className={`font-sans text-[0.76rem] font-medium ${mono ? "font-mono" : ""}`}
        style={{ color: TEXT_PRIMARY }}>{value}</span>
    </div>
  );
}
