"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "./actions";

/**
 * "Add friend" for a signed-in visitor. When they arrive back from sign-in (`auto`), the
 * request is made for them, as promised on the page before they signed in.
 */
export function AcceptButton({
  token,
  name,
  auto,
}: {
  token: string;
  name: string;
  auto: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<{ done?: boolean; error?: string }>({});
  const started = useRef(false);

  const accept = () =>
    startTransition(async () => {
      const result = await acceptInvite(token);
      setState(result.ok ? { done: true } : { error: result.error });
    });

  useEffect(() => {
    if (auto && !started.current) {
      started.current = true;
      accept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  if (state.done) {
    return (
      <div className="grid gap-3" role="status">
        <p className="font-semibold text-positive">You and {name} are now friends.</p>
        <Button asChild size="lg">
          <Link href="/friends">See your friends</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button size="lg" onClick={accept} disabled={pending}>
        <UserPlus aria-hidden /> {pending ? "Adding…" : `Add ${name}`}
      </Button>
    </div>
  );
}
