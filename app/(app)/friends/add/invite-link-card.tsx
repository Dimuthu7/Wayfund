"use client";

import { Copy, RefreshCw, Share2 } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { inviteLinkShared, resetInviteLink } from "../actions";

/** Personal invite link with native share on phones and copy elsewhere (E2-3). */
export function InviteLinkCard({ url, name }: { url: string; name: string }) {
  const [pending, startTransition] = useTransition();

  async function share() {
    const data = { title: "Add me on Wayfund", text: `Add ${name} as a friend on Wayfund`, url };
    try {
      if (navigator.share && navigator.canShare?.(data)) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
      void inviteLinkShared();
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") toast.error("Couldn't share the link");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your invite link</CardTitle>
        <CardDescription>Anyone who opens it can add you as a friend in one tap.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="truncate rounded-xl bg-muted px-3 py-2.5 font-mono text-sm" title={url}>
          {url}
        </p>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button onClick={share}>
            <Share2 aria-hidden /> Share link
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Copy link"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              toast.success("Link copied");
            }}
          >
            <Copy aria-hidden />
          </Button>
        </div>
        <Button
          variant="link"
          size="sm"
          className="justify-self-start px-0 text-muted-foreground"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await resetInviteLink();
              if (result.ok) toast.success("New link created. The old one no longer works.");
              else toast.error(result.error);
            })
          }
        >
          <RefreshCw aria-hidden /> Create a new link
        </Button>
      </CardContent>
    </Card>
  );
}
