import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetProductParams, ListProductsResponse, GetProductResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(productsTable.id);
  res.json(ListProductsResponse.parse(products.map(p => ({
    ...p,
    priceKwacha: Number(p.priceKwacha),
    features: (p.features as string[]) ?? [],
    createdAt: p.createdAt.toISOString(),
  }))));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse({
    ...product,
    priceKwacha: Number(product.priceKwacha),
    features: (product.features as string[]) ?? [],
    createdAt: product.createdAt.toISOString(),
  }));
});

export default router;
