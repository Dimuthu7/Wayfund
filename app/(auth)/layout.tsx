import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8">
      <header>
        <Link href="/" aria-label="Wayfund home" className="inline-flex">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 flex-col justify-center py-8">{children}</main>
    </div>
  );
}
