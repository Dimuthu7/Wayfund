"use client";

import type * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom sheet (vaul), with drag-to-dismiss and focus trapping.
 * Usage: <BottomSheet trigger={<Button/>} title="..."> ... </BottomSheet>
 */
export function BottomSheet({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  className,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Drawer.Trigger asChild>{trigger}</Drawer.Trigger> : null}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] max-w-lg flex-col rounded-t-3xl border bg-popover text-popover-foreground outline-none",
            className,
          )}
        >
          <div aria-hidden className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
          <div className="grid gap-1 px-5 pt-4 pb-2">
            <Drawer.Title className="text-lg font-semibold">{title}</Drawer.Title>
            {description ? (
              <Drawer.Description className="text-sm text-muted-foreground">
                {description}
              </Drawer.Description>
            ) : (
              <Drawer.Description className="sr-only">{title}</Drawer.Description>
            )}
          </div>
          <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export const BottomSheetClose = Drawer.Close;
