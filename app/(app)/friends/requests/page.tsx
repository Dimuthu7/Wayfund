import { Inbox } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireOnboardedUser } from "@/lib/auth/session";
import { listRequests } from "@/lib/friends/queries";
import { FriendsTabs } from "../friends-tabs";
import { RequestList } from "./request-list";

export const metadata: Metadata = { title: "Friend requests" };

export default async function RequestsPage() {
  const me = await requireOnboardedUser("/friends/requests");
  const { incoming, outgoing } = await listRequests(me.id);
  const strip = ({ id, name, username, image }: (typeof incoming)[number]) => ({
    id,
    name,
    username,
    image,
  });
  return (
    <>
      <PageHeader title="Friends" />
      <FriendsTabs active="requests" requests={incoming.length} />
      {incoming.length === 0 && outgoing.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests"
          description="Friend requests you get and send show up here."
        />
      ) : (
        <RequestList incoming={incoming.map(strip)} outgoing={outgoing.map(strip)} />
      )}
    </>
  );
}
