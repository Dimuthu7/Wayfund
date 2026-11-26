# syntax=docker/dockerfile:1.7
# Wayfund production image: Next.js standalone server on Node 22, running as non-root.
# The same image runs locally (docker compose), on phones through a Cloudflare Tunnel,
# and on the production VPS.

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# ---- dependencies (cached unless the lockfile changes)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---- build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Browser-side keys are baked in at build time.
ARG NEXT_PUBLIC_SENTRY_DSN=""
ARG NEXT_PUBLIC_POSTHOG_KEY=""
ARG NEXT_PUBLIC_APP_ENV="production"
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
RUN --mount=type=secret,id=sentry_auth_token,required=false \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || true)" pnpm build

# ---- migrations: a one-shot image used by the `migrate` compose service
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY drizzle ./drizzle
COPY scripts ./scripts
USER node
CMD ["node_modules/.bin/tsx", "scripts/migrate.ts"]

# ---- runtime
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
# Run with an init process (compose `init: true` / `docker run --init`) for clean signals.
CMD ["node", "server.js"]
