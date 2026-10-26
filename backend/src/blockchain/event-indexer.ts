import { Contract, EventLog, Log } from "ethers";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { env, getStartBlock } from "../config/env.js";
import { getLatestBlockNumber } from "./provider.js";
import { getTokenContract, getBadgeContract } from "./contracts.js";
import { logger } from "../utils/logger.js";
import { mapReasonToCategorySlug } from "../services/category-map.js";

type IndexTarget = {
  key: string;
  contract: Contract;
  eventNames: string[];
};

const targets: IndexTarget[] = [];

function initTargets() {
  if (targets.length) return;
  targets.push({
    key: env.CAMP_TOKEN_ADDRESS.toLowerCase(),
    contract: getTokenContract(),
    eventNames: [
      "TokensAwarded",
      "StudentRegistered",
      "AwardProposed",
      "AwardApproved",
      "TeacherAdded",
      "TokensDecayed",
    ],
  });
  targets.push({
    key: env.BADGE_CONTRACT_ADDRESS.toLowerCase(),
    contract: getBadgeContract(),
    eventNames: ["BadgeMinted"],
  });
}

async function getLastProcessedBlock(contractKey: string): Promise<number | null> {
  const row = await prisma.syncState.findUnique({ where: { contract: contractKey } });
  return row?.lastProcessedBlock ?? null;
}

async function setLastProcessedBlock(contractKey: string, block: number) {
  await prisma.syncState.upsert({
    where: { contract: contractKey },
    create: { contract: contractKey, lastProcessedBlock: block },
    update: { lastProcessedBlock: block },
  });
}

function isEventLog(log: Log): log is EventLog {
  return (log as EventLog).args !== undefined;
}

async function storeEvent(
  contractAddress: string,
  eventName: string,
  log: EventLog,
  payload: Prisma.InputJsonValue,
) {
  await prisma.blockchainEvent.upsert({
    where: {
      transactionHash_logIndex: {
        transactionHash: log.transactionHash,
        logIndex: log.index,
      },
    },
    create: {
      contractAddress: contractAddress.toLowerCase(),
      eventName,
      transactionHash: log.transactionHash,
      logIndex: log.index,
      blockNumber: log.blockNumber,
      blockHash: log.blockHash,
      payload,
    },
    update: {
      blockHash: log.blockHash,
      payload,
      processedAt: new Date(),
    },
  });
}

async function handleDerivedLogic(
  eventName: string,
  payload: Record<string, string | number | boolean | null>,
  log: EventLog,
) {
  const block = await log.provider.getBlock(log.blockNumber);
  const ts = block?.timestamp ? new Date(block.timestamp * 1000) : new Date();

  if (eventName === "StudentRegistered") {
    const student = (payload.student as string).toLowerCase();
    const name = payload.name as string;
    await prisma.studentProfile.upsert({
      where: { walletAddress: student },
      create: { walletAddress: student, name, isPublic: true },
      update: { name: name || undefined },
    });
    await prisma.userPreference.upsert({
      where: { walletAddress: student },
      create: { walletAddress: student },
      update: {},
    });
  }

  if (eventName === "TokensAwarded") {
    const student = (payload.student as string).toLowerCase();
    const amount = payload.amount?.toString() ?? "0";
    const reason = (payload.reason as string) ?? "Award";
    const slug = mapReasonToCategorySlug(reason);
    const category = await prisma.achievementCategory.findUnique({ where: { slug } });

    await prisma.studentProfile.upsert({
      where: { walletAddress: student },
      create: { walletAddress: student, isPublic: true },
      update: {},
    });

    await prisma.achievement.upsert({
      where: {
        transactionHash_logIndex: {
          transactionHash: log.transactionHash,
          logIndex: log.index,
        },
      },
      create: {
        studentWallet: student,
        title: reason,
        categoryId: category?.id,
        reason,
        campAmount: amount,
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        logIndex: log.index,
        status: "verified",
        awardedAt: ts,
      },
      update: {
        reason,
        campAmount: amount,
        categoryId: category?.id,
      },
    });

    await prisma.notification.create({
      data: {
        walletAddress: student,
        type: "CAMP_AWARDED",
        title: "CAMP awarded",
        message: `You received ${amount} CAMP for ${reason}`,
        metadata: { transactionHash: log.transactionHash, amount, reason },
      },
    });
  }

  if (eventName === "AwardProposed") {
    const proposer = (payload.proposer as string).toLowerCase();
    await prisma.notification.create({
      data: {
        walletAddress: proposer,
        type: "AWARD_PROPOSED",
        title: "Award proposed",
        message: `Proposal #${payload.proposalId} submitted`,
        metadata: payload as Prisma.InputJsonValue,
      },
    });
  }

  if (eventName === "AwardApproved") {
    const approver = (payload.approver as string).toLowerCase();
    await prisma.notification.create({
      data: {
        walletAddress: approver,
        type: "AWARD_APPROVED",
        title: "Approval recorded",
        message: `You approved proposal #${payload.approvalCount}`,
        metadata: payload as Prisma.InputJsonValue,
      },
    });
  }

  if (eventName === "BadgeMinted") {
    const student = (payload.student as string).toLowerCase();
    await prisma.notification.create({
      data: {
        walletAddress: student,
        type: "BADGE_CLAIMED",
        title: "Badge minted",
        message: `${payload.badgeType} badge claimed on-chain`,
        metadata: payload as Prisma.InputJsonValue,
      },
    });
  }
}

async function processRange(contract: Contract, contractKey: string, fromBlock: number, toBlock: number) {
  let eventsFound = 0;
  for (const eventName of targets.find((t) => t.key === contractKey)!.eventNames) {
    const logs = await contract.queryFilter(
      eventName as Parameters<Contract["queryFilter"]>[0],
      fromBlock,
      toBlock,
    );
    for (const log of logs) {
      if (!isEventLog(log)) continue;
      try {
        eventsFound++;
        const parsed = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (!parsed) continue;
        const payload: Record<string, string | number | boolean | null> = {};
        parsed.fragment.inputs.forEach((input, i) => {
          const val = parsed.args[i];
          payload[input.name] =
            typeof val === "bigint"
              ? val.toString()
              : typeof val === "string" && val.startsWith("0x")
                ? val.toLowerCase()
                : typeof val === "string" || typeof val === "number" || typeof val === "boolean"
                  ? val
                  : val == null
                    ? null
                    : String(val);
        });
        await storeEvent(contractKey, eventName, log, payload as Prisma.InputJsonValue);
        await handleDerivedLogic(eventName, payload, log);
      } catch (err) {
        logger.error(
          { err, eventName, transactionHash: log.transactionHash, logIndex: log.index },
          "indexer event skipped",
        );
      }
    }
  }
  return eventsFound;
}

export async function runIndexerCycle(): Promise<{ from: number; to: number; eventsFound: number }> {
  initTargets();
  const latest = await getLatestBlockNumber();
  const safeHead = latest - env.CONFIRMATION_BLOCKS;
  if (safeHead < 0) {
    return { from: 0, to: 0, eventsFound: 0 };
  }

  let totalEvents = 0;
  for (const target of targets) {
    const last = await getLastProcessedBlock(target.key);
    const configuredStart = getStartBlock();
    let from =
      last !== null
        ? Math.max(0, last - env.CONFIRMATION_BLOCKS + 1)
        : configuredStart ?? Math.max(0, safeHead - 5000);

    while (from <= safeHead) {
      const to = Math.min(from + env.INDEXER_BLOCK_CHUNK - 1, safeHead);
      const found = await processRange(target.contract, target.key, from, to);
      totalEvents += found;
      logger.info({ contract: target.key, fromBlock: from, toBlock: to, eventsFound: found }, "indexer chunk");
      await setLastProcessedBlock(target.key, to);
      from = to + 1;
    }
  }

  await refreshBalanceSnapshots();

  return { from: 0, to: safeHead, eventsFound: totalEvents };
}

/** Periodic balance cache for leaderboard efficiency — authoritative reads still use RPC on detail endpoints */
async function refreshBalanceSnapshots() {
  const wallets = new Set<string>();
  const students = await prisma.studentProfile.findMany({ select: { walletAddress: true } });
  const achievements = await prisma.achievement.findMany({
    select: { studentWallet: true },
    distinct: ["studentWallet"],
  });
  students.forEach((s) => wallets.add(s.walletAddress));
  achievements.forEach((a) => wallets.add(a.studentWallet));

  const { getCampBalanceWei } = await import("./token.service.js");
  for (const w of wallets) {
    try {
      const balanceWei = await getCampBalanceWei(w);
      await prisma.balanceSnapshot.upsert({
        where: { walletAddress: w },
        create: { walletAddress: w, balanceWei },
        update: { balanceWei, fetchedAt: new Date() },
      });
    } catch {
      // skip individual failures
    }
  }
}
