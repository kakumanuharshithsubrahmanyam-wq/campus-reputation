import { prisma } from "../db/prisma.js";
import { normalizeAddress, isValidAddress } from "../utils/address.js";

export async function search(query: string, page: number, limit: number) {
  const q = query.trim();
  const skip = (page - 1) * limit;

  if (isValidAddress(q)) {
    const w = normalizeAddress(q);
    const profile = await prisma.studentProfile.findUnique({ where: { walletAddress: w } });
    return {
      students: profile
        ? [
            {
              walletAddress: profile.walletAddress,
              name: profile.name,
              publicSlug: profile.publicSlug,
              department: profile.department,
            },
          ]
        : [{ walletAddress: w, name: null }],
      achievements: [],
      total: 1,
      page,
      limit,
    };
  }

  const [students, achievements, studentTotal, achievementTotal] = await Promise.all([
    prisma.studentProfile.findMany({
      where: {
        isPublic: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { publicSlug: { contains: q, mode: "insensitive" } },
          { studentId: { contains: q, mode: "insensitive" } },
        ],
      },
      skip,
      take: limit,
      select: {
        walletAddress: true,
        name: true,
        publicSlug: true,
        department: true,
        year: true,
      },
    }),
    prisma.achievement.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { reason: { contains: q, mode: "insensitive" } },
        ],
      },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        reason: true,
        studentWallet: true,
        transactionHash: true,
      },
    }),
    prisma.studentProfile.count({
      where: {
        isPublic: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { publicSlug: { contains: q, mode: "insensitive" } },
          { studentId: { contains: q, mode: "insensitive" } },
        ],
      },
    }),
    prisma.achievement.count({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { reason: { contains: q, mode: "insensitive" } },
        ],
      },
    }),
  ]);

  return {
    students,
    achievements,
    total: studentTotal + achievementTotal,
    page,
    limit,
  };
}
