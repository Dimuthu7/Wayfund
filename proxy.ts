import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth check: people without a session cookie are sent to sign-in before any
 * rendering happens. This is only a fast path. Every page and server action still checks
 * the session in the Data Access Layer (lib/auth/session.ts).
 */
const SESSION_COOKIES = ["__Secure-authjs.session-token", "authjs.session-token"];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();
  const url = request.nextUrl.clone();
  const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = "/sign-in";
  url.search = `?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/home/:path*", "/trips/:path*", "/friends/:path*", "/profile/:path*", "/onboarding"],
};
