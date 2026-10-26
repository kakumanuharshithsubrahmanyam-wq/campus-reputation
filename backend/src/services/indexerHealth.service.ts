import { prisma } from "../db/prisma.js";
import { getLatestBlockNumber } from "../blockchain/provider.js";

export async function getIndexerHealth() {
  let latestBlock: number | null = null;
  try {
    latestBlock = await getLatestBlockNumber();
  } catch {
    latestBlock = null;
  }

  const sync = await prisma.syncState.findMany();
  const lastIndexedBlock =
    sync.length > 0 ? Math.min(...sync.map((s) => s.lastProcessedBlock)) : null;

  const lag =
    latestBlock !== null && lastIndexedBlock !== null
      ? Math.max(0, latestBlock - lastIndexedBlock)
      : null;

  let status: "unknown" | "healthy" | "degraded" | "behind" = "unknown";
  if (lag !== null) {
    if (lag <= 50) status = "healthy";
    else if (lag <= 500) status = "degraded";
    else status = "behind";
  }

  return { status, lastIndexedBlock, latestBlock, lag };
}
