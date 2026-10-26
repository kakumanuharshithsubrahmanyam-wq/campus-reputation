import { ethers } from "ethers";

export function normalizeAddress(address: string): string {
  if (!ethers.isAddress(address)) {
    throw new Error("Invalid Ethereum address");
  }
  return ethers.getAddress(address).toLowerCase();
}

export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}
