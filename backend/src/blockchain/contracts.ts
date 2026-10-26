import { Contract } from "ethers";
import { env } from "../config/env.js";
import { getProvider } from "./provider.js";
import { BADGE_ABI, TOKEN_ABI } from "./abis.js";

export function getTokenContract(): Contract {
  return new Contract(env.CAMP_TOKEN_ADDRESS, TOKEN_ABI, getProvider());
}

export function getBadgeContract(): Contract {
  return new Contract(env.BADGE_CONTRACT_ADDRESS, BADGE_ABI, getProvider());
}
