import { db, paymentGatewaySettingsTable } from "@workspace/db";

type ProbaseConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string | null;
  successUrl: string | null;
  cancelUrl: string | null;
  publicWebUrl: string | null;
  publicApiUrl: string | null;
  enabled: boolean;
};

type ProbaseTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type ProbaseCollectionStatus =
  | "PROCESSING"
  | "PENDING"
  | "SUCCESSFUL"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

export type ProbaseCollectionResponse = {
  id?: string;
  transaction_id?: string;
  status: ProbaseCollectionStatus;
  session_url?: string | null;
  description?: string | null;
  discription?: string | null;
  transaction?: {
    reference?: string | null;
    completed_at?: string | null;
    expires_at?: string | null;
    created_at?: string | null;
    provider_reference?: string | null;
    amount?: {
      value?: number;
      currency?: string;
    };
    payment_method?: {
      type?: string | null;
      identifier?: string | null;
      provider?: {
        msisdn?: string | null;
        prefix?: string | null;
        network?: string | null;
      } | null;
    } | null;
  };
};

type DirectCollectionInput = {
  method: Exclude<MobileMoneyNetwork, null>;
  amount: string;
  reference: string;
  description: string;
  phoneNumber: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    address: string;
  };
  callbackUrl: string;
  idempotencyKey: string;
};

type CheckoutCollectionInput = {
  paymentMethod: "CARD" | "BANK_ACCOUNT" | "ALL";
  amount: string;
  reference: string;
  description: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    address: string;
  };
  successCallbackUrl: string;
  cancelCallbackUrl: string;
};

const cachedToken: { value: string | null; expiresAt: number } = {
  value: null,
  expiresAt: 0,
};

async function getConfig(): Promise<ProbaseConfig> {
  const [dbConfig] = await db.select().from(paymentGatewaySettingsTable).limit(1);

  const baseUrl = dbConfig?.baseUrl?.trim() || process.env.PROBASE_BASE_URL?.trim() || "https://testpayments.probasegroup.com";
  const clientId = dbConfig?.clientId?.trim() || process.env.PROBASE_CLIENT_ID?.trim() || "";
  const clientSecret = dbConfig?.clientSecret?.trim() || process.env.PROBASE_CLIENT_SECRET?.trim() || "";

  if (!clientId || !clientSecret) {
    throw new Error("Probase gateway is not configured. Set PROBASE_CLIENT_ID and PROBASE_CLIENT_SECRET.");
  }

  return {
    enabled: dbConfig?.enabled ?? true,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    clientId,
    clientSecret,
    callbackUrl: dbConfig?.callbackUrl?.trim() || process.env.PROBASE_CALLBACK_URL?.trim() || null,
    successUrl: dbConfig?.successUrl?.trim() || process.env.PROBASE_SUCCESS_URL?.trim() || null,
    cancelUrl: dbConfig?.cancelUrl?.trim() || process.env.PROBASE_CANCEL_URL?.trim() || null,
    publicWebUrl: dbConfig?.publicWebUrl?.trim() || process.env.PUBLIC_WEB_URL?.trim() || null,
    publicApiUrl: dbConfig?.publicApiUrl?.trim() || process.env.PUBLIC_API_URL?.trim() || null,
  };
}

async function probaseRequest<T>(path: string, init: RequestInit): Promise<T> {
  const config = await getConfig();
  const response = await fetch(`${config.baseUrl}${path}`, init);
  const text = await response.text();
  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body && typeof body.message === "string"
        ? body.message
        : typeof body === "string"
          ? body
          : `Probase request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken.value && now < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const config = await getConfig();
  if (!config.enabled) {
    throw new Error("Probase gateway is disabled in payment settings.");
  }
  const body = await probaseRequest<ProbaseTokenResponse>("/v1/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "client_credentials",
    }),
  });

  cachedToken.value = body.access_token;
  cachedToken.expiresAt = now + Math.max((body.expires_in - 15) * 1000, 30_000);
  return body.access_token;
}

function baseHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Currency": "ZMW",
    "X-Country": "ZM",
  };
}

export function normalizeZambianPhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  const subscriber = digits.startsWith("260")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;

  if (subscriber.length === 9) {
    return `260${subscriber}`;
  }

  return digits.startsWith("260") ? digits.slice(0, 12) : digits.slice(0, 12);
}

export type MobileMoneyNetwork = "airtel_money" | "mtn_money" | "zamtel_money" | null;
export type ProbaseDirectPaymentType =
  | "MOBILE_MONEY"
  | "AIRTEL_MOBILE_MONEY"
  | "MTN_MOBILE_MONEY"
  | "ZAMTEL_MOBILE_MONEY";

export function detectZambianMobileMoneyNetwork(input: string): MobileMoneyNetwork {
  const normalized = normalizeZambianPhoneNumber(input);

  if (!/^260\d{9}$/.test(normalized)) {
    return null;
  }

  const prefix = normalized.slice(3, 5);

  if (prefix === "97" || prefix === "77") return "airtel_money";
  if (prefix === "96" || prefix === "76") return "mtn_money";
  if (prefix === "95" || prefix === "75") return "zamtel_money";

  return null;
}

export function toProbaseDirectPaymentType(method: Exclude<MobileMoneyNetwork, null>): ProbaseDirectPaymentType {
  switch (method) {
    case "airtel_money":
      return "AIRTEL_MOBILE_MONEY";
    case "mtn_money":
      return "MTN_MOBILE_MONEY";
    case "zamtel_money":
      return "ZAMTEL_MOBILE_MONEY";
  }
}

export function splitCustomerName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "Customer", lastName: "Customer" };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" ") || firstName,
  };
}

export async function createDirectCollection(input: DirectCollectionInput): Promise<ProbaseCollectionResponse> {
  const token = await getAccessToken();

  return probaseRequest<ProbaseCollectionResponse>("/v1/collections/direct", {
    method: "POST",
    headers: {
      ...baseHeaders(token),
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      transaction: {
        reference: input.reference,
        currency: "ZMW",
        amount: input.amount,
        description: input.description,
      },
      payment_method: {
        type: toProbaseDirectPaymentType(input.method),
        identifier: input.phoneNumber,
      },
      customer: {
        first_name: input.customer.firstName,
        last_name: input.customer.lastName,
        email: input.customer.email,
        mobile: input.customer.mobile,
        address: input.customer.address,
      },
      callback_url: input.callbackUrl,
    }),
  });
}

export async function createCheckoutCollection(input: CheckoutCollectionInput): Promise<ProbaseCollectionResponse> {
  const token = await getAccessToken();

  return probaseRequest<ProbaseCollectionResponse>("/v1/collections/checkout", {
    method: "POST",
    headers: baseHeaders(token),
    body: JSON.stringify({
      transaction: {
        reference: input.reference,
        currency: "ZMW",
        amount: input.amount,
        description: input.description,
      },
      customer: {
        first_name: input.customer.firstName,
        last_name: input.customer.lastName,
        email: input.customer.email,
        mobile: input.customer.mobile,
        address: input.customer.address,
      },
      payment_method: input.paymentMethod,
      success_callback_url: input.successCallbackUrl,
      cancel_callback_url: input.cancelCallbackUrl,
    }),
  });
}

export async function inquireCollection(transactionId: string): Promise<ProbaseCollectionResponse> {
  const token = await getAccessToken();
  return probaseRequest<ProbaseCollectionResponse>(`/v1/collections/inquiry/${encodeURIComponent(transactionId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function normalizeGatewayStatus(status: string | null | undefined): string {
  return status?.trim().toUpperCase() || "";
}

export function mapGatewayStatus(status: string | null | undefined): "pending" | "successful" | "failed" {
  switch (normalizeGatewayStatus(status)) {
    case "SUCCESS":
    case "SUCCESSFUL":
      return "successful";
    case "FAILED":
    case "FAIL":
    case "ERROR":
    case "DECLINED":
    case "EXPIRED":
    case "CANCELLED":
    case "CANCELED":
      return "failed";
    default:
      return "pending";
  }
}

export async function getProbaseResolvedConfig(): Promise<Omit<ProbaseConfig, "clientSecret"> & { clientSecret: string | null }> {
  const config = await getConfig();
  return {
    ...config,
    clientSecret: config.clientSecret || null,
  };
}

export function getGatewayTransactionId(payload: ProbaseCollectionResponse): string | null {
  return payload.id || payload.transaction_id || null;
}

export function getGatewayDescription(payload: ProbaseCollectionResponse): string | null {
  return payload.description || payload.discription || null;
}
