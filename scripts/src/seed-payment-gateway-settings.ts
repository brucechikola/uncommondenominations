import { db, paymentGatewaySettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const payload = {
  provider: "probase",
  enabled: true,
  baseUrl: "https://testpayments.probasegroup.com",
  clientId: "MERC-15-4566",
  clientSecret: "YEe4Ya4iYNZi/jBaK3wiQ5T9RLuX1TV6xv+EhTAdUbg",
  callbackUrl: null,
  successUrl: null,
  cancelUrl: null,
  publicWebUrl: null,
  publicApiUrl: null,
  notes: "Test Probase gateway credentials",
} as const;

const [existing] = await db.select({ id: paymentGatewaySettingsTable.id }).from(paymentGatewaySettingsTable).limit(1);

if (existing) {
  await db.update(paymentGatewaySettingsTable).set(payload).where(eq(paymentGatewaySettingsTable.id, existing.id));
  console.log("Updated payment gateway settings");
} else {
  await db.insert(paymentGatewaySettingsTable).values(payload);
  console.log("Created payment gateway settings");
}
