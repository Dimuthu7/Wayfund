"use client";

import { useActionState } from "react";
import { ProfileFields } from "@/components/profile/profile-fields";
import { Button } from "@/components/ui/button";
import { updateProfile, type ProfileState } from "../actions";

export function EditProfileForm(props: Omit<React.ComponentProps<typeof ProfileFields>, "errors">) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  return (
    <form action={action} className="grid gap-6" noValidate>
      <ProfileFields {...props} errors={state.errors} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
