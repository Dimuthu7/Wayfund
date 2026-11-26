# Wayfund

**Plan the trip, track the spend, split it fairly.**

Wayfund is a mobile-first trip planner and group expense splitter. A group of friends can estimate what a trip will cost before they leave, record what they actually spend along the way, and settle up at the end with the fewest possible payments.

> **Status:** Planning. The scope, backlog and sprint plan are agreed. Application code starts in Sprint 0 (from 2026-11-23).

## Highlights

- **Budget planner:** fuel calculator (distance, price per litre, km per litre), rental and public transport, accommodation, food and custom costs, with a shareable PDF.
- **Flexible splits:** equal, percentage, exact amounts or shares. "Only A, B and C drank, and C pays 20%" takes a few taps.
- **Fair settlement:** balances are netted so a group of *n* people needs at most *n − 1* payments. Members mark payments as paid, confirm them and send polite reminders.
- **Built for the road:** installable PWA that records expenses without signal and syncs later.
- **Everyone included:** friends without the app join as guests and can claim their place later.
- **Local first:** LKR is the default currency, and PayHere is supported for Pro subscriptions in Sri Lanka.
- **Pro plan (Phase 2):** unlimited trips, Google Drive photo folders and receipts, multi-currency, advanced analytics and branded PDFs.
- **Super admin console (Phase 2):** the Wayfund team can change Free and Pro limits, prices and features without a release.

## Documentation

| Document | What's in it |
|---|---|
| [Product scope and requirements](docs/01-product-scope.md) | Vision, features, MVP vs Phase 2, Free vs Pro, roles, trip lifecycle, split rules, non-functional requirements |
| [Product backlog](docs/02-backlog.md) | Epics and user stories with acceptance criteria, story points and planned sprints |
| [Sprint plan](docs/03-sprint-plan.md) | 2-week sprints, ceremonies, Definition of Ready and Done, roadmap, risks |
| [Architecture and tech stack](docs/04-architecture.md) | Stack, system overview, data model, key flows, security |
| [Deployment options and costs](docs/05-deployment-costs.md) | Hosting options compared by monthly cost, with a recommendation |

## Roadmap

| Release | Sprints | Target |
|---|---|---|
| MVP (public launch) | S0 to S8, with a 2-week beta | 2027-04-09 |
| Phase 2 (Pro, admin console, Drive, multi-currency, analytics) | S9 to S12 | 2027-06-04 |

## Tech stack

Next.js (TypeScript) PWA · Tailwind CSS and shadcn/ui · PostgreSQL with Drizzle ORM · Auth.js (Google, Facebook, email link) · server-side PDFs with `@react-pdf/renderer` · Cloudflare R2 storage · Web Push and Resend · PayHere and Paddle.

**Hosting:** free plans during development (Neon Free, Cloudflare Workers Free and a Cloudflare Tunnel), then one VPS running Docker Compose (app, Postgres, Caddy, backups) from the beta onward. See [deployment options and costs](docs/05-deployment-costs.md).

## Getting started

Setup instructions will be added in Sprint 0, when the application is scaffolded.

## Contributing

Work follows the [sprint plan](docs/03-sprint-plan.md). Each backlog story becomes a GitHub issue, and each issue is delivered through a pull request from a short-lived branch into `main`.
