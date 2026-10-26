import { Router } from "express";
import { z } from "zod";
import { sendSuccess } from "../../utils/response.js";
import { walletParam, paginationQuery, evidenceUrlSchema } from "../../validators/common.js";
import { createNonce, verifyWalletSignature } from "../../services/auth.service.js";
import { getStudentAggregate } from "../../services/student.service.js";
import { listAchievements, getAchievementById, attachEvidence } from "../../services/achievement.service.js";
import { getLeaderboard } from "../../services/leaderboard.service.js";
import { getActivity } from "../../services/activity.service.js";
import {
  getProfileByWallet,
  getProfileBySlug,
  upsertProfile,
  updatePreferences,
} from "../../services/profile.service.js";
import { verifyWallet, verifyTransaction, verifyAchievement } from "../../services/verification.service.js";
import { search } from "../../services/search.service.js";
import { listNotifications, markRead, markAllRead } from "../../services/notification.service.js";
import {
  listTeachers,
  getTeacher,
  getTeacherActivity,
  listProposals,
} from "../../services/teacher.service.js";
import { getAdminStats } from "../../services/admin.service.js";
import { getStudentBadges } from "../../blockchain/badge.service.js";
import { getCampBalance, getReputationLevel } from "../../blockchain/token.service.js";
import { requireAuth, requireOwner, type AuthedRequest } from "../../middleware/auth.js";
import {
  authNonceLimiter,
  authVerifyLimiter,
  searchLimiter,
  verifyLimiter,
} from "../../middleware/rateLimit.js";
import { prisma } from "../../db/prisma.js";
import { normalizeAddress } from "../../utils/address.js";
import { assertChainId, getLatestBlockNumber } from "../../blockchain/provider.js";
import { env } from "../../config/env.js";
import { getIndexerHealth } from "../../services/indexerHealth.service.js";

export const v1Router = Router();

v1Router.get("/system/status", async (_req, res, next) => {
  try {
    await assertChainId();
    const [dbOk, sync, indexer] = await Promise.all([
      prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      prisma.syncState.findMany(),
      getIndexerHealth(),
    ]);
    sendSuccess(res, {
      api: "ok",
      database: dbOk ? "ok" : "error",
      rpc: "ok",
      chainId: env.CHAIN_ID,
      latestBlock: indexer.latestBlock,
      syncStates: sync,
      indexer,
    });
  } catch (e) {
    next(e);
  }
});

v1Router.get("/auth/nonce", authNonceLimiter, async (req, res, next) => {
  try {
    const address = walletParam.parse(req.query.address);
    const data = await createNonce(address);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

v1Router.post("/auth/verify", authVerifyLimiter, async (req, res, next) => {
  try {
    const body = z
      .object({
        address: walletParam,
        signature: z.string().min(1),
      })
      .parse(req.body);
    const data = await verifyWalletSignature(body.address, body.signature);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

v1Router.get("/students/:wallet", async (req, res, next) => {
  try {
    const wallet = walletParam.parse(req.params.wallet);
    sendSuccess(res, await getStudentAggregate(wallet));
  } catch (e) {
    next(e);
  }
});

v1Router.get("/students/:wallet/achievements", async (req, res, next) => {
  try {
    const wallet = walletParam.parse(req.params.wallet);
    const q = paginationQuery.parse(req.query);
    sendSuccess(
      res,
      await listAchievements({ student: wallet, page: q.page, limit: q.limit }),
    );
  } catch (e) {
    next(e);
  }
});

v1Router.get("/students/:wallet/badges", async (req, res, next) => {
  try {
    const wallet = walletParam.parse(req.params.wallet);
    sendSuccess(res, { badges: await getStudentBadges(wallet), verificationSource: "onchain" });
  } catch (e) {
    next(e);
  }
});

v1Router.get("/students/:wallet/activity", async (req, res, next) => {
  try {
    const wallet = walletParam.parse(req.params.wallet);
    const q = paginationQuery.parse(req.query);
    sendSuccess(
      res,
      await getActivity({ student: wallet, page: q.page, limit: q.limit }),
    );
  } catch (e) {
    next(e);
  }
});

v1Router.get("/students/:wallet/reputation", async (req, res, next) => {
  try {
    const wallet = walletParam.parse(req.params.wallet);
    sendSuccess(res, {
      walletAddress: normalizeAddress(wallet),
      campBalance: await getCampBalance(wallet),
      reputationLevel: await getReputationLevel(wallet),
      verificationSource: "onchain",
    });
  } catch (e) {
    next(e);
  }
});

v1Router.get("/profile/:wallet", async (req, res, next) => {
  try {
    const wallet = walletParam.parse(req.params.wallet);
    const data = await getProfileByWallet(wallet);
    sendSuccess(res, data.publicDto);
  } catch (e) {
    next(e);
  }
});

v1Router.get("/profile/slug/:slug", async (req, res, next) => {
  try {
    const slug = z.string().min(1).parse(req.params.slug);
    const data = await getProfileBySlug(slug);
    sendSuccess(res, data.publicDto);
  } catch (e) {
    next(e);
  }
});

v1Router.patch("/profile", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().max(120).optional(),
        studentId: z.string().max(64).optional(),
        department: z.string().max(64).optional(),
        year: z.coerce.number().int().min(1).max(10).optional(),
        bio: z.string().max(500).optional(),
        profileImageUrl: z.string().url().optional(),
        publicSlug: z
          .string()
          .regex(/^[a-z0-9-]+$/)
          .max(64)
          .optional(),
        isPublic: z.boolean().optional(),
      })
      .parse(req.body);
    const profile = await upsertProfile(req.wallet!, body);
    sendSuccess(res, profile);
  } catch (e) {
    next(e);
  }
});

v1Router.patch("/profile/preferences", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        publicProfile: z.boolean().optional(),
        showAchievements: z.boolean().optional(),
        showCampScore: z.boolean().optional(),
        showBadges: z.boolean().optional(),
        showRank: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
      })
      .parse(req.body);
    sendSuccess(res, await updatePreferences(req.wallet!, body));
  } catch (e) {
    next(e);
  }
});

v1Router.get("/achievements", async (req, res, next) => {
  try {
    const q = paginationQuery.extend({
      student: z.string().optional(),
      teacher: z.string().optional(),
      category: z.string().optional(),
      status: z.string().optional(),
      fromDate: z.string().datetime().optional(),
      toDate: z.string().datetime().optional(),
    }).parse(req.query);
    sendSuccess(
      res,
      await listAchievements({
        student: q.student,
        teacher: q.teacher,
        category: q.category,
        status: q.status,
        fromDate: q.fromDate ? new Date(q.fromDate) : undefined,
        toDate: q.toDate ? new Date(q.toDate) : undefined,
        page: q.page,
        limit: q.limit,
      }),
    );
  } catch (e) {
    next(e);
  }
});

v1Router.get("/achievements/:id", async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    sendSuccess(res, await getAchievementById(id));
  } catch (e) {
    next(e);
  }
});

v1Router.patch("/achievements/:id/evidence", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const evidenceUrl = evidenceUrlSchema.parse(req.body.evidenceUrl);
    sendSuccess(res, await attachEvidence(id, req.wallet!, evidenceUrl));
  } catch (e) {
    next(e);
  }
});

v1Router.get("/leaderboard", async (req, res, next) => {
  try {
    const q = paginationQuery.extend({
      department: z.string().optional(),
      year: z.coerce.number().optional(),
    }).parse(req.query);
    sendSuccess(
      res,
      await getLeaderboard({
        page: q.page,
        limit: q.limit,
        department: q.department,
        year: q.year,
      }),
    );
  } catch (e) {
    next(e);
  }
});

v1Router.get("/activity", async (req, res, next) => {
  try {
    const q = paginationQuery.extend({
      student: z.string().optional(),
      teacher: z.string().optional(),
      eventType: z.string().optional(),
    }).parse(req.query);
    sendSuccess(
      res,
      await getActivity({
        page: q.page,
        limit: q.limit,
        student: q.student,
        teacher: q.teacher,
        eventType: q.eventType,
      }),
    );
  } catch (e) {
    next(e);
  }
});

v1Router.get("/verify/wallet/:address", verifyLimiter, async (req, res, next) => {
  try {
    sendSuccess(res, await verifyWallet(walletParam.parse(req.params.address)));
  } catch (e) {
    next(e);
  }
});

v1Router.get("/verify/transaction/:hash", verifyLimiter, async (req, res, next) => {
  try {
    const hash = z.string().regex(/^0x[a-fA-F0-9]{64}$/).parse(req.params.hash);
    sendSuccess(res, await verifyTransaction(hash));
  } catch (e) {
    next(e);
  }
});

v1Router.get("/verify/achievement/:id", verifyLimiter, async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    sendSuccess(res, await verifyAchievement(id));
  } catch (e) {
    next(e);
  }
});

v1Router.get("/search", searchLimiter, async (req, res, next) => {
  try {
    const q = paginationQuery.extend({ q: z.string().min(1) }).parse(req.query);
    sendSuccess(res, await search(q.q, q.page, q.limit));
  } catch (e) {
    next(e);
  }
});

v1Router.get("/notifications", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const q = paginationQuery.parse(req.query);
    sendSuccess(res, await listNotifications(req.wallet!, q.page, q.limit));
  } catch (e) {
    next(e);
  }
});

v1Router.patch("/notifications/:id/read", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    sendSuccess(res, await markRead(id, req.wallet!));
  } catch (e) {
    next(e);
  }
});

v1Router.patch("/notifications/read-all", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    await markAllRead(req.wallet!);
    sendSuccess(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

v1Router.get("/teachers", async (req, res, next) => {
  try {
    const q = paginationQuery.parse(req.query);
    sendSuccess(res, await listTeachers(q.page, q.limit));
  } catch (e) {
    next(e);
  }
});

v1Router.get("/teachers/:wallet", async (req, res, next) => {
  try {
    sendSuccess(res, await getTeacher(walletParam.parse(req.params.wallet)));
  } catch (e) {
    next(e);
  }
});

v1Router.get("/teachers/:wallet/activity", async (req, res, next) => {
  try {
    const q = paginationQuery.parse(req.query);
    sendSuccess(res, await getTeacherActivity(walletParam.parse(req.params.wallet), q.page, q.limit));
  } catch (e) {
    next(e);
  }
});

v1Router.get("/teacher/proposals", async (req, res, next) => {
  try {
    const q = paginationQuery.parse(req.query);
    sendSuccess(res, await listProposals(q.page, q.limit));
  } catch (e) {
    next(e);
  }
});

v1Router.get("/admin/stats", requireAuth, requireOwner, async (_req, res, next) => {
  try {
    sendSuccess(res, await getAdminStats());
  } catch (e) {
    next(e);
  }
});
