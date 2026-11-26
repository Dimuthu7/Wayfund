import { describe, expect, it } from "vitest";
import { maskEmail, safeCallbackUrl } from "@/lib/auth/utils";

describe("safeCallbackUrl", () => {
  it.each([
    ["/friends", "/friends"],
    ["/invite/abc?accept=1", "/invite/abc?accept=1"],
    [undefined, "/home"],
    ["", "/home"],
    ["https://evil.example", "/home"],
    ["//evil.example", "/home"],
    ["/\\evil.example", "/home"],
    ["javascript:alert(1)", "/home"],
  ])("%j -> %j", (input, expected) => {
    expect(safeCallbackUrl(input)).toBe(expected);
  });
});

describe("maskEmail", () => {
  it("hides the middle of the local part", () => {
    expect(maskEmail("dimuthu@example.com")).toBe("d•••u@example.com");
    expect(maskEmail("ab@example.com")).toBe("a•••@example.com");
  });
});
