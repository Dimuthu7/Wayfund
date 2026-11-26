import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <div className="grid justify-items-center gap-5 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
        <MailCheck className="size-8" aria-hidden />
      </span>
      <div className="grid gap-2">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-muted-foreground">
          We sent you a sign-in link. Open it on any device within 15 minutes. It works once.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Can&apos;t find it? Look in spam or promotions.
      </p>
      <Button asChild variant="outline">
        <Link href="/sign-in">Use a different email</Link>
      </Button>
    </div>
  );
}
