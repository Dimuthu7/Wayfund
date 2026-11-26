/**
 * Demo data for local development and phone demos.
 * Usage: pnpm db:seed   (refuses to run when NODE_ENV=production)
 *
 * Creates four onboarded people, friendships between them and an "Ella weekend" trip with
 * a few expenses, so balances and the friends list have something to show.
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { allocate } from "../lib/money/money";
import * as schema from "../lib/db/schema";

const people = [
  { name: "Amal Perera", username: "amal", email: "amal@example.com" },
  { name: "Bimali Fernando", username: "bimali", email: "bimali@example.com" },
  { name: "Chamari Silva", username: "chamari", email: "chamari@example.com" },
  { name: "Dilan Jayasuriya", username: "dilan", email: "dilan@example.com" },
];

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed in production");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema, casing: "snake_case" });

  await db.transaction(async (tx) => {
    const emails = people.map((p) => p.email);
    await tx.execute(
      sql`delete from trips where owner_id in (select id from users where email in ${emails})`,
    );
    await tx.execute(sql`delete from users where email in ${emails}`);

    const users = await tx
      .insert(schema.users)
      .values(people.map((p) => ({ ...p, emailVerified: new Date(), onboardedAt: new Date() })))
      .returning({ id: schema.users.id, username: schema.users.username });
    const [amal, bimali, chamari, dilan] = users as [
      (typeof users)[number],
      (typeof users)[number],
      (typeof users)[number],
      (typeof users)[number],
    ];

    await tx.insert(schema.friendships).values([
      { userId: amal.id, friendId: bimali.id, status: "accepted", respondedAt: new Date() },
      { userId: amal.id, friendId: chamari.id, status: "accepted", respondedAt: new Date() },
      { userId: bimali.id, friendId: chamari.id, status: "accepted", respondedAt: new Date() },
      { userId: dilan.id, friendId: amal.id, status: "pending" },
    ]);

    const [trip] = await tx
      .insert(schema.trips)
      .values({
        ownerId: amal.id,
        name: "Ella weekend",
        destinations: ["Ella", "Nine Arches Bridge", "Little Adam's Peak"],
        startDate: "2027-01-08",
        endDate: "2027-01-10",
        days: 3,
      })
      .returning();
    const members = await tx
      .insert(schema.tripMembers)
      .values([
        { tripId: trip!.id, userId: amal.id, role: "owner" },
        { tripId: trip!.id, userId: bimali.id, role: "co_admin" },
        { tripId: trip!.id, userId: chamari.id },
        { tripId: trip!.id, guestName: "Kasun (guest)" },
      ])
      .returning({ id: schema.tripMembers.id });

    const expenses = [
      { description: "Fuel to Ella", amount: 1_850_000, payer: 0, category: "transport" },
      { description: "Homestay, 2 nights", amount: 2_400_000, payer: 1, category: "accommodation" },
      { description: "Dinner at Café Chill", amount: 1_275_050, payer: 2, category: "food" },
    ];
    for (const e of expenses) {
      const id = randomUUID();
      await tx.insert(schema.expenses).values({
        id,
        tripId: trip!.id,
        payerMemberId: members[e.payer]!.id,
        description: e.description,
        category: e.category,
        amountMinor: e.amount,
        currency: "LKR",
        baseAmountMinor: e.amount,
        createdBy: amal.id,
      });
      const shares = allocate(
        e.amount,
        members.map(() => 1),
      );
      await tx
        .insert(schema.expenseShares)
        .values(members.map((m, i) => ({ expenseId: id, memberId: m.id, shareMinor: shares[i]! })));
    }
  });

  console.log(
    `Seeded ${people.length} people (sign in as amal@example.com) and the "Ella weekend" trip`,
  );
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
