import "server-only";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { track } from "@/lib/analytics/server";
import { getDb, schema } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { magicLinkEmail } from "@/lib/email/templates";
import { env, features } from "@/lib/env";
import { needsLinkConfirmation, setPendingLink } from "./linking";

export const MAGIC_LINK_MINUTES = 15;

function providers(): Provider[] {
  const list: Provider[] = [];
  if (features.google()) {
    list.push(Google({ clientId: env().AUTH_GOOGLE_ID, clientSecret: env().AUTH_GOOGLE_SECRET }));
  }
  if (features.facebook()) {
    list.push(
      Facebook({ clientId: env().AUTH_FACEBOOK_ID, clientSecret: env().AUTH_FACEBOOK_SECRET }),
    );
  }
  list.push(
    Resend({
      // The key is only used by our own sendVerificationRequest below.
      apiKey: env().AUTH_RESEND_KEY ?? "development",
      from: env().EMAIL_FROM,
      maxAge: MAGIC_LINK_MINUTES * 60,
      normalizeIdentifier(identifier) {
        const email = identifier.trim().toLowerCase();
        if (!/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email) || email.length > 254) {
          throw new Error("Invalid email address");
        }
        return email;
      },
      async sendVerificationRequest({ identifier, url }) {
        await sendEmail({
          to: identifier,
          ...magicLinkEmail({ url, minutes: MAGIC_LINK_MINUTES }),
        });
      },
    }),
  );
  return list;
}

function config(): NextAuthConfig {
  return {
    // The adapter checks the instance type, so it gets the real client rather than the proxy.
    adapter: DrizzleAdapter(getDb(), {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    }),
    secret: env().AUTH_SECRET,
    trustHost: true,
    providers: providers(),
    session: { strategy: "database", maxAge: 60 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
    pages: {
      signIn: "/sign-in",
      verifyRequest: "/sign-in/check-email",
      error: "/sign-in",
    },
    callbacks: {
      async signIn({ account, profile }) {
        // E1-6: an OAuth sign-in whose email matches an existing account, while signed out,
        // must be confirmed by signing in to that account first. Remember the intent and
        // send the person to the confirmation page instead of failing.
        if (account?.type === "oauth" || account?.type === "oidc") {
          const pending = await needsLinkConfirmation({
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            email: profile?.email ?? null,
          });
          if (pending) {
            await setPendingLink(pending);
            return "/sign-in/link-account";
          }
        }
        return true;
      },
      session({ session, user }) {
        const u = user as typeof user & typeof schema.users.$inferSelect;
        session.user = {
          ...session.user,
          id: u.id,
          name: u.name ?? null,
          image: u.image ?? null,
          username: u.username ?? null,
          onboarded: Boolean(u.onboardedAt),
          defaultCurrency: u.defaultCurrency,
          country: u.country,
        };
        return session;
      },
    },
    events: {
      createUser({ user }) {
        if (user.id) track(user.id, "signed_up");
      },
      signIn({ user, account, isNewUser }) {
        if (user.id && !isNewUser)
          track(user.id, "signed_in", { provider: account?.provider ?? null });
      },
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => config());

/** Sign-in providers that are configured, for the sign-in and linking screens. */
export function enabledProviders() {
  return { google: features.google(), facebook: features.facebook(), email: true };
}
