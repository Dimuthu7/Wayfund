"use client";

import { Search } from "lucide-react";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { searchPeople, sendRequest } from "../actions";

type Found = Awaited<ReturnType<typeof searchPeople>>;
type Person = Extract<Found, { ok: true }>["data"];

const STATUS: Record<string, string> = {
  self: "That's you",
  friends: "Already friends",
  request_sent: "Request sent",
};

/** Find someone by exact username or email, then send a request (E2-1). */
export function PersonSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Person | undefined>(undefined);
  const [searching, startSearch] = useTransition();
  const [sending, startSend] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find by username or email</CardTitle>
        <CardDescription>Type their exact username or email address.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <form
          role="search"
          className="grid grid-cols-[1fr_auto] gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            startSearch(async () => {
              const found = await searchPeople(query);
              if (!found.ok) toast.error(found.error);
              setResult(found.ok ? found.data : null);
            });
          }}
        >
          <Input
            aria-label="Username or email"
            placeholder="@username or email"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Search"
            disabled={searching || query.trim().length < 3}
          >
            <Search aria-hidden />
          </Button>
        </form>

        <div aria-live="polite">
          {result === null ? (
            <p className="py-2 text-sm text-muted-foreground">
              No one found. Check the spelling, or share your invite link instead.
            </p>
          ) : result ? (
            <div
              role="group"
              aria-label="Search result"
              className="flex items-center gap-3 rounded-xl bg-muted/60 p-3"
            >
              <Avatar name={result.name} src={result.image} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{result.name}</p>
                <p className="truncate text-sm text-muted-foreground">@{result.username}</p>
              </div>
              {STATUS[result.relationship] ? (
                <span className="text-sm text-muted-foreground">{STATUS[result.relationship]}</span>
              ) : (
                <Button
                  size="sm"
                  disabled={sending}
                  onClick={() =>
                    startSend(async () => {
                      const sent = await sendRequest(result.id);
                      if (!sent.ok) return void toast.error(sent.error);
                      const accepted = sent.data === "accepted";
                      toast.success(
                        accepted ? `You and ${result.name} are friends` : "Request sent",
                      );
                      setResult({ ...result, relationship: accepted ? "friends" : "request_sent" });
                    })
                  }
                >
                  {result.relationship === "request_received" ? "Accept" : "Add"}
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
