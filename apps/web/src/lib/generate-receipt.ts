export interface ReceiptParams {
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
  deliveryPaymentMethod?: string | null;
}

export async function generateReceiptPdf(params: ReceiptParams): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = 210;
  const PH = 297;
  const M  = 18;
  const CW = PW - M * 2;

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

  const HDR = 52;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PW, HDR, "F");
  doc.setFillColor(...GOLD_C);
  doc.rect(0, 0, 4, HDR, "F");

  const bx = M + 2, by = 10, bw = 14, bh = 18;
  doc.setDrawColor(...GOLD_C);
  doc.setLineWidth(0.9);
  doc.rect(bx, by, bw / 2, bh, "S");
  doc.rect(bx + bw / 2, by, bw / 2, bh, "S");
  doc.setLineWidth(0.7);
  doc.line(bx + bw / 2, by, bx + bw / 2, by + bh);
  doc.setLineWidth(0.8);
  doc.line(bx + 2, by + bh + 2.5, bx + bw - 2, by + bh + 2.5);
  doc.setFillColor(...GOLD_C);
  doc.circle(bx + bw / 2, by + bh + 1.2, 0.8, "F");
  doc.circle(bx + bw / 2, by + bh + 3.8, 0.8, "F");

  const tx = bx + bw + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text("UNCOMMON DENOMINATORS", tx, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD_L);
  doc.text("by Shebo Nalishebo", tx, 27);
  doc.setFontSize(6.5);
  doc.setTextColor(160, 165, 195);
  doc.text("LIBROS Academic Publishing", tx, 32.5);

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

  let y = HDR + 12;
  doc.setFont("times", "bolditalic");
  doc.setFontSize(22);
  doc.setTextColor(...NAVY);
  doc.text("Purchase Receipt", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text(`Order #${params.orderId}  ·  Issued ${params.issuedDate}`, M, y + 7);

  y += 14;
  doc.setDrawColor(...GOLD_C);
  doc.setLineWidth(0.5);
  doc.line(M, y, M + CW, y);

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

  sectionHeading("Customer Details", M, y);
  let lY = y + 6;
  lY = field("Full Name",        params.fullName,                              M, lY) + 3;
  lY = field("Phone",            params.phone,                                 M, lY) + 3;
  lY = field("Email",            params.email,                                 M, lY) + 3;
  lY = field("Delivery Address", `${params.deliveryAddress}, ${params.city}`,  M, lY) + 3;

  sectionHeading("Order Details", COL2, y);
  let rY = y + 6;
  const edition = params.productType.charAt(0).toUpperCase() + params.productType.slice(1);
  rY = field("Edition",           edition,                   COL2, rY) + 3;
  rY = field("Quantity",          String(params.quantity),   COL2, rY) + 3;
  rY = field("Payment Method",    params.paymentMethod,      COL2, rY) + 3;
  rY = field("Payment Reference", params.paymentReference,   COL2, rY) + 3;
  if (params.notes) rY = field("Notes", params.notes, COL2, rY) + 3;

  y = Math.max(lY, rY) + 6;
  doc.setDrawColor(210, 207, 200);
  doc.setLineWidth(0.2);
  doc.line(M, y, M + CW, y);
  y += 8;

  const BAND_H = 20;
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, y, CW, BAND_H, 3, 3, "F");
  doc.setFillColor(...GOLD_C);
  doc.roundedRect(M, y, 4, BAND_H, 3, 3, "F");
  doc.rect(M + 1, y, 3, BAND_H, "F");

  const totalLabel = params.paymentStatus === "successful" ? "TOTAL PAID" : "AMOUNT DUE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(160, 165, 200);
  doc.text(totalLabel, M + 10, y + 8);
  doc.setFontSize(9);
  doc.setTextColor(...GOLD_L);
  doc.text("Zambian Kwacha (ZMW)", M + 10, y + 14.5);
  doc.setFontSize(20);
  doc.setTextColor(...GOLD_C);
  doc.text(`K${Number(params.totalAmount).toLocaleString("en-ZM")}`, M + CW - 4, y + 13.5, { align: "right" });

  y += BAND_H + 10;

  if (params.deliveryPaymentMethod) {
    const RED    = [160,  30,  30] as [number, number, number];
    const REDBG  = [255, 235, 235] as [number, number, number];
    const dmLabel = params.deliveryPaymentMethod === "bank_transfer"
      ? "Bank Transfer (EFT)"
      : "Mobile Money";
    doc.setFillColor(...REDBG);
    doc.roundedRect(M, y, CW, 22, 2, 2, "F");
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y, CW, 22, 2, 2, "S");
    doc.setFillColor(...RED);
    doc.roundedRect(M, y, 4, 22, 2, 2, "F");
    doc.rect(M + 1, y, 3, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...RED);
    doc.text("PAYMENT ON DELIVERY", M + 10, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 30, 30);
    doc.text(`Payment to be collected via ${dmLabel} at doorstep — NO CASH accepted.`, M + 10, y + 15);
    y += 30;
  }

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

  const footerY = PH - 16;
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
    "Shebo Nalishebo  ·  LIBROS Academic Publishing  ·  WhatsApp 0979 697 853",
    PW / 2, footerY + 5.5, { align: "center" },
  );

  doc.save(`receipt-order-${params.orderId}.pdf`);
}
