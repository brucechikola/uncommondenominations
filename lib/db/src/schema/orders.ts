import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  city: text("city").notNull(),
  productType: text("product_type").notNull(), // paperback | hardcover
  quantity: integer("quantity").notNull().default(1),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending | confirmed | shipped | delivered | cancelled
  notes: text("notes"),
  agentId: integer("agent_id"), // null = self-service (public website)
  pricingTier: text("pricing_tier").notNull().default("standard"), // standard | bulk | institutional
  paymentLinkToken: text("payment_link_token"), // unique token for shareable payment link
  courierId: integer("courier_id"),              // assigned courier
  trackingNotes: text("tracking_notes"),         // courier can add delivery notes / updates
  deliveryPaymentMethod: text("delivery_payment_method"), // mobile money method to collect on delivery (not cash)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
