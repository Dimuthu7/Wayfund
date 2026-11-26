import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser, safeCallbackUrl } from "@/lib/auth/session";
import { countryOptions, suggestedCurrency } from "@/lib/profile/countries";
import { suggestAvailableUsername } from "@/lib/profile/server";
import { suggestUsername } from "@/lib/profile/validation";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Set up your profile" };

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-primary">Almost there</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Set up your profile</h1>
        <p className="text-muted-foreground">This takes a few seconds. You can change it later.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Onboarding searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Onboarding({ searchParams }: Pick<PageProps<"/onboarding">, "searchParams">) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(
    typeof params.callbackUrl === "string" ? params.callbackUrl : undefined,
  );
  const user = await requireUser("/onboarding");
  if (user.onboarded) redirect(callbackUrl);

  const username =
    user.username ??
    (await suggestAvailableUsername(suggestUsername(user.name ?? user.email), user.id));
  const country = user.country || "LK";
  return (
    <OnboardingForm
      callbackUrl={callbackUrl}
      countries={countryOptions()}
      defaults={{
        name: user.name ?? "",
        username,
        country,
        defaultCurrency: user.defaultCurrency || suggestedCurrency(country),
      }}
    />
  );
}
