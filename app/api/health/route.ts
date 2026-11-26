import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/lib/db";

/** Liveness and database check for Docker, Caddy and uptime monitors. */
export async function GET() {
  await connection();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "error", database: "unreachable" }, { status: 503 });
  }
}
