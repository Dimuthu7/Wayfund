# 0005. Next.js 16 with Cache Components and Partial Prefetching

- **Status:** Accepted (2026-11-26)

## Decision

- Next.js 16 App Router, React 19, TypeScript strict (with `noUncheckedIndexedAccess`), built as `output: "standalone"` for the Docker image.
- `cacheComponents` and `partialPrefetching` are on. Static parts of each page are prerendered into an instant shell; anything that reads the session streams in behind a `<Suspense>` boundary (`loading.tsx` for the signed-in app).
- Mutations are server actions that re-check the session, validate input with zod, and call `refresh()` instead of path revalidation.
- Tailwind CSS v4 with design tokens in `app/globals.css` (light and dark), and shadcn-style components we own in `components/ui` (Radix primitives, vaul bottom sheet, sonner toasts). Fonts are bundled from the `geist` package, so builds need no network.

## Consequences

- Reading cookies outside a Suspense boundary is a build error, which keeps pages fast by default.
- The Next.js docs shipped in `node_modules/next/dist/docs` are the reference for this version (see `AGENTS.md`).
