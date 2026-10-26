import { describe, expect, it } from "vitest";
import { isValidAddress, normalizeAddress } from "./address.js";

describe("address utils", () => {
  it("validates checksummed addresses", () => {
    expect(isValidAddress("0xF2c2bC22de5df5e95F5bB27b65E53b569E83d918")).toBe(true);
    expect(isValidAddress("not-an-address")).toBe(false);
  });

  it("normalizes to lowercase storage form", () => {
    const n = normalizeAddress("0xF2c2bC22de5df5e95F5bB27b65E53b569E83d918");
    expect(n).toBe("0xf2c2bc22de5df5e95f5bb27b65e53b569e83d918");
  });
});
