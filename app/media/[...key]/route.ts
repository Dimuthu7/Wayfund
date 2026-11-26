import { Readable } from "node:stream";
import { features } from "@/lib/env";
import { getObject } from "@/lib/storage/s3";

/**
 * Serves stored media (profile photos) from S3/R2. Keys are random and immutable, so
 * responses are cached for a year. Only the avatars/ prefix is public.
 */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...key]">) {
  const { key } = await ctx.params;
  const path = key.join("/");
  if (!features.storage() || !/^avatars\/[0-9a-f-]{36}\/[0-9a-f]{16}\.(webp|jpg|png)$/.test(path)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const object = await getObject(path);
    if (!object.body) return new Response("Not found", { status: 404 });
    const body = Readable.toWeb(object.body as Readable) as ReadableStream;
    return new Response(body, {
      headers: {
        "Content-Type": object.contentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
