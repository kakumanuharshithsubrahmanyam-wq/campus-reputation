import { describe, expect, it } from "vitest";
import { Wallet, verifyMessage } from "ethers";
import { buildSignMessage } from "./auth.service.js";

describe("wallet auth message", () => {
  it("builds deterministic sign-in payload", () => {
    const msg = buildSignMessage("0xf2c2bc22de5df5e95f5bb27b65e53b569e83d918", "abc123");
    expect(msg).toContain("Campus Reputation sign-in");
    expect(msg).toContain("abc123");
    expect(msg).toContain("11155111");
  });

  it("verifyMessage recovers signer", async () => {
    const wallet = Wallet.createRandom();
    const nonce = "test-nonce";
    const message = buildSignMessage(wallet.address, nonce);
    const signature = await wallet.signMessage(message);
    const recovered = verifyMessage(message, signature);
    expect(recovered.toLowerCase()).toBe(wallet.address.toLowerCase());
  });
});
