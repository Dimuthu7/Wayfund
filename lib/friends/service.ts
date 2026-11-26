import "server-only";
import { randomBytes } from "node:crypto";
import { and, count, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db, schema, withUser, type Tx } from "@/lib/db";
import { notify } from "@/lib/notify";
import type { PersonSummary, Relationship } from "./queries";
import { relationshipWith } from "./queries";

const { friendships, users, invites } = schema;

export class FriendError extends Error {
  override name = "FriendError";
}

/** Requests one person may send in 24 hours, to stop spam. */
const DAILY_REQUEST_LIMIT = 50;

const person = { id: users.id, name: users.name, username: users.username, image: users.image };

function pairRow(tx: Tx, a: string, b: string) {
  return tx
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.userId, a), eq(friendships.friendId, b)),
        and(eq(friendships.userId, b), eq(friendships.friendId, a)),
      ),
    )
    .limit(1)
    .then((rows) => rows[0]);
}

/**
 * Finds a person by exact username (with or without @) or exact email (E2-1).
 * The result never includes an email address, so searching can't reveal anyone's email.
 */
export async function findPerson(
  me: string,
  query: string,
): Promise<(PersonSummary & { relationship: Relationship }) | null> {
  const q = query.trim().toLowerCase();
  if (q.length < 3 || q.length > 254) return null;
  const isEmail = q.includes("@") && !q.startsWith("@");
  const username = q.replace(/^@/, "");
  // Email lookup needs the privileged connection: the app role can't read emails at all.
  const [found] = await db
    .select(person)
    .from(users)
    .where(
      and(
        isEmail ? sql`lower(${users.email}) = ${q}` : sql`lower(${users.username}) = ${username}`,
        sql`${users.onboardedAt} is not null`,
      ),
    )
    .limit(1);
  if (!found) return null;
  return { ...found, relationship: await relationshipWith(me, found.id) };
}

export type SendResult = "sent" | "accepted" | "already_friends" | "already_sent";

/**
 * Sends a friend request (E2-1). If they had already asked me, this accepts theirs instead.
 * Duplicates are refused, and a request I declined earlier is replaced by my new one.
 */
export async function sendFriendRequest(me: string, other: string): Promise<SendResult> {
  if (me === other) throw new FriendError("You can't add yourself");
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, other), sql`${users.onboardedAt} is not null`))
    .limit(1);
  if (!target) throw new FriendError("We couldn't find that person");

  const result = await withUser(me, async (tx): Promise<SendResult> => {
    const existing = await pairRow(tx, me, other);
    if (existing?.status === "accepted") return "already_friends";
    if (existing && existing.userId === me) return "already_sent"; // pending, or silently declined
    if (existing && existing.status === "pending") {
      await tx
        .update(friendships)
        .set({ status: "accepted", respondedAt: new Date() })
        .where(and(eq(friendships.userId, other), eq(friendships.friendId, me)));
      return "accepted";
    }
    if (existing) {
      // They asked before and I declined; now I'm asking, so start fresh in my direction.
      await tx
        .delete(friendships)
        .where(and(eq(friendships.userId, other), eq(friendships.friendId, me)));
    }

    const [sentToday] = await tx
      .select({ n: count() })
      .from(friendships)
      .where(
        and(
          eq(friendships.userId, me),
          gt(friendships.createdAt, sql`now() - interval '24 hours'`),
        ),
      );
    if ((sentToday?.n ?? 0) >= DAILY_REQUEST_LIMIT) {
      throw new FriendError("You've sent a lot of requests today. Try again tomorrow.");
    }
    await tx.insert(friendships).values({ userId: me, friendId: other });
    return "sent";
  });

  if (result === "sent") await notify(other, "friend_request", { from: me });
  if (result === "accepted") await notify(other, "friend_accepted", { by: me });
  return result;
}

/** Accepts or declines a request someone sent me (E2-2). Declining tells nobody. */
export async function respondToRequest(me: string, requester: string, accept: boolean) {
  const updated = await withUser(me, (tx) =>
    tx
      .update(friendships)
      .set({ status: accept ? "accepted" : "declined", respondedAt: new Date() })
      .where(
        and(
          eq(friendships.userId, requester),
          eq(friendships.friendId, me),
          eq(friendships.status, "pending"),
        ),
      )
      .returning({ userId: friendships.userId }),
  );
  if (updated.length === 0) throw new FriendError("That request is no longer waiting");
  if (accept) await notify(requester, "friend_accepted", { by: me });
}

/**
 * Removes a friend, or cancels a request I sent (E2-5). Trips, expenses and balances are
 * untouched because they belong to trip membership, not to the friendship.
 */
export async function removeFriend(me: string, other: string) {
  await withUser(me, (tx) =>
    tx
      .delete(friendships)
      .where(
        or(
          and(eq(friendships.userId, me), eq(friendships.friendId, other)),
          and(
            eq(friendships.userId, other),
            eq(friendships.friendId, me),
            eq(friendships.status, "accepted"),
          ),
        ),
      ),
  );
}

/* ------------------------------------------------------- personal invite links (E2-3) */

function newToken() {
  return randomBytes(16).toString("base64url"); // 128 bits
}

/** My active personal invite token, created on first use. */
export async function getOrCreateFriendInvite(me: string): Promise<string> {
  return withUser(me, async (tx) => {
    const [active] = await tx
      .select({ token: invites.token })
      .from(invites)
      .where(and(eq(invites.kind, "friend"), eq(invites.userId, me), isNull(invites.revokedAt)))
      .limit(1);
    if (active) return active.token;
    const token = newToken();
    await tx.insert(invites).values({ kind: "friend", userId: me, createdBy: me, token });
    return token;
  });
}

/** Turns off my current link and makes a new one, e.g. after sharing it too widely. */
export async function resetFriendInvite(me: string): Promise<string> {
  return withUser(me, async (tx) => {
    await tx
      .update(invites)
      .set({ revokedAt: new Date() })
      .where(and(eq(invites.kind, "friend"), eq(invites.userId, me), isNull(invites.revokedAt)));
    const token = newToken();
    await tx.insert(invites).values({ kind: "friend", userId: me, createdBy: me, token });
    return token;
  });
}

/** Public lookup for the invite page: who shared this link. Null if unknown or revoked. */
export async function getFriendInvite(token: string): Promise<PersonSummary | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const [row] = await db
    .select(person)
    .from(invites)
    .innerJoin(users, eq(users.id, invites.userId))
    .where(
      and(
        eq(invites.token, token),
        eq(invites.kind, "friend"),
        isNull(invites.revokedAt),
        or(isNull(invites.expiresAt), gt(invites.expiresAt, sql`now()`)),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Accepts someone's personal invite link: we become friends straight away, because the
 * link's owner chose to share it. The token is checked here, then the friendship is
 * written with the privileged connection (the app role may only create pending requests).
 */
export async function acceptFriendInvite(me: string, token: string): Promise<PersonSummary> {
  const inviter = await getFriendInvite(token);
  if (!inviter)
    throw new FriendError("This invite link has expired. Ask your friend for a new one.");
  if (inviter.id === me) throw new FriendError("This is your own invite link");

  const became = await db.transaction(async (tx) => {
    const existing = await pairRow(tx, me, inviter.id);
    if (existing?.status === "accepted") return false;
    if (existing) {
      await tx
        .update(friendships)
        .set({ status: "accepted", respondedAt: new Date() })
        .where(
          and(eq(friendships.userId, existing.userId), eq(friendships.friendId, existing.friendId)),
        );
    } else {
      await tx
        .insert(friendships)
        .values({ userId: me, friendId: inviter.id, status: "accepted", respondedAt: new Date() });
    }
    return true;
  });
  if (became) await notify(inviter.id, "friend_accepted", { by: me, via: "invite_link" });
  return inviter;
}
