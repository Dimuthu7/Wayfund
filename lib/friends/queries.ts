import "server-only";
import { and, asc, count, eq, or, sql } from "drizzle-orm";
import { withUser, schema } from "@/lib/db";

const { friendships, users, tripMembers } = schema;

export type PersonSummary = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

const person = { id: users.id, name: users.name, username: users.username, image: users.image };

/** The other person in a friendship row, from the signed-in user's point of view. */
const otherId = (me: string) =>
  sql<string>`case when ${friendships.userId} = ${me} then ${friendships.friendId} else ${friendships.userId} end`;

export async function countIncomingRequests(me: string): Promise<number> {
  const [row] = await withUser(me, (tx) =>
    tx
      .select({ n: count() })
      .from(friendships)
      .where(and(eq(friendships.friendId, me), eq(friendships.status, "pending"))),
  );
  return row?.n ?? 0;
}

export async function countFriends(me: string): Promise<number> {
  const [row] = await withUser(me, (tx) =>
    tx.select({ n: count() }).from(friendships).where(eq(friendships.status, "accepted")),
  );
  return row?.n ?? 0;
}

export type FriendRow = PersonSummary & { sharedTrips: number; since: Date };

/** Accepted friends sorted by name, with the number of trips we share (E2-4). */
export async function listFriends(me: string): Promise<FriendRow[]> {
  return withUser(me, async (tx) => {
    const rows = await tx
      .select({
        ...person,
        since: sql<Date>`coalesce(${friendships.respondedAt}, ${friendships.createdAt})`.mapWith(
          (v: string | Date) => new Date(v),
        ),
        sharedTrips: sql<number>`(
          select count(*)::int from ${tripMembers} mine
          join ${tripMembers} theirs on theirs.trip_id = mine.trip_id
          where mine.user_id = ${me} and theirs.user_id = ${users.id}
            and mine.left_at is null and theirs.left_at is null
        )`,
      })
      .from(friendships)
      .innerJoin(users, eq(users.id, otherId(me)))
      .where(eq(friendships.status, "accepted"))
      .orderBy(asc(sql`lower(coalesce(${users.name}, ${users.username}))`));
    return rows;
  });
}

export type RequestRow = PersonSummary & { createdAt: Date };

/** Incoming pending requests and requests I've sent that are still unanswered (E2-2). */
export async function listRequests(me: string) {
  return withUser(me, async (tx) => {
    const incoming = await tx
      .select({ ...person, createdAt: friendships.createdAt })
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.userId))
      .where(and(eq(friendships.friendId, me), eq(friendships.status, "pending")))
      .orderBy(sql`${friendships.createdAt} desc`);
    // Declined requests still show as sent: declining is silent to the sender.
    const outgoing = await tx
      .select({ ...person, createdAt: friendships.createdAt })
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.friendId))
      .where(
        and(
          eq(friendships.userId, me),
          or(eq(friendships.status, "pending"), eq(friendships.status, "declined")),
        ),
      )
      .orderBy(sql`${friendships.createdAt} desc`);
    return { incoming, outgoing };
  });
}

export type Relationship = "self" | "friends" | "request_sent" | "request_received" | "none";

/** How the signed-in user relates to another person, for buttons and the invite page. */
export async function relationshipWith(me: string, other: string): Promise<Relationship> {
  if (me === other) return "self";
  const [row] = await withUser(me, (tx) =>
    tx
      .select({ userId: friendships.userId, status: friendships.status })
      .from(friendships)
      .where(
        or(
          and(eq(friendships.userId, me), eq(friendships.friendId, other)),
          and(eq(friendships.userId, other), eq(friendships.friendId, me)),
        ),
      )
      .limit(1),
  );
  if (!row) return "none";
  if (row.status === "accepted") return "friends";
  if (row.userId === me) return "request_sent";
  return row.status === "pending" ? "request_received" : "none";
}
