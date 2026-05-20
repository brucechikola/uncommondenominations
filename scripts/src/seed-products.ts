import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const products = [
  {
    type: "paperback",
    name: "Uncommon Denominators Paperback",
    priceKwacha: "400.00",
    description:
      "The standard edition of Uncommon Denominators, designed for accessible everyday reading, study, and discussion.",
    features: [
      "Complete text of Uncommon Denominators",
      "Ideal for daily reading and study",
      "Lightweight and portable format",
      "Affordable standard edition",
    ],
  },
  {
    type: "hardcover",
    name: "Uncommon Denominators Hardcover",
    priceKwacha: "500.00",
    description:
      "The premium edition of Uncommon Denominators, beautifully bound for readers who want a more durable and gift-worthy copy.",
    features: [
      "Complete text of Uncommon Denominators",
      "Premium hardcover binding",
      "Higher quality paper stock",
      "Ideal for gifting or long-term shelf display",
    ],
  },
] as const;

for (const product of products) {
  const [existing] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.type, product.type));

  if (existing) {
    await db
      .update(productsTable)
      .set(product)
      .where(eq(productsTable.id, existing.id));
    console.log(`Updated ${product.type} product`);
  } else {
    await db.insert(productsTable).values(product);
    console.log(`Created ${product.type} product`);
  }
}
