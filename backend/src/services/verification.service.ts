import { prisma } from "../db/prisma.js";
import { getProvider } from "../blockchain/provider.js";
import { env } from "../config/env.js";
import { normalizeAddress } from "../utils/address.js";
import { getStudentAggregate } from "./student.service.js";
import { getAchievementById } from "./achievement.service.js";
import { AppError } from "../utils/errors.js";

export async function verifyWallet(address: string) {
  const w = normalizeAddress(address);
  const aggregate = await getStudentAggregate(w);
  return {
    verified: true,
    network: "sepolia",
    chainId: env.CHAIN_ID,
    wallet: w,
    campBalance: aggregate.campBalance,
    reputationLevel: aggregate.reputationLevel,
    achievementCount: aggregate.achievementCount,
    verificationSource: "onchain",
    timestamp: new Date().toISOString(),
  };
}

export async function verifyTransaction(hash: string) {
  const provider = getProvider();
  const tx = await provider.getTransaction(hash);
  if (!tx) throw new AppError("NOT_FOUND", "Transaction not found", 404);
  const receipt = await provider.getTransactionReceipt(hash);
  const achievement = await prisma.achievement.findFirst({ where: { transactionHash: hash } });
  return {
    verified: Boolean(receipt && receipt.status === 1),
    network: "sepolia",
    chainId: env.CHAIN_ID,
    transactionHash: hash,
    blockNumber: receipt?.blockNumber ?? null,
    contractEvidence: {
      campToken: env.CAMP_TOKEN_ADDRESS,
      badgeContract: env.BADGE_CONTRACT_ADDRESS,
    },
    linkedAchievement: achievement ?? null,
    timestamp: new Date().toISOString(),
  };
}

export async function verifyAchievement(id: string) {
  const achievement = await getAchievementById(id);
  const txCheck = await verifyTransaction(achievement.transactionHash);
  return {
    verified: txCheck.verified && achievement.status === "verified",
    network: "sepolia",
    chainId: env.CHAIN_ID,
    achievement,
    transaction: txCheck,
    verificationSource: "onchain",
    timestamp: new Date().toISOString(),
  };
}
