import { prisma } from "../db/prisma.js";
import { cacheGet, cacheSet, CACHE_TTL } from "./cache.service.js";
import { getCampBalance } from "../blockchain/token.service.js";
import { getReputationLevel } from "../blockchain/token.service.js";

type LeaderboardEntry = {
  rank: number;
  wallet: string;
  name: string | null;
  department: string | null;
  year: number | null;
  level: string;
  campBalance: number;
  achievementCount: number;
};

async function collectWallets(): Promise<string[]> {
  const fromProfiles = await prisma.studentProfile.findMany({ select: { walletAddress: true } });
  const fromAchievements = await prisma.achievement.findMany({
    select: { studentWallet: true },
    distinct: ["studentWallet"],
  });
  const set = new Set<string>();
  fromProfiles.forEach((p) => set.add(p.walletAddress));
  fromAchievements.forEach((a) => set.add(a.studentWallet));
  return [...set];
}

export async function getLeaderboard(options: {
  limit: number;
  page: number;
  department?: string;
  year?: number;
}) {
  const cacheKey = `lb:${options.page}:${options.limit}:${options.department ?? ""}:${options.year ?? ""}`;
  const cached = cacheGet<{ items: LeaderboardEntry[]; total: number }>(cacheKey);
  if (cached) return cached;

  let wallets = await collectWallets();
  if (wallets.length === 0) {
    return { items: [], total: 0, page: options.page, limit: options.limit };
  }

  const profiles = await prisma.studentProfile.findMany({
    where: {
      walletAddress: { in: wallets },
      ...(options.department ? { department: options.department } : {}),
      ...(options.year ? { year: options.year } : {}),
    },
  });

  if (options.department || options.year) {
    wallets = profiles.map((p) => p.walletAddress);
  }

  const entries: LeaderboardEntry[] = [];
  for (const w of wallets) {
    const profile = profiles.find((p) => p.walletAddress === w) ??
      (await prisma.studentProfile.findUnique({ where: { walletAddress: w } }));
    const [campBalance, level, achievementCount] = await Promise.all([
      getCampBalance(w),
      getReputationLevel(w),
      prisma.achievement.count({ where: { studentWallet: w } }),
    ]);
    if (campBalance <= 0) continue;
    entries.push({
      rank: 0,
      wallet: w,
      name: profile?.name ?? null,
      department: profile?.department ?? null,
      year: profile?.year ?? null,
      level,
      campBalance,
      achievementCount,
    });
  }

  entries.sort((a, b) => b.campBalance - a.campBalance);
  entries.forEach((e, i) => {
    e.rank = i + 1;
  });

  const total = entries.length;
  const start = (options.page - 1) * options.limit;
  const items = entries.slice(start, start + options.limit);

  const result = { items, total, page: options.page, limit: options.limit };
  cacheSet(cacheKey, result, CACHE_TTL.LEADERBOARD);
  return result;
}

export async function getLeaderboardRankForWallet(wallet: string): Promise<number | null> {
  const full = await getLeaderboard({ limit: 1000, page: 1 });
  const found = full.items.find((i) => i.wallet === wallet.toLowerCase());
  return found?.rank ?? null;
}
