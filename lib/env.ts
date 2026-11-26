import "server-only";
import { z } from "zod";

/**
 * Server-side environment, validated once on first use.
 *
 * Optional integrations (OAuth providers, email, storage, error tracking, analytics)
 * switch themselves off when their variables are missing, so the app runs locally
 * with nothing but a database.
 */
const optional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  /** Base URL of the app, used in emails and invite links. */
  APP_URL: z.string().url().default("http://localhost:3000"),

  AUTH_SECRET: optional,
  AUTH_GOOGLE_ID: optional,
  AUTH_GOOGLE_SECRET: optional,
  AUTH_FACEBOOK_ID: optional,
  AUTH_FACEBOOK_SECRET: optional,
  AUTH_RESEND_KEY: optional,
  EMAIL_FROM: z.string().default("Wayfund <hello@wayfund.app>"),
  /**
   * "log" writes emails to the server log (and to EMAIL_LOG_DIR when set) instead of sending
   * them. Defaults to "log" when there is no Resend key, except in production.
   */
  EMAIL_TRANSPORT: z.enum(["resend", "log"]).optional(),
  EMAIL_LOG_DIR: optional,

  S3_ENDPOINT: optional,
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: optional,
  S3_ACCESS_KEY_ID: optional,
  S3_SECRET_ACCESS_KEY: optional,

  SENTRY_DSN: optional,
  POSTHOG_KEY: optional,
  POSTHOG_HOST: z.string().url().default("https://eu.i.posthog.com"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  if (parsed.data.NODE_ENV === "production" && !parsed.data.AUTH_SECRET) {
    throw new Error("AUTH_SECRET must be set in production");
  }
  cached = parsed.data;
  return cached;
}

export const features = {
  google: () => Boolean(env().AUTH_GOOGLE_ID && env().AUTH_GOOGLE_SECRET),
  facebook: () => Boolean(env().AUTH_FACEBOOK_ID && env().AUTH_FACEBOOK_SECRET),
  /** Where emails go: Resend, or the server log for local development and tests. */
  emailTransport: (): "resend" | "log" | "none" => {
    const { EMAIL_TRANSPORT, AUTH_RESEND_KEY, NODE_ENV } = env();
    if (EMAIL_TRANSPORT === "log") return "log";
    if (AUTH_RESEND_KEY) return "resend";
    return NODE_ENV === "production" ? "none" : "log";
  },
  storage: () =>
    Boolean(
      env().S3_ENDPOINT && env().S3_BUCKET && env().S3_ACCESS_KEY_ID && env().S3_SECRET_ACCESS_KEY,
    ),
};
