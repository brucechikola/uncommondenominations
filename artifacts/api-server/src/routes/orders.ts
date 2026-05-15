import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ordersTable, paymentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateOrderBody, GetOrderParams } from "@workspace/api-zod";

const PRICES: Record<string, number> = {
  paperback: 400,
  hardcover: 500,
};

const router: IRouter = Router();

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const unitPrice = PRICES[parsed.data.productType] ?? 0;
  const totalAmount = unitPrice * parsed.data.quantity;

  const [order] = await db.insert(ordersTable).values({
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    email: parsed.data.email,
    deliveryAddress: parsed.data.deliveryAddress,
    city: parsed.data.city,
    productType: parsed.data.productType,
    quantity: parsed.data.quantity,
    totalAmount: totalAmount.toString(),
    status: "pending",
    notes: parsed.data.notes ?? null,
  }).returning();

  res.status(201).json({
    ...order,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    payment: null,
  });
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetOrderParams.safeParse({ id: Number(raw) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.orderId, order.id));

  res.json({
    ...order,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    payment: payment ? {
      ...payment,
      amount: Number(payment.amount),
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    } : null,
  });
});

export default router;
