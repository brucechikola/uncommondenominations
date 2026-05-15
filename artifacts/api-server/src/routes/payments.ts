import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { paymentsTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { InitiatePaymentBody, GetPaymentParams, SimulatePaymentParams, SimulatePaymentBody } from "@workspace/api-zod";

const router: IRouter = Router();

function generateReference(): string {
  const prefix = "TXN";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

const PRICES: Record<string, number> = {
  paperback: 400,
  hardcover: 500,
};

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = InitiatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, parsed.data.orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const amount = Number(order.totalAmount) || PRICES[order.productType] * order.quantity;

  const [payment] = await db.insert(paymentsTable).values({
    orderId: parsed.data.orderId,
    method: parsed.data.method,
    amount: amount.toString(),
    status: "pending",
    reference: generateReference(),
    phoneNumber: parsed.data.phoneNumber ?? null,
    accountName: parsed.data.accountName ?? null,
  }).returning();

  res.status(201).json({
    ...payment,
    amount: Number(payment.amount),
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  });
});

router.get("/payments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPaymentParams.safeParse({ id: Number(raw) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, params.data.id));
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  res.json({
    ...payment,
    amount: Number(payment.amount),
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  });
});

router.patch("/payments/:id/simulate", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SimulatePaymentParams.safeParse({ id: Number(rawId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SimulatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [payment] = await db.update(paymentsTable)
    .set({ status: parsed.data.outcome })
    .where(eq(paymentsTable.id, params.data.id))
    .returning();

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  if (parsed.data.outcome === "successful") {
    await db.update(ordersTable)
      .set({ status: "confirmed" })
      .where(eq(ordersTable.id, payment.orderId));
  }

  res.json({
    ...payment,
    amount: Number(payment.amount),
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  });
});

export default router;
