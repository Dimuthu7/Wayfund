import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/layout/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth/session";
import { relationshipWith } from "@/lib/friends/queries";
import { getFriendInvite } from "@/lib/friends/service";
import { AcceptButton } from "./accept-button";

export const metadata: Metadata = {
  title: "Add a friend",
  robots: { index: false, follow: false },
};

export default function InvitePage({ params, searchParams }: PageProps<"/invite/[token]">) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8">
      <header>
        <Link href="/" aria-label="Wayfund home" className="inline-flex">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 flex-col justify-center py-8">
        <Suspense fallback={<Skeleton className="h-64" />}>
          <Invite params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function Invite({ params, searchParams }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const { accept } = await searchParams;
  const inviter = await getFriendInvite(token);

  if (!inviter) {
    return (
      <div className="grid gap-4 text-center">
        <h1 className="text-2xl font-bold">This invite link has expired</h1>
        <p className="text-muted-foreground">Ask your friend to share their latest link.</p>
        <Button asChild variant="outline">
          <Link href="/">Go to Wayfund</Link>
        </Button>
      </div>
    );
  }

  const name = inviter.name ?? inviter.username ?? "your friend";
  const session = await getSession();
  const returnTo = `/invite/${token}?accept=1`;
  // New people finish their profile first, then come back here and the add happens for them.
  if (session?.user && !session.user.onboarded) {
    redirect(`/onboarding?callbackUrl=${encodeURIComponent(returnTo)}`);
  }
  const relationship = session?.user ? await relationshipWith(session.user.id, inviter.id) : "none";

  return (
    <div className="grid justify-items-center gap-6 text-center">
      <Avatar name={inviter.name} src={inviter.image} size="xl" />
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold">{name} invited you to Wayfund</h1>
        {inviter.username ? <p className="text-muted-foreground">@{inviter.username}</p> : null}
        <p className="mt-2 text-muted-foreground">
          Plan trips together, track what you spend and settle up fairly.
        </p>
      </div>
      <div className="w-full">
        {!session?.user ? (
          <Button asChild size="lg" className="w-full">
            <Link href={`/sign-in?callbackUrl=${encodeURIComponent(returnTo)}`}>
              Sign in to add {name}
            </Link>
          </Button>
        ) : relationship === "self" ? (
          <p className="text-muted-foreground">
            This is your own invite link. Share it with friends.
          </p>
        ) : relationship === "friends" ? (
          <Button asChild size="lg" className="w-full">
            <Link href="/friends">You&apos;re already friends</Link>
          </Button>
        ) : (
          <AcceptButton token={token} name={name} auto={accept === "1"} />
        )}
      </div>
    </div>
  );
}
