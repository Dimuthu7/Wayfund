import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

const MAIL_DIR = ".data/mail";

export function uniqueEmail(name: string) {
  return `${name}.${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;
}

/** Waits for the sign-in email written by the log transport and returns its link. */
export async function magicLinkFor(email: string): Promise<string> {
  const file = path.join(MAIL_DIR, `${email}.txt`);
  let text = "";
  await expect
    .poll(
      async () => {
        text = await readFile(file, "utf8").catch(() => "");
        return text;
      },
      { timeout: 10_000 },
    )
    .toContain("http");
  await rm(file, { force: true });
  const link = text.match(/https?:\/\/\S+/)?.[0];
  if (!link) throw new Error(`No link in email for ${email}`);
  return link;
}

/** Signs in with an email link from the current page (which must show the email form). */
export async function signInByEmail(page: Page, email: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: /email me a sign-in link/i }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  const link = await magicLinkFor(email);
  await page.goto(link);
  return link;
}

export async function completeOnboarding(page: Page, name: string, username: string) {
  await expect(page.getByRole("heading", { name: "Set up your profile" })).toBeVisible();
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Username").fill(username);
  await expect(page.getByLabel("Available")).toBeVisible();
  await expect(page.getByLabel("Currency")).toHaveValue("LKR");
  await page.getByRole("button", { name: "Let's go" }).click();
}
