# Wayfund

**Plan the trip, track the spend, split it fairly.**

Wayfund is a mobile-first trip planner and group expense splitter. A group of friends can estimate what a trip will cost before they leave, record what they actually spend along the way, and settle up at the end with the fewest possible payments.

> **Status:** In development. Sprint 0 (foundation) and Sprint 1 (accounts and friends) are built. See the [changelog](CHANGELOG.md).

## Highlights

- **Budget planner:** fuel calculator (distance, price per litre, km per litre), rental and public transport, accommodation, food and custom costs, with a shareable PDF.
- **Flexible splits:** equal, percentage, exact amounts or shares. "Only A, B and C drank, and C pays 20%" takes a few taps.
- **Fair settlement:** balances are netted so a group of _n_ people needs at most _n − 1_ payments. Members mark payments as paid, confirm them and send polite reminders.
- **Built for the road:** installable PWA that records expenses without signal and syncs later.
- **Everyone included:** friends without the app join as guests and can claim their place later.
- **Local first:** LKR is the default currency, and PayHere is supported for Pro subscriptions in Sri Lanka.
- **Pro plan (Phase 2):** unlimited trips, Google Drive photo folders and receipts, multi-currency, advanced analytics and branded PDFs.
- **Super admin console (Phase 2):** the Wayfund team can change Free and Pro limits, prices and features without a release.

## Documentation

| Document                                                    | What's in it                                                                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [Product scope and requirements](docs/01-product-scope.md)  | Vision, features, MVP vs Phase 2, Free vs Pro, roles, trip lifecycle, split rules, non-functional requirements |
| [Product backlog](docs/02-backlog.md)                       | Epics and user stories with acceptance criteria, story points and planned sprints                              |
| [Sprint plan](docs/03-sprint-plan.md)                       | 2-week sprints, ceremonies, Definition of Ready and Done, roadmap, risks                                       |
| [Architecture and tech stack](docs/04-architecture.md)      | Stack, system overview, data model, key flows, security                                                        |
| [Deployment options and costs](docs/05-deployment-costs.md) | Hosting options compared by monthly cost, with a recommendation                                                |
| [Architecture decisions](docs/adr/)                         | Why we chose the hosting, money model, row-level security, auth and framework setup                            |

## Roadmap

| Release                                                        | Sprints                      | Target     |
| -------------------------------------------------------------- | ---------------------------- | ---------- |
| MVP (public launch)                                            | S0 to S8, with a 2-week beta | 2027-04-09 |
| Phase 2 (Pro, admin console, Drive, multi-currency, analytics) | S9 to S12                    | 2027-06-04 |

## Tech stack

Next.js (TypeScript) PWA · Tailwind CSS and shadcn/ui · PostgreSQL with Drizzle ORM · Auth.js (Google, Facebook, email link) · server-side PDFs with `@react-pdf/renderer` · Cloudflare R2 storage · Web Push and Resend · PayHere and Paddle.

**Hosting:** free plans during development (Neon Free, Cloudflare Workers Free and a Cloudflare Tunnel), then one VPS running Docker Compose (app, Postgres, Caddy, backups) from the beta onward. See [deployment options and costs](docs/05-deployment-costs.md).

## Getting started

You need Node.js 22, pnpm 10 (`corepack enable`) and Docker.

```bash
pnpm install
cp .env.example .env.local           # set AUTH_SECRET: openssl rand -base64 33
docker compose up -d db storage storage-init   # Postgres 17 and S3-compatible storage
pnpm db:migrate                      # create tables, roles and row-level security
pnpm db:seed                         # optional demo data (sign in as amal@example.com)
pnpm dev                             # http://localhost:3000
```

Sign in with your email. Without a Resend key, the sign-in link is printed in the terminal running `pnpm dev`. Google and Facebook buttons appear once their keys are in `.env.local`.

**Use Neon instead of local Postgres:** put your Neon connection string (the pooled `-pooler` host, with `?sslmode=require`) in `DATABASE_URL` and run `pnpm db:migrate`.

### Run the production image and test on a phone

```bash
cp .env.example .env                 # set AUTH_SECRET
docker compose --profile tunnel up --build
docker compose logs tunnel           # find the https://<random>.trycloudflare.com URL
```

Set `APP_URL` in `.env` to the tunnel URL and run `docker compose up -d app` so links point to it. Open the URL on your phone and add it to the home screen. Sign-in links appear in `docker compose logs app`.

### Scripts

| Command                                        | What it does                                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm dev`                                     | Development server                                                                           |
| `pnpm lint` / `pnpm typecheck` / `pnpm format` | ESLint, TypeScript, Prettier                                                                 |
| `pnpm test`                                    | Unit and property-based tests (Vitest, fast-check)                                           |
| `pnpm test:db`                                 | Row-level security and data tests against Postgres (`TEST_DATABASE_URL`)                     |
| `pnpm test:e2e`                                | Playwright on a 360 px phone viewport (needs `pnpm build` and a migrated `E2E_DATABASE_URL`) |
| `pnpm db:generate`                             | Create a migration after changing `lib/db/schema.ts`                                         |
| `pnpm db:migrate` / `pnpm db:seed`             | Apply migrations / load demo data                                                            |

### Project layout

```
app/            routes: (auth) sign-in and onboarding, (app) signed-in screens, invite/, api/
components/     ui/ design system, layout/, profile/
lib/            auth, db (schema, RLS helper), money, friends, profile, email, storage, analytics
drizzle/        SQL migrations (0001_security.sql holds roles, policies and views)
tests/          unit/, db/ (row-level security), e2e/ (Playwright)
docs/           product docs and adr/ (architecture decisions)
```

## Contributing

Work follows the [sprint plan](docs/03-sprint-plan.md). Each backlog story becomes a GitHub issue, and each issue is delivered through a pull request from a short-lived branch into `main`.
