import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { couriersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const name = "Default Courier";
const phone = "0970000002";
const email = "courier@uncommondenominators.com";
const password = "courier123";

const hash = await bcrypt.hash(password, 12);

const [existing] = await db.select().from(couriersTable).where(eq(couriersTable.phone, phone));
if (existing) {
  await db.update(couriersTable).set({ passwordHash: hash }).where(eq(couriersTable.phone, phone));
  console.log(`Updated password for courier: ${phone}`);
} else {
  await db.insert(couriersTable).values({ name, phone, email, passwordHash: hash, active: true });
  console.log(`Created courier: ${phone} / password: ${password}`);
}

process.exit(0);
