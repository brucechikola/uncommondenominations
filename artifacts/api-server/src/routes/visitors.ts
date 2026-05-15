import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { visitorsTable } from "@workspace/db";
import { TrackVisitorBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/visitors/track", async (req, res): Promise<void> => {
  const parsed = TrackVisitorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? null;

  await db.insert(visitorsTable).values({
    page: parsed.data.page,
    referrer: parsed.data.referrer ?? null,
    userAgent: parsed.data.userAgent ?? null,
    ipAddress: ip,
  });

  res.status(201).json({ tracked: true });
});

export default router;
