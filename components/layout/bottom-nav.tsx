"use client";

import { Home, Map, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/trips", label: "Trips", icon: Map },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
] as const;

/** Fixed bottom navigation for the signed-in app, sized for thumbs and safe areas. */
export function BottomNav({
  badges,
}: {
  badges?: Partial<Record<(typeof items)[number]["href"], number>>;
}) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-nav pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul className="mx-auto grid h-nav max-w-lg grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const badge = badges?.[href] ?? 0;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="size-6" strokeWidth={active ? 2.4 : 2} aria-hidden />
                  {badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] font-bold text-accent-foreground">
                      {badge > 9 ? "9+" : badge}
                      <span className="sr-only"> new</span>
                    </span>
                  ) : null}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
