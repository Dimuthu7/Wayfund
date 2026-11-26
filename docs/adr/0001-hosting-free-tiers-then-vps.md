# 0001. Free plans for development, one Docker VPS for beta and production

- **Status:** Accepted (2026-11-26)
- **Context:** Wayfund is built by one developer on a tight budget. Supabase was the first idea, but production will be self-hosted, and a managed platform would have to be migrated away from later.

## Decision

- Develop and test on free plans: Neon Free Postgres, the app in Docker on the laptop shared through a Cloudflare Tunnel, and optional Cloudflare Workers Free preview links.
- From Sprint 7, run the beta and production on one VPS with Docker Compose: the Next.js standalone image, PostgreSQL 17, Caddy, a cron container and a backup container. Nightly encrypted `pg_dump` to Cloudflare R2.
- Use plain Postgres, Auth.js and S3-compatible storage (R2 in the cloud, SeaweedFS locally) so the same code runs everywhere.
- The Docker image is the source of truth. CI publishes it to GitHub Container Registry on every merge to `main`.

## Consequences

- Moving between Neon and the VPS is a dump and restore. No vendor SDKs in the code.
- Workers Free allows only 10 ms CPU per request, so heavy features (PDFs) are tested in Docker, not on previews.
- We operate the VPS ourselves: backups, updates and monitoring are our job (see [deployment costs](../05-deployment-costs.md)).
