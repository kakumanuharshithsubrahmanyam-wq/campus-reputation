import { prisma } from "../db/prisma.js";
import { normalizeAddress } from "../utils/address.js";
import { AppError } from "../utils/errors.js";

export async function listAchievements(filters: {
  student?: string;
  teacher?: string;
  category?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  page: number;
  limit: number;
}) {
  const where: Record<string, unknown> = {};
  if (filters.student) where.studentWallet = normalizeAddress(filters.student);
  if (filters.teacher) where.teacherWallet = normalizeAddress(filters.teacher);
  if (filters.status) where.status = filters.status;
  if (filters.fromDate || filters.toDate) {
    where.awardedAt = {
      ...(filters.fromDate ? { gte: filters.fromDate } : {}),
      ...(filters.toDate ? { lte: filters.toDate } : {}),
    };
  }
  if (filters.category) {
    where.category = { slug: filters.category };
  }

  const [items, total] = await Promise.all([
    prisma.achievement.findMany({
      where,
      include: { category: true },
      orderBy: { awardedAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.achievement.count({ where }),
  ]);

  return {
    items: items.map((a) => ({
      ...a,
      verificationSource: "onchain" as const,
    })),
    total,
    page: filters.page,
    limit: filters.limit,
  };
}

export async function getAchievementById(id: string) {
  const a = await prisma.achievement.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!a) throw new AppError("NOT_FOUND", "Achievement not found", 404);
  return { ...a, verificationSource: "onchain" as const };
}

export async function attachEvidence(id: string, wallet: string, evidenceUrl: string) {
  const a = await prisma.achievement.findUnique({ where: { id } });
  if (!a) throw new AppError("NOT_FOUND", "Achievement not found", 404);
  if (a.studentWallet !== normalizeAddress(wallet)) {
    throw new AppError("FORBIDDEN", "Only the student can attach evidence", 403);
  }
  return prisma.achievement.update({
    where: { id },
    data: { evidenceUrl },
  });
}
