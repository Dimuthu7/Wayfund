import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

/**
 * Browser start-up hook. Error tracking and product analytics turn on only when their
 * public keys are set at build time (NEXT_PUBLIC_*).
 */
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
if (posthogKey) {
  posthog.init(posthogKey, {
    // Proxied through our own domain (see next.config.ts) so ad blockers don't drop events.
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://eu.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: "history_change",
    capture_pageleave: true,
    // Amounts and names are personal: never record session replays or input text.
    disable_session_recording: true,
    mask_all_text: true,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
