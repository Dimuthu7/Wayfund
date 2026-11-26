import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireOnboardedUser } from "@/lib/auth/session";
import { features } from "@/lib/env";
import { countryOptions } from "@/lib/profile/countries";
import { AvatarPicker } from "./avatar-picker";
import { EditProfileForm } from "./edit-profile-form";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const user = await requireOnboardedUser("/profile/edit");
  return (
    <>
      <PageHeader title="Edit profile" backHref="/profile" />
      <div className="grid gap-8">
        <AvatarPicker name={user.name} image={user.image} uploadsEnabled={features.storage()} />
        <EditProfileForm
          countries={countryOptions()}
          defaults={{
            name: user.name ?? "",
            username: user.username ?? "",
            country: user.country,
            defaultCurrency: user.defaultCurrency,
          }}
        />
      </div>
    </>
  );
}
