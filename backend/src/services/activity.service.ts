import { prisma } from "../db/prisma.js";
import { normalizeAddress } from "../utils/address.js";

export async function getActivity(options: {
  limit: number;
  page: number;
  student?: string;
  teacher?: string;
  eventType?: string;
}) {
  const where: Record<string, unknown> = {};
  if (options.eventType) where.eventName = options.eventType;
  if (options.student) {
    where.payload = { path: ["student"], equals: normalizeAddress(options.student) };
  }

  const [events, total] = await Promise.all([
    prisma.blockchainEvent.findMany({
      where,
      orderBy: [{ blockNumber: "desc" }, { logIndex: "desc" }],
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.blockchainEvent.count({ where }),
  ]);

  const items = events
    .map((e) => {
      const payload = e.payload as Record<string, unknown>;
      if (options.teacher) {
        const proposer = (payload.proposer as string | undefined)?.toLowerCase();
        const approver = (payload.approver as string | undefined)?.toLowerCase();
        const t = normalizeAddress(options.teacher);
        if (proposer !== t && approver !== t && e.eventName !== "TokensAwarded") {
          return null;
        }
      }

      if (e.eventName === "TokensAwarded") {
        return {
          type: "CAMP_AWARDED",
          student: payload.student,
          amount: payload.amount?.toString(),
          reason: payload.reason,
          transactionHash: e.transactionHash,
          blockNumber: e.blockNumber,
          timestamp: e.processedAt.toISOString(),
        };
      }
      return {
        type: e.eventName,
        payload,
        transactionHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp: e.processedAt.toISOString(),
      };
    })
    .filter(Boolean);

  return { items, total, page: options.page, limit: options.limit };
}
