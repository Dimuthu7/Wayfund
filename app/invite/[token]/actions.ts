"use server";

import { z } from "zod";
import { track } from "@/lib/analytics/server";
import { requireOnboardedUser } from "@/lib/auth/session";
import { acceptFriendInvite, FriendError } from "@/lib/friends/service";

export async function acceptInvite(
  token: string,
): Promise<{ ok: true; name: string | null } | { ok: false; error: string }> {
  const me = await requireOnboardedUser(`/invite/${encodeURIComponent(token)}`);
  try {
    const inviter = await acceptFriendInvite(me.id, z.string().max(64).parse(token));
    track(me.id, "friend_request_accepted", { via: "invite_link" });
    return { ok: true, name: inviter.name };
  } catch (error) {
    if (error instanceof FriendError) return { ok: false, error: error.message };
    throw error;
  }
}
