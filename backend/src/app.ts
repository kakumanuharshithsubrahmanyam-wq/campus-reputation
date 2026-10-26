import { randomUUID } from "crypto";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttpImport from "pino-http";

const pinoHttp = pinoHttpImport.default ?? pinoHttpImport;
import { env } from "./config/env.js";
import { getCorsOrigins } from "./utils/corsOrigins.js";
import { getIndexerHealth } from "./services/indexerHealth.service.js";
import { logger } from "./utils/logger.js";
import { v1Router } from "./routes/v1/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { prisma } from "./db/prisma.js";
import { assertChainId } from "./blockchain/provider.js";
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: getCorsOrigins(),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(
    pinoHttp({
      logger,
      customProps: () => ({ requestId: randomUUID() }),
    }),
  );
  app.use(apiLimiter);

  app.get("/health", async (_req, res) => {
    const dbOk = await prisma.$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false);
    let rpcOk = false;
    const chainId = env.CHAIN_ID;
    let indexer: Awaited<ReturnType<typeof getIndexerHealth>> = {
      status: "unknown",
      lastIndexedBlock: null,
      latestBlock: null,
      lag: null,
    };
    try {
      await assertChainId();
      rpcOk = true;
      indexer = await getIndexerHealth();
    } catch {
      rpcOk = false;
    }
    const ok = dbOk && rpcOk;
    const status = ok ? 200 : 503;
    res.status(status).json({
      success: ok,
      data: {
        status: ok ? "ok" : "degraded",
        api: "ok",
        database: dbOk ? "connected" : "error",
        blockchain: rpcOk ? "connected" : "error",
        rpc: rpcOk ? "ok" : "error",
        chainId,
        latestBlock: indexer.latestBlock,
        latestIndexedBlock: indexer.lastIndexedBlock,
        indexer,
      },
    });
  });

  app.use("/api/v1", v1Router);
  app.use(errorHandler);

  return app;
}
