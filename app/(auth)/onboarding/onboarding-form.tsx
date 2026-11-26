"use client";

import { useActionState } from "react";
import { ProfileFields } from "@/components/profile/profile-fields";
import { Button } from "@/components/ui/button";
import { completeOnboarding, type OnboardingState } from "./actions";

export function OnboardingForm({
  defaults,
  countries,
  callbackUrl,
}: {
  defaults: React.ComponentProps<typeof ProfileFields>["defaults"];
  countries: React.ComponentProps<typeof ProfileFields>["countries"];
  callbackUrl: string;
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    {},
  );
  return (
    <form action={action} className="grid gap-6" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <ProfileFields defaults={defaults} countries={countries} errors={state.errors} />
      {state.errors?.form ? (
        <p role="alert" className="text-sm text-destructive">
          {state.errors.form}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Let's go"}
      </Button>
    </form>
  );
}
