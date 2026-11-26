import "server-only";
import { and, eq, gt, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { decode, encode } from "next-auth/jwt";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Confirmed account linking (E1-6).
 *
 * When someone signs in with Google or Facebook while signed out, and that provider account
 * isn't linked yet but its email matches an existing Wayfund account, we don't link
 * automatically (an OAuth email isn't proof of owning the Wayfund account). Instead we keep
 * the intent in a short-lived encrypted cookie, ask them to sign in to the existing account,
 * and then finish linking while signed in, which Auth.js does safely.
 */

const COOKIE = "wf.pending-link";
const SALT = "wayfund.pending-link";
const MAX_AGE = 15 * 60;
const SESSION_COOKIES = ["__Secure-authjs.session-token", "authjs.session-token"];

export type PendingLink = { provider: string; email: string };

async function signedInUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = SESSION_COOKIES.map((name) => jar.get(name)?.value).find(Boolean);
  if (!token) return null;
  const [row] = await db
    .select({ userId: schema.sessions.userId })
    .from(schema.sessions)
    .where(and(eq(schema.sessions.sessionToken, token), gt(schema.sessions.expires, new Date())))
    .limit(1);
  return row?.userId ?? null;
}

export async function needsLinkConfirmation({
  provider,
  providerAccountId,
  email,
}: {
  provider: string;
  providerAccountId: string;
  email: string | null;
}): Promise<PendingLink | null> {
  if (!email) return null;
  const [linked] = await db
    .select({ userId: schema.accounts.userId })
    .from(schema.accounts)
    .where(
      and(
        eq(schema.accounts.provider, provider),
        eq(schema.accounts.providerAccountId, providerAccountId),
      ),
    )
    .limit(1);
  if (linked) return null;
  if (await signedInUserId()) return null; // Auth.js links it to the signed-in user.
  const normalized = email.trim().toLowerCase();
  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${normalized}`)
    .limit(1);
  return existing ? { provider, email: normalized } : null;
}

function secret() {
  const value = env().AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is required for account linking");
  return value;
}

export async function setPendingLink(link: PendingLink) {
  const value = await encode({ token: link, secret: secret(), salt: SALT, maxAge: MAX_AGE });
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: env().APP_URL.startsWith("https://"),
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getPendingLink(): Promise<PendingLink | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  try {
    const token = await decode({ token: value, secret: secret(), salt: SALT });
    if (typeof token?.provider === "string" && typeof token.email === "string") {
      return { provider: token.provider, email: token.email };
    }
  } catch {
    // Expired or tampered: treat as absent.
  }
  return null;
}

export async function clearPendingLink() {
  (await cookies()).delete(COOKIE);
}

export { maskEmail } from "./utils";
