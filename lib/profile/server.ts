import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { ProfileInput } from "./validation";

const { users } = schema;

export async function isUsernameAvailable(username: string, exceptUserId?: string) {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        sql`lower(${users.username}) = ${username.toLowerCase()}`,
        exceptUserId ? ne(users.id, exceptUserId) : undefined,
      ),
    )
    .limit(1);
  return !row;
}

function isUniqueViolation(error: unknown, constraint: string) {
  const cause = (error as { cause?: { code?: string; constraint_name?: string } })?.cause;
  return cause?.code === "23505" && cause.constraint_name === constraint;
}

/**
 * Saves profile fields for the signed-in user. The username unique index is the final
 * arbiter, so two people racing for the same name get a clear error, not a crash.
 */
export async function saveProfile(
  userId: string,
  input: ProfileInput,
  { completeOnboarding = false }: { completeOnboarding?: boolean } = {},
): Promise<{ ok: true } | { ok: false; field: "username"; message: string }> {
  try {
    await db
      .update(users)
      .set({
        name: input.name,
        username: input.username,
        country: input.country,
        defaultCurrency: input.defaultCurrency,
        ...(completeOnboarding ? { onboardedAt: sql`coalesce(${users.onboardedAt}, now())` } : {}),
      })
      .where(eq(users.id, userId));
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error, "users_username_lower_key")) {
      return { ok: false, field: "username", message: "That username is taken" };
    }
    throw error;
  }
}

export async function getProfile(userId: string) {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      username: users.username,
      country: users.country,
      defaultCurrency: users.defaultCurrency,
      onboardedAt: users.onboardedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

export async function setAvatar(userId: string, image: string | null) {
  await db.update(users).set({ image }).where(eq(users.id, userId));
}

/** A free username to pre-fill onboarding: the suggestion, else with a short suffix. */
export async function suggestAvailableUsername(base: string, userId: string): Promise<string> {
  if (await isUsernameAvailable(base, userId)) return base;
  const digits = userId.replace(/\D/g, "").padEnd(12, "7");
  for (let i = 0; i < 3; i++) {
    const candidate = `${base.slice(0, 15)}_${digits.slice(i * 4, i * 4 + 4)}`;
    if (await isUsernameAvailable(candidate, userId)) return candidate;
  }
  return "";
}
