import { pgTable, text, serial, boolean, integer } from "drizzle-orm/pg-core";

export const paymentSettingsTable = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull().unique(),
  label: text("label").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type PaymentSetting = typeof paymentSettingsTable.$inferSelect;
