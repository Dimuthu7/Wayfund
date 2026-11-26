/** Pure helpers for auth flows (safe to unit test and to import anywhere). */

/** Only allows same-site relative paths as post-sign-in destinations (no open redirects). */
export function safeCallbackUrl(value: string | null | undefined, fallback = "/home"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}

/** "dimuthu@example.com" -> "d•••u@example.com", for showing which account to confirm. */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  if (local.length <= 2) return `${local[0] ?? ""}•••@${domain}`;
  return `${local[0]}•••${local.at(-1)}@${domain}`;
}
