import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reviewsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateReviewBody, ListReviewsResponse, GetOrderResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reviews", async (_req, res): Promise<void> => {
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.approved, true)).orderBy(reviewsTable.createdAt);
  res.json(ListReviewsResponse.parse(reviews.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))));
});

router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({
    reviewerName: parsed.data.reviewerName,
    reviewerTitle: parsed.data.reviewerTitle ?? null,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    productType: parsed.data.productType ?? null,
    approved: false,
  }).returning();

  res.status(201).json({
    ...review,
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
