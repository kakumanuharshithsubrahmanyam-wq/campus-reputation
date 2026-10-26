import { randomUUID } from "crypto";
import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";

const LOCK_ID = "global";
/** Stale lock recovery if a worker crashes without releasing */
const LOCK_TTL_MS = 20 * 60 * 1000;

export class IndexerLockHeldError extends Error {
  constructor() {
    super("Indexer lock held by another worker");
    this.name = "IndexerLockHeldError";
  }
}

export async function runWithIndexerLock<T>(fn: () => Promise<T>): Promise<T> {
  const holder = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);

  const existing = await prisma.indexerLock.findUnique({ where: { id: LOCK_ID } });
  if (existing && existing.expiresAt > now) {
    logger.warn({ holder: existing.holder, expiresAt: existing.expiresAt }, "indexer lock active");
    throw new IndexerLockHeldError();
  }

  await prisma.indexerLock.upsert({
    where: { id: LOCK_ID },
    create: { id: LOCK_ID, holder, acquiredAt: now, expiresAt },
    update: { holder, acquiredAt: now, expiresAt },
  });

  try {
    return await fn();
  } finally {
    await prisma.indexerLock.deleteMany({ where: { id: LOCK_ID, holder } });
  }
}
