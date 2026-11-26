import "server-only";
import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

function createClient() {
  const url = env().DATABASE_URL;
  // Transaction poolers (Neon's "-pooler" host, PgBouncer) don't support prepared statements.
  const pooled = /-pooler\.|pgbouncer=true/.test(url);
  return postgres(url, {
    max: env().NODE_ENV === "production" ? 10 : 5,
    prepare: !pooled,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });
}

const globalForDb = globalThis as unknown as { wayfundDb?: Database };

export function getDb(): Database {
  if (!globalForDb.wayfundDb) {
    globalForDb.wayfundDb = drizzle(createClient(), { schema, casing: "snake_case" });
  }
  return globalForDb.wayfundDb;
}

/**
 * The privileged connection. It is NOT subject to row-level security, so use it only for
 * auth (Auth.js adapter), public token lookups and system jobs. All user data access
 * goes through {@link withUser}.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

/**
 * Runs `fn` in a transaction as the restricted `wayfund_app` role with `app.user_id` set,
 * so Postgres row-level security policies apply to every query inside it.
 */
export async function withUser<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
    await tx.execute(sql`set local role wayfund_app`);
    return fn(tx);
  });
}

export { schema };
