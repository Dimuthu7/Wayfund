import { CheckCircle2, Mail } from "lucide-react";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { enabledProviders } from "@/lib/auth";
import { getPendingLink } from "@/lib/auth/linking";
import { requireUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { getProfile } from "@/lib/profile/server";
import { linkProvider, unlinkProvider } from "../actions";

export const metadata: Metadata = { title: "Sign-in methods" };

const NAMES = { google: "Google", facebook: "Facebook" } as const;

export default async function SignInMethodsPage({
  searchParams,
}: PageProps<"/profile/sign-in-methods">) {
  const user = await requireUser("/profile/sign-in-methods");
  const params = await searchParams;
  const [profile, accounts, pending] = await Promise.all([
    getProfile(user.id),
    db
      .select({ provider: schema.accounts.provider })
      .from(schema.accounts)
      .where(eq(schema.accounts.userId, user.id)),
    getPendingLink(),
  ]);
  const linked = new Set(accounts.map((a) => a.provider));
  const available = enabledProviders();
  const methodCount = linked.size + (profile?.email ? 1 : 0);
  // Arriving from the "confirm it's you" flow: offer to finish linking that provider.
  const finish =
    typeof params.link === "string" && params.link in NAMES && !linked.has(params.link)
      ? (params.link as keyof typeof NAMES)
      : pending && pending.provider in NAMES && !linked.has(pending.provider)
        ? (pending.provider as keyof typeof NAMES)
        : null;
  const justLinked =
    typeof params.linked === "string" && linked.has(params.linked) ? params.linked : null;

  return (
    <>
      <PageHeader title="Sign-in methods" backHref="/profile" />
      <div className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Link more ways to sign in so you never end up with two accounts.
        </p>

        {finish ? (
          <form
            action={linkProvider}
            className="grid gap-3 rounded-2xl border border-primary/40 bg-secondary p-4"
          >
            <p className="font-semibold">Thanks for confirming. Finish linking {NAMES[finish]}?</p>
            <input type="hidden" name="provider" value={finish} />
            <Button type="submit">Link {NAMES[finish]}</Button>
          </form>
        ) : null}
        {justLinked ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-xl bg-positive/10 p-3 text-sm font-medium text-positive"
          >
            <CheckCircle2 className="size-4" aria-hidden />{" "}
            {NAMES[justLinked as keyof typeof NAMES]} is linked.
          </p>
        ) : null}

        <ul className="divide-y rounded-2xl border bg-card">
          {profile?.email ? (
            <li className="flex items-center gap-3 p-4">
              <Mail className="size-5 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Email link</p>
                <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
              </div>
              <Badge variant="secondary">On</Badge>
            </li>
          ) : null}
          {(Object.keys(NAMES) as (keyof typeof NAMES)[])
            .filter((p) => available[p] || linked.has(p))
            .map((p) => (
              <li key={p} className="flex items-center gap-3 p-4">
                <span className="flex-1 font-medium">{NAMES[p]}</span>
                {linked.has(p) ? (
                  <form action={unlinkProvider}>
                    <input type="hidden" name="provider" value={p} />
                    <Button type="submit" variant="ghost" size="sm" disabled={methodCount <= 1}>
                      Unlink
                    </Button>
                  </form>
                ) : (
                  <form action={linkProvider}>
                    <input type="hidden" name="provider" value={p} />
                    <Button type="submit" variant="outline" size="sm">
                      Link
                    </Button>
                  </form>
                )}
              </li>
            ))}
        </ul>
      </div>
    </>
  );
}
