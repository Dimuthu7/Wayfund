import { Map } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireOnboardedUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Trips" };

export default async function TripsPage() {
  await requireOnboardedUser("/trips");
  return (
    <>
      <PageHeader title="Trips" />
      <EmptyState
        icon={Map}
        title="Trips are coming next"
        description="Creating trips and inviting your group arrives in the next sprint."
      />
    </>
  );
}
