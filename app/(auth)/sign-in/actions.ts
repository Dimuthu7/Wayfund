"use server";

import { and, count, eq, gt } from "drizzle-orm";
import { unstable_rethrow } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";

export type EmailSignInState = { error?: string; email?: string };

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

/** At most this many unused links per email in the link's lifetime (15 minutes). */
const MAX_PENDING_LINKS = 3;

export async function signInWithEmail(
  _prev: EmailSignInState,
  formData: FormData,
): Promise<EmailSignInState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message, email: String(formData.get("email") ?? "") };
  }
  const email = parsed.data;
  const redirectTo = safeCallbackUrl(formData.get("callbackUrl")?.toString());

  const [pending] = await db
    .select({ n: count() })
    .from(schema.verificationTokens)
    .where(
      and(
        eq(schema.verificationTokens.identifier, email),
        gt(schema.verificationTokens.expires, new Date()),
      ),
    );
  if ((pending?.n ?? 0) >= MAX_PENDING_LINKS) {
    return {
      email,
      error:
        "We've sent a few links already. Check your inbox and spam, or try again in 15 minutes.",
    };
  }

  try {
    await signIn("resend", { email, redirectTo });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthError) {
      return { email, error: "We couldn't send the link. Please try again in a moment." };
    }
    throw error;
  }
  return { email };
}

const providerSchema = z.enum(["google", "facebook"]);

export async function signInWithProvider(formData: FormData) {
  const provider = providerSchema.parse(formData.get("provider"));
  const redirectTo = safeCallbackUrl(formData.get("callbackUrl")?.toString());
  await signIn(provider, { redirectTo });
}
