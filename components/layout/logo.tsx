import { cn } from "@/lib/utils";

/** Wayfund mark: a route line that bends into a coin. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M7 10.5 11 22l4-8 4 8 4-11.5"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      />
      <circle cx="24.5" cy="9" r="2.6" className="fill-accent" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-lg font-bold tracking-tight", className)}
    >
      <LogoMark />
      Wayfund
    </span>
  );
}
