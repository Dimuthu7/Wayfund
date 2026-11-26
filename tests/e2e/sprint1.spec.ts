import { expect, test } from "@playwright/test";
import { completeOnboarding, signInByEmail, uniqueEmail } from "./helpers";

/**
 * Sprint 1 demo: two people sign up on their phones and become friends through an
 * invite link.
 */
test("two people sign up and become friends through an invite link", async ({ browser }) => {
  const suffix = Date.now().toString(36).slice(-6);
  const amal = await (await browser.newContext()).newPage();
  const bimal = await (await browser.newContext()).newPage();

  // Amal signs up with an email link and finishes onboarding.
  await amal.goto("/home");
  await expect(amal).toHaveURL(/\/sign-in\?callbackUrl=%2Fhome/);
  const amalEmail = uniqueEmail("amal");
  const usedLink = await signInByEmail(amal, amalEmail);
  await completeOnboarding(amal, "Amal Perera", `amal_${suffix}`);
  await expect(amal.getByRole("heading", { name: "Hi, Amal" })).toBeVisible();

  // A used link can't sign in again, and says so (E1-3).
  const stranger = await (await browser.newContext()).newPage();
  await stranger.goto(usedLink);
  await expect(stranger.getByText(/expired or was already used/)).toBeVisible();
  await expect(stranger.getByRole("button", { name: "Send a new link" })).toBeVisible();

  // Amal copies the personal invite link.
  await amal.goto("/friends/add");
  const inviteUrl = (await amal.getByTitle(/\/invite\//).textContent())!.trim();
  expect(inviteUrl).toMatch(/\/invite\/[A-Za-z0-9_-]{22}$/);

  // Bimal opens it, signs up, and is added automatically after onboarding (E2-3).
  await bimal.goto(inviteUrl);
  await expect(
    bimal.getByRole("heading", { name: "Amal Perera invited you to Wayfund" }),
  ).toBeVisible();
  await bimal.getByRole("link", { name: "Sign in to add Amal Perera" }).click();
  await signInByEmail(bimal, uniqueEmail("bimal"));
  await completeOnboarding(bimal, "Bimal Silva", `bimal_${suffix}`);
  await expect(bimal.getByText("You and Amal Perera are now friends.")).toBeVisible();

  await bimal.getByRole("link", { name: "See your friends" }).click();
  await expect(
    bimal.getByRole("list", { name: "Your friends" }).getByText("Amal Perera"),
  ).toBeVisible();

  await amal.goto("/friends");
  await expect(
    amal.getByRole("list", { name: "Your friends" }).getByText("Bimal Silva"),
  ).toBeVisible();
  await expect(amal.getByText("0 shared trips")).toBeVisible();

  // Search the list (E2-4), then remove with confirmation (E2-5).
  await amal.getByLabel("Search friends").fill("zzz");
  await expect(amal.getByText(/No friends match/)).toBeVisible();
  await amal.getByLabel("Search friends").fill(`bimal_${suffix}`);
  await amal.getByRole("button", { name: "Remove Bimal Silva" }).click();
  await amal.getByRole("button", { name: "Remove friend" }).click();
  await expect(amal.getByText("No friends yet")).toBeVisible();
});

test("friend requests by username: send, see, accept (E2-1, E2-2)", async ({ browser }) => {
  const suffix = Date.now().toString(36).slice(-6);
  const chamari = await (await browser.newContext()).newPage();
  const dilan = await (await browser.newContext()).newPage();

  await chamari.goto("/sign-in");
  await signInByEmail(chamari, uniqueEmail("chamari"));
  await completeOnboarding(chamari, "Chamari Fernando", `chamari_${suffix}`);

  await dilan.goto("/sign-in");
  await signInByEmail(dilan, uniqueEmail("dilan"));
  await completeOnboarding(dilan, "Dilan Jaya", `dilan_${suffix}`);

  await dilan.goto("/friends/add");
  await dilan.getByLabel("Username or email").fill(`@chamari_${suffix}`);
  await dilan.getByRole("button", { name: "Search" }).click();
  const result = dilan.getByRole("group", { name: "Search result" });
  await expect(result.getByText("Chamari Fernando")).toBeVisible();
  await result.getByRole("button", { name: "Add" }).click();
  await expect(result.getByText("Request sent")).toBeVisible();

  await chamari.goto("/friends/requests");
  await expect(chamari.getByRole("heading", { name: "Waiting for you" })).toBeVisible();
  await chamari.getByRole("button", { name: "Accept" }).click();
  await expect(chamari.getByText("No requests")).toBeVisible();
  await chamari.goto("/friends");
  await expect(
    chamari.getByRole("list", { name: "Your friends" }).getByText("Dilan Jaya"),
  ).toBeVisible();
});

test("landing and sign-in pages work signed out", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("split it fairly");
  await page.getByRole("link", { name: /get started/i }).click();
  await expect(page.getByRole("heading", { name: "Welcome to Wayfund" })).toBeVisible();
  const response = await page.goto("/invite/not-a-real-token-123456");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "This invite link has expired" })).toBeVisible();
});
