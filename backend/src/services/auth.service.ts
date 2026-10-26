import { randomBytes } from "crypto";
import { verifyMessage } from "ethers";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { env } from "../config/env.js";
import { normalizeAddress } from "../utils/address.js";
import { AppError } from "../utils/errors.js";

export function buildSignMessage(address: string, nonce: string): string {
  return `Campus Reputation sign-in\nAddress: ${address}\nNonce: ${nonce}\nChain ID: ${env.CHAIN_ID}`;
}

export async function createNonce(address: string): Promise<{ nonce: string; message: string; expiresAt: Date }> {
  const normalized = normalizeAddress(address);
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + env.NONCE_TTL_MINUTES * 60 * 1000);

  await prisma.authNonce.create({
    data: { address: normalized, nonce, expiresAt },
  });

  return { nonce, message: buildSignMessage(normalized, nonce), expiresAt };
}

export async function verifyWalletSignature(
  address: string,
  signature: string,
): Promise<{ token: string; address: string }> {
  const normalized = normalizeAddress(address);

  const record = await prisma.authNonce.findFirst({
    where: {
      address: normalized,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new AppError("INVALID_SIGNATURE", "Nonce expired or not found", 401);
  }

  const message = buildSignMessage(normalized, record.nonce);
  let recovered: string;
  try {
    recovered = verifyMessage(message, signature).toLowerCase();
  } catch {
    throw new AppError("INVALID_SIGNATURE", "Invalid signature format", 401);
  }

  if (recovered !== normalized) {
    throw new AppError("INVALID_SIGNATURE", "Signature does not match address", 401);
  }

  await prisma.authNonce.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  const token = jwt.sign({ sub: normalized, type: "wallet" }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  return { token, address: normalized };
}

export type JwtPayload = { sub: string; type: string };

export function verifyJwt(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    throw new AppError("UNAUTHORIZED", "Invalid or expired session", 401);
  }
}
