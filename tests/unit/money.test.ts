import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { allocate, formatMoney, MoneyError, parseAmount, toDecimalString } from "@/lib/money";

describe("parseAmount", () => {
  it.each([
    ["1250", 125000],
    ["1,250.5", 125050],
    [" 12.50 ", 1250],
    [".5", 50],
    ["0.01", 1],
    ["7.", 700],
    ["0", 0],
  ])("parses %j for LKR", (input, expected) => {
    expect(parseAmount(input, "LKR")).toBe(expected);
  });

  it.each(["", "  ", "abc", "1.234", "-5", "1.2.3", ".", "1e5"])("rejects %j", (input) => {
    expect(parseAmount(input, "LKR")).toBeNull();
  });

  it("respects zero-decimal and three-decimal currencies", () => {
    expect(parseAmount("1500", "JPY")).toBe(1500);
    expect(parseAmount("1500.5", "JPY")).toBeNull();
    expect(parseAmount("1.234", "KWD")).toBe(1234);
  });

  it("rejects amounts beyond the safe integer range", () => {
    expect(parseAmount("99999999999999999999", "LKR")).toBeNull();
  });
});

describe("toDecimalString and formatMoney", () => {
  it("formats minor units without float error", () => {
    expect(toDecimalString(125050, "LKR")).toBe("1250.50");
    expect(toDecimalString(5, "LKR")).toBe("0.05");
    expect(toDecimalString(-5, "LKR")).toBe("-0.05");
    expect(toDecimalString(1500, "JPY")).toBe("1500");
    expect(formatMoney(125050, "LKR")).toBe("LKR 1,250.50");
    expect(formatMoney(125000, "LKR", { compact: true })).toBe("LKR 1,250");
    expect(formatMoney(5, "LKR")).toBe("LKR 0.05"); // cached formatter
    expect(formatMoney(150000, "JPY")).toBe("JPY 150,000");
  });

  it("round-trips through parseAmount", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e13 }), (minor) => {
        expect(parseAmount(toDecimalString(minor, "LKR"), "LKR")).toBe(minor);
      }),
    );
  });

  it("rejects non-integer minor units", () => {
    expect(() => toDecimalString(1.5, "LKR")).toThrow(MoneyError);
  });
});

describe("allocate (largest remainder)", () => {
  it("splits 100 three ways with the extra cent first", () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
  });

  it("handles the 40/40/20 example", () => {
    expect(allocate(300001, [40, 40, 20])).toEqual([120001, 120000, 60000]);
  });

  it("handles negative totals and zero weights", () => {
    expect(allocate(-100, [1, 1, 1])).toEqual([-34, -33, -33]);
    expect(allocate(100, [0, 1])).toEqual([0, 100]);
  });

  it("rejects invalid weights", () => {
    expect(() => allocate(100, [])).toThrow(MoneyError);
    expect(() => allocate(100, [0, 0])).toThrow(MoneyError);
    expect(() => allocate(100, [-1, 2])).toThrow(MoneyError);
    expect(() => allocate(100, [0.5, 2])).toThrow(MoneyError);
  });

  it("always sums to the total and stays within one unit of the exact share", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1e12, max: 1e12 }),
        fc
          .array(fc.integer({ min: 0, max: 10_000 }), { minLength: 1, maxLength: 30 })
          .filter((w) => w.some((x) => x > 0)),
        (total, weights) => {
          const parts = allocate(total, weights);
          expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
          const sum = weights.reduce((a, b) => a + b, 0);
          parts.forEach((part, i) => {
            const exact = (total * (weights[i] ?? 0)) / sum;
            expect(Math.abs(part - exact)).toBeLessThan(1 + 1e-6);
          });
        },
      ),
    );
  });
});
