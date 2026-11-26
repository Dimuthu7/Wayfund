import type * as React from "react";
import { cn } from "@/lib/utils";

export const inputClassName =
  "flex h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 file:border-0 file:bg-transparent file:text-sm file:font-medium";

/** Text input. 16 px text stops iOS Safari zooming in on focus. */
export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input type={type} data-slot="input" className={cn(inputClassName, className)} {...props} />
  );
}

/** Native select: the best picker on phones, styled like the inputs. */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        inputClassName,
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23888%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] appearance-none bg-[length:16px] bg-[right_0.875rem_center] bg-no-repeat pr-10",
        className,
      )}
      {...props}
    />
  );
}
