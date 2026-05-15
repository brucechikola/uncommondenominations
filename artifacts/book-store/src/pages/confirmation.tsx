import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { useGetOrder, useGetPayment, getGetOrderQueryKey, getGetPaymentQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { PAGE_BG, CARD_BG, CARD_BORDER, GOLD, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM, fmtMoney, fmtDate } from "@/components/purchase-ui";
import { StepIndicator } from "@/components/purchase-ui";
import { Package, Phone, Truck, Download, Loader2 } from "lucide-react";

async function generateReceiptPdf(params: {
  orderId: number;
  fullName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  city: string;
  productType: string;
  quantity: number;
  totalAmount: number;
  notes?: string | null;
  paymentMethod: string;
  paymentReference: string;
  paymentStatus: string;
  issuedDate: string;
}): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW     = 210;
  const PH     = 297;
  const M      = 18;   // side margin
  const CW     = PW - M * 2;

  // Palette
  const NAVY   = [8,   18,  46]  as [number, number, number];
  const NAVY2  = [14,  28,  66]  as [number, number, number];
  const GOLD_C = [141, 107, 61]  as [number, number, number];
  const GOLD_L = [200, 162, 100] as [number, number, number];
  const WHITE  = [255, 255, 255] as [number, number, number];
  const SMOKE  = [245, 243, 239] as [number, number, number];
  const GREY   = [110, 110, 120] as [number, number, number];
  const GREEN  = [22,  110,  60] as [number, number, number];
  const GBG    = [224, 242, 232] as [number, number, number];
  const AMBER  = [180, 110,  10] as [number, number, number];
  const ABG    = [253, 244, 220] as [number, number, number];

  // ── Full-bleed navy header ────────────────────────────────────────────────
  const HDR = 52;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PW, HDR, "F");

  // Subtle side accent stripe
  doc.setFillColor(...GOLD_C);
  doc.rect(0, 0, 4, HDR, "F");

  // Mini book icon drawn in-PDF (matches site logo)
  const bx = M + 2, by = 10, bw = 14, bh = 18;
  doc.setDrawColor(...GOLD_C);
  doc.setLineWidth(0.9);
  // Left page
  doc.rect(bx, by, bw / 2, bh, "S");
  // Right page
  doc.rect(bx + bw / 2, by, bw / 2, bh, "S");
  // Spine divider
  doc.setLineWidth(0.7);
  doc.line(bx + bw / 2, by, bx + bw / 2, by + bh);
  // Fraction bar beneath book
  doc.setLineWidth(0.8);
  doc.line(bx + 2, by + bh + 2.5, bx + bw - 2, by + bh + 2.5);
  // Dots
  doc.setFillColor(...GOLD_C);
  doc.circle(bx + bw / 2, by + bh + 1.2, 0.8, "F");
  doc.circle(bx + bw / 2, by + bh + 3.8, 0.8, "F");

  // Title text
  const tx = bx + bw + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text("UNCOMMON DENOMINATORS", tx, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD_L);
  doc.text("by Monde Mwanalushi & Eric Nalishebo", tx, 27);

  doc.setFontSize(6.5);
  doc.setTextColor(160, 165, 195);
  doc.text("LIBROS Academic Publishing", tx, 32.5);

  // ── PAID / UNPAID stamp ──────────────────────────────────────────────────
  const badgeX = PW - M - 28;
  if (params.paymentStatus === "successful") {
    doc.setFillColor(...GBG);
    doc.roundedRect(badgeX, 18, 26, 10, 2, 2, "F");
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.5);
    doc.roundedRect(badgeX, 18, 26, 10, 2, 2, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GREEN);
    doc.text("✓  PAID", badgeX + 13, 24.5, { align: "center" });
  } else {
    doc.setFillColor(...ABG);
    doc.roundedRect(badgeX, 18, 26, 10, 2, 2, "F");
    doc.setDrawColor(...AMBER);
    doc.setLineWidth(0.5);
    doc.roundedRect(badgeX, 18, 26, 10, 2, 2, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...AMBER);
    doc.text("UNPAID", badgeX + 13, 24.5, { align: "center" });
  }

  // ── "Purchase Receipt" heading ────────────────────────────────────────────
  let y = HDR + 12;

  doc.setFont("times", "bolditalic");
  doc.setFontSize(22);
  doc.setTextColor(...NAVY);
  doc.text("Purchase Receipt", M, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text(`Order #${params.orderId}  ·  Issued ${params.issuedDate}`, M, y + 7);

  // Gold rule
  y += 14;
  doc.setDrawColor(...GOLD_C);
  doc.setLineWidth(0.5);
  doc.line(M, y, M + CW, y);

  // ── Two-column customer / order section ──────────────────────────────────
  y += 9;
  const COL_W = (CW - 8) / 2;
  const COL2  = M + COL_W + 8;

  function sectionHeading(label: string, x: number, yy: number) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...GOLD_C);
    doc.text(label.toUpperCase(), x, yy);
    doc.setDrawColor(...GOLD_C);
    doc.setLineWidth(0.3);
    doc.line(x, yy + 1.5, x + COL_W, yy + 1.5);
  }

  function field(label: string, value: string, x: number, yy: number): number {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GREY);
    doc.text(label, x, yy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    const lines = doc.splitTextToSize(value, COL_W);
    doc.text(lines, x, yy + 5);
    return yy + 5 + lines.length * 5;
  }

  // Left column — Customer
  sectionHeading("Customer Details", M, y);
  let lY = y + 6;
  lY = field("Full Name",         params.fullName,                           M,     lY) + 3;
  lY = field("Phone",             params.phone,                              M,     lY) + 3;
  lY = field("Email",             params.email,                              M,     lY) + 3;
  lY = field("Delivery Address",  `${params.deliveryAddress}, ${params.city}`, M,  lY) + 3;

  // Right column — Order
  sectionHeading("Order Details", COL2, y);
  let rY = y + 6;
  const edition = params.productType.charAt(0).toUpperCase() + params.productType.slice(1);
  rY = field("Edition",           edition,                     COL2, rY) + 3;
  rY = field("Quantity",          String(params.quantity),      COL2, rY) + 3;
  rY = field("Payment Method",    params.paymentMethod,         COL2, rY) + 3;
  rY = field("Payment Reference", params.paymentReference,      COL2, rY) + 3;
  if (params.notes) {
    rY = field("Notes", params.notes, COL2, rY) + 3;
  }

  y = Math.max(lY, rY) + 6;

  // Thin separator
  doc.setDrawColor(210, 207, 200);
  doc.setLineWidth(0.2);
  doc.line(M, y, M + CW, y);
  y += 8;

  // ── Total band ───────────────────────────────────────────────────────────
  const BAND_H = 20;
  // Outer navy band
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, y, CW, BAND_H, 3, 3, "F");
  // Left gold accent
  doc.setFillColor(...GOLD_C);
  doc.roundedRect(M, y, 4, BAND_H, 3, 3, "F");
  doc.rect(M + 1, y, 3, BAND_H, "F");   // square off right side of accent

  const totalLabel = params.paymentStatus === "successful" ? "TOTAL PAID" : "AMOUNT DUE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(160, 165, 200);
  doc.text(totalLabel, M + 10, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GOLD_L);
  doc.text("Zambian Kwacha (ZMW)", M + 10, y + 14.5);

  const amtStr = `K${Number(params.totalAmount).toLocaleString("en-ZM")}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...GOLD_C);
  doc.text(amtStr, M + CW - 4, y + 13.5, { align: "right" });

  y += BAND_H + 10;

  // ── Thank-you note box ───────────────────────────────────────────────────
  doc.setFillColor(...SMOKE);
  doc.roundedRect(M, y, CW, 18, 2, 2, "F");
  doc.setDrawColor(220, 215, 205);
  doc.setLineWidth(0.25);
  doc.roundedRect(M, y, CW, 18, 2, 2, "S");

  doc.setFont("times", "bolditalic");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY2);
  doc.text('"The book Zambia has been waiting for."', PW / 2, y + 8, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GREY);
  doc.text("Thank you for your order — our team will reach out within 24 hours.", PW / 2, y + 14, { align: "center" });

  // ── Footer ───────────────────────────────────────────────────────────────
  const footerY = PH - 16;

  // Full-width navy footer bar
  doc.setFillColor(...NAVY);
  doc.rect(0, footerY - 6, PW, 24, "F");
  doc.setFillColor(...GOLD_C);
  doc.rect(0, footerY - 6, 4, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...GOLD_L);
  doc.text("UNCOMMON DENOMINATORS", PW / 2, footerY, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(160, 165, 195);
  doc.text(
    "Mwanalushi & Nalishebo  ·  LIBROS Academic Publishing  ·  WhatsApp 0979 697 853",
    PW / 2, footerY + 5.5, { align: "center" },
  );

  doc.save(`receipt-order-${params.orderId}.pdf`);
}

export default function Confirmation() {
  const { currentOrderId, currentPaymentId, clearCart } = useCartStore();
  const [downloading, setDownloading] = useState(false);

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
          background: "radial-gradient(ellipse, hsl(42,78%,46%,0.07) 0%, hsl(222,65%,14%,0.6) 38%, transparent 70%)",
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
                className="text-3xl font-bold" style={{ color: "hsl(222,58%,8%)" }}>✓</motion.span>
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
                    style={{ background: "hsl(152,60%,14%)", border: "1px solid hsl(152,60%,24%)", color: "hsl(152,62%,50%)" }}>
                    Paid
                  </span>
                ) : payment?.status === "pending" ? (
                  <span className="font-sans text-[0.54rem] tracking-[0.18em] uppercase font-semibold px-2.5 py-1 rounded-sm"
                    style={{ background: "hsl(38,80%,10%)", border: "1px solid hsl(38,80%,24%)", color: "hsl(38,90%,62%)" }}>
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
