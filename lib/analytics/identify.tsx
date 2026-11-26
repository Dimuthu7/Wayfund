"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

/** Links browser analytics to the signed-in user by id only (no name or email). */
export function AnalyticsIdentify({ userId }: { userId: string }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.identify(userId);
  }, [userId]);
  return null;
}

export function resetAnalytics() {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.reset();
}
