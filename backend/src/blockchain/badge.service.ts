import { Contract } from "ethers";
import { getBadgeContract } from "./contracts.js";
import { BADGE_TYPES } from "./abis.js";
import { normalizeAddress } from "../utils/address.js";

type BadgeReader = Contract & {
  hasBadge: (address: string, badgeType: string) => Promise<boolean>;
};

export async function getStudentBadges(wallet: string) {
  const badge = getBadgeContract() as BadgeReader;
  const normalized = normalizeAddress(wallet);
  const result: Record<string, boolean> = {};
  for (const type of BADGE_TYPES) {
    result[type] = await badge.hasBadge(normalized, type);
  }
  return result;
}
