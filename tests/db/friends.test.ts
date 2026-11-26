import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/lib/db";
import {
  countIncomingRequests,
  listFriends,
  listRequests,
  relationshipWith,
} from "@/lib/friends/queries";
import {
  acceptFriendInvite,
  findPerson,
  FriendError,
  getFriendInvite,
  getOrCreateFriendInvite,
  removeFriend,
  resetFriendInvite,
  respondToRequest,
  sendFriendRequest,
} from "@/lib/friends/service";
import { createUser, resetData } from "./helpers";

describe("friends", () => {
  beforeEach(resetData);

  it("finds people by exact username or email without revealing the email", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    const byUsername = await findPerson(amal.id, `@${bimal.username.toUpperCase()}`);
    expect(byUsername).toMatchObject({ id: bimal.id, relationship: "none" });
    expect(byUsername).not.toHaveProperty("email");

    const byEmail = await findPerson(amal.id, `${bimal.username}@EXAMPLE.com`);
    expect(byEmail?.id).toBe(bimal.id);
    expect(JSON.stringify(byEmail)).not.toContain("@example.com");

    expect(await findPerson(amal.id, bimal.username.slice(0, 4))).toBeNull();
  });

  it("sends, refuses duplicates, and accepts", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    expect(await sendFriendRequest(amal.id, bimal.id)).toBe("sent");
    expect(await sendFriendRequest(amal.id, bimal.id)).toBe("already_sent");
    expect(await countIncomingRequests(bimal.id)).toBe(1);
    expect(await relationshipWith(bimal.id, amal.id)).toBe("request_received");

    const notes = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, bimal.id));
    expect(notes.map((n) => n.type)).toEqual(["friend_request"]);

    await respondToRequest(bimal.id, amal.id, true);
    expect((await listFriends(amal.id)).map((f) => f.id)).toEqual([bimal.id]);
    expect((await listFriends(bimal.id)).map((f) => f.id)).toEqual([amal.id]);
    expect(await sendFriendRequest(bimal.id, amal.id)).toBe("already_friends");
  });

  it("accepts a crossed request instead of duplicating it", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    await sendFriendRequest(amal.id, bimal.id);
    expect(await sendFriendRequest(bimal.id, amal.id)).toBe("accepted");
    expect(await relationshipWith(amal.id, bimal.id)).toBe("friends");
  });

  it("declines silently and lets the decliner ask later", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    await sendFriendRequest(amal.id, bimal.id);
    await respondToRequest(bimal.id, amal.id, false);

    // Amal still sees the request as sent, and can't resend it.
    expect((await listRequests(amal.id)).outgoing.map((r) => r.id)).toEqual([bimal.id]);
    expect(await sendFriendRequest(amal.id, bimal.id)).toBe("already_sent");
    expect((await listRequests(bimal.id)).incoming).toEqual([]);

    // Bimal changes their mind.
    expect(await sendFriendRequest(bimal.id, amal.id)).toBe("sent");
    expect((await listRequests(amal.id)).incoming.map((r) => r.id)).toEqual([bimal.id]);
  });

  it("only lets the recipient respond", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    await sendFriendRequest(amal.id, bimal.id);
    await expect(respondToRequest(amal.id, bimal.id, true)).rejects.toThrow(FriendError);
  });

  it("removes a friend from both lists", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    await sendFriendRequest(amal.id, bimal.id);
    await respondToRequest(bimal.id, amal.id, true);
    await removeFriend(bimal.id, amal.id);
    expect(await listFriends(amal.id)).toEqual([]);
    expect(await listFriends(bimal.id)).toEqual([]);
  });

  it("makes friends through a personal invite link and supports resetting it", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    const token = await getOrCreateFriendInvite(amal.id);
    expect(await getOrCreateFriendInvite(amal.id)).toBe(token);
    expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect((await getFriendInvite(token))?.id).toBe(amal.id);

    await expect(acceptFriendInvite(amal.id, token)).rejects.toThrow(FriendError);
    const inviter = await acceptFriendInvite(bimal.id, token);
    expect(inviter.id).toBe(amal.id);
    expect(await relationshipWith(amal.id, bimal.id)).toBe("friends");

    const fresh = await resetFriendInvite(amal.id);
    expect(fresh).not.toBe(token);
    expect(await getFriendInvite(token)).toBeNull();
    await expect(acceptFriendInvite(bimal.id, token)).rejects.toThrow(/expired/);
  });

  it("counts shared trips", async () => {
    const amal = await createUser("Amal");
    const bimal = await createUser("Bimal");
    await sendFriendRequest(amal.id, bimal.id);
    await respondToRequest(bimal.id, amal.id, true);
    const [trip] = await db
      .insert(schema.trips)
      .values({ ownerId: amal.id, name: "Ella" })
      .returning();
    await db.insert(schema.tripMembers).values([
      { tripId: trip!.id, userId: amal.id, role: "owner" },
      { tripId: trip!.id, userId: bimal.id },
    ]);
    expect((await listFriends(amal.id))[0]?.sharedTrips).toBe(1);
  });
});
