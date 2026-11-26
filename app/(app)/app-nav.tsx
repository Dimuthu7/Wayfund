import { BottomNav } from "@/components/layout/bottom-nav";
import { AnalyticsIdentify } from "@/lib/analytics/identify";
import { getSession } from "@/lib/auth/session";
import { countIncomingRequests } from "@/lib/friends/queries";

/** Bottom navigation with the pending friend request count; streams in after the page. */
export async function AppNav() {
  const session = await getSession();
  if (!session?.user) return <BottomNav />;
  const requests = await countIncomingRequests(session.user.id);
  return (
    <>
      <BottomNav badges={{ "/friends": requests }} />
      <AnalyticsIdentify userId={session.user.id} />
    </>
  );
}
