"use client";

import { useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { remove, respond } from "../actions";

type Person = { id: string; name: string | null; username: string | null; image: string | null };

function Row({ person, children }: { person: Person; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 p-3">
      <Avatar name={person.name} src={person.image} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{person.name ?? person.username}</p>
        <p className="truncate text-sm text-muted-foreground">@{person.username}</p>
      </div>
      <div className="flex shrink-0 gap-1">{children}</div>
    </li>
  );
}

export function RequestList({ incoming, outgoing }: { incoming: Person[]; outgoing: Person[] }) {
  const [pending, startTransition] = useTransition();
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, success?: string) =>
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) toast.error(result.error ?? "Something went wrong");
      else if (success) toast.success(success);
    });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {incoming.length > 0 ? (
        <section aria-labelledby="incoming" className="grid gap-2">
          <h2 id="incoming" className="text-sm font-semibold text-muted-foreground">
            Waiting for you
          </h2>
          <ul className="divide-y rounded-2xl border bg-card">
            {incoming.map((p) => (
              <Row key={p.id} person={p}>
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    act(() => respond(p.id, true), `You and ${p.name ?? p.username} are friends`)
                  }
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => act(() => respond(p.id, false))}
                >
                  Decline
                </Button>
              </Row>
            ))}
          </ul>
        </section>
      ) : null}
      {outgoing.length > 0 ? (
        <section aria-labelledby="outgoing" className="grid gap-2">
          <h2 id="outgoing" className="text-sm font-semibold text-muted-foreground">
            Sent by you
          </h2>
          <ul className="divide-y rounded-2xl border bg-card">
            {outgoing.map((p) => (
              <Row key={p.id} person={p}>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => act(() => remove(p.id), "Request cancelled")}
                >
                  Cancel
                </Button>
              </Row>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
