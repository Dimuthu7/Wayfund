import { ArrowRight, Calculator, Receipt, Scale, WifiOff } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Calculator,
    title: "Plan the budget",
    text: "Fuel, stays, food and more, shared as a PDF.",
  },
  { icon: Receipt, title: "Track every spend", text: "Equal, percentage, exact or shares splits." },
  { icon: Scale, title: "Settle fairly", text: "The fewest payments to square everyone up." },
  { icon: WifiOff, title: "Works offline", text: "Add expenses without signal, sync later." },
];

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8">
      <header className="flex items-center justify-between">
        <Logo />
        <Button asChild variant="ghost" size="sm">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-8 py-10">
        <div className="grid gap-4">
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-balance">
            Plan the trip, track the spend, <span className="text-primary">split it fairly.</span>
          </h1>
          <p className="text-lg text-pretty text-muted-foreground">
            Wayfund keeps your group&apos;s trip money simple, from the first budget to the last
            settle-up.
          </p>
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href="/sign-in">
            Get started free <ArrowRight aria-hidden />
          </Link>
        </Button>

        <ul className="grid grid-cols-2 gap-3">
          {features.map(({ icon: Icon, title, text }) => (
            <li key={title} className="grid gap-2 rounded-2xl border bg-card p-4">
              <Icon className="size-6 text-primary" aria-hidden />
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </main>

      <footer className="text-center text-sm text-muted-foreground">Made in Sri Lanka 🇱🇰</footer>
    </div>
  );
}
