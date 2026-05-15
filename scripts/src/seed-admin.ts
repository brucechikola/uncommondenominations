import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const username = "admin";
const password = "admin123";

const hash = await bcrypt.hash(password, 12);

const existing = await db.select().from(adminsTable).where(eq(adminsTable.username, username));
if (existing.length > 0) {
  await db.update(adminsTable).set({ passwordHash: hash }).where(eq(adminsTable.username, username));
  console.log(`Updated admin password hash for user: ${username}`);
} else {
  await db.insert(adminsTable).values({ username, passwordHash: hash });
  console.log(`Created admin user: ${username}`);
}

process.exit(0);
