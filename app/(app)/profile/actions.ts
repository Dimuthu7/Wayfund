"use server";

import { randomBytes } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { track } from "@/lib/analytics/server";
import { signIn, signOut } from "@/lib/auth";
import { clearPendingLink } from "@/lib/auth/linking";
import { requireOnboardedUser, requireUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { features } from "@/lib/env";
import { getProfile, saveProfile, setAvatar } from "@/lib/profile/server";
import { flattenErrors, profileSchema, type FieldErrors } from "@/lib/profile/validation";
import { deleteObject, putObject } from "@/lib/storage/s3";

export type ProfileState = { errors?: FieldErrors; saved?: boolean };

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireOnboardedUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: flattenErrors(parsed.error) };
  const result = await saveProfile(user.id, parsed.data);
  if (!result.ok) return { errors: { [result.field]: result.message } };
  track(user.id, "profile_updated");
  redirect("/profile");
}

const AVATAR_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** Detects the real image type from the first bytes, rather than trusting the browser. */
function sniffImage(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return "image/png";
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  return riff === "RIFF" && webp === "WEBP" ? "image/webp" : null;
}

const EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/** Profile photo upload (E1-5). The browser shrinks the photo to 256 px before sending. */
export async function uploadAvatar(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const user = await requireOnboardedUser();
  if (!features.storage()) return { ok: false, error: "Photo uploads aren't set up yet" };
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a photo" };
  if (file.size > MAX_AVATAR_BYTES) return { ok: false, error: "That photo is too large" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type || !AVATAR_TYPES.has(type))
    return { ok: false, error: "Use a JPEG, PNG or WebP photo" };

  const key = `avatars/${user.id}/${randomBytes(8).toString("hex")}.${EXT[type]}`;
  await putObject(key, bytes, type);
  const previous = (await getProfile(user.id))?.image;
  await setAvatar(user.id, `/media/${key}`);
  if (previous?.startsWith(`/media/avatars/${user.id}/`)) {
    await deleteObject(previous.slice("/media/".length)).catch(() => {});
  }
  refresh();
  return { ok: true };
}

export async function removeAvatar() {
  const user = await requireOnboardedUser();
  const previous = (await getProfile(user.id))?.image;
  await setAvatar(user.id, null);
  if (previous?.startsWith(`/media/avatars/${user.id}/`) && features.storage()) {
    await deleteObject(previous.slice("/media/".length)).catch(() => {});
  }
  refresh();
}

/* ------------------------------------------------------------ sign-in methods (E1-6) */

const provider = z.enum(["google", "facebook"]);

/** Starts the provider flow while signed in; Auth.js links the account to this user. */
export async function linkProvider(formData: FormData) {
  await requireUser();
  const p = provider.parse(formData.get("provider"));
  await clearPendingLink();
  await signIn(p, { redirectTo: `/profile/sign-in-methods?linked=${p}` });
}

export async function unlinkProvider(formData: FormData) {
  const user = await requireUser();
  const p = provider.parse(formData.get("provider"));
  const profile = await getProfile(user.id);
  const [linked] = await db
    .select({ n: count() })
    .from(schema.accounts)
    .where(eq(schema.accounts.userId, user.id));
  // Email sign-in always works when the account has an email, so it counts as a method.
  const methods = (linked?.n ?? 0) + (profile?.email ? 1 : 0);
  if (methods <= 1) return;
  await db
    .delete(schema.accounts)
    .where(and(eq(schema.accounts.userId, user.id), eq(schema.accounts.provider, p)));
  refresh();
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
