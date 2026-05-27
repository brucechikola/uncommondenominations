import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { agentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const name = "Default Agent";
const phone = "0970000001";
const email = "agent@uncommondenominators.com";
const password = "agent123";

const hash = await bcrypt.hash(password, 12);

const [existing] = await db.select().from(agentsTable).where(eq(agentsTable.email, email));
if (existing) {
  await db.update(agentsTable).set({ passwordHash: hash }).where(eq(agentsTable.email, email));
  console.log(`Updated password for agent: ${email}`);
} else {
  await db.insert(agentsTable).values({ name, phone, email, passwordHash: hash, active: true });
  console.log(`Created agent: ${email} / password: ${password}`);
}

process.exit(0);
