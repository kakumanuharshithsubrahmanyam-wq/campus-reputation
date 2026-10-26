import { prisma } from "../db/prisma.js";
import { getLatestBlockNumber } from "../blockchain/provider.js";
import { env } from "../config/env.js";
import { cacheGet, cacheSet, CACHE_TTL } from "./cache.service.js";

export async function getAdminStats() {
  const cached = cacheGet<Awaited<ReturnType<typeof computeStats>>>("admin:stats");
  if (cached) return cached;
  const stats = await computeStats();
  cacheSet("admin:stats", stats, CACHE_TTL.ADMIN_STATS);
  return stats;
}

async function computeStats() {
  const [
    totalStudents,
    totalTeachers,
    totalAchievements,
    campRows,
    totalEvents,
    syncStates,
    latestBlock,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.achievement.count(),
    prisma.achievement.findMany({ select: { campAmount: true } }),
    prisma.blockchainEvent.count(),
    prisma.syncState.findMany(),
    getLatestBlockNumber(),
  ]);

  const latestIndexedBlock = syncStates.reduce(
    (min, s) => (min === null ? s.lastProcessedBlock : Math.min(min, s.lastProcessedBlock)),
    null as number | null,
  );

  return {
    totalStudents,
    totalTeachers,
    totalAchievements,
    totalCampAwardedIndexed: campRows
      .reduce((sum, row) => sum + BigInt(row.campAmount || "0"), 0n)
      .toString(),
    totalEvents,
    latestIndexedBlock,
    latestChainBlock: latestBlock,
    syncLag: latestIndexedBlock !== null ? latestBlock - latestIndexedBlock : null,
    chainId: env.CHAIN_ID,
  };
}
