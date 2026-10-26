import { Contract, formatEther } from "ethers";
import { getTokenContract } from "./contracts.js";
import { normalizeAddress } from "../utils/address.js";

type TokenReader = Contract & {
  balanceOf: (address: string) => Promise<bigint>;
  getReputationLevel: (address: string) => Promise<string>;
  studentNames: (address: string) => Promise<string>;
  authorizedTeachers: (address: string) => Promise<boolean>;
  owner: () => Promise<string>;
  proposalCount: () => Promise<bigint>;
  proposals: (index: number) => Promise<{
    student: string;
    amount: bigint;
    reason: string;
    proposer: string;
    approvalCount: bigint;
    executed: boolean;
  }>;
};

function token(): TokenReader {
  return getTokenContract() as TokenReader;
}

/** Matches frontend campTokens.js: balanceOf returns wei, display as integer CAMP via formatEther */
export function formatCampBalance(balanceWei: bigint): number {
  return Math.floor(parseFloat(formatEther(balanceWei)));
}

export async function getCampBalance(wallet: string): Promise<number> {
  const wei = await token().balanceOf(normalizeAddress(wallet));
  return formatCampBalance(wei);
}

export async function getCampBalanceWei(wallet: string): Promise<string> {
  const wei = await token().balanceOf(normalizeAddress(wallet));
  return wei.toString();
}

export async function getReputationLevel(wallet: string): Promise<string> {
  return await token().getReputationLevel(normalizeAddress(wallet));
}

export async function getOnChainStudentName(wallet: string): Promise<string> {
  const name = await token().studentNames(normalizeAddress(wallet));
  return name ?? "";
}

export async function isAuthorizedTeacher(wallet: string): Promise<boolean> {
  return token().authorizedTeachers(normalizeAddress(wallet));
}

export async function isContractOwner(wallet: string): Promise<boolean> {
  const owner = await token().owner();
  return owner.toLowerCase() === normalizeAddress(wallet);
}

export async function getProposalCount(): Promise<number> {
  return Number(await token().proposalCount());
}

export async function getProposal(index: number) {
  const p = await token().proposals(index);
  return {
    proposalId: index,
    student: (p.student as string).toLowerCase(),
    amount: p.amount.toString(),
    reason: p.reason as string,
    proposer: (p.proposer as string).toLowerCase(),
    approvalCount: Number(p.approvalCount),
    executed: Boolean(p.executed),
  };
}
