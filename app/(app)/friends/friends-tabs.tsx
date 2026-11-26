import Link from "next/link";
import { cn } from "@/lib/utils";

export function FriendsTabs({
  active,
  requests,
}: {
  active: "friends" | "requests";
  requests: number;
}) {
  const tab = (href: string, label: string, isActive: boolean, badge?: number) => (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
        isActive ? "bg-card text-foreground shadow-xs" : "text-muted-foreground",
      )}
    >
      {label}
      {badge ? (
        <span className="rounded-full bg-accent px-1.5 text-xs text-accent-foreground">
          {badge}
        </span>
      ) : null}
    </Link>
  );
  return (
    <nav aria-label="Friends" className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
      {tab("/friends", "Friends", active === "friends")}
      {tab("/friends/requests", "Requests", active === "requests", requests)}
    </nav>
  );
}
