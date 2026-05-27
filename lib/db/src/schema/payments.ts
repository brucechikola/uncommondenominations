import { pgTable, text, serial, timestamp, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  method: text("method").notNull(), // airtel_money | mtn_money | zamtel_money | visa_mastercard | bank_transfer
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending | successful | failed
  reference: text("reference").notNull(),
  phoneNumber: text("phone_number"),
  accountName: text("account_name"),
  gatewayTransactionId: text("gateway_transaction_id"),
  gatewayStatus: text("gateway_status"),
  gatewayCheckoutUrl: text("gateway_checkout_url"),
  gatewayProviderReference: text("gateway_provider_reference"),
  gatewayIdempotencyKey: text("gateway_idempotency_key"),
  gatewayLastPayload: jsonb("gateway_last_payload"),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
