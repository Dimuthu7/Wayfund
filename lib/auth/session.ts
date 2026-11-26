import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { Session } from "next-auth";
import { cache } from "react";
import { auth } from "./index";

export type CurrentUser = Session["user"];

/** The session for this request, read once per render. */
export const getSession = cache(async () => {
  // Session reads are per request; mark it so nothing here is prerendered.
  await connection();
  return auth();
});

/**
 * Data Access Layer entry point: returns the signed-in user or redirects to sign-in.
 * Call it in every page and server action that needs a user; never trust the client.
 */
export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(returnTo ? `/sign-in?callbackUrl=${encodeURIComponent(returnTo)}` : "/sign-in");
  }
  return session.user;
}

/** Like requireUser, and sends people who haven't finished onboarding there first. */
export async function requireOnboardedUser(returnTo?: string): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (!user.onboarded) {
    redirect(returnTo ? `/onboarding?callbackUrl=${encodeURIComponent(returnTo)}` : "/onboarding");
  }
  return user;
}

export { safeCallbackUrl } from "./utils";
