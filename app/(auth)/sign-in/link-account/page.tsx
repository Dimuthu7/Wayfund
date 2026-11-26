import { Link2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPendingLink, maskEmail } from "@/lib/auth/linking";
import { EmailForm } from "../email-form";

export const metadata: Metadata = { title: "Confirm it's you" };

const NAMES: Record<string, string> = { google: "Google", facebook: "Facebook" };

export default function LinkAccountPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72" />}>
      <LinkAccount />
    </Suspense>
  );
}

async function LinkAccount() {
  const pending = await getPendingLink();
  if (!pending) {
    return (
      <div className="grid gap-4 text-center">
        <h1 className="text-2xl font-bold">This link has expired</h1>
        <Button asChild>
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    );
  }
  const name = NAMES[pending.provider] ?? pending.provider;
  return (
    <div className="grid gap-6">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <Link2 className="size-7" aria-hidden />
      </span>
      <div className="grid gap-2">
        <h1 className="text-2xl font-bold">You already have an account</h1>
        <p className="text-muted-foreground">
          {maskEmail(pending.email)} already uses Wayfund. To keep everything in one account,
          confirm it&apos;s you, then {name} will be linked to it.
        </p>
      </div>
      <EmailForm
        defaultEmail={pending.email}
        callbackUrl={`/profile/sign-in-methods?link=${encodeURIComponent(pending.provider)}`}
        submitLabel="Email me a confirmation link"
      />
      <Button asChild variant="ghost">
        <Link href="/sign-in">Cancel</Link>
      </Button>
    </div>
  );
}
