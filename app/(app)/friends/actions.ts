"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { track } from "@/lib/analytics/server";
import { requireOnboardedUser } from "@/lib/auth/session";
import {
  findPerson,
  FriendError,
  removeFriend,
  resetFriendInvite,
  respondToRequest,
  sendFriendRequest,
  type SendResult,
} from "@/lib/friends/service";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const id = z.string().uuid();

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof FriendError || error instanceof z.ZodError) {
      return { ok: false, error: error instanceof FriendError ? error.message : "Invalid request" };
    }
    throw error;
  }
}

export async function searchPeople(query: string) {
  const me = await requireOnboardedUser();
  return run(() => findPerson(me.id, z.string().max(254).parse(query)));
}

export async function sendRequest(otherId: string): Promise<ActionResult<SendResult>> {
  const me = await requireOnboardedUser();
  const result = await run(() => sendFriendRequest(me.id, id.parse(otherId)));
  if (result.ok) {
    if (result.data === "sent") track(me.id, "friend_request_sent");
    if (result.data === "accepted") track(me.id, "friend_request_accepted");
    refresh();
  }
  return result;
}

export async function respond(requesterId: string, accept: boolean) {
  const me = await requireOnboardedUser();
  const result = await run(() => respondToRequest(me.id, id.parse(requesterId), accept));
  if (result.ok) {
    if (accept) track(me.id, "friend_request_accepted");
    refresh();
  }
  return result;
}

export async function remove(otherId: string) {
  const me = await requireOnboardedUser();
  const result = await run(() => removeFriend(me.id, id.parse(otherId)));
  if (result.ok) refresh();
  return result;
}

export async function resetInviteLink() {
  const me = await requireOnboardedUser();
  const result = await run(() => resetFriendInvite(me.id));
  if (result.ok) refresh();
  return result;
}

export async function inviteLinkShared() {
  const me = await requireOnboardedUser();
  track(me.id, "friend_invite_link_shared");
}
