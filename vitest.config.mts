import { defineConfig } from "vitest/config";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? "postgres://wayfund:wayfund@localhost:5432/wayfund_test";

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts", "lib/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          env: { DATABASE_URL: testDatabaseUrl },
          include: ["tests/db/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/db/global-setup.ts"],
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 60_000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/db/schema.ts", "**/*.test.ts"],
      // Money logic must be fully covered (Definition of Done).
      thresholds: {
        "lib/money/**": { lines: 100, functions: 100, branches: 100, statements: 100 },
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
    alias: { "server-only": new URL("./tests/stubs/server-only.ts", import.meta.url).pathname },
  },
});
