import { db, paymentSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const channels = [
  { channelId: "mobile_money_on_delivery", label: "Mobile Money on Delivery", enabled: true, sortOrder: 1 },
  { channelId: "airtel_money", label: "Airtel Money", enabled: true, sortOrder: 2 },
  { channelId: "mtn_money", label: "MTN Mobile Money", enabled: true, sortOrder: 3 },
  { channelId: "zamtel_money", label: "Zamtel Money", enabled: true, sortOrder: 4 },
  { channelId: "visa_mastercard", label: "Visa / Mastercard", enabled: true, sortOrder: 5 },
  { channelId: "bank_transfer", label: "Bank Transfer", enabled: true, sortOrder: 6 },
] as const;

for (const channel of channels) {
  const [existing] = await db
    .select({ id: paymentSettingsTable.id })
    .from(paymentSettingsTable)
    .where(eq(paymentSettingsTable.channelId, channel.channelId));

  if (existing) {
    await db
      .update(paymentSettingsTable)
      .set(channel)
      .where(eq(paymentSettingsTable.id, existing.id));
    console.log(`Updated ${channel.channelId}`);
  } else {
    await db.insert(paymentSettingsTable).values(channel);
    console.log(`Created ${channel.channelId}`);
  }
}
