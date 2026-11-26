/**
 * Currencies Wayfund supports. `exponent` is the number of minor-unit digits (ISO 4217).
 * LKR is the default. The MVP uses one base currency per trip; the list grows in Phase 2.
 */
export const CURRENCIES = {
  LKR: { name: "Sri Lankan rupee", exponent: 2 },
  USD: { name: "US dollar", exponent: 2 },
  EUR: { name: "Euro", exponent: 2 },
  GBP: { name: "British pound", exponent: 2 },
  INR: { name: "Indian rupee", exponent: 2 },
  AUD: { name: "Australian dollar", exponent: 2 },
  CAD: { name: "Canadian dollar", exponent: 2 },
  SGD: { name: "Singapore dollar", exponent: 2 },
  MYR: { name: "Malaysian ringgit", exponent: 2 },
  THB: { name: "Thai baht", exponent: 2 },
  AED: { name: "UAE dirham", exponent: 2 },
  MVR: { name: "Maldivian rufiyaa", exponent: 2 },
  NZD: { name: "New Zealand dollar", exponent: 2 },
  JPY: { name: "Japanese yen", exponent: 0 },
  KRW: { name: "South Korean won", exponent: 0 },
  KWD: { name: "Kuwaiti dinar", exponent: 3 },
} as const satisfies Record<string, { name: string; exponent: number }>;

export type CurrencyCode = keyof typeof CURRENCIES;

export const DEFAULT_CURRENCY: CurrencyCode = "LKR";

export function isCurrencyCode(code: string): code is CurrencyCode {
  return Object.hasOwn(CURRENCIES, code);
}

export function currencyExponent(code: CurrencyCode): number {
  return CURRENCIES[code].exponent;
}
