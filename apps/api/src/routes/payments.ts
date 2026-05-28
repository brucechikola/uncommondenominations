import { Router, type IRouter, type Request } from "express";
import { db, ordersTable, paymentsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import {
  GetPaymentParams,
  InitiatePaymentBody,
  SimulatePaymentBody,
  SimulatePaymentParams,
} from "@workspace/api-zod";
import {
  createCheckoutCollection,
  createDirectCollection,
  detectZambianMobileMoneyNetwork,
  getGatewayDescription,
  getProbaseResolvedConfig,
  getGatewayTransactionId,
  inquireCollection,
  mapGatewayStatus,
  normalizeZambianPhoneNumber,
  splitCustomerName,
  type ProbaseCollectionResponse,
} from "../lib/probase";

const router: IRouter = Router();

const PRICES: Record<string, number> = {
  paperback: 400,
  hardcover: 500,
};

function isMobileMoneyMethod(method: string): method is "airtel_money" | "mtn_money" | "zamtel_money" {
  return ["airtel_money", "mtn_money", "zamtel_money"].includes(method);
}

function generateReference(orderId: number): string {
  const prefix = "TXN";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${orderId}-${timestamp}-${random}`;
}

function getOrigin(req: Request): string {
  const proto = (req.header("x-forwarded-proto") || req.protocol || "http").split(",")[0].trim();
  const host = (req.header("x-forwarded-host") || req.header("host") || "").split(",")[0].trim();
  return `${proto}://${host}`;
}

function getWebBaseUrl(req: Request): string {
  return process.env.PUBLIC_WEB_URL?.trim()?.replace(/\/+$/, "") || getOrigin(req);
}

function getApiBaseUrl(req: Request): string {
  return process.env.PUBLIC_API_URL?.trim()?.replace(/\/+$/, "") || `${getOrigin(req)}/api`;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function serializePayment(payment: typeof paymentsTable.$inferSelect) {
  return {
    ...payment,
    amount: Number(payment.amount),
    gatewayLastPayload: payment.gatewayLastPayload ?? null,
    lastCheckedAt: payment.lastCheckedAt?.toISOString() ?? null,
    completedAt: payment.completedAt?.toISOString() ?? null,
    expiresAt: payment.expiresAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

async function setOrderStatusFromPayment(orderId: number, status: "pending" | "successful" | "failed", method: string) {
  if (method === "mobile_money_on_delivery") {
    await db.update(ordersTable).set({ status: "confirmed" }).where(eq(ordersTable.id, orderId));
    return;
  }

  if (status === "successful") {
    await db.update(ordersTable).set({ status: "awaiting_delivery" }).where(eq(ordersTable.id, orderId));
  }
}

async function syncPaymentFromGateway(paymentId: number, gateway: ProbaseCollectionResponse) {
  const localStatus = mapGatewayStatus(gateway.status);
  const gatewayTransactionId = getGatewayTransactionId(gateway);
  const [existing] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId)).limit(1);
  const [payment] = await db.update(paymentsTable)
    .set({
      status: localStatus,
      gatewayStatus: gateway.status,
      gatewayTransactionId,
      gatewayCheckoutUrl: gateway.session_url ?? existing?.gatewayCheckoutUrl ?? null,
      gatewayProviderReference: gateway.transaction?.provider_reference ?? null,
      gatewayLastPayload: gateway,
      lastCheckedAt: new Date(),
      completedAt: toDate(gateway.transaction?.completed_at),
      expiresAt: toDate(gateway.transaction?.expires_at),
      failureReason: localStatus === "failed" ? (getGatewayDescription(gateway) ?? gateway.status) : null,
    })
    .where(eq(paymentsTable.id, paymentId))
    .returning();

  if (!payment) return null;
  await setOrderStatusFromPayment(payment.orderId, payment.status as "pending" | "successful" | "failed", payment.method);
  return payment;
}

function getNestedString(record: Record<string, unknown>, paths: string[][]): string | null {
  for (const path of paths) {
    let current: unknown = record;
    let valid = true;
    for (const segment of path) {
      if (!current || typeof current !== "object" || !(segment in current)) {
        valid = false;
        break;
      }
      current = (current as Record<string, unknown>)[segment];
    }
    if (valid && typeof current === "string" && current.trim()) {
      return current.trim();
    }
  }
  return null;
}

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
  const reference = generateReference(order.id);
  const normalizedPhone = parsed.data.phoneNumber ? normalizeZambianPhoneNumber(parsed.data.phoneNumber) : null;

  if (isMobileMoneyMethod(parsed.data.method) && !normalizedPhone) {
    res.status(400).json({ error: "Phone number is required for mobile money payments" });
    return;
  }

  if (normalizedPhone && isMobileMoneyMethod(parsed.data.method) && !/^260\d{9}$/.test(normalizedPhone)) {
    res.status(400).json({ error: "Mobile money numbers must normalize to a 12-digit Zambian number in the form 260XXXXXXXXX." });
    return;
  }

  if (normalizedPhone && isMobileMoneyMethod(parsed.data.method)) {
    const detectedNetwork = detectZambianMobileMoneyNetwork(normalizedPhone);
    if (!detectedNetwork) {
      res.status(400).json({ error: "Unsupported mobile money prefix. Use an Airtel, MTN, or Zamtel number." });
      return;
    }

    if (detectedNetwork !== parsed.data.method) {
      const networkLabels: Record<string, string> = {
        airtel_money: "Airtel Money",
        mtn_money: "MTN Mobile Money",
        zamtel_money: "Zamtel Money",
      };
      res.status(400).json({
        error: `The phone number prefix belongs to ${networkLabels[detectedNetwork]}. Select that network before continuing.`,
      });
      return;
    }
  }

  const [payment] = await db.insert(paymentsTable).values({
    orderId: parsed.data.orderId,
    method: parsed.data.method,
    amount: amount.toFixed(2),
    status: "pending",
    reference,
    phoneNumber: normalizedPhone,
    accountName: parsed.data.accountName ?? null,
  }).returning();

  if (parsed.data.method === "mobile_money_on_delivery") {
    await setOrderStatusFromPayment(payment.orderId, "pending", payment.method);
    res.status(201).json(serializePayment(payment));
    return;
  }

  const { firstName, lastName } = splitCustomerName(order.fullName);
  const customerMobile = normalizeZambianPhoneNumber(order.phone);
  const description = `Order #${order.id} - Uncommon Denominations`;

  try {
    const gatewayConfig = await getProbaseResolvedConfig();
    const webBaseUrl = gatewayConfig.publicWebUrl?.replace(/\/+$/, "") || getWebBaseUrl(req);
    const apiBaseUrl = gatewayConfig.publicApiUrl?.replace(/\/+$/, "") || getApiBaseUrl(req);
    let gatewayResponse: ProbaseCollectionResponse;
    const idempotencyKey = isMobileMoneyMethod(parsed.data.method)
      ? crypto.randomUUID()
      : null;

    if (isMobileMoneyMethod(parsed.data.method)) {
      gatewayResponse = await createDirectCollection({
        method: parsed.data.method,
        amount: amount.toFixed(2),
        reference,
        description,
        phoneNumber: normalizedPhone!,
        callbackUrl: gatewayConfig.callbackUrl || `${apiBaseUrl}/payments/probase/callback`,
        idempotencyKey: idempotencyKey!,
        customer: {
          firstName,
          lastName,
          email: order.email,
          mobile: customerMobile,
          address: order.city,
        },
      });
    } else {
      gatewayResponse = await createCheckoutCollection({
        paymentMethod: parsed.data.method === "visa_mastercard" ? "CARD" : "BANK_ACCOUNT",
        amount: amount.toFixed(2),
        reference,
        description,
        successCallbackUrl:
          gatewayConfig.successUrl ||
          `${apiBaseUrl}/payments/probase/return/success?payment_id=${payment.id}&order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancelCallbackUrl:
          gatewayConfig.cancelUrl ||
          `${apiBaseUrl}/payments/probase/return/cancel?payment_id=${payment.id}`,
        customer: {
          firstName,
          lastName,
          email: order.email,
          mobile: customerMobile,
          address: order.city,
        },
      });
    }

    const [updated] = await db.update(paymentsTable)
      .set({
        gatewayTransactionId: getGatewayTransactionId(gatewayResponse),
        gatewayStatus: gatewayResponse.status,
        gatewayCheckoutUrl: gatewayResponse.session_url ?? null,
        gatewayProviderReference: gatewayResponse.transaction?.provider_reference ?? null,
        gatewayIdempotencyKey: idempotencyKey,
        gatewayLastPayload: gatewayResponse,
        lastCheckedAt: new Date(),
        completedAt: toDate(gatewayResponse.transaction?.completed_at),
        expiresAt: toDate(gatewayResponse.transaction?.expires_at),
      })
      .where(eq(paymentsTable.id, payment.id))
      .returning();

    res.status(201).json(serializePayment(updated));
  } catch (error) {
    const [failed] = await db.update(paymentsTable)
      .set({
        status: "failed",
        gatewayStatus: "FAILED_TO_INITIATE",
        failureReason: error instanceof Error ? error.message : "Failed to initiate payment",
        lastCheckedAt: new Date(),
      })
      .where(eq(paymentsTable.id, payment.id))
      .returning();

    res.status(502).json({
      error: error instanceof Error ? error.message : "Failed to initiate payment",
      payment: failed ? serializePayment(failed) : null,
    });
  }
});

router.post("/payments/probase/callback", async (req, res): Promise<void> => {
  const payload = typeof req.body === "object" && req.body ? req.body as Record<string, unknown> : {};
  const gatewayTransactionId = getNestedString(payload, [["id"], ["transaction_id"], ["transaction", "id"], ["data", "id"]]);
  const reference = getNestedString(payload, [["reference"], ["transaction", "reference"], ["data", "reference"]]);
  const status = getNestedString(payload, [["status"], ["transaction", "status"], ["data", "status"]]);

  const payment = gatewayTransactionId
    ? (await db.select().from(paymentsTable).where(eq(paymentsTable.gatewayTransactionId, gatewayTransactionId)).limit(1))[0]
    : reference
      ? (await db.select().from(paymentsTable).where(eq(paymentsTable.reference, reference)).orderBy(desc(paymentsTable.createdAt)).limit(1))[0]
      : null;

  if (!payment) {
    res.status(202).json({ received: true, matched: false });
    return;
  }

  if (gatewayTransactionId) {
    try {
      const gateway = await inquireCollection(gatewayTransactionId);
      await syncPaymentFromGateway(payment.id, gateway);
      res.json({ received: true, matched: true, synced: true });
      return;
    } catch {
      // Fall through to the raw callback payload if the inquiry fails.
    }
  }

  const mappedStatus = mapGatewayStatus(status);
  const [updated] = await db.update(paymentsTable)
    .set({
      status: mappedStatus,
      gatewayTransactionId: gatewayTransactionId ?? payment.gatewayTransactionId,
      gatewayStatus: status,
      gatewayLastPayload: payload,
      gatewayProviderReference: getNestedString(payload, [["transaction", "provider_reference"], ["data", "transaction", "provider_reference"]]),
      lastCheckedAt: new Date(),
      completedAt: toDate(getNestedString(payload, [["transaction", "completed_at"], ["data", "transaction", "completed_at"]])),
      expiresAt: toDate(getNestedString(payload, [["transaction", "expires_at"], ["data", "transaction", "expires_at"]])),
      failureReason: mappedStatus === "failed" ? (status || "Gateway callback reported failure") : null,
    })
    .where(eq(paymentsTable.id, payment.id))
    .returning();

  if (updated) {
    await setOrderStatusFromPayment(updated.orderId, updated.status as "pending" | "successful" | "failed", updated.method);
  }

  res.json({ received: true, matched: true, synced: false });
});

router.get("/payments/probase/return/success", async (req, res): Promise<void> => {
  const paymentId = typeof req.query.payment_id === "string" ? req.query.payment_id : "";
  const orderId = typeof req.query.order_id === "string" ? req.query.order_id : "";
  const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
  const gatewayConfig = await getProbaseResolvedConfig();
  const webBaseUrl = gatewayConfig.publicWebUrl?.replace(/\/+$/, "") || process.env.PUBLIC_WEB_URL?.trim()?.replace(/\/+$/, "") || "http://localhost:5173";
  const redirectUrl = new URL(`${webBaseUrl}/confirmation`);

  if (paymentId) redirectUrl.searchParams.set("payment_id", paymentId);
  if (orderId) redirectUrl.searchParams.set("order_id", orderId);
  if (sessionId) redirectUrl.searchParams.set("session_id", sessionId);

  res.redirect(302, redirectUrl.toString());
});

router.get("/payments/probase/return/cancel", async (req, res): Promise<void> => {
  const paymentId = typeof req.query.payment_id === "string" ? req.query.payment_id : "";
  const gatewayConfig = await getProbaseResolvedConfig();
  const webBaseUrl = gatewayConfig.publicWebUrl?.replace(/\/+$/, "") || process.env.PUBLIC_WEB_URL?.trim()?.replace(/\/+$/, "") || "http://localhost:5173";
  const redirectUrl = new URL(`${webBaseUrl}/payment`);

  if (paymentId) redirectUrl.searchParams.set("payment_id", paymentId);
  redirectUrl.searchParams.set("cancelled", "1");

  res.redirect(302, redirectUrl.toString());
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

  res.json(serializePayment(payment));
});

router.post("/payments/:id/refresh", async (req, res): Promise<void> => {
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

  if (!payment.gatewayTransactionId) {
    res.json(serializePayment(payment));
    return;
  }

  try {
    const gateway = await inquireCollection(payment.gatewayTransactionId);
    const updated = await syncPaymentFromGateway(payment.id, gateway);
    if (!updated) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    res.json(serializePayment(updated));
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "Failed to refresh payment" });
  }
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
    .set({
      status: parsed.data.outcome,
      gatewayStatus: parsed.data.outcome === "successful" ? "SUCCESSFUL" : "FAILED",
      completedAt: parsed.data.outcome === "successful" ? new Date() : null,
      lastCheckedAt: new Date(),
    })
    .where(eq(paymentsTable.id, params.data.id))
    .returning();

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  await setOrderStatusFromPayment(payment.orderId, payment.status as "pending" | "successful" | "failed", payment.method);
  res.json(serializePayment(payment));
});

export default router;
