"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRef, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { removeAvatar, uploadAvatar } from "../actions";

const SIZE = 256;

/** Crops to a centred square and shrinks to 256 px WebP, so uploads are tiny on mobile data. */
async function toSquareWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed"))),
      "image/webp",
      0.85,
    ),
  );
}

export function AvatarPicker({
  name,
  image,
  uploadsEnabled,
}: {
  name: string | null;
  image: string | null;
  uploadsEnabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} src={image} size="xl" />
      <div className="grid gap-2">
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Choose a profile photo"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            startTransition(async () => {
              try {
                const form = new FormData();
                form.set("photo", await toSquareWebp(file), "avatar.webp");
                const result = await uploadAvatar(form);
                if (result.ok) toast.success("Photo updated");
                else toast.error(result.error);
              } catch {
                toast.error("We couldn't read that photo");
              }
            });
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!uploadsEnabled || pending}
          onClick={() => input.current?.click()}
        >
          <Camera aria-hidden /> {pending ? "Uploading…" : "Change photo"}
        </Button>
        {image ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => removeAvatar())}
          >
            <Trash2 aria-hidden /> Remove photo
          </Button>
        ) : null}
        {!uploadsEnabled ? (
          <p className="text-xs text-muted-foreground">
            Photo uploads need storage to be configured.
          </p>
        ) : null}
      </div>
    </div>
  );
}
