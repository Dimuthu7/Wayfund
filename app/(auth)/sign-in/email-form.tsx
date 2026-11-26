"use client";

import { Mail } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, fieldA11y } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signInWithEmail, type EmailSignInState } from "./actions";

export function EmailForm({
  callbackUrl,
  defaultEmail,
  submitLabel = "Email me a sign-in link",
}: {
  callbackUrl: string;
  defaultEmail?: string;
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState<EmailSignInState, FormData>(signInWithEmail, {
    email: defaultEmail,
  });
  return (
    <form action={action} className="grid gap-3" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Field id="email" label="Email" error={state.error}>
        <Input
          {...fieldA11y("email", state.error)}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@example.com"
          defaultValue={state.email}
          required
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        <Mail aria-hidden />
        {pending ? "Sending…" : submitLabel}
      </Button>
    </form>
  );
}
