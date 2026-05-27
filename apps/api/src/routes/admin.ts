import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  adminsTable,
  agentsTable,
  couriersTable,
  ordersTable,
  paymentsTable,
  buyersTable,
  visitorsTable,
  reviewsTable,
  paymentSettingsTable,
  paymentGatewaySettingsTable,
  productsTable,
} from "@workspace/db";
import { eq, sql, desc, count, sum, and, or, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signToken, requireAdmin } from "../lib/auth";
import { AdminLoginBody, ListAdminOrdersQueryParams, ListAdminBuyersQueryParams, ListAdminPaymentsQueryParams, GetAdminAnalyticsQueryParams, ApproveReviewParams } from "@workspace/api-zod";
import { contactsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, parsed.data.username));
  if (!admin) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ username: admin.username, id: admin.id });
  res.json({ token, username: admin.username });
});

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [totalVisitors] = await db.select({ count: count() }).from(visitorsTable);
  const [totalOrders] = await db.select({ count: count() }).from(ordersTable);
  const [revenueRow] = await db
    .select({ total: sum(paymentsTable.amount) })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "successful"));

  const [paperbackRow] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(eq(ordersTable.productType, "paperback"));

  const [hardcoverRow] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(eq(ordersTable.productType, "hardcover"));

  const [pendingRow] = await db
    .select({ count: count() })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "pending"));

  const [successfulRow] = await db
    .select({ count: count() })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "successful"));

  const [failedRow] = await db
    .select({ count: count() })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "failed"));

  const uniqueBuyers = await db
    .selectDistinct({ email: ordersTable.email })
    .from(ordersTable);

  const methodStats = await db
    .select({
      method: paymentsTable.method,
      count: count(),
      total: sum(paymentsTable.amount),
    })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "successful"))
    .groupBy(paymentsTable.method);

  res.json({
    totalVisitors: totalVisitors?.count ?? 0,
    totalBuyers: uniqueBuyers.length,
    totalOrders: totalOrders?.count ?? 0,
    totalRevenue: Number(revenueRow?.total ?? 0),
    paperbackSales: paperbackRow?.count ?? 0,
    hardcoverSales: hardcoverRow?.count ?? 0,
    pendingPayments: pendingRow?.count ?? 0,
    successfulPayments: successfulRow?.count ?? 0,
    failedPayments: failedRow?.count ?? 0,
    paymentMethodBreakdown: methodStats.map(m => ({
      method: m.method,
      count: m.count,
      total: Number(m.total ?? 0),
    })),
  });
});

router.get("/admin/orders", requireAdmin, async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1")) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "15")) || 15));
  const status = req.query.status ? String(req.query.status) : undefined;
  const search = String(req.query.search ?? "").trim();
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(ordersTable.status, status as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"));
  if (search) conditions.push(or(
    ilike(ordersTable.fullName, `%${search}%`),
    ilike(ordersTable.phone, `%${search}%`),
    ilike(ordersTable.city, `%${search}%`),
    ilike(ordersTable.email, `%${search}%`),
  ));
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const orders = await db.select().from(ordersTable)
    .where(whereClause)
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db.select({ count: count() }).from(ordersTable).where(whereClause);

  const orderIds = orders.map(o => o.id);
  const payments = orderIds.length > 0
    ? await db.select().from(paymentsTable)
        .where(sql`${paymentsTable.orderId} = ANY(${sql.raw(`ARRAY[${orderIds.join(",")}]`)}::int[])`)
    : [];

  const paymentMap = new Map(payments.map(p => [p.orderId, p]));

  res.json({
    orders: orders.map(o => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      payment: (() => {
        const p = paymentMap.get(o.id);
        return p ? { ...p, amount: Number(p.amount), createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() } : null;
      })(),
    })),
    total: totalRow?.count ?? 0,
    page,
    limit,
  });
});

router.get("/admin/buyers", requireAdmin, async (req, res): Promise<void> => {
  const queryParams = ListAdminBuyersQueryParams.safeParse(req.query);
  const page = queryParams.success ? (queryParams.data.page ?? 1) : 1;
  const limit = queryParams.success ? (queryParams.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const buyerStats = await db
    .select({
      email: ordersTable.email,
      fullName: ordersTable.fullName,
      phone: ordersTable.phone,
      city: ordersTable.city,
      totalOrders: count(ordersTable.id),
      totalSpent: sum(paymentsTable.amount),
      firstOrder: sql<Date>`MIN(${ordersTable.createdAt})`,
    })
    .from(ordersTable)
    .leftJoin(paymentsTable, and(eq(paymentsTable.orderId, ordersTable.id), eq(paymentsTable.status, "successful")))
    .groupBy(ordersTable.email, ordersTable.fullName, ordersTable.phone, ordersTable.city)
    .orderBy(desc(sql`MIN(${ordersTable.createdAt})`))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db
    .selectDistinct({ count: count(ordersTable.email) })
    .from(ordersTable);

  res.json({
    buyers: buyerStats.map((b, idx) => ({
      id: idx + 1 + offset,
      fullName: b.fullName,
      phone: b.phone,
      email: b.email,
      city: b.city,
      totalOrders: b.totalOrders,
      totalSpent: Number(b.totalSpent ?? 0),
      createdAt: b.firstOrder instanceof Date ? b.firstOrder.toISOString() : new Date(b.firstOrder).toISOString(),
    })),
    total: totalRow?.count ?? 0,
    page,
    limit,
  });
});

router.get("/admin/payments", requireAdmin, async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1")) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "15")) || 15));
  const status = req.query.status ? String(req.query.status) : undefined;
  const method = req.query.method ? String(req.query.method) : undefined;
  const search = String(req.query.search ?? "").trim();
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(paymentsTable.status, status as "pending" | "successful" | "failed"));
  if (method) conditions.push(eq(paymentsTable.method, method));
  if (search) conditions.push(or(
    ilike(paymentsTable.reference, `%${search}%`),
    ilike(paymentsTable.method, `%${search}%`),
    ilike(ordersTable.fullName, `%${search}%`),
    ilike(ordersTable.phone, `%${search}%`),
  ));
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: paymentsTable.id,
      orderId: paymentsTable.orderId,
      method: paymentsTable.method,
      amount: paymentsTable.amount,
      status: paymentsTable.status,
      reference: paymentsTable.reference,
      phoneNumber: paymentsTable.phoneNumber,
      accountName: paymentsTable.accountName,
      createdAt: paymentsTable.createdAt,
      orderName: ordersTable.fullName,
      orderPhone: ordersTable.phone,
      orderCity: ordersTable.city,
    })
    .from(paymentsTable)
    .leftJoin(ordersTable, eq(paymentsTable.orderId, ordersTable.id))
    .where(whereClause)
    .orderBy(desc(paymentsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db
    .select({ count: count() })
    .from(paymentsTable)
    .leftJoin(ordersTable, eq(paymentsTable.orderId, ordersTable.id))
    .where(whereClause);

  res.json({
    payments: rows.map(p => ({
      ...p,
      amount: Number(p.amount),
      createdAt: p.createdAt.toISOString(),
    })),
    total: totalRow?.count ?? 0,
    page,
    limit,
  });
});

router.get("/admin/analytics", requireAdmin, async (req, res): Promise<void> => {
  const queryParams = GetAdminAnalyticsQueryParams.safeParse(req.query);
  const period = queryParams.success ? (queryParams.data.period ?? "daily") : "daily";

  let dateTrunc: string;
  let daysBack: number;
  switch (period) {
    case "weekly":
      dateTrunc = "week";
      daysBack = 84;
      break;
    case "monthly":
      dateTrunc = "month";
      daysBack = 365;
      break;
    default:
      dateTrunc = "day";
      daysBack = 30;
  }

  const salesData = await db
    .select({
      date: sql<string>`DATE_TRUNC('${sql.raw(dateTrunc)}', ${ordersTable.createdAt})::date::text`,
      orders: count(ordersTable.id),
      revenue: sum(paymentsTable.amount),
    })
    .from(ordersTable)
    .leftJoin(paymentsTable, and(eq(paymentsTable.orderId, ordersTable.id), eq(paymentsTable.status, "successful")))
    .where(sql`${ordersTable.createdAt} >= NOW() - INTERVAL '${sql.raw(String(daysBack))} days'`)
    .groupBy(sql`DATE_TRUNC('${sql.raw(dateTrunc)}', ${ordersTable.createdAt})::date::text`)
    .orderBy(sql`DATE_TRUNC('${sql.raw(dateTrunc)}', ${ordersTable.createdAt})::date::text`);

  const visitorData = await db
    .select({
      date: sql<string>`DATE_TRUNC('${sql.raw(dateTrunc)}', ${visitorsTable.createdAt})::date::text`,
      pageViews: count(visitorsTable.id),
    })
    .from(visitorsTable)
    .where(sql`${visitorsTable.createdAt} >= NOW() - INTERVAL '${sql.raw(String(daysBack))} days'`)
    .groupBy(sql`DATE_TRUNC('${sql.raw(dateTrunc)}', ${visitorsTable.createdAt})::date::text`)
    .orderBy(sql`DATE_TRUNC('${sql.raw(dateTrunc)}', ${visitorsTable.createdAt})::date::text`);

  const visitorMap = new Map(visitorData.map(v => [v.date, v.pageViews]));

  const allDates = new Set([...salesData.map(s => s.date), ...visitorData.map(v => v.date)]);
  const mergedVisitorData = Array.from(allDates).sort().map(date => ({
    date,
    visitors: Math.ceil((visitorMap.get(date) ?? 0) * 0.6),
    pageViews: visitorMap.get(date) ?? 0,
  }));

  res.json({
    period,
    salesData: salesData.map(s => ({
      date: s.date,
      orders: s.orders,
      revenue: Number(s.revenue ?? 0),
    })),
    visitorData: mergedVisitorData,
  });
});

router.get("/admin/export/orders", requireAdmin, async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const payments = await db.select().from(paymentsTable);
  const paymentMap = new Map(payments.map(p => [p.orderId, p]));

  const headers = ["ID", "Name", "Phone", "Email", "City", "Address", "Product", "Qty", "Amount (K)", "Status", "Payment Method", "Payment Status", "Reference", "Date"];
  const rows = orders.map(o => {
    const p = paymentMap.get(o.id);
    return [
      o.id,
      o.fullName,
      o.phone,
      o.email,
      o.city,
      o.deliveryAddress,
      o.productType,
      o.quantity,
      Number(o.totalAmount),
      o.status,
      p?.method ?? "",
      p?.status ?? "",
      p?.reference ?? "",
      o.createdAt.toISOString().split("T")[0],
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  res.json({ csv, filename: `orders-${new Date().toISOString().split("T")[0]}.csv` });
});

router.get("/admin/export/buyers", requireAdmin, async (_req, res): Promise<void> => {
  const buyerStats = await db
    .select({
      email: ordersTable.email,
      fullName: ordersTable.fullName,
      phone: ordersTable.phone,
      city: ordersTable.city,
      totalOrders: count(ordersTable.id),
      totalSpent: sum(paymentsTable.amount),
      firstOrder: sql<Date>`MIN(${ordersTable.createdAt})`,
    })
    .from(ordersTable)
    .leftJoin(paymentsTable, and(eq(paymentsTable.orderId, ordersTable.id), eq(paymentsTable.status, "successful")))
    .groupBy(ordersTable.email, ordersTable.fullName, ordersTable.phone, ordersTable.city)
    .orderBy(desc(sql`MIN(${ordersTable.createdAt})`));

  const headers = ["Name", "Phone", "Email", "City", "Total Orders", "Total Spent (K)", "First Purchase"];
  const rows = buyerStats.map(b => [
    b.fullName,
    b.phone,
    b.email,
    b.city,
    b.totalOrders,
    Number(b.totalSpent ?? 0),
    new Date(b.firstOrder).toISOString().split("T")[0],
  ].join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  res.json({ csv, filename: `buyers-${new Date().toISOString().split("T")[0]}.csv` });
});

router.get("/admin/reviews", requireAdmin, async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1")) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "15")) || 15));
  const search = String(req.query.search ?? "").trim();
  const approvedFilter = req.query.approved ? String(req.query.approved) : "all";
  const offset = (page - 1) * limit;

  const conditions = [];
  if (approvedFilter === "true") conditions.push(eq(reviewsTable.approved, true));
  if (approvedFilter === "false") conditions.push(eq(reviewsTable.approved, false));
  if (search) conditions.push(or(
    ilike(reviewsTable.reviewerName, `%${search}%`),
    ilike(reviewsTable.comment, `%${search}%`),
    ilike(reviewsTable.reviewerTitle, `%${search}%`),
  ));
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const reviews = await db.select().from(reviewsTable)
    .where(whereClause)
    .orderBy(desc(reviewsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db.select({ count: count() }).from(reviewsTable).where(whereClause);

  res.json({
    reviews: reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
    total: totalRow?.count ?? 0,
    page,
    limit,
  });
});

router.patch("/admin/reviews/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ApproveReviewParams.safeParse({ id: Number(rawId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [review] = await db.update(reviewsTable)
    .set({ approved: true })
    .where(eq(reviewsTable.id, params.data.id))
    .returning();

  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  res.json({ ...review, createdAt: review.createdAt.toISOString() });
});

router.delete("/admin/reviews/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [deleted] = await db.delete(reviewsTable).where(eq(reviewsTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Review not found" });
    return;
  }
  res.json({ success: true });
});

router.patch("/admin/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { status } = req.body as { status: string };
  const validStatuses = ["pending", "confirmed", "awaiting_delivery", "picked_up", "in_transit", "delivered", "failed_delivery", "cancelled"];
  if (!id || isNaN(id) || !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [order] = await db.update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.id, id))
    .returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({
    ...order,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  });
});

router.get("/admin/contacts", requireAdmin, async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1")) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "15")) || 15));
  const search = String(req.query.search ?? "").trim();
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) conditions.push(or(
    ilike(contactsTable.name, `%${search}%`),
    ilike(contactsTable.email, `%${search}%`),
    ilike(contactsTable.message, `%${search}%`),
    ilike(contactsTable.phone, `%${search}%`),
  ));
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const contacts = await db.select().from(contactsTable)
    .where(whereClause)
    .orderBy(desc(contactsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db.select({ count: count() }).from(contactsTable).where(whereClause);

  res.json({
    contacts: contacts.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
    total: totalRow?.count ?? 0,
    page,
    limit,
  });
});

router.get("/admin/payment-settings", requireAdmin, async (_req, res): Promise<void> => {
  const settings = await db.select().from(paymentSettingsTable).orderBy(paymentSettingsTable.sortOrder);
  res.json(settings);
});

router.patch("/admin/payment-settings/:channelId", requireAdmin, async (req, res): Promise<void> => {
  const { channelId } = req.params;
  const { enabled } = req.body as { enabled: boolean };
  if (typeof enabled !== "boolean") {
    res.status(400).json({ error: "enabled must be a boolean" });
    return;
  }
  const [updated] = await db
    .update(paymentSettingsTable)
    .set({ enabled })
    .where(eq(paymentSettingsTable.channelId, channelId as string))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Channel not found" });
    return;
  }
  res.json(updated);
});

router.get("/admin/payment-gateway-settings", requireAdmin, async (_req, res): Promise<void> => {
  const [settings] = await db.select().from(paymentGatewaySettingsTable).limit(1);
  res.json(settings ?? null);
});

router.put("/admin/payment-gateway-settings", requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as {
    enabled?: boolean;
    baseUrl?: string;
    clientId?: string | null;
    clientSecret?: string | null;
    callbackUrl?: string | null;
    successUrl?: string | null;
    cancelUrl?: string | null;
    publicWebUrl?: string | null;
    publicApiUrl?: string | null;
    notes?: string | null;
  };

  if (typeof body.enabled !== "boolean" || typeof body.baseUrl !== "string" || !body.baseUrl.trim()) {
    res.status(400).json({ error: "enabled and baseUrl are required" });
    return;
  }

  const payload = {
    provider: "probase",
    enabled: body.enabled,
    baseUrl: body.baseUrl.trim(),
    clientId: body.clientId?.trim() || null,
    clientSecret: body.clientSecret?.trim() || null,
    callbackUrl: body.callbackUrl?.trim() || null,
    successUrl: body.successUrl?.trim() || null,
    cancelUrl: body.cancelUrl?.trim() || null,
    publicWebUrl: body.publicWebUrl?.trim() || null,
    publicApiUrl: body.publicApiUrl?.trim() || null,
    notes: body.notes?.trim() || null,
  };

  const [existing] = await db.select({ id: paymentGatewaySettingsTable.id }).from(paymentGatewaySettingsTable).limit(1);

  const [saved] = existing
    ? await db.update(paymentGatewaySettingsTable).set(payload).where(eq(paymentGatewaySettingsTable.id, existing.id)).returning()
    : await db.insert(paymentGatewaySettingsTable).values(payload).returning();

  res.json(saved);
});

// ── Agent management ──────────────────────────────────────────────────────────

router.get("/admin/agents", requireAdmin, async (_req, res): Promise<void> => {
  const agents = await db.select({
    id: agentsTable.id,
    name: agentsTable.name,
    phone: agentsTable.phone,
    email: agentsTable.email,
    active: agentsTable.active,
    createdAt: agentsTable.createdAt,
  }).from(agentsTable).orderBy(desc(agentsTable.createdAt));

  const agentIds = agents.map(a => a.id);
  let orderCounts: { agentId: number | null; cnt: number }[] = [];
  if (agentIds.length > 0) {
    orderCounts = await db.select({
      agentId: ordersTable.agentId,
      cnt: sql<number>`cast(count(*) as int)`,
    }).from(ordersTable)
      .where(sql`${ordersTable.agentId} = ANY(ARRAY[${sql.raw(agentIds.join(","))}]::int[])`)
      .groupBy(ordersTable.agentId);
  }
  const countMap = new Map(orderCounts.map(r => [r.agentId, r.cnt]));

  res.json(agents.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    totalOrders: countMap.get(a.id) ?? 0,
  })));
});

router.post("/admin/agents", requireAdmin, async (req, res): Promise<void> => {
  const { name, phone, email, password } = req.body as { name: string; phone: string; email: string; password: string };
  if (!name || !phone || !email || !password) {
    res.status(400).json({ error: "name, phone, email and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "password must be at least 6 characters" });
    return;
  }

  const existing = await db.select({ id: agentsTable.id }).from(agentsTable)
    .where(or(eq(agentsTable.email, email.toLowerCase().trim()), eq(agentsTable.phone, phone.trim())));
  if (existing.length > 0) {
    res.status(409).json({ error: "An agent with that email or phone already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [agent] = await db.insert(agentsTable).values({
    name: name.trim(),
    phone: phone.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    active: true,
  }).returning({
    id: agentsTable.id,
    name: agentsTable.name,
    phone: agentsTable.phone,
    email: agentsTable.email,
    active: agentsTable.active,
    createdAt: agentsTable.createdAt,
  });

  res.status(201).json({ ...agent, createdAt: agent.createdAt.toISOString() });
});

router.patch("/admin/agents/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "Invalid agent id" }); return; }

  const { active, name, phone, email } = req.body as { active?: boolean; name?: string; phone?: string; email?: string };
  const updates: Partial<{ active: boolean; name: string; phone: string; email: string }> = {};
  if (typeof active === "boolean") updates.active = active;
  if (name) updates.name = name.trim();
  if (phone) updates.phone = phone.trim();
  if (email) updates.email = email.toLowerCase().trim();

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  const [updated] = await db.update(agentsTable).set(updates).where(eq(agentsTable.id, id)).returning({
    id: agentsTable.id,
    name: agentsTable.name,
    phone: agentsTable.phone,
    email: agentsTable.email,
    active: agentsTable.active,
    createdAt: agentsTable.createdAt,
  });
  if (!updated) { res.status(404).json({ error: "Agent not found" }); return; }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.patch("/admin/agents/:id/reset-password", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { password } = req.body as { password: string };
  if (!password || password.length < 6) {
    res.status(400).json({ error: "password must be at least 6 characters" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [updated] = await db.update(agentsTable).set({ passwordHash }).where(eq(agentsTable.id, id)).returning({ id: agentsTable.id });
  if (!updated) { res.status(404).json({ error: "Agent not found" }); return; }
  res.json({ success: true });
});

// ── Stock management ──────────────────────────────────────────────────────────

router.get("/admin/stock", requireAdmin, async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(productsTable.type);
  res.json(products.map(p => ({
    ...p,
    priceKwacha: Number(p.priceKwacha),
    createdAt: p.createdAt.toISOString(),
  })));
});

router.patch("/admin/stock/:type", requireAdmin, async (req, res): Promise<void> => {
  const rawType = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;
  if (!["paperback", "hardcover"].includes(rawType)) {
    res.status(400).json({ error: "type must be paperback or hardcover" });
    return;
  }
  const { stockQuantity } = req.body as { stockQuantity: number };
  if (typeof stockQuantity !== "number" || stockQuantity < 0 || !Number.isInteger(stockQuantity)) {
    res.status(400).json({ error: "stockQuantity must be a non-negative integer" });
    return;
  }
  const [updated] = await db.update(productsTable)
    .set({ stockQuantity })
    .where(eq(productsTable.type, rawType))
    .returning();
  if (!updated) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ ...updated, priceKwacha: Number(updated.priceKwacha), createdAt: updated.createdAt.toISOString() });
});

// ── Courier management ────────────────────────────────────────────────────────

router.get("/admin/couriers", requireAdmin, async (_req, res): Promise<void> => {
  const couriers = await db.select({
    id: couriersTable.id,
    name: couriersTable.name,
    phone: couriersTable.phone,
    email: couriersTable.email,
    vehicleInfo: couriersTable.vehicleInfo,
    active: couriersTable.active,
    createdAt: couriersTable.createdAt,
  }).from(couriersTable).orderBy(couriersTable.name);

  const ids = couriers.map(c => c.id);
  let deliveryCounts: { courierId: number | null; cnt: number }[] = [];
  if (ids.length > 0) {
    deliveryCounts = await db.select({
      courierId: ordersTable.courierId,
      cnt: sql<number>`cast(count(*) as int)`,
    }).from(ordersTable)
      .where(sql`${ordersTable.courierId} = ANY(ARRAY[${sql.raw(ids.join(","))}]::int[])`)
      .groupBy(ordersTable.courierId);
  }
  const countMap = new Map(deliveryCounts.map(r => [r.courierId, r.cnt]));

  res.json(couriers.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    totalDeliveries: countMap.get(c.id) ?? 0,
  })));
});

router.post("/admin/couriers", requireAdmin, async (req, res): Promise<void> => {
  const { name, phone, email, password, vehicleInfo } = req.body as {
    name: string; phone: string; email: string; password: string; vehicleInfo?: string;
  };
  if (!name || !phone || !email || !password) {
    res.status(400).json({ error: "name, phone, email and password are required" }); return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "password must be at least 6 characters" }); return;
  }
  const existing = await db.select({ id: couriersTable.id }).from(couriersTable)
    .where(or(eq(couriersTable.email, email.toLowerCase().trim()), eq(couriersTable.phone, phone.trim())));
  if (existing.length > 0) {
    res.status(409).json({ error: "A courier with that email or phone already exists" }); return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [courier] = await db.insert(couriersTable).values({
    name: name.trim(),
    phone: phone.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    vehicleInfo: vehicleInfo?.trim() ?? null,
    active: true,
  }).returning({
    id: couriersTable.id, name: couriersTable.name, phone: couriersTable.phone,
    email: couriersTable.email, vehicleInfo: couriersTable.vehicleInfo,
    active: couriersTable.active, createdAt: couriersTable.createdAt,
  });
  res.status(201).json({ ...courier, createdAt: courier.createdAt.toISOString() });
});

router.patch("/admin/couriers/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "Invalid courier id" }); return; }
  const { active, name, phone, email, vehicleInfo } = req.body as {
    active?: boolean; name?: string; phone?: string; email?: string; vehicleInfo?: string;
  };
  const updates: Record<string, unknown> = {};
  if (typeof active === "boolean") updates.active = active;
  if (name) updates.name = name.trim();
  if (phone) updates.phone = phone.trim();
  if (email) updates.email = email.toLowerCase().trim();
  if (vehicleInfo !== undefined) updates.vehicleInfo = vehicleInfo.trim() || null;
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  const [updated] = await db.update(couriersTable)
    .set(updates as any)
    .where(eq(couriersTable.id, id))
    .returning({
      id: couriersTable.id, name: couriersTable.name, phone: couriersTable.phone,
      email: couriersTable.email, vehicleInfo: couriersTable.vehicleInfo,
      active: couriersTable.active, createdAt: couriersTable.createdAt,
    });
  if (!updated) { res.status(404).json({ error: "Courier not found" }); return; }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.patch("/admin/couriers/:id/reset-password", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { password } = req.body as { password: string };
  if (!password || password.length < 6) { res.status(400).json({ error: "password must be at least 6 characters" }); return; }
  const passwordHash = await bcrypt.hash(password, 12);
  const [u] = await db.update(couriersTable).set({ passwordHash }).where(eq(couriersTable.id, id)).returning({ id: couriersTable.id });
  if (!u) { res.status(404).json({ error: "Courier not found" }); return; }
  res.json({ success: true });
});

// ── Assign courier to order ───────────────────────────────────────────────────

router.patch("/admin/orders/:id/assign-courier", requireAdmin, async (req, res): Promise<void> => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId < 1) { res.status(400).json({ error: "Invalid order id" }); return; }

  const { courierId, deliveryPaymentMethod } = req.body as {
    courierId: number;
    deliveryPaymentMethod?: string;
  };
  if (!courierId) { res.status(400).json({ error: "courierId is required" }); return; }

  const [courier] = await db.select({ id: couriersTable.id, active: couriersTable.active })
    .from(couriersTable).where(eq(couriersTable.id, courierId));
  if (!courier) { res.status(404).json({ error: "Courier not found" }); return; }
  if (!courier.active) { res.status(400).json({ error: "Courier is inactive" }); return; }

  const updates: Record<string, unknown> = {
    courierId,
    status: "awaiting_delivery",
  };
  if (deliveryPaymentMethod) updates.deliveryPaymentMethod = deliveryPaymentMethod;

  const [updated] = await db.update(ordersTable)
    .set(updates as any)
    .where(eq(ordersTable.id, orderId))
    .returning();
  if (!updated) { res.status(404).json({ error: "Order not found" }); return; }

  res.json({
    ...updated,
    totalAmount: Number(updated.totalAmount),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

// ── Unassign courier from order ───────────────────────────────────────────────

router.patch("/admin/orders/:id/unassign-courier", requireAdmin, async (req, res): Promise<void> => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId < 1) { res.status(400).json({ error: "Invalid order id" }); return; }
  const [updated] = await db.update(ordersTable)
    .set({ courierId: null, status: "confirmed" } as any)
    .where(eq(ordersTable.id, orderId))
    .returning();
  if (!updated) { res.status(404).json({ error: "Order not found" }); return; }
  res.json({
    ...updated,
    totalAmount: Number(updated.totalAmount),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

// ── Order detail (with courier + agent info) ──────────────────────────────────

router.get("/admin/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId < 1) { res.status(400).json({ error: "Invalid order id" }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const [payment] = await db.select()
    .from(paymentsTable)
    .where(eq(paymentsTable.orderId, orderId))
    .orderBy(desc(paymentsTable.createdAt))
    .limit(1);
  const agent = order.agentId
    ? (await db.select({ id: agentsTable.id, name: agentsTable.name, phone: agentsTable.phone })
        .from(agentsTable).where(eq(agentsTable.id, order.agentId)))[0] ?? null
    : null;
  const courier = order.courierId
    ? (await db.select({
        id: couriersTable.id, name: couriersTable.name, phone: couriersTable.phone, vehicleInfo: couriersTable.vehicleInfo,
      }).from(couriersTable).where(eq(couriersTable.id, order.courierId)))[0] ?? null
    : null;

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
    agent,
    courier,
  });
});

export default router;
