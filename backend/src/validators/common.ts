import { z } from "zod";
import { isValidAddress } from "../utils/address.js";

export const walletParam = z.string().refine(isValidAddress, "Invalid wallet address");

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const evidenceUrlSchema = z
  .string()
  .url()
  .refine(
    (u) => u.startsWith("https://") || u.startsWith("ipfs://"),
    "Evidence URL must be https or ipfs",
  );
