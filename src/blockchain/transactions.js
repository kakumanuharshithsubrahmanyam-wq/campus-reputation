import { getTokenContract, getBadgeContract } from './contracts.js'
import {
  BRONZE_IPFS_URI,
  SILVER_IPFS_URI,
  GOLD_IPFS_URI,
} from './config.js'

const BADGE_URIS = {
  BRONZE: BRONZE_IPFS_URI,
  SILVER: SILVER_IPFS_URI,
  GOLD: GOLD_IPFS_URI,
}

export async function registerStudent(name) {
  const token = await getTokenContract()
  const tx = await token.registerStudent(name.trim())
  return tx.wait()
}

export async function proposeAward(student, amount, reason) {
  const token = await getTokenContract()
  const tx = await token.proposeAward(student, Math.floor(Number(amount)), reason)
  return tx.wait()
}

export async function approveAward(proposalId) {
  const token = await getTokenContract()
  const tx = await token.approveAward(proposalId)
  return tx.wait()
}

export async function addTeacher(address) {
  const token = await getTokenContract()
  const tx = await token.addTeacher(address)
  return tx.wait()
}

export async function claimBadge(badgeType) {
  const uri = BADGE_URIS[badgeType]
  if (!uri) throw new Error('Unknown badge type')
  const badge = await getBadgeContract()
  const tx = await badge.claimBadge(badgeType, uri)
  return tx.wait()
}
