<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Wayfund conventions

- Product docs and decisions live in `docs/` (scope, backlog with story IDs like E2-3, sprint plan, architecture, `docs/adr/`).
- User data access goes through `withUser(userId, tx => …)` from `lib/db` so row-level security applies. The privileged `db` is only for auth, public token lookups and system jobs (see ADR 0003).
- Pages and server actions call `requireUser()` / `requireOnboardedUser()` from `lib/auth/session`; never trust the client.
- Money is integer minor units (`lib/money`); never use floats for amounts.
- Schema changes: edit `lib/db/schema.ts`, run `pnpm db:generate`, and add policies in a SQL migration.
- Before pushing: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`, plus `pnpm test:db` for data changes.
