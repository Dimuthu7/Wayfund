import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env, features } from "@/lib/env";

export type Email = { to: string; subject: string; html: string; text: string };

/**
 * Sends an email through Resend. For local development and end-to-end tests
 * (EMAIL_TRANSPORT=log, or no Resend key outside production) the email is written to the
 * server log, and to EMAIL_LOG_DIR/<address>.txt when that is set.
 */
export async function sendEmail(email: Email): Promise<void> {
  const transport = features.emailTransport();
  if (transport === "none") throw new Error("Email delivery is not configured (AUTH_RESEND_KEY)");
  if (transport === "log") {
    console.info(`\n[email] To: ${email.to}\n[email] Subject: ${email.subject}\n${email.text}\n`);
    const dir = env().EMAIL_LOG_DIR;
    if (dir) {
      await mkdir(dir, { recursive: true });
      const file = path.join(dir, `${email.to.replace(/[^a-z0-9@._-]/gi, "_")}.txt`);
      await writeFile(file, email.text);
    }
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env().AUTH_RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env().EMAIL_FROM, ...email }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }
}
