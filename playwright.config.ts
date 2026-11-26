import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests on a 360 px phone viewport against a production build.
 * Needs a migrated database: E2E_DATABASE_URL (default: local wayfund_e2e).
 * Magic links are written to .data/mail by the log email transport.
 */
const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 360, height: 740 },
        launchOptions: process.env.PW_CHROMIUM_PATH
          ? { executablePath: process.env.PW_CHROMIUM_PATH }
          : {},
      },
    },
  ],
  webServer: {
    command: `pnpm exec next start -p ${port}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      DATABASE_URL:
        process.env.E2E_DATABASE_URL ?? "postgres://wayfund:wayfund@localhost:5432/wayfund_e2e",
      APP_URL: baseURL,
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-secret-not-for-production-use-0123456789",
      EMAIL_TRANSPORT: "log",
      EMAIL_LOG_DIR: ".data/mail",
    },
  },
});
