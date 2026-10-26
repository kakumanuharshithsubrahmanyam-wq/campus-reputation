import { prisma } from "../db/prisma.js";
import { normalizeAddress } from "../utils/address.js";
import {
  isAuthorizedTeacher,
  getProposalCount,
  getProposal,
} from "../blockchain/token.service.js";

export async function listTeachers(page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.teacherProfile.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacherProfile.count(),
  ]);

  const enriched = await Promise.all(
    items.map(async (t) => ({
      ...t,
      authorizedOnChain: await isAuthorizedTeacher(t.walletAddress),
    })),
  );

  return { items: enriched, total, page, limit };
}

export async function getTeacher(wallet: string) {
  const w = normalizeAddress(wallet);
  const profile = await prisma.teacherProfile.findUnique({ where: { walletAddress: w } });
  const authorizedOnChain = await isAuthorizedTeacher(w);
  return { profile, walletAddress: w, authorizedOnChain };
}

export async function getTeacherActivity(wallet: string, page: number, limit: number) {
  const w = normalizeAddress(wallet);
  const items = await prisma.blockchainEvent.findMany({
    where: {
      OR: [
        { eventName: "AwardProposed", payload: { path: ["proposer"], equals: w } },
        { eventName: "AwardApproved", payload: { path: ["approver"], equals: w } },
      ],
    },
    orderBy: [{ blockNumber: "desc" }],
    skip: (page - 1) * limit,
    take: limit,
  });
  return { items, page, limit };
}

export async function listProposals(page: number, limit: number) {
  const count = await getProposalCount();
  const start = (page - 1) * limit;
  const end = Math.min(start + limit, count);
  const items = [];
  for (let i = start; i < end; i++) {
    items.push(await getProposal(i));
  }
  return { items, total: count, page, limit };
}
