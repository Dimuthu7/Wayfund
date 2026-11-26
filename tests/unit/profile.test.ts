import { describe, expect, it } from "vitest";
import { countryOptions, suggestedCurrency } from "@/lib/profile/countries";
import { profileSchema, suggestUsername, usernameSchema } from "@/lib/profile/validation";

describe("usernameSchema", () => {
  it("lowercases and trims", () => {
    expect(usernameSchema.parse("  Amal_99 ")).toBe("amal_99");
  });
  it.each(["ab", "a".repeat(21), "amal perera", "amal-p", "admin", "wayfund"])(
    "rejects %j",
    (v) => {
      expect(usernameSchema.safeParse(v).success).toBe(false);
    },
  );
});

describe("suggestUsername", () => {
  it.each([
    ["Amal Perera", "amal_perera"],
    ["dimuthu.c@example.com", "dimuthu_c"],
    ["José Álvarez", "jose_alvarez"],
    ["Li", "travellerli"],
    [null, "traveller"],
  ])("%j -> %j", (input, expected) => {
    const suggestion = suggestUsername(input);
    expect(suggestion).toBe(expected);
    expect(usernameSchema.safeParse(suggestion).success).toBe(true);
  });
});

describe("countries", () => {
  it("puts Sri Lanka first and suggests LKR for it", () => {
    expect(countryOptions()[0]).toEqual({ code: "LK", name: "Sri Lanka" });
    expect(suggestedCurrency("LK")).toBe("LKR");
    expect(suggestedCurrency("JP")).toBe("JPY");
    expect(suggestedCurrency("ZZ")).toBe("LKR");
  });
});

describe("profileSchema", () => {
  it("accepts a valid profile and rejects unknown codes", () => {
    const valid = { name: "Amal", username: "amal", country: "LK", defaultCurrency: "LKR" };
    expect(profileSchema.safeParse(valid).success).toBe(true);
    expect(profileSchema.safeParse({ ...valid, country: "XX" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...valid, defaultCurrency: "ABC" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...valid, name: "<script>" }).success).toBe(false);
  });
});
