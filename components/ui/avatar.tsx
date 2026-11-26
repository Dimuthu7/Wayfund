import { cn, initials } from "@/lib/utils";

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl",
};

/** Hue from the name, so people keep the same colour everywhere. */
function hue(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

/**
 * Round avatar with a photo or coloured initials. Decorative by default, because the name
 * is almost always shown next to it; pass `labelled` when it stands alone.
 */
export function Avatar({
  name,
  src,
  size = "md",
  className,
  labelled = false,
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
  labelled?: boolean;
}) {
  const label = name ?? "Unknown";
  return (
    <span
      aria-hidden={labelled ? undefined : true}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? label : undefined}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold select-none",
        sizes[size],
        className,
      )}
      style={
        src
          ? undefined
          : {
              backgroundColor: `oklch(0.85 0.08 ${hue(label)})`,
              color: `oklch(0.3 0.08 ${hue(label)})`,
            }
      }
    >
      {src ? (
        // Avatars are tiny and come from several hosts; a plain img avoids remote-pattern config.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials(label)
      )}
    </span>
  );
}
