import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const couriersTable = pgTable("couriers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  vehicleInfo: text("vehicle_info"),          // e.g. "Blue Toyota Corolla — ACB 1234 ZM"
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCourierSchema = createInsertSchema(couriersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCourier = z.infer<typeof insertCourierSchema>;
export type Courier = typeof couriersTable.$inferSelect;
