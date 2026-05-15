import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { useGetOrder, useGetPayment, getGetOrderQueryKey, getGetPaymentQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { PAGE_BG, CARD_BG, CARD_BORDER, GOLD, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM } from "@/components/purchase-ui";
import { StepIndicator } from "@/components/purchase-ui";
import { Package, Phone, Truck, Download } from "lucide-react";

function buildReceiptHtml(params: {
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
}): string {
  const {
    orderId, fullName, phone, email, deliveryAddress, city,
    productType, quantity, totalAmount, notes,
    paymentMethod, paymentReference, paymentStatus, issuedDate,
  } = params;

  const rows: [string, string][] = [
    ["Order ID",         `#${orderId}`],
    ["Customer Name",    fullName],
    ["Phone",            phone],
    ["Email",            email],
    ["Delivery Address", deliveryAddress],
    ["City",             city],
    ["Edition",          productType.charAt(0).toUpperCase() + productType.slice(1)],
    ["Quantity",         String(quantity)],
    ...(notes ? [["Notes", notes] as [string, string]] : []),
    ["Payment Method",   paymentMethod],
    ["Payment Reference",paymentReference],
    ["Payment Status",   paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt — Order #${orderId}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      background: #fff;
      color: #1a1a1a;
      padding: 3rem 3.5rem;
      max-width: 680px;
      margin: 0 auto;
    }
    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 1.25rem;
      margin-bottom: 1.75rem;
      border-bottom: 2px solid #c8a84b;
    }
    .logo {
      font-family: Georgia, serif;
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #0d1a38;
      text-transform: uppercase;
    }
    .logo-sub {
      font-size: 0.65rem;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #999;
      margin-top: 0.3rem;
    }
    .badge-paid {
      display: inline-block;
      padding: 0.22rem 0.75rem;
      background: #e6f4ec;
      color: #1a7a46;
      border: 1px solid #a8d8bc;
      border-radius: 3px;
      font-family: Arial, sans-serif;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    /* ── Title block ── */
    .title-block { margin-bottom: 1.75rem; }
    .title-block h1 {
      font-size: 1.65rem;
      font-weight: 700;
      color: #0d1a38;
      margin-bottom: 0.25rem;
    }
    .issued {
      font-size: 0.75rem;
      color: #888;
      font-style: italic;
    }
    /* ── Rows ── */
    .rows { margin-bottom: 1.5rem; }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0.6rem 0;
      border-bottom: 1px solid #ede8df;
      font-size: 0.875rem;
      gap: 1rem;
    }
    .row:first-child { border-top: 1px solid #ede8df; }
    .row-label { color: #777; flex-shrink: 0; }
    .row-value { font-weight: 600; color: #111; text-align: right; font-family: Arial, sans-serif; }
    .row-value.mono { font-family: "Courier New", monospace; font-size: 0.8rem; }
    /* ── Total ── */
    .total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.1rem 0 0;
      border-top: 2px solid #0d1a38;
      margin-bottom: 2.5rem;
    }
    .total-label {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0d1a38;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .total-amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: #b8860b;
    }
    /* ── Footer ── */
    .footer {
      padding-top: 1.2rem;
      border-top: 1px solid #ede8df;
      font-size: 0.72rem;
      color: #aaa;
      text-align: center;
      line-height: 1.7;
    }
    .footer strong { color: #888; }
    @media print {
      body { padding: 2rem 2.5rem; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Uncommon Denominators</div>
      <div class="logo-sub">by Mwanalushi &amp; Nalishebo &nbsp;·&nbsp; LIBROS Academic Publishing</div>
    </div>
    ${paymentStatus === "successful" ? '<span class="badge-paid">Paid</span>' : ""}
  </div>

  <div class="title-block">
    <h1>Purchase Receipt</h1>
    <p class="issued">Issued ${issuedDate}</p>
  </div>

  <div class="rows">
    ${rows.map(([label, value]) => {
      const isMono = label === "Payment Reference" || label === "Order ID";
      return `<div class="row">
      <span class="row-label">${label}</span>
      <span class="row-value${isMono ? " mono" : ""}">${value}</span>
    </div>`;
    }).join("\n    ")}
  </div>

  <div class="total">
    <span class="total-label">Total Paid</span>
    <span class="total-amount">K${totalAmount}</span>
  </div>

  <div class="footer">
    <strong>Uncommon Denominators</strong> — Mwanalushi &amp; Nalishebo<br />
    LIBROS Academic Publishing &nbsp;·&nbsp; For delivery enquiries call or WhatsApp <strong>0979 697 853</strong><br />
    Thank you for your order. Your copy is on its way!
  </div>
</body>
</html>`;
}

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

  const issuedDate = new Date().toLocaleDateString("en-ZM", {
    year: "numeric", month: "long", day: "numeric",
  });

  const methodLabel = payment?.method
    ? payment.method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  function handleDownloadReceipt() {
    if (!order || !payment) return;
    const html = buildReceiptHtml({
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

    const win = window.open("", "_blank", "width=780,height=900");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  const canDownload = !!(order && payment);

  return (
    <div style={{ minHeight: "100svh", background: PAGE_BG, position: "relative" }}
      className="pt-[4.5rem] pb-24 overflow-hidden">

      {/* Atmospheric glow */}
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

            {/* Header */}
            <div className="flex items-center justify-between px-7 py-4"
              style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
              <div className="flex items-center gap-3">
                <h2 className="font-sans text-[0.6rem] font-bold tracking-[0.28em] uppercase"
                  style={{ color: TEXT_DIM }}>Receipt</h2>
                {payment?.status === "successful" && (
                  <span className="font-sans text-[0.54rem] tracking-[0.18em] uppercase font-semibold px-2.5 py-1 rounded-sm"
                    style={{ background: "hsl(152,60%,14%)", border: "1px solid hsl(152,60%,24%)", color: "hsl(152,62%,50%)" }}>
                    Paid
                  </span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: canDownload ? 1.05 : 1 }}
                whileTap={{ scale: canDownload ? 0.96 : 1 }}
                onClick={handleDownloadReceipt}
                disabled={!canDownload}
                className="flex items-center gap-2 rounded-full px-3.5 py-2 transition-colors disabled:opacity-40"
                style={{
                  background: "hsl(42,78%,46%,0.1)",
                  border: "1px solid hsl(42,78%,46%,0.25)",
                  color: GOLD,
                  cursor: canDownload ? "pointer" : "default",
                }}>
                <Download className="h-3.5 w-3.5" />
                <span className="font-sans text-[0.62rem] tracking-[0.12em] uppercase font-semibold">
                  Download Receipt
                </span>
              </motion.button>
            </div>

            <div className="px-7 py-6">
              <div className="space-y-3.5">
                {order && (
                  <>
                    <ReceiptRow label="Order ID"      value={`#${order.id}`} mono />
                    <ReceiptRow label="Name"          value={order.fullName} />
                    <ReceiptRow label="Phone"         value={order.phone} />
                    <ReceiptRow label="Email"         value={order.email} />
                    <ReceiptRow label="Delivery"      value={`${order.deliveryAddress}, ${order.city}`} />
                    <ReceiptRow label="Edition"       value={<span className="capitalize">{order.productType}</span>} />
                    <ReceiptRow label="Quantity"      value={order.quantity} />
                    {order.notes && <ReceiptRow label="Notes" value={order.notes} />}
                  </>
                )}
                {payment && (
                  <>
                    <ReceiptRow label="Payment"
                      value={methodLabel} />
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
            <Button onClick={handleDownloadReceipt}
              disabled={!canDownload}
              variant="outline"
              className="font-sans uppercase w-full sm:w-auto flex items-center gap-2 disabled:opacity-40"
              style={{ height: "2.75rem", color: GOLD, background: "transparent" }}>
              <Download className="h-3.5 w-3.5" />
              Download Receipt
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
