import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const paymentGatewaySettingsTable = pgTable("payment_gateway_settings", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull().default("probase"),
  enabled: boolean("enabled").notNull().default(true),
  baseUrl: text("base_url").notNull().default("https://testpayments.probasegroup.com"),
  clientId: text("client_id"),
  clientSecret: text("client_secret"),
  callbackUrl: text("callback_url"),
  successUrl: text("success_url"),
  cancelUrl: text("cancel_url"),
  publicWebUrl: text("public_web_url"),
  publicApiUrl: text("public_api_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type PaymentGatewaySetting = typeof paymentGatewaySettingsTable.$inferSelect;
