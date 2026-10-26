import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: ["req.headers.authorization", "signature", "token"],
    remove: true,
  },
  base: { service: "campus-reputation-api", chainId: env.CHAIN_ID },
});
