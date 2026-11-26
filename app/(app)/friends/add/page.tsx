import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireOnboardedUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { getOrCreateFriendInvite } from "@/lib/friends/service";
import { InviteLinkCard } from "./invite-link-card";
import { PersonSearch } from "./person-search";

export const metadata: Metadata = { title: "Add friends" };

export default async function AddFriendsPage() {
  const me = await requireOnboardedUser("/friends/add");
  const token = await getOrCreateFriendInvite(me.id);
  return (
    <>
      <PageHeader title="Add friends" backHref="/friends" />
      <div className="grid gap-6">
        <InviteLinkCard url={`${env().APP_URL}/invite/${token}`} name={me.name ?? "your friend"} />
        <PersonSearch />
      </div>
    </>
  );
}
