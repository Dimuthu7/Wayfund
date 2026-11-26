import { Map, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireOnboardedUser } from "@/lib/auth/session";
import { countFriends } from "@/lib/friends/queries";

export const metadata: Metadata = { title: "Home" };

function greeting(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Colombo",
    }).format(now),
  );
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export default async function HomePage() {
  const user = await requireOnboardedUser("/home");
  const friends = await countFriends(user.id);
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="grid gap-6 pt-6">
      <header className="flex items-center gap-3">
        <Avatar name={user.name} src={user.image} />
        <div>
          <p className="text-sm text-muted-foreground">{greeting()}</p>
          <h1 className="text-2xl font-bold tracking-tight">Hi, {firstName}</h1>
        </div>
      </header>

      <EmptyState
        icon={Map}
        title="No trips yet"
        description="Trips arrive in the next update. Until then, add the friends you travel with."
      />

      {friends === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-4 pt-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/25 text-accent-foreground">
              <UserPlus className="size-5" aria-hidden />
            </span>
            <div className="flex-1">
              <p className="font-semibold">Add your travel crew</p>
              <p className="text-sm text-muted-foreground">
                Share your link or find friends by username.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/friends/add">Add</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
