import { prisma } from "../db/prisma.js";
import { normalizeAddress } from "../utils/address.js";

export async function listNotifications(wallet: string, page: number, limit: number) {
  const w = normalizeAddress(wallet);
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: { walletAddress: w },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where: { walletAddress: w } }),
  ]);
  return { items, total, page, limit };
}

export async function markRead(id: string, wallet: string) {
  const w = normalizeAddress(wallet);
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || n.walletAddress !== w) return null;
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllRead(wallet: string) {
  const w = normalizeAddress(wallet);
  await prisma.notification.updateMany({
    where: { walletAddress: w, isRead: false },
    data: { isRead: true },
  });
}
