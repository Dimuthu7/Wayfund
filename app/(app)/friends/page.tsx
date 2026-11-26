import { UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/auth/session";
import { countIncomingRequests, listFriends } from "@/lib/friends/queries";
import { FriendList } from "./friend-list";
import { FriendsTabs } from "./friends-tabs";

export const metadata: Metadata = { title: "Friends" };

export default async function FriendsPage() {
  const me = await requireOnboardedUser("/friends");
  const [friends, requests] = await Promise.all([listFriends(me.id), countIncomingRequests(me.id)]);
  return (
    <>
      <PageHeader
        title="Friends"
        action={
          <Button asChild size="sm">
            <Link href="/friends/add">
              <UserPlus aria-hidden /> Add
            </Link>
          </Button>
        }
      />
      <FriendsTabs active="friends" requests={requests} />
      <FriendList
        friends={friends.map((f) => ({
          id: f.id,
          name: f.name,
          username: f.username,
          image: f.image,
          sharedTrips: f.sharedTrips,
        }))}
      />
    </>
  );
}
