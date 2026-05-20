import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { paymentSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/payment-settings", async (_req, res): Promise<void> => {
  const settings = await db
    .select()
    .from(paymentSettingsTable)
    .where(eq(paymentSettingsTable.enabled, true))
    .orderBy(paymentSettingsTable.sortOrder);
  res.json(settings);
});

export default router;
