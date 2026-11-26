import "server-only";
import { db, schema } from "@/lib/db";

export type NotificationType = "friend_request" | "friend_accepted";

/**
 * Records an in-app notification. Push and email fan-out (E7) will hang off this one
 * function, so callers don't change. Written with the privileged connection because the
 * recipient is another user; callers must have authorised the action first.
 */
export async function notify(
  userId: string,
  type: NotificationType,
  payload: Record<string, string | number | boolean | null>,
) {
  await db.insert(schema.notifications).values({ userId, type, payload });
}
