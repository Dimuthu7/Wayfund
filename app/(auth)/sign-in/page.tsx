import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { enabledProviders } from "@/lib/auth";
import { getSession, safeCallbackUrl } from "@/lib/auth/session";
import { EmailForm } from "./email-form";
import { ProviderButtons } from "./provider-buttons";

export const metadata: Metadata = { title: "Sign in" };

/** Auth.js error codes we explain. Cancelling a provider screen shows no error (E1-1). */
const ERRORS: Record<string, string | null> = {
  Verification: "That sign-in link has expired or was already used. We can send you a new one.",
  OAuthAccountNotLinked:
    "That account is already linked to a different Wayfund account. Sign in with that one instead.",
  AccountNotLinked:
    "That account is already linked to a different Wayfund account. Sign in with that one instead.",
  AccessDenied: null,
  OAuthCallbackError: null,
  Configuration: "Sign-in isn't available right now. Please try again shortly.",
};

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome to Wayfund</h1>
        <p className="text-muted-foreground">
          Sign in or create your account. No passwords needed.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-56" />}>
        <SignInOptions searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SignInOptions({ searchParams }: Pick<PageProps<"/sign-in">, "searchParams">) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(
    typeof params.callbackUrl === "string" ? params.callbackUrl : undefined,
  );
  const session = await getSession();
  if (session?.user) redirect(session.user.onboarded ? callbackUrl : "/onboarding");

  const code = typeof params.error === "string" ? params.error : undefined;
  const error = code
    ? code in ERRORS
      ? ERRORS[code]
      : "Something went wrong. Please try again."
    : null;
  const providers = enabledProviders();
  const hasOAuth = providers.google || providers.facebook;

  return (
    <div className="grid gap-6">
      {error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <ProviderButtons
        google={providers.google}
        facebook={providers.facebook}
        callbackUrl={callbackUrl}
      />
      {hasOAuth ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or use your email
          <span className="h-px flex-1 bg-border" />
        </div>
      ) : null}
      <EmailForm
        callbackUrl={callbackUrl}
        submitLabel={code === "Verification" ? "Send a new link" : undefined}
      />
      <p className="text-center text-xs text-muted-foreground">
        By continuing you agree to the terms and privacy policy.
      </p>
    </div>
  );
}
