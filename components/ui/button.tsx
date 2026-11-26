import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-[color,background-color,box-shadow,transform] outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        accent: "bg-accent text-accent-foreground shadow-sm hover:bg-accent/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border bg-card shadow-xs hover:bg-muted",
        ghost: "hover:bg-muted",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Default and lg meet the 44 px minimum touch target.
      size: {
        default: "h-11 px-4",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-9 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
