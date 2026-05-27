import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { couriersTable, ordersTable, paymentsTable, agentsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signCourierToken, requireCourier } from "../lib/auth";
import type { Request } from "express";

const router: IRouter = Router();

// ── Courier login ─────────────────────────────────────────────────────────────
router.post("/courier/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [courier] = await db.select().from(couriersTable)
    .where(eq(couriersTable.email, email.toLowerCase().trim()));
  if (!courier || !courier.active) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, courier.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signCourierToken({ id: courier.id, name: courier.name });
  res.json({
    token,
    courier: {
      id: courier.id,
      name: courier.name,
      phone: courier.phone,
      email: courier.email,
      vehicleInfo: courier.vehicleInfo,
    },
  });
});

// ── Courier profile ───────────────────────────────────────────────────────────
router.get("/courier/me", requireCourier, async (req, res): Promise<void> => {
  const courierReq = req as Request & { courier: { id: number; name: string } };
  const [courier] = await db.select({
    id: couriersTable.id,
    name: couriersTable.name,
    phone: couriersTable.phone,
    email: couriersTable.email,
    vehicleInfo: couriersTable.vehicleInfo,
    active: couriersTable.active,
  }).from(couriersTable).where(eq(couriersTable.id, courierReq.courier.id));

  if (!courier) { res.status(404).json({ error: "Courier not found" }); return; }
  res.json(courier);
});

// ── Orders assigned to this courier ──────────────────────────────────────────
router.get("/courier/orders", requireCourier, async (req, res): Promise<void> => {
  const courierReq = req as Request & { courier: { id: number; name: string } };
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.courierId, courierReq.courier.id))
    .orderBy(desc(ordersTable.updatedAt))
    .limit(limit).offset(offset);

  const [{ total }] = await db.select({ total: sql<number>`cast(count(*) as int)` })
    .from(ordersTable).where(eq(ordersTable.courierId, courierReq.courier.id));

  const orderIds = orders.map(o => o.id);
  const payments = orderIds.length
    ? await db.select().from(paymentsTable)
        .where(sql`${paymentsTable.orderId} = ANY(ARRAY[${sql.raw(orderIds.join(","))}]::int[])`)
    : [];
  const paymentMap = new Map(payments.map(p => [p.orderId, p]));

  // Fetch agent names
  const agentIds = [...new Set(orders.map(o => o.agentId).filter(Boolean))] as number[];
  const agents = agentIds.length
    ? await db.select({ id: agentsTable.id, name: agentsTable.name })
        .from(agentsTable)
        .where(sql`${agentsTable.id} = ANY(ARRAY[${sql.raw(agentIds.join(","))}]::int[])`)
    : [];
  const agentMap = new Map(agents.map(a => [a.id, a.name]));

  res.json({
    orders: orders.map(o => {
      const p = paymentMap.get(o.id);
      return {
        ...o,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        agentName: o.agentId ? (agentMap.get(o.agentId) ?? null) : null,
        payment: p ? {
          ...p,
          amount: Number(p.amount),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        } : null,
      };
    }),
    total,
    page,
    limit,
  });
});

// ── Courier updates order status / tracking notes ─────────────────────────────
router.patch("/courier/orders/:id/status", requireCourier, async (req, res): Promise<void> => {
  const courierReq = req as Request & { courier: { id: number; name: string } };
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId < 1) {
    res.status(400).json({ error: "Invalid order id" }); return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  if (order.courierId !== courierReq.courier.id) {
    res.status(403).json({ error: "This order is not assigned to you" }); return;
  }

  const { status, trackingNotes } = req.body as { status?: string; trackingNotes?: string };
  const allowedTransitions: Record<string, string[]> = {
    awaiting_delivery: ["picked_up"],
    picked_up:         ["in_transit"],
    in_transit:        ["delivered", "failed_delivery"],
    failed_delivery:   ["in_transit"],
  };

  const updates: Record<string, unknown> = {};
  if (status) {
    const allowed = allowedTransitions[order.status] ?? [];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: `Cannot transition from '${order.status}' to '${status}'` }); return;
    }
    updates.status = status;
  }
  if (trackingNotes !== undefined) updates.trackingNotes = trackingNotes;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nothing to update" }); return;
  }

  const [updated] = await db.update(ordersTable)
    .set(updates as any)
    .where(eq(ordersTable.id, orderId))
    .returning();

  res.json({
    ...updated,
    totalAmount: Number(updated.totalAmount),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

// ── Courier stats ─────────────────────────────────────────────────────────────
router.get("/courier/stats", requireCourier, async (req, res): Promise<void> => {
  const courierReq = req as Request & { courier: { id: number; name: string } };
  const id = courierReq.courier.id;

  const rows = await db.select({ status: ordersTable.status, cnt: sql<number>`cast(count(*) as int)` })
    .from(ordersTable).where(eq(ordersTable.courierId, id)).groupBy(ordersTable.status);

  const byStatus = Object.fromEntries(rows.map(r => [r.status, r.cnt]));
  res.json({
    assigned:      (byStatus.awaiting_delivery ?? 0) + (byStatus.picked_up ?? 0) + (byStatus.in_transit ?? 0),
    inTransit:     byStatus.in_transit ?? 0,
    delivered:     byStatus.delivered ?? 0,
    failedDelivery: byStatus.failed_delivery ?? 0,
  });
});

export default router;
