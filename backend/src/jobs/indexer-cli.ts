import { runIndexerCycle } from "../blockchain/event-indexer.js";
import { logger } from "../utils/logger.js";
import { prisma } from "../db/prisma.js";

async function main() {
  const result = await runIndexerCycle();
  logger.info(result, "Indexer run finished");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  logger.error({ err }, "Indexer failed");
  await prisma.$disconnect();
  process.exit(1);
});
