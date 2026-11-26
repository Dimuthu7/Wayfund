import { z } from "zod";
import { isCurrencyCode } from "@/lib/money";
import { isCountryCode } from "./countries";

/** Shared by the browser (instant feedback) and the server (the real check). */

export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "support",
  "help",
  "wayfund",
  "system",
  "api",
  "app",
  "settings",
  "profile",
  "friends",
  "trips",
  "home",
  "invite",
  "share",
  "sign_in",
  "signin",
  "login",
  "logout",
  "null",
  "undefined",
  "me",
  "you",
  "official",
  "staff",
  "team",
]);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use at least 3 characters")
  .max(20, "Use 20 characters or fewer")
  .regex(/^[a-z0-9_]+$/, "Use only letters, numbers and underscores")
  .refine((v) => !RESERVED_USERNAMES.has(v), "That username isn't available");

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your name")
  .max(50, "Use 50 characters or fewer")
  .refine((v) => !/[<>]/.test(v), "Remove < and > from your name");

export const profileSchema = z.object({
  name: displayNameSchema,
  username: usernameSchema,
  country: z.string().refine(isCountryCode, "Choose a country"),
  defaultCurrency: z.string().refine(isCurrencyCode, "Choose a currency"),
});

export type ProfileInput = z.infer<typeof profileSchema>;

/** A starting username from a name or email: "Amal Perera" -> "amal_perera". */
export function suggestUsername(source: string | null | undefined): string {
  const base = (source ?? "")
    .split("@")[0]!
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 16);
  return base.length >= 3 ? base : `traveller${base}`.slice(0, 16);
}

export type FieldErrors = Partial<Record<keyof ProfileInput | "form" | "image", string>>;

export function flattenErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = (issue.path[0] as keyof FieldErrors | undefined) ?? "form";
    out[key] ??= issue.message;
  }
  return out;
}
