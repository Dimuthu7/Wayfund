# 0003. Row-level security with a restricted role and a per-request user

- **Status:** Accepted (2026-11-26)
- **Context:** Trip data must only be visible to trip members, even if a server action has a bug. We use plain Postgres (Neon now, the VPS later) with a single connection string, and Neon's owner role bypasses row-level security.

## Decision

- Migration `0001_security.sql` creates a `NOLOGIN` role `wayfund_app` without `BYPASSRLS`, and grants it to the connecting user.
- Every user request runs in `withUser(userId, tx => ...)` (`lib/db/index.ts`), a transaction that runs `set_config('app.user_id', …, true)` and `SET LOCAL ROLE wayfund_app`. Both reset when the transaction ends, so pooled connections stay clean (works with Neon's transaction pooler).
- Policies use `SECURITY DEFINER` helpers (`app.is_trip_member`, `app.is_trip_admin`, `app.is_trip_owner`) so membership checks don't recurse into `trip_members` policies.
- `wayfund_app` can read only public profile columns of `users` (never email) and has no access to `accounts`, `sessions` or `verification_tokens`.
- Friend requests: the app role may only insert `pending` rows as the sender, and only the recipient may answer. Steps that need more (accepting a personal invite link, joining a trip by link, notifications to other people) are validated in server code and written with the privileged connection.
- The `member_balances` view uses `security_invoker` so it respects the caller's policies.

## Consequences

- Tests in `tests/db` prove the policies against a real Postgres in CI.
- Server code must not use the privileged `db` for user data. Code review checks for it.
