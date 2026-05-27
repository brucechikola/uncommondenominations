import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { agentsTable, ordersTable, paymentsTable, productsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signAgentToken, requireAgent } from "../lib/auth";
import type { Request } from "express";
import crypto from "crypto";

const router: IRouter = Router();

// Pricing tiers: standard, bulk (10+), institutional (50+)
const TIER_PRICES: Record<string, Record<string, number>> = {
  paperback: { standard: 400, bulk: 360, institutional: 320 },
  hardcover: { standard: 500, bulk: 450, institutional: 400 },
};

function resolveTier(quantity: number): string {
  if (quantity >= 50) return "institutional";
  if (quantity >= 10) return "bulk";
  return "standard";
}

function resolvePrice(productType: string, quantity: number, tier?: string): number {
  const resolvedTier = tier ?? resolveTier(quantity);
  return (TIER_PRICES[productType]?.[resolvedTier] ?? TIER_PRICES[productType]?.standard ?? 0) * quantity;
}

function generatePaymentToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

// ── Agent login ───────────────────────────────────────────────────────────────
router.post("/agent/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.email, email.toLowerCase().trim()));
  if (!agent || !agent.active) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, agent.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signAgentToken({ id: agent.id, name: agent.name });
  res.json({ token, agent: { id: agent.id, name: agent.name, phone: agent.phone, email: agent.email } });
});

// ── Get agent profile ─────────────────────────────────────────────────────────
router.get("/agent/me", requireAgent, async (req, res): Promise<void> => {
  const agentReq = req as Request & { agent: { id: number; name: string } };
  const [agent] = await db.select({
    id: agentsTable.id,
    name: agentsTable.name,
    phone: agentsTable.phone,
    email: agentsTable.email,
    active: agentsTable.active,
    createdAt: agentsTable.createdAt,
  }).from(agentsTable).where(eq(agentsTable.id, agentReq.agent.id));

  if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }
  res.json({ ...agent, createdAt: agent.createdAt.toISOString() });
});

// ── Create order (agent-assisted) ─────────────────────────────────────────────
router.post("/agent/orders", requireAgent, async (req, res): Promise<void> => {
  const agentReq = req as Request & { agent: { id: number; name: string } };

  const { fullName, phone, email, deliveryAddress, city, productType, quantity, notes, overrideTier } = req.body as {
    fullName: string;
    phone: string;
    email: string;
    deliveryAddress: string;
    city: string;
    productType: string;
    quantity: number;
    notes?: string;
    overrideTier?: string;
  };

  if (!fullName || !phone || !email || !deliveryAddress || !city || !productType || !quantity) {
    res.status(400).json({ error: "fullName, phone, email, deliveryAddress, city, productType, quantity are required" });
    return;
  }
  if (!["paperback", "hardcover"].includes(productType)) {
    res.status(400).json({ error: "productType must be paperback or hardcover" });
    return;
  }
  if (quantity < 1 || quantity > 10000) {
    res.status(400).json({ error: "quantity must be between 1 and 10000" });
    return;
  }

  // Check stock
  const [product] = await db.select().from(productsTable).where(eq(productsTable.type, productType));
  if (product && product.stockQuantity < quantity) {
    res.status(409).json({ error: `Insufficient stock. Available: ${product.stockQuantity}` });
    return;
  }

  const tier = overrideTier ?? resolveTier(quantity);
  const totalAmount = resolvePrice(productType, quantity, tier);
  const paymentLinkToken = generatePaymentToken();

  const [order] = await db.insert(ordersTable).values({
    fullName: fullName.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    deliveryAddress: deliveryAddress.trim(),
    city: city.trim(),
    productType,
    quantity,
    totalAmount: totalAmount.toString(),
    status: "pending",
    notes: notes ?? null,
    agentId: agentReq.agent.id,
    pricingTier: tier,
    paymentLinkToken,
  }).returning();

  res.status(201).json({
    ...order,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    payment: null,
    pricingTier: tier,
    paymentLink: `/pay/${paymentLinkToken}`,
  });
});

// ── List agent's own orders ───────────────────────────────────────────────────
router.get("/agent/orders", requireAgent, async (req, res): Promise<void> => {
  const agentReq = req as Request & { agent: { id: number; name: string } };
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.agentId, agentReq.agent.id))
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db.select({ total: sql<number>`cast(count(*) as int)` })
    .from(ordersTable)
    .where(eq(ordersTable.agentId, agentReq.agent.id));

  // Fetch payments for these orders
  const orderIds = orders.map(o => o.id);
  const payments = orderIds.length
    ? await db.select().from(paymentsTable).where(sql`${paymentsTable.orderId} = ANY(${sql.raw(`ARRAY[${orderIds.join(",")}]::int[]`)})`)
    : [];
  const paymentMap = new Map(payments.map(p => [p.orderId, p]));

  const result = orders.map(o => {
    const p = paymentMap.get(o.id);
    return {
      ...o,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      paymentLink: o.paymentLinkToken ? `/pay/${o.paymentLinkToken}` : null,
      payment: p ? { ...p, amount: Number(p.amount), createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() } : null,
    };
  });

  res.json({ orders: result, total, page, limit });
});

// ── Get single order by payment link token (public — for pay page) ────────────
router.get("/pay/:token", async (req, res): Promise<void> => {
  const [order] = await db.select().from(ordersTable)
    .where(eq(ordersTable.paymentLinkToken, req.params.token));

  if (!order) { res.status(404).json({ error: "Payment link not found or expired" }); return; }

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.orderId, order.id));

  res.json({
    ...order,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    payment: payment ? { ...payment, amount: Number(payment.amount), createdAt: payment.createdAt.toISOString(), updatedAt: payment.updatedAt.toISOString() } : null,
  });
});

// ── Agent stats summary ───────────────────────────────────────────────────────
router.get("/agent/stats", requireAgent, async (req, res): Promise<void> => {
  const agentReq = req as Request & { agent: { id: number; name: string } };
  const agentId = agentReq.agent.id;

  const [{ totalOrders }] = await db.select({ totalOrders: sql<number>`cast(count(*) as int)` })
    .from(ordersTable).where(eq(ordersTable.agentId, agentId));

  const ordersWithPayments = await db
    .select({ orderId: paymentsTable.orderId, amount: paymentsTable.amount, status: paymentsTable.status })
    .from(paymentsTable)
    .innerJoin(ordersTable, and(eq(paymentsTable.orderId, ordersTable.id), eq(ordersTable.agentId, agentId)));

  const confirmed = ordersWithPayments.filter(p => p.status === "successful");
  const totalRevenue = confirmed.reduce((s, p) => s + Number(p.amount), 0);
  const pendingPayments = ordersWithPayments.filter(p => p.status === "pending").length;

  res.json({ totalOrders, totalRevenue, pendingPayments, confirmedOrders: confirmed.length });
});

export default router;
