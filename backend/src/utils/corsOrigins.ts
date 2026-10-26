import { env } from "../config/env.js";

/** Comma-separated FRONTEND_ORIGIN values for production + staging. */
export function getCorsOrigins(): string | string[] {
  const list = env.FRONTEND_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (list.length === 0) return "http://localhost:5173";
  if (list.length === 1) return list[0]!;
  return list;
}
