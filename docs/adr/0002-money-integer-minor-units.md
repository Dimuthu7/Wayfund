# 0002. Money as integer minor units with largest-remainder rounding

- **Status:** Accepted (2026-11-26)
- **Context:** Splits and settlements must add up to the cent, or people stop trusting the app.

## Decision

- Store every amount as `bigint` minor units with an ISO 4217 code (LKR 12.50 is `1250 LKR`).
- In TypeScript, amounts are integer `number`s checked with `Number.isSafeInteger` (safe up to 9 × 10¹⁵ minor units). Drizzle reads `bigint` columns in `number` mode, so amounts serialise to JSON for server components and offline sync.
- Parse user input from the digit string, never through floating point (`lib/money`).
- Split any total with the largest-remainder method (`allocate`), so the parts always add up exactly. Ties go to the earliest member, so results are stable.
- Format with `Intl.NumberFormat`, passing decimal strings so large values keep full precision.

## Consequences

- `lib/money` has 100% coverage enforced in CI, plus property-based tests with fast-check.
- A future currency with more than 3 decimals only needs an entry in `CURRENCIES`.
