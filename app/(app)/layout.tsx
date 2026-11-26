import { Suspense } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppNav } from "./app-nav";

/** Signed-in app shell: a phone-width column with the bottom navigation. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="mx-auto min-h-dvh max-w-lg px-4 pt-[env(safe-area-inset-top)] pb-[calc(var(--spacing-nav)+env(safe-area-inset-bottom)+1.5rem)]">
        {children}
      </div>
      <Suspense fallback={<BottomNav />}>
        <AppNav />
      </Suspense>
    </>
  );
}
