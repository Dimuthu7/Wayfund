"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-center"
      richColors
      closeButton
      toastOptions={{ classNames: { toast: "rounded-xl" } }}
    />
  );
}
