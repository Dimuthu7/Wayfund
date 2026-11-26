import { ChevronLeft } from "lucide-react";
import Link from "next/link";

/** Sticky page title bar with an optional back link and trailing action. */
export function PageHeader({
  title,
  backHref,
  action,
}: {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-4 flex h-14 items-center gap-2 bg-background/90 px-4 backdrop-blur-md">
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Back"
          className="-ml-2 flex size-10 items-center justify-center rounded-full hover:bg-muted"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Link>
      ) : null}
      <h1 className="flex-1 truncate text-xl font-bold tracking-tight">{title}</h1>
      {action}
    </header>
  );
}
