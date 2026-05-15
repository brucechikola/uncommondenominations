import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const buyersTable = pgTable("buyers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  city: text("city").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBuyerSchema = createInsertSchema(buyersTable).omit({ id: true, createdAt: true });
export type InsertBuyer = z.infer<typeof insertBuyerSchema>;
export type Buyer = typeof buyersTable.$inferSelect;
