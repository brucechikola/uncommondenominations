import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  adminsTable,
  ordersTable,
  paymentsTable,
  buyersTable,
  visitorsTable,
  reviewsTable,
  paymentSettingsTable,
} from "@workspace/db";
import { eq, sql, desc, count, sum, and } from "drizzle-orm";
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
  const queryParams = ListAdminOrdersQueryParams.safeParse(req.query);
  const page = queryParams.success ? (queryParams.data.page ?? 1) : 1;
  const limit = queryParams.success ? (queryParams.data.limit ?? 20) : 20;
  const status = queryParams.success ? queryParams.data.status : undefined;
  const offset = (page - 1) * limit;

  const whereClause = status ? eq(ordersTable.status, status) : undefined;

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
  const queryParams = ListAdminPaymentsQueryParams.safeParse(req.query);
  const status = queryParams.success ? queryParams.data.status : undefined;
  const method = queryParams.success ? queryParams.data.method : undefined;

  let query = db.select().from(paymentsTable);

  const conditions = [];
  if (status) conditions.push(eq(paymentsTable.status, status));
  if (method) conditions.push(eq(paymentsTable.method, method));

  const payments = await db.select().from(paymentsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(paymentsTable.createdAt));

  res.json(payments.map(p => ({
    ...p,
    amount: Number(p.amount),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  })));
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

router.get("/admin/reviews", requireAdmin, async (_req, res): Promise<void> => {
  const reviews = await db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt));
  res.json(reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
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
  const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  if (!id || isNaN(id) || !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [order] = await db.update(ordersTable)
    .set({ status: status as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" })
    .where(eq(ordersTable.id, id))
    .returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ ...order, createdAt: order.createdAt.toISOString() });
});

router.get("/admin/contacts", requireAdmin, async (_req, res): Promise<void> => {
  const contacts = await db.select().from(contactsTable).orderBy(desc(contactsTable.createdAt));
  res.json(contacts.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })));
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
    .where(eq(paymentSettingsTable.channelId, channelId))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Channel not found" });
    return;
  }
  res.json(updated);
});

export default router;
