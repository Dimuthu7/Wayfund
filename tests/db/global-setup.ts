import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/** Resets the test database and applies all migrations once before the DB test run. */
export default async function setup() {
  const url =
    process.env.TEST_DATABASE_URL ?? "postgres://wayfund:wayfund@localhost:5432/wayfund_test";
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await client.unsafe(`
      drop schema if exists drizzle cascade;
      drop schema if exists app cascade;
      drop schema if exists public cascade;
      create schema public;
    `);
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  } finally {
    await client.end();
  }
}
