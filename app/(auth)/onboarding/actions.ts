"use server";

import { redirect } from "next/navigation";
import { track } from "@/lib/analytics/server";
import { requireUser, safeCallbackUrl } from "@/lib/auth/session";
import { saveProfile } from "@/lib/profile/server";
import { flattenErrors, profileSchema, type FieldErrors } from "@/lib/profile/validation";

export type OnboardingState = { errors?: FieldErrors };

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: flattenErrors(parsed.error) };

  const result = await saveProfile(user.id, parsed.data, { completeOnboarding: true });
  if (!result.ok) return { errors: { [result.field]: result.message } };

  track(user.id, "onboarding_completed", {
    country: parsed.data.country,
    currency: parsed.data.defaultCurrency,
  });
  redirect(safeCallbackUrl(formData.get("callbackUrl")?.toString()));
}
