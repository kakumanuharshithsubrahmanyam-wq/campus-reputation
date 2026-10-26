import { ethers } from "ethers";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

let providerInstance: ethers.JsonRpcProvider | null = null;

export function getProvider(): ethers.JsonRpcProvider {
  if (!providerInstance) {
    providerInstance = new ethers.JsonRpcProvider(env.SEPOLIA_RPC_URL, env.CHAIN_ID);
  }
  return providerInstance;
}

export async function assertChainId(): Promise<void> {
  const network = await getProvider().getNetwork();
  if (Number(network.chainId) !== env.CHAIN_ID) {
    throw new AppError(
      "WRONG_NETWORK",
      `RPC chainId ${network.chainId} != configured ${env.CHAIN_ID}`,
      503,
    );
  }
}

export async function getLatestBlockNumber(): Promise<number> {
  return getProvider().getBlockNumber();
}
