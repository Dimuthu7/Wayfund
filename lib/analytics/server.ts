import "server-only";
import { after } from "next/server";
import { PostHog } from "posthog-node";
import { env } from "@/lib/env";
import type { AnalyticsEvent } from "./events";

let client: PostHog | null | undefined;

function posthog(): PostHog | null {
  if (client !== undefined) return client;
  const { POSTHOG_KEY, POSTHOG_HOST } = env();
  client = POSTHOG_KEY
    ? new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST, flushAt: 1, flushInterval: 0 })
    : null;
  return client;
}

/**
 * Records a product event for a user. Runs after the response is sent, never throws,
 * and does nothing when PostHog isn't configured. Never pass names, emails or amounts.
 */
export function track(
  userId: string,
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean | null>,
) {
  const ph = posthog();
  if (!ph) return;
  const send = async () => {
    try {
      ph.capture({ distinctId: userId, event, properties });
      await ph.flush();
    } catch (error) {
      console.warn("analytics: failed to send", event, error);
    }
  };
  try {
    after(send);
  } catch {
    // Outside a request (scripts, tests): send directly.
    void send();
  }
}
