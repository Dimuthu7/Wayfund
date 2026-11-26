import * as Sentry from "@sentry/nextjs";

/** Server start-up hook: error tracking is on only when SENTRY_DSN is set. */
export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.APP_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

export const onRequestError = Sentry.captureRequestError;
