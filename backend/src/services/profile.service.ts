import { prisma } from "../db/prisma.js";
import { normalizeAddress } from "../utils/address.js";
import { AppError } from "../utils/errors.js";
import { getOnChainStudentName } from "../blockchain/token.service.js";

export type ProfileUpdateInput = {
  name?: string;
  studentId?: string;
  department?: string;
  year?: number;
  bio?: string;
  profileImageUrl?: string;
  publicSlug?: string;
  isPublic?: boolean;
};

function publicProfileDto(
  profile: Awaited<ReturnType<typeof prisma.studentProfile.findUnique>> & {},
  pref: Awaited<ReturnType<typeof prisma.userPreference.findUnique>>,
) {
  const showScore = pref?.showCampScore ?? true;
  const showAchievements = pref?.showAchievements ?? true;
  const showBadges = pref?.showBadges ?? true;
  const showRank = pref?.showRank ?? true;

  return {
    walletAddress: profile.walletAddress,
    name: profile.name,
    department: profile.department,
    year: profile.year,
    bio: profile.bio,
    profileImageUrl: profile.profileImageUrl,
    publicSlug: profile.publicSlug,
    isPublic: profile.isPublic,
    studentId: profile.isPublic ? profile.studentId : undefined,
    preferences: {
      showAchievements,
      showCampScore: showScore,
      showBadges,
      showRank,
    },
  };
}

export async function upsertProfile(wallet: string, data: ProfileUpdateInput) {
  const w = normalizeAddress(wallet);
  if (data.publicSlug) {
    const clash = await prisma.studentProfile.findFirst({
      where: { publicSlug: data.publicSlug, NOT: { walletAddress: w } },
    });
    if (clash) throw new AppError("VALIDATION_ERROR", "publicSlug already taken", 409);
  }

  const profile = await prisma.studentProfile.upsert({
    where: { walletAddress: w },
    create: {
      walletAddress: w,
      ...data,
      isPublic: data.isPublic ?? true,
    },
    update: data,
  });

  await prisma.userPreference.upsert({
    where: { walletAddress: w },
    create: { walletAddress: w },
    update: {},
  });

  return profile;
}

export async function getProfileByWallet(wallet: string, viewerIsOwner = false) {
  const w = normalizeAddress(wallet);
  let profile = await prisma.studentProfile.findUnique({ where: { walletAddress: w } });
  if (!profile) {
    const chainName = await getOnChainStudentName(w);
    profile = await prisma.studentProfile.create({
      data: { walletAddress: w, name: chainName || null, isPublic: true },
    });
  }
  const pref = await prisma.userPreference.findUnique({ where: { walletAddress: w } });

  if (!profile.isPublic && !viewerIsOwner) {
    throw new AppError("FORBIDDEN", "Profile is private", 403);
  }

  return { profile, pref, publicDto: publicProfileDto(profile, pref) };
}

export async function getProfileBySlug(slug: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { publicSlug: slug } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);
  if (!profile.isPublic) throw new AppError("FORBIDDEN", "Profile is private", 403);
  const pref = await prisma.userPreference.findUnique({ where: { walletAddress: profile.walletAddress } });
  return { profile, pref, publicDto: publicProfileDto(profile, pref) };
}

export async function updatePreferences(
  wallet: string,
  data: Partial<{
    publicProfile: boolean;
    showAchievements: boolean;
    showCampScore: boolean;
    showBadges: boolean;
    showRank: boolean;
    emailNotifications: boolean;
  }>,
) {
  const w = normalizeAddress(wallet);
  await prisma.studentProfile.upsert({
    where: { walletAddress: w },
    create: { walletAddress: w, isPublic: data.publicProfile ?? true },
    update: data.publicProfile !== undefined ? { isPublic: data.publicProfile } : {},
  });
  return prisma.userPreference.upsert({
    where: { walletAddress: w },
    create: { walletAddress: w, ...data },
    update: data,
  });
}
