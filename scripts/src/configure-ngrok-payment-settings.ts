import { db, paymentGatewaySettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

type NgrokTunnel = {
  public_url: string;
  proto: string;
  config?: {
    addr?: string;
  };
};

type NgrokResponse = {
  tunnels: NgrokTunnel[];
};

const apiPort = process.env.PORT?.trim() || "3001";
const webUrl = process.env.PUBLIC_WEB_URL?.trim() || "http://localhost:5173";

let response: Response | null = null;
for (const port of ["4040", "4041"]) {
  try {
    const candidate = await fetch(`http://127.0.0.1:${port}/api/tunnels`);
    if (candidate.ok) {
      response = candidate;
      break;
    }
  } catch {
    // Try the next local ngrok admin port.
  }
}

if (!response) {
  throw new Error("Failed to read ngrok tunnels from localhost:4040 or localhost:4041");
}

const data = await response.json() as NgrokResponse;
const tunnel = data.tunnels.find((item) =>
  item.public_url.startsWith("https://") &&
  typeof item.config?.addr === "string" &&
  item.config.addr.endsWith(`:${apiPort}`),
);

if (!tunnel) {
  throw new Error(`No active https ngrok tunnel found for port ${apiPort}`);
}

const publicApiUrl = `${tunnel.public_url}/api`;
const payload = {
  provider: "probase",
  enabled: true,
  baseUrl: process.env.PROBASE_BASE_URL?.trim() || "https://testpayments.probasegroup.com",
  clientId: process.env.PROBASE_CLIENT_ID?.trim() || process.env.PAYMENT_MERCHANT_ID?.trim() || null,
  clientSecret: process.env.PROBASE_CLIENT_SECRET?.trim() || process.env.PAYMENT_API_KEY?.trim() || null,
  callbackUrl: `${publicApiUrl}/payments/probase/callback`,
  successUrl: `${publicApiUrl}/payments/probase/return/success`,
  cancelUrl: `${publicApiUrl}/payments/probase/return/cancel`,
  publicWebUrl: webUrl,
  publicApiUrl,
  notes: `Configured from ngrok tunnel ${tunnel.public_url}`,
} as const;

const [existing] = await db.select({ id: paymentGatewaySettingsTable.id }).from(paymentGatewaySettingsTable).limit(1);

if (existing) {
  await db.update(paymentGatewaySettingsTable).set(payload).where(eq(paymentGatewaySettingsTable.id, existing.id));
} else {
  await db.insert(paymentGatewaySettingsTable).values(payload);
}

console.log(JSON.stringify(payload, null, 2));
