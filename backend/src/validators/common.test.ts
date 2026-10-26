import { describe, expect, it } from "vitest";
import { evidenceUrlSchema } from "./common.js";

describe("evidenceUrlSchema", () => {
  it("accepts https URLs", () => {
    expect(evidenceUrlSchema.safeParse("https://example.com/proof.pdf").success).toBe(true);
  });

  it("accepts ipfs URLs", () => {
    expect(evidenceUrlSchema.safeParse("ipfs://bafybeihash").success).toBe(true);
  });

  it("rejects javascript URLs", () => {
    expect(evidenceUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });
});
