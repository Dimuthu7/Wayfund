import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function createUser(name: string) {
  const id = randomUUID();
  const username = `${name.toLowerCase()}_${id.slice(0, 6)}`;
  await db.insert(schema.users).values({
    id,
    name,
    username,
    email: `${username}@example.com`,
    onboardedAt: new Date(),
  });
  return { id, name, username };
}

export async function resetData() {
  await db.execute(sql`truncate users, trips cascade`);
}
