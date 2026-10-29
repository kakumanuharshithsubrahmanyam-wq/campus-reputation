/**
 * Demo data for production/staging: profile metadata + real on-chain achievements via indexer.
 * Does not insert fake transaction hashes.
 *
 * Usage (from backend/ with DATABASE_URL + SEPOLIA_RPC_URL + JWT_SECRET set):
 *   npm run seed:demo
 *
 * Full history backfill (first time on empty SyncState):
 *   DEMO_BACKFILL=true START_BLOCK=<deploy_block> npm run seed:demo
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runIndexerCycle } from "../blockchain/event-indexer.js";
import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";

const MAX_CYCLES = 80;

async function main() {
  const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  execSync("npm run prisma:seed", { cwd: backendRoot, stdio: "inherit" });
  logger.info("Prisma demo seed finished (categories + team profiles)");

  if (process.env.DEMO_BACKFILL === "true") {
    await prisma.syncState.deleteMany({});
    logger.info("Cleared SyncState for DEMO_BACKFILL");
  }

  let totalEvents = 0;
  for (let i = 0; i < MAX_CYCLES; i++) {
    const result = await runIndexerCycle();
    totalEvents += result.eventsFound;
    logger.info({ cycle: i + 1, ...result }, "demo indexer cycle");
    if (result.eventsFound === 0 && i > 0) break;
    if (result.to > 0 && result.from === 0 && result.eventsFound === 0 && i === 0) break;
  }

  const [achievements, students] = await Promise.all([
    prisma.achievement.count(),
    prisma.studentProfile.count(),
  ]);

  logger.info(
    { totalEventsIndexed: totalEvents, achievements, studentProfiles: students },
    "Demo seed complete — achievements are from Sepolia events only",
  );
}

main()
  .catch((err) => {
    logger.error({ err }, "demo-seed failed");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
