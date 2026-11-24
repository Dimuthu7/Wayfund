# Wayfund: Deployment Options and Costs

| | |
|---|---|
| **Status** | Comparison for decision (prices checked 2026-11-24) |
| **Related** | [Architecture](04-architecture.md) · [Sprint plan](03-sprint-plan.md) |

Prices are in USD per month, from each provider's pricing page on 2026-11-24 unless marked otherwise. LKR figures use roughly LKR 300 per USD and are only a guide. Prices change often, so check again before paying for anything.

## 1. What Wayfund needs to run

| Need | Used for |
|---|---|
| **App hosting** | The Next.js PWA: pages, server actions, sync API, server-side PDFs, cron jobs |
| **Postgres database** | Trips, expenses, splits, payments |
| **Auth** | Google, Facebook and email magic link sign-in |
| **Realtime** | Live expense and balance updates |
| **File storage** | Generated PDFs and data exports (photos go to users' own Google Drive in Phase 2) |
| **Email, push, monitoring** | Resend, Web Push, Sentry, PostHog |

Wayfund is light on resources. Even with a few thousand active users it mostly reads and writes small rows. The heaviest work is PDF generation, which happens a few times per trip.

## 2. Provider prices that matter

### App hosting

| Provider | Free plan | Cheapest paid plan | Notes |
|---|---|---|---|
| **Vercel** | Hobby, $0. **Commercial use is not allowed** under Vercel's terms, and Hobby projects can be shut down without notice. | **Pro $20/month** per developer seat, including $20 of usage. Then CPU $0.128/hour, invocations $0.60 per million. | Best Next.js support. A $200 default spend budget, with optional auto-pause. |
| **Cloudflare Workers** (Next.js through the OpenNext adapter) | 100,000 requests/day, 10 ms CPU per request (too little for PDFs and server rendering) | **Paid $5/month**, including 10 million requests and 30 million CPU-ms. Then $0.30 per million requests. | No bandwidth charges. R2 storage $0.015/GB with free egress and 10 GB free. |
| **Railway** | $1 of usage per month, services sleep | **Hobby $5/month**, including $5 of usage. RAM $10/GB, CPU $20/vCPU, egress $0.05/GB. | App and database in one place. Always-on container. |
| **Render** *(from a comparison article, not Render's own page)* | 512 MB web service that sleeps when idle | **$7/month** web service (512 MB). | Postgres from $6/month (256 MB) or $19/month (1 GB). |
| **VPS** (for example Hetzner with Coolify) *(from a price aggregator)* | none | about **$7–8/month** for 2 vCPU and 4 GB in Europe | Hetzner raised prices twice in 2026 and has limited new server orders. Asia (Singapore) costs more and has less traffic included. You run backups, security updates and uptime yourself. |

### Database, auth and realtime

| Provider | Free plan | Cheapest paid plan | Notes |
|---|---|---|---|
| **Supabase** | 500 MB database, 50,000 monthly users, 1 GB storage, 5 GB egress, 2 projects. **Paused after 1 week without activity, and no automatic backups.** | **Pro $25/month**, including one Micro database, 8 GB disk, 100,000 monthly users, 100 GB storage, 250 GB egress, daily backups for 7 days. A spend cap is on by default. | Includes auth, realtime and storage, which Wayfund's design already uses. |
| **Neon** | 1 GB per project, 100 compute hours per project per month, never paused for inactivity (compute sleeps after 5 minutes idle) | **Launch: no base fee.** $0.106 per compute hour, $0.35/GB storage. Light use is about $5–15/month. | Postgres only, plus a basic auth service. Realtime and file storage would need other services. |
| **Railway Postgres** | inside the $5 Hobby usage | usage based (RAM and disk) | You manage backups. No auth or realtime. |

### Small fixed costs (any option)

| Item | Cost |
|---|---|
| Domain (`.com` or `.app`) | about $10–20 per **year** *(typical price, not checked)* |
| Email (Resend) | free plan is enough for the beta *(limits not re-checked)* |
| Sentry and PostHog | free plans are enough for the MVP |
| Web Push | free |
| PayHere and Paddle | no hosting cost. They take a fee per payment, from Phase 2. |

## 3. Options compared

Monthly cost at three stages. **Beta** is development plus about 5 test groups. **Launch** is up to about 2,000 users. **Growth** is about 10,000–20,000 users.

| # | Option | Beta | Launch | Growth | Extra build work | Verdict |
|---|---|---:|---:|---:|---|---|
| 1 | **Vercel Pro + Supabase Pro** (current plan in the architecture note) | $20–45 | **$45** | $45–70 | None | Easiest, but the most expensive |
| 2 | **Cloudflare Workers + Supabase** | **$5** (Supabase free) | **$30** | $30–50 | Small: OpenNext adapter, check PDFs and cron on Workers in Sprint 0 | ✅ **Recommended** |
| 3 | Cloudflare Workers + Neon + R2 | $5 | $10–20 | $20–40 | Large: own auth (Auth.js), own realtime, storage on R2 | Cheapest managed option, but costs about 2 extra sprints |
| 4 | Railway (app + Postgres) | $5 | $10–20 | $25–50 | Large: own auth, realtime and backups | Simple bill, more work |
| 5 | Render (app + Postgres) | $0–13 | $26 | $50–100 | Large: own auth and realtime | Fair, but grows fastest |
| 6 | VPS with Coolify (self-host everything, even Supabase) | $8 | $8–15 | $15–30 | Large ongoing work: backups, updates, security, monitoring | Cheapest on paper, but your time costs more |

In LKR, option 1 at launch is about **LKR 13,500 per month**. Option 2 is about **LKR 9,000 per month**, and only about **LKR 1,500 per month** during the beta.

Why the free plans alone are not enough for launch:

- **Vercel Hobby** forbids commercial use. Wayfund sells Pro plans, so it needs Vercel Pro or another host.
- **Supabase Free** pauses after a week without activity and has **no backups**. Losing expense and settlement data would destroy trust, so move to Pro before real users rely on it.

## 4. Recommendation

**Use Cloudflare Workers for the app and keep Supabase for the database, auth, realtime and storage.**

| Stage | Setup | Monthly cost |
|---|---|---:|
| Sprint 0 to Sprint 7 (development) | Cloudflare Workers Paid + Supabase Free | **$5** |
| Beta buffer onward (real groups' money data) | Cloudflare Workers Paid + Supabase Pro | **$30** |
| Growth | Same, with Supabase compute upgraded only when needed (Small +$5) | **$30–50** |

Why:

- **It saves about $15 per month (about LKR 4,500) compared with Vercel**, from day one, and costs only $5 during development.
- **Supabase stays.** Auth, realtime, storage and row-level security are already in the design. Replacing them (options 3 to 6) costs weeks of building to save $10–25 a month.
- **Cloudflare charges nothing for bandwidth** and has servers close to Sri Lanka.
- **The code stays portable.** Next.js with Drizzle runs on Vercel too. If Workers causes problems, moving to Vercel Pro is a configuration change, not a rewrite.

**Risk to check in Sprint 0:** Next.js on Workers uses the OpenNext adapter, which supports most but not all Next.js features. A short spike in Sprint 0 should confirm that server actions, the `@react-pdf/renderer` PDFs, cron triggers and the Supabase client work on Workers. If any of them don't, use Vercel Pro (option 1) instead.

**Ways to keep costs down later**

- Keep the Supabase spend cap on.
- Cache public pages (landing, invite previews) at the edge.
- Generate PDFs on demand and keep them for a short time, rather than storing every version.
- Only upgrade Supabase compute when the database dashboard shows sustained high CPU or memory use.

## 5. Sources

- Vercel: [pricing](https://vercel.com/pricing), [terms (Hobby is non-commercial)](https://vercel.com/legal/terms), [fair-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)
- Cloudflare: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- Supabase: [pricing](https://supabase.com/pricing.md)
- Neon: [pricing](https://neon.com/pricing)
- Railway: [pricing plans](https://docs.railway.com/pricing/plans)
- Render (secondary): [Render vs Railway, Encore, Nov 2026](https://encore.dev/articles/render-vs-railway)
- Hetzner (secondary): [Hetzner pricing 2026, AgentDeals](https://agentdeals.dev/hetzner-pricing-2026)
