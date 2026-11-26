import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/money";

/**
 * Countries offered in onboarding and the profile, with the currency we suggest for each.
 * Sri Lanka comes first. Names come from Intl so they stay correct without a data file.
 */
const COUNTRY_CURRENCY: Record<string, string> = {
  LK: "LKR",
  IN: "INR",
  MV: "MVR",
  SG: "SGD",
  MY: "MYR",
  TH: "THB",
  AE: "AED",
  AU: "AUD",
  NZ: "NZD",
  GB: "GBP",
  US: "USD",
  CA: "CAD",
  JP: "JPY",
  KR: "KRW",
  KW: "KWD",
  QA: "USD",
  SA: "USD",
  OM: "USD",
  BH: "USD",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  IE: "EUR",
  AT: "EUR",
  BE: "EUR",
  FI: "EUR",
  PT: "EUR",
  GR: "EUR",
  CH: "EUR",
  SE: "EUR",
  NO: "EUR",
  DK: "EUR",
  PL: "EUR",
  CY: "EUR",
  MT: "EUR",
  IL: "USD",
  BD: "USD",
  PK: "USD",
  NP: "USD",
  ID: "USD",
  PH: "USD",
  VN: "USD",
  HK: "USD",
  CN: "USD",
  TW: "USD",
  ZA: "USD",
  KE: "USD",
  NG: "USD",
  EG: "USD",
  BR: "USD",
  MX: "USD",
  AR: "USD",
  TR: "EUR",
  RU: "USD",
  UA: "EUR",
};

export const COUNTRY_CODES = Object.keys(COUNTRY_CURRENCY);

export function isCountryCode(code: string): boolean {
  return Object.hasOwn(COUNTRY_CURRENCY, code);
}

export function suggestedCurrency(country: string): CurrencyCode {
  const code = COUNTRY_CURRENCY[country];
  return code && isCurrencyCode(code) ? code : DEFAULT_CURRENCY;
}

/** [{ code, name }] sorted by name, with Sri Lanka first. */
export function countryOptions(locale = "en"): { code: string; name: string }[] {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const list = COUNTRY_CODES.map((code) => ({ code, name: names.of(code) ?? code }));
  list.sort((a, b) => (a.code === "LK" ? -1 : b.code === "LK" ? 1 : a.name.localeCompare(b.name)));
  return list;
}
