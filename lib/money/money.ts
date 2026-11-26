import { currencyExponent, type CurrencyCode } from "./currencies";

/**
 * Money helpers. Amounts are always integers in minor units (LKR 12.50 is 1250).
 * Floating point never touches an amount: parsing works on the digit string.
 */

export class MoneyError extends Error {
  override name = "MoneyError";
}

export function assertMinor(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(`Amount must be a safe integer of minor units, got ${value}`);
  }
}

/**
 * Parses what a person typed ("1,250.5", "1250", " 12.50 ") into minor units.
 * Returns null for empty or invalid input, or for more decimals than the currency allows.
 */
export function parseAmount(input: string, currency: CurrencyCode): number | null {
  const exponent = currencyExponent(currency);
  const cleaned = input.trim().replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  const match = /^(\d*)(?:\.(\d*))?$/.exec(cleaned);
  if (!match) return null;
  const whole = match[1]!; // group 1 always participates (possibly empty)
  const fraction = match[2] ?? "";
  if (whole === "" && fraction === "") return null;
  if (fraction.length > exponent) return null;
  const digits = (whole || "0") + fraction.padEnd(exponent, "0");
  const value = Number(digits.replace(/^0+(?=\d)/, ""));
  return Number.isSafeInteger(value) ? value : null;
}

/** Minor units to a plain decimal string without grouping, e.g. 125050 -> "1250.50". */
export function toDecimalString(minor: number, currency: CurrencyCode): string {
  assertMinor(minor);
  const exponent = currencyExponent(currency);
  const negative = minor < 0;
  const digits = Math.abs(minor)
    .toString()
    .padStart(exponent + 1, "0");
  const whole = exponent === 0 ? digits : digits.slice(0, -exponent);
  const fraction = exponent === 0 ? "" : `.${digits.slice(-exponent)}`;
  return `${negative ? "-" : ""}${whole}${fraction}`;
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: CurrencyCode, locale: string, compact: boolean) {
  const key = `${locale}|${currency}|${compact}`;
  let f = formatters.get(key);
  if (!f) {
    const exponent = currencyExponent(currency);
    f = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "code",
      minimumFractionDigits: compact ? 0 : exponent,
      maximumFractionDigits: exponent,
    });
    formatters.set(key, f);
  }
  return f;
}

/**
 * Formats minor units for display, e.g. 125050 LKR -> "LKR 1,250.50".
 * Uses the decimal string so large values never lose precision.
 */
export function formatMoney(
  minor: number,
  currency: CurrencyCode,
  { locale = "en-LK", compact = false }: { locale?: string; compact?: boolean } = {},
): string {
  const decimal = toDecimalString(minor, currency);
  // Intl accepts decimal strings exactly (as "string numeric literal"), avoiding float rounding.
  return formatter(currency, locale, compact)
    .format(decimal as unknown as number)
    .replace(/ /g, " ");
}

/**
 * Splits `total` into parts proportional to `weights` using the largest-remainder method,
 * so the parts always add up to exactly `total`. Ties go to the earliest index, which keeps
 * results stable. Used by the split engine and budget per-person estimates.
 */
export function allocate(total: number, weights: readonly number[]): number[] {
  assertMinor(total);
  if (weights.length === 0) throw new MoneyError("allocate needs at least one weight");
  if (weights.some((w) => !Number.isSafeInteger(w) || w < 0)) {
    throw new MoneyError("weights must be non-negative safe integers");
  }
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum === 0) throw new MoneyError("weights must not all be zero");

  const sign = total < 0 ? -1 : 1;
  const absTotal = BigInt(Math.abs(total));
  const sum = BigInt(weightSum);
  const base: bigint[] = [];
  const remainders: { index: number; remainder: bigint }[] = [];
  let allocated = 0n;
  weights.forEach((w, index) => {
    const exact = absTotal * BigInt(w);
    const share = exact / sum;
    base.push(share);
    allocated += share;
    remainders.push({ index, remainder: exact % sum });
  });
  let leftover = absTotal - allocated;
  remainders.sort((a, b) =>
    a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
  );
  for (const { index } of remainders) {
    if (leftover === 0n) break;
    base[index]! += 1n;
    leftover -= 1n;
  }
  return base.map((b) => (b === 0n ? 0 : sign * Number(b)));
}
