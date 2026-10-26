import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SEPOLIA_RPC_URL: z.string().url(),
  CHAIN_ID: z.coerce.number().default(11155111),
  CAMP_TOKEN_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  BADGE_CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  JWT_SECRET: z.string().min(16),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  PORT: z.coerce.number().default(4000),
  START_BLOCK: z.string().optional(),
  CONFIRMATION_BLOCKS: z.coerce.number().default(3),
  INDEXER_BLOCK_CHUNK: z.coerce.number().default(1000),
  ENABLE_INDEXER_LOOP: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  INDEXER_INTERVAL_MS: z.coerce.number().default(60_000),
  JWT_EXPIRES_IN: z.string().default("24h"),
  NONCE_TTL_MINUTES: z.coerce.number().default(10),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export function getStartBlock(): number | null {
  if (!env.START_BLOCK || env.START_BLOCK.trim() === "") return null;
  const n = Number(env.START_BLOCK);
  return Number.isFinite(n) ? Math.floor(n) : null;
}
