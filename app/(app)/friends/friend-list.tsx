"use client";

import { Search, UserMinus, Users } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { remove } from "./actions";

type Friend = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  sharedTrips: number;
};

/** Friends sorted by name with instant search by name or username (E2-4), and remove (E2-5). */
export function FriendList({ friends }: { friends: Friend[] }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const [removing, setRemoving] = useState<Friend | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = deferred.trim().toLowerCase().replace(/^@/, "");
    if (!q) return friends;
    return friends.filter(
      (f) => f.name?.toLowerCase().includes(q) || f.username?.toLowerCase().includes(q),
    );
  }, [friends, deferred]);

  if (friends.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No friends yet"
        description="Share your invite link or find people by username or email."
        action={
          <Button asChild>
            <Link href="/friends/add">Add friends</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          aria-label="Search friends"
          placeholder="Search by name or username"
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No friends match “{query}”.
        </p>
      ) : (
        <ul aria-label="Your friends" className="divide-y rounded-2xl border bg-card">
          {visible.map((friend) => (
            <li key={friend.id} className="flex items-center gap-3 p-3">
              <Avatar name={friend.name} src={friend.image} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{friend.name ?? friend.username}</p>
                <p className="truncate text-sm text-muted-foreground">
                  @{friend.username} · {friend.sharedTrips}{" "}
                  {friend.sharedTrips === 1 ? "shared trip" : "shared trips"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${friend.name ?? friend.username}`}
                onClick={() => setRemoving(friend)}
              >
                <UserMinus aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <BottomSheet
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.name ?? "friend"}?`}
        description="You'll stay together in shared trips. Expenses and balances don't change."
      >
        <div className="grid gap-2 pt-2">
          <Button
            variant="destructive"
            size="lg"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (!removing) return;
                const result = await remove(removing.id);
                if (result.ok) toast.success(`${removing.name ?? "Friend"} removed`);
                else toast.error(result.error);
                setRemoving(null);
              })
            }
          >
            Remove friend
          </Button>
          <Button variant="ghost" size="lg" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
