import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { schema, withUser } from "@/lib/db";
import { createUser, resetData } from "./helpers";

/** Postgres insufficient_privilege, raised by row-level security and missing grants. */
const RLS_DENIED = { cause: { code: "42501" } };

const { trips, tripMembers, expenses, expenseShares, friendships, users } = schema;

async function createTrip(ownerId: string, name = "Ella weekend") {
  return withUser(ownerId, async (tx) => {
    const [trip] = await tx.insert(trips).values({ ownerId, name }).returning();
    const [member] = await tx
      .insert(tripMembers)
      .values({ tripId: trip!.id, userId: ownerId, role: "owner" })
      .returning();
    return { trip: trip!, ownerMember: member! };
  });
}

describe("row-level security", () => {
  beforeEach(resetData);

  it("lets only members see a trip", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    const { trip } = await createTrip(amal.id);

    const seenByOwner = await withUser(amal.id, (tx) => tx.select().from(trips));
    const seenByOther = await withUser(bimal.id, (tx) => tx.select().from(trips));
    expect(seenByOwner.map((t) => t.id)).toEqual([trip.id]);
    expect(seenByOther).toEqual([]);

    await withUser(amal.id, (tx) =>
      tx.insert(tripMembers).values({ tripId: trip.id, userId: bimal.id, role: "member" }),
    );
    const seenAfterJoin = await withUser(bimal.id, (tx) => tx.select().from(trips));
    expect(seenAfterJoin.map((t) => t.id)).toEqual([trip.id]);
  });

  it("stops non-members writing to a trip or adding themselves", async () => {
    const amal = await createUser("Amal");
    const mallory = await createUser("Mallory");
    const { trip, ownerMember } = await createTrip(amal.id);

    await expect(
      withUser(mallory.id, (tx) =>
        tx.insert(tripMembers).values({ tripId: trip.id, userId: mallory.id, role: "member" }),
      ),
    ).rejects.toMatchObject(RLS_DENIED);

    await expect(
      withUser(mallory.id, (tx) =>
        tx.insert(expenses).values({
          id: randomUUID(),
          tripId: trip.id,
          payerMemberId: ownerMember.id,
          description: "Fake",
          amountMinor: 100,
          currency: "LKR",
          baseAmountMinor: 100,
          createdBy: mallory.id,
        }),
      ),
    ).rejects.toMatchObject(RLS_DENIED);

    const updated = await withUser(mallory.id, (tx) =>
      tx.update(trips).set({ name: "Hacked" }).where(eq(trips.id, trip.id)).returning(),
    );
    expect(updated).toEqual([]);
  });

  it("stops a member from promoting themselves", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    const { trip } = await createTrip(amal.id);
    const [member] = await withUser(amal.id, (tx) =>
      tx
        .insert(tripMembers)
        .values({ tripId: trip.id, userId: bimal.id, role: "member" })
        .returning(),
    );

    await expect(
      withUser(bimal.id, (tx) =>
        tx.update(tripMembers).set({ role: "co_admin" }).where(eq(tripMembers.id, member!.id)),
      ),
    ).rejects.toMatchObject(RLS_DENIED);

    // Leaving is allowed.
    const left = await withUser(bimal.id, (tx) =>
      tx
        .update(tripMembers)
        .set({ leftAt: new Date() })
        .where(eq(tripMembers.id, member!.id))
        .returning(),
    );
    expect(left).toHaveLength(1);
  });

  it("calculates balances from expenses and shares", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    const { trip, ownerMember } = await createTrip(amal.id);

    const balances = await withUser(amal.id, async (tx) => {
      const [bMember] = await tx
        .insert(tripMembers)
        .values({ tripId: trip.id, userId: bimal.id })
        .returning();
      const expenseId = randomUUID();
      await tx.insert(expenses).values({
        id: expenseId,
        tripId: trip.id,
        payerMemberId: ownerMember.id,
        description: "Dinner",
        amountMinor: 300001,
        currency: "LKR",
        baseAmountMinor: 300001,
        createdBy: amal.id,
      });
      await tx.insert(expenseShares).values([
        { expenseId, memberId: ownerMember.id, shareMinor: 150001 },
        { expenseId, memberId: bMember!.id, shareMinor: 150000 },
      ]);
      return tx.execute<{ member_id: string; balance_minor: string }>(
        sql`select member_id, balance_minor from member_balances where trip_id = ${trip.id}`,
      );
    });

    const byMember = Object.fromEntries(
      [...balances].map((r) => [r.member_id, Number(r.balance_minor)]),
    );
    expect(byMember[ownerMember.id]).toBe(150000);
    expect(Object.values(byMember).reduce((a, b) => a + b, 0)).toBe(0);
  });

  it("hides friendships from third parties", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    const chamari = await createUser("Chamari");
    await withUser(amal.id, (tx) =>
      tx.insert(friendships).values({ userId: amal.id, friendId: bimal.id }),
    );
    expect(await withUser(bimal.id, (tx) => tx.select().from(friendships))).toHaveLength(1);
    expect(await withUser(chamari.id, (tx) => tx.select().from(friendships))).toHaveLength(0);
    await expect(
      withUser(chamari.id, (tx) =>
        tx.insert(friendships).values({ userId: amal.id, friendId: chamari.id }),
      ),
    ).rejects.toMatchObject(RLS_DENIED);
  });

  it("never exposes emails to the app role", async () => {
    const amal = await createUser("Amal");
    await expect(
      withUser(amal.id, (tx) => tx.select({ email: users.email }).from(users)),
    ).rejects.toMatchObject({ cause: { code: "42501" } }); // insufficient_privilege
    const names = await withUser(amal.id, (tx) =>
      tx.select({ id: users.id, name: users.name }).from(users),
    );
    expect(names).toHaveLength(1);
  });
});

describe("friendship rules", () => {
  beforeEach(resetData);

  it("stops the sender accepting their own request or inserting an accepted friendship", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    await expect(
      withUser(amal.id, (tx) =>
        tx.insert(friendships).values({ userId: amal.id, friendId: bimal.id, status: "accepted" }),
      ),
    ).rejects.toMatchObject(RLS_DENIED);

    await withUser(amal.id, (tx) =>
      tx.insert(friendships).values({ userId: amal.id, friendId: bimal.id }),
    );
    const bySender = await withUser(amal.id, (tx) =>
      tx.update(friendships).set({ status: "accepted" }).returning(),
    );
    expect(bySender).toEqual([]);

    const byRecipient = await withUser(bimal.id, (tx) =>
      tx.update(friendships).set({ status: "accepted" }).returning(),
    );
    expect(byRecipient).toHaveLength(1);
  });

  it("rejects a crossed duplicate request", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    await withUser(amal.id, (tx) =>
      tx.insert(friendships).values({ userId: amal.id, friendId: bimal.id }),
    );
    await expect(
      withUser(bimal.id, (tx) =>
        tx.insert(friendships).values({ userId: bimal.id, friendId: amal.id }),
      ),
    ).rejects.toMatchObject({ cause: { code: "23505" } });
  });
});
