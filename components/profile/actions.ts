"use server";

import { requireUser } from "@/lib/auth/session";
import { isUsernameAvailable } from "@/lib/profile/server";
import { usernameSchema } from "@/lib/profile/validation";

export type UsernameCheck = { available: boolean; message?: string };

/** Live username check for onboarding and profile editing (E1-4). */
export async function checkUsername(value: string): Promise<UsernameCheck> {
  const user = await requireUser();
  const parsed = usernameSchema.safeParse(value);
  if (!parsed.success) return { available: false, message: parsed.error.issues[0]?.message };
  if (user.username && parsed.data === user.username.toLowerCase()) return { available: true };
  const available = await isUsernameAvailable(parsed.data, user.id);
  return available ? { available } : { available, message: "That username is taken" };
}
