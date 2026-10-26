import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { runIndexerCycle } from "./blockchain/event-indexer.js";

const app = createApp();

let indexerTimer: NodeJS.Timeout | null = null;

async function start() {
  app.listen(env.PORT, "0.0.0.0", () => {
    logger.info({ port: env.PORT, host: "0.0.0.0" }, "Campus Reputation API listening");
  });

  if (env.ENABLE_INDEXER_LOOP) {
    const tick = async () => {
      try {
        const result = await runIndexerCycle();
        logger.info(result, "indexer cycle complete");
      } catch (err) {
        logger.error({ err }, "indexer cycle failed");
      }
    };
    await tick();
    indexerTimer = setInterval(tick, env.INDEXER_INTERVAL_MS);
  }
}

start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});

process.on("SIGTERM", () => {
  if (indexerTimer) clearInterval(indexerTimer);
  process.exit(0);
});
