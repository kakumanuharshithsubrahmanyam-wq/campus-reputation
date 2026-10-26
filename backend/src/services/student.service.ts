import { prisma } from "../db/prisma.js";
import { normalizeAddress } from "../utils/address.js";
import {
  getCampBalance,
  getReputationLevel,
  getOnChainStudentName,
} from "../blockchain/token.service.js";
import { getStudentBadges } from "../blockchain/badge.service.js";
import { getLeaderboardRankForWallet } from "./leaderboard.service.js";

export async function getStudentAggregate(wallet: string) {
  const w = normalizeAddress(wallet);
  const [profile, campBalance, level, badges, achievementCount, onChainName, rank] =
    await Promise.all([
      prisma.studentProfile.findUnique({ where: { walletAddress: w } }),
      getCampBalance(w),
      getReputationLevel(w),
      getStudentBadges(w),
      prisma.achievement.count({ where: { studentWallet: w } }),
      getOnChainStudentName(w),
      getLeaderboardRankForWallet(w),
    ]);

  return {
    walletAddress: w,
    profile: profile ?? null,
    onChainName,
    campBalance,
    reputationLevel: level,
    badges,
    achievementCount,
    rank,
    verificationSource: {
      campBalance: "onchain",
      reputationLevel: "onchain",
      badges: "onchain",
    },
  };
}
