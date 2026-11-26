# 0004. Auth.js with database sessions and confirmed account linking

- **Status:** Accepted (2026-11-26)

## Decision

- Auth.js v5 with the Drizzle adapter and **database sessions** (60 days, refreshed daily), so sessions can be revoked and live in our own Postgres.
- Providers: Google, Facebook and an email magic link (Resend). Links expire in 15 minutes, work once, and at most 3 can be pending per address. Without a Resend key outside production, links are written to the server log (`EMAIL_TRANSPORT=log`), which also drives the end-to-end tests.
- Providers switch on when their keys are set, so the app runs locally with email only.
- **Linking (E1-6):** signing in with Google or Facebook while signed in links that account to the current user. If someone is signed out and the provider's email matches an existing account, we don't link automatically. We remember the intent in an encrypted 15-minute cookie, ask them to confirm by signing in to the existing account with an email link, then offer a one-tap "Link Google" while signed in.
- `proxy.ts` only does an optimistic cookie check for protected paths. The real check is `requireUser()` / `requireOnboardedUser()` in every page and server action.
- Post-sign-in destinations go through `safeCallbackUrl` to prevent open redirects.

## Consequences

- Each request that reads the session does one indexed lookup in `sessions`.
- Google and Facebook need developer apps with redirect URIs `<APP_URL>/api/auth/callback/{google,facebook}`.
