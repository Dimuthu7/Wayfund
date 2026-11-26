# Wayfund: Deployment Options and Costs

| | |
|---|---|
| **Status** | **Decided 2026-11-26** (prices checked 2026-11-24 and 2026-11-26) |
| **Related** | [Architecture](04-architecture.md) · [Sprint plan](03-sprint-plan.md) |

Prices are in USD per month, from each provider's pricing page on 2026-11-24 unless marked otherwise. LKR figures use roughly LKR 300 per USD and are only a guide. Prices change often, so check again before paying for anything.

## Decision

| Stage | Setup | Monthly cost |
|---|---|---:|
| **Development and testing** (Sprint 0 to Sprint 6) | App on the laptop in Docker, shared through a free **Cloudflare Tunnel**, plus optional **Cloudflare Workers Free** preview links. Database on **Neon Free**. | **$0** |
| **Beta and production** (from Sprint 7, March 2027) | **One VPS running Docker Compose**: the Next.js app, PostgreSQL, Caddy for HTTPS, a cron container and a backup container. Nightly database backups to **Cloudflare R2** (free up to 10 GB). | **about $6.50–9** (about LKR 2,000–2,700) on a 2-year term |

Notes on the decision:

- **Cloudflare Workers Free** allows only 10 ms of CPU per request, so PDFs and heavy pages will fail there. Use it for quick preview links only, and test real features in Docker, which is the same image the VPS runs.
- **Neon Free** never deletes data and is plain Postgres, so nothing needs migrating when production moves to the VPS.
- **Supabase is not used.** Auth.js, polling for live updates and R2 replace its auth, realtime and storage, so development and production run the same code. See the [architecture note](04-architecture.md).
- **Buy the VPS at the start of Sprint 7**, not now. See section 6 for the VPS options.

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

## 4. First recommendation (superseded by the decision at the top)

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

## 5. Follow-up: Cloudflare Free, Neon, and DigitalOcean

### Can Cloudflare Workers Free run Wayfund in production?

Not reliably. The Free plan allows only **10 ms of CPU per request** and 100,000 requests per day. Server-rendered Next.js pages often need more than 10 ms, and PDF generation needs far more. Requests over the limit fail with an error. Workers Paid ($5/month) raises this to 30 seconds per request by default. The Free plan is fine for development previews and for a static landing page.

### Neon's paid plan

Neon has no plan called "Pro". Its paid plans are **Launch** (no base fee, $0.106 per compute hour, $0.35/GB storage) and **Scale** (about twice the compute rate). For Wayfund, **Launch** is the right choice and should cost about **$5–15/month** at launch, because the database sleeps when nobody is using it. The Free plan does not pause projects or delete data, so it is fine for development.

Moving from Supabase to Neon means three things need replacing:

| Supabase feature | Replacement with Neon |
|---|---|
| Auth | Neon Auth (included on Launch) or Better Auth / Auth.js |
| Realtime | Refresh the trip screen every few seconds for the MVP, or add a realtime service later |
| File storage (PDFs, exports) | Cloudflare R2 (10 GB free, no egress fees) |

This adds roughly one sprint of work.

### DigitalOcean prices (checked 2026-11-24)

| Product | Price |
|---|---|
| App Platform, 512 MB container | $5/month (likely too small for Next.js with PDFs) |
| App Platform, 1 GB container | $10–12/month, 100–150 GB bandwidth |
| App Platform, 2 GB container | $25/month |
| Basic Droplet (VPS), 1 GB / 2 GB | $6 / $12 per month, plus 20–30% for backups |
| Managed PostgreSQL (smallest) | $15.15/month |

DigitalOcean has Bangalore and Singapore datacenters, both close to Sri Lanka.

### Cloudflare + Neon vs DigitalOcean + Neon

| | **Cloudflare Workers Paid + Neon Launch** | **DigitalOcean App Platform + Neon Launch** |
|---|---|---|
| Development cost | $0–5/month | $0–12/month |
| Launch cost | **about $10–20/month** (about LKR 3,000–6,000) | **about $17–27/month** (about LKR 5,000–8,000) |
| Growth cost | about $20–40/month | about $30–50/month (bigger container) |
| How Next.js runs | Through the OpenNext adapter. Most features work, and a few may not. | A normal Node.js server, so everything works. |
| Limits | 30 s CPU per request (enough). 128 MB memory per request. | None beyond the container size. |
| PDFs | Needs testing on Workers | Works as on a laptop |
| Bandwidth | Free | 100–150 GB included, then $0.02/GB |
| Region | Global edge, close to every user | One region. Choose Singapore, the same as Neon, to keep the app and database close. |
| Server upkeep | None | None on App Platform (a Droplet would need upkeep) |
| Main risk | Adapter limits | Slightly higher cost |

**Recommendation:** start with **Cloudflare Workers Paid + Neon Launch**, which is the cheapest managed setup. If the Sprint 0 check shows the adapter can't handle our PDFs or server features, use **DigitalOcean App Platform (1 GB) + Neon Launch** instead. Both use the same code, Neon database and R2 storage, so switching costs very little.

## 6. VPS options (checked 2026-11-26)

### Hostinger VPS

| Plan | CPU / RAM / disk | Price on a 24-month term | Paid upfront | Renews at |
|---|---|---:|---:|---:|
| KVM 1 | 1 vCPU, 4 GB, 50 GB NVMe, 4 TB traffic | $6.49/month | $155.76 | $11.99/month |
| KVM 2 | 2 vCPU, 8 GB, 100 GB NVMe, 8 TB traffic | $8.79/month | $210.96 | $14.99/month |

- Free weekly backups and a 30-day money-back guarantee are included.
- **The "Black Friday" price is not special.** Review sites recorded the same 24-month prices in August and September 2026. Black Friday 2025 was lower ($4.99 and $5.99, term not stated), so there is no need to buy early.
- **Check the data centre list at checkout.** One review site lists only Boston and Phoenix (US) for Hostinger VPS, and no source confirms an India or Singapore location. A US server adds noticeable delay for users in Sri Lanka.
- Choose the **VPS** plans, not the web hosting plans (Premium, Business, Cloud), which can't run Docker or Postgres.

### Other VPS options

| Provider | Comparable plan | Price | Asia location | Notes |
|---|---|---:|---|---|
| DigitalOcean Droplet | 1 vCPU, 2 GB | $12/month, monthly | ✅ Bangalore, Singapore | Optional backups +20%. No long contract. |
| InterServer | 2 slices: 2 cores, 4 GB | $6/month, monthly | ❌ US only (New York, Dallas, Los Angeles) | No money-back guarantee, backups extra, no Black Friday deal |
| Hetzner | 2 vCPU, 4 GB (CX23) | about $7/month in Europe | Singapore (higher price) | Prices rose twice in 2026 and new orders are limited |

**Recommendation for the VPS:** Hostinger KVM 1 or KVM 2 **if** it offers an Asian data centre. If not, DigitalOcean in Bangalore or Singapore (2 GB, $12/month) is the safer choice for speed in Sri Lanka.

### Backups on a single VPS

One VPS is enough. The rule is that a copy of the database must live **outside** the VPS: a nightly encrypted `pg_dump` uploaded to Cloudflare R2, kept for 30 days, with a test restore once a month. The provider's weekly server backup is a useful second layer, but on its own it could lose up to a week of expenses.

## 7. Sources

- Vercel: [pricing](https://vercel.com/pricing), [terms (Hobby is non-commercial)](https://vercel.com/legal/terms), [fair-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)
- Cloudflare: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- Supabase: [pricing](https://supabase.com/pricing.md)
- Neon: [pricing](https://neon.com/pricing)
- Railway: [pricing plans](https://docs.railway.com/pricing/plans)
- Render (secondary): [Render vs Railway, Encore, Nov 2026](https://encore.dev/articles/render-vs-railway)
- DigitalOcean: [App Platform pricing](https://docs.digitalocean.com/products/app-platform/details/pricing/), [Droplet pricing](https://www.digitalocean.com/pricing/droplets), [Managed database pricing](https://www.digitalocean.com/pricing/managed-databases)
- Hostinger and InterServer: [Hostinger VPS pricing](https://www.hostinger.com/pricing/vps-hosting), [InterServer VPS](https://www.interserver.net/vps/)
- Hostinger price history (secondary): [FrontDeskReview](https://frontdeskreview.com/software/vps-hosting/hostinger-vps/), [Findstack](https://findstack.com/resources/hostinger-renewal-price), [BestUSAVPS](https://bestusavps.com/reviews/hostinger-vps/), [TechRadar Black Friday 2025](https://www.techradar.com/pro/website-hosting/best-black-friday-vps-deals-im-a-web-hosting-expert-and-these-are-the-top-offers-you-will-see-all-year)
- Hetzner (secondary): [Hetzner pricing 2026, AgentDeals](https://agentdeals.dev/hetzner-pricing-2026)
