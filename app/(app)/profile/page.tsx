import { ChevronRight, KeyRound, LogOut, UserPen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/auth/session";
import { signOutAction } from "./actions";

export const metadata: Metadata = { title: "Profile" };

const links = [
  { href: "/profile/edit", label: "Edit profile", icon: UserPen },
  { href: "/profile/sign-in-methods", label: "Sign-in methods", icon: KeyRound },
] as const;

export default async function ProfilePage() {
  const user = await requireOnboardedUser("/profile");
  return (
    <>
      <PageHeader title="Profile" />
      <div className="grid gap-6">
        <section className="flex items-center gap-4">
          <Avatar name={user.name} src={user.image} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-xl font-bold">{user.name}</p>
            <p className="truncate text-muted-foreground">@{user.username}</p>
            <p className="text-sm text-muted-foreground">
              {user.defaultCurrency} · {user.country}
            </p>
          </div>
        </section>

        <nav aria-label="Profile settings">
          <ul className="divide-y rounded-2xl border bg-card">
            {links.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="flex h-14 items-center gap-3 px-4 hover:bg-muted/60">
                  <Icon className="size-5 text-muted-foreground" aria-hidden />
                  <span className="flex-1 font-medium">{label}</span>
                  <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="appearance" className="grid gap-2">
          <h2 id="appearance" className="text-sm font-semibold text-muted-foreground">
            Appearance
          </h2>
          <ThemeToggle />
        </section>

        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="w-full">
            <LogOut aria-hidden /> Sign out
          </Button>
        </form>
      </div>
    </>
  );
}
