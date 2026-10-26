import { runIndexerCycle } from "../blockchain/event-indexer.js";
import { runWithIndexerLock, IndexerLockHeldError } from "../services/indexerLock.service.js";
import { logger } from "../utils/logger.js";
import { prisma } from "../db/prisma.js";

async function main() {
  try {
    const result = await runWithIndexerLock(() => runIndexerCycle());
    logger.info(result, "indexer:once finished");
    process.exitCode = 0;
  } catch (err) {
    if (err instanceof IndexerLockHeldError) {
      logger.info("indexer:once skipped — another run holds the lock");
      process.exitCode = 0;
      return;
    }
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (err) => {
  logger.error({ err }, "indexer:once failed");
  await prisma.$disconnect();
  process.exit(1);
});
