"use client";

import { Check, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Field, fieldA11y } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { CURRENCIES } from "@/lib/money";
import { suggestedCurrency } from "@/lib/profile/countries";
import type { FieldErrors } from "@/lib/profile/validation";
import { usernameSchema } from "@/lib/profile/validation";
import { checkUsername } from "./actions";

type Status = { state: "idle" | "checking" | "ok" | "error"; message?: string };

/**
 * Name, username (checked live), country and currency fields, shared by onboarding (E1-4)
 * and profile editing (E1-5). Picking a country suggests its currency until the person
 * picks a currency themselves.
 */
export function ProfileFields({
  defaults,
  countries,
  errors,
}: {
  defaults: { name: string; username: string; country: string; defaultCurrency: string };
  countries: { code: string; name: string }[];
  errors?: FieldErrors;
}) {
  const [username, setUsername] = useState(defaults.username);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [currency, setCurrency] = useState(defaults.defaultCurrency);
  const currencyTouched = useRef(false);
  const [, startTransition] = useTransition();
  const latest = useRef(0);

  useEffect(() => {
    const local = usernameSchema.safeParse(username);
    const id = ++latest.current;
    if (local.success && local.data === defaults.username) {
      startTransition(() => setStatus({ state: "idle" }));
      return;
    }
    if (!local.success) {
      startTransition(() =>
        setStatus(
          username
            ? { state: "error", message: local.error.issues[0]?.message }
            : { state: "idle" },
        ),
      );
      return;
    }
    startTransition(() => setStatus({ state: "checking" }));
    const timer = setTimeout(async () => {
      const result = await checkUsername(local.data);
      if (id !== latest.current) return; // a newer value is being checked
      setStatus(result.available ? { state: "ok" } : { state: "error", message: result.message });
    }, 350);
    return () => clearTimeout(timer);
  }, [username, defaults.username]);

  const usernameError = errors?.username ?? (status.state === "error" ? status.message : undefined);

  return (
    <div className="grid gap-5">
      <Field id="name" label="Your name" error={errors?.name}>
        <Input
          {...fieldA11y("name", errors?.name)}
          autoComplete="name"
          defaultValue={defaults.name}
          maxLength={50}
          required
        />
      </Field>

      <Field
        id="username"
        label="Username"
        error={usernameError}
        hint="Friends find you by this. Letters, numbers and _."
      >
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
            @
          </span>
          <Input
            {...fieldA11y("username", usernameError, true)}
            className="pr-10 pl-8"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={20}
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
          />
          <span className="absolute inset-y-0 right-3.5 flex items-center" aria-live="polite">
            {status.state === "checking" ? (
              <Loader2
                className="size-4 animate-spin text-muted-foreground"
                aria-label="Checking"
              />
            ) : status.state === "ok" ? (
              <Check className="size-4 text-positive" aria-label="Available" />
            ) : status.state === "error" ? (
              <X className="size-4 text-destructive" aria-label="Not available" />
            ) : null}
          </span>
        </div>
      </Field>

      <div className="grid gap-5">
        <Field id="country" label="Country" error={errors?.country}>
          <NativeSelect
            {...fieldA11y("country", errors?.country)}
            defaultValue={defaults.country}
            onChange={(e) => {
              if (!currencyTouched.current) setCurrency(suggestedCurrency(e.target.value));
            }}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="defaultCurrency" label="Currency" error={errors?.defaultCurrency}>
          <NativeSelect
            {...fieldA11y("defaultCurrency", errors?.defaultCurrency)}
            value={currency}
            onChange={(e) => {
              currencyTouched.current = true;
              setCurrency(e.target.value);
            }}
          >
            {Object.entries(CURRENCIES).map(([code, { name }]) => (
              <option key={code} value={code}>
                {code} · {name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
    </div>
  );
}
