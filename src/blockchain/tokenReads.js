import { getTokenContract, getBrowserProvider } from './contracts.js'
import { normalizeAddress, sameAddress } from '../utils/address.js'
import { weiToCamp, displayCampAmount } from '../utils/campAmount.js'

export function formatCampFromWei(wei) {
  return weiToCamp(wei)
}

export async function fetchTokenState(address) {
  const w = normalizeAddress(address)
  if (!w) throw new Error('Invalid wallet address')
  const provider = getBrowserProvider()
  const token = await getTokenContract(provider)
  const [balanceWei, level, name] = await Promise.all([
    token.balanceOf(w),
    token.getReputationLevel(w),
    token.studentNames(w),
  ])
  return {
    balance: formatCampFromWei(balanceWei),
    level: level || 'Newcomer',
    onChainName: name || '',
  }
}

export async function fetchRoles(address) {
  const w = normalizeAddress(address)
  if (!w) return { isTeacher: false, isOwner: false }
  const provider = getBrowserProvider()
  const token = await getTokenContract(provider)
  const [isTeacher, owner] = await Promise.all([
    token.authorizedTeachers(w),
    token.owner(),
  ])
  return {
    isTeacher: Boolean(isTeacher),
    isOwner: sameAddress(owner, w),
  }
}

export async function fetchAllProposals(myAddress) {
  const provider = getBrowserProvider()
  const token = await getTokenContract(provider)
  const count = Number(await token.proposalCount())
  const items = []
  for (let i = 0; i < count; i++) {
    const p = await token.proposals(i)
    const hasApproved = myAddress
      ? await token.hasApproved(i, myAddress)
      : false
    items.push({
      proposalId: i,
      student: p.student,
      amount: displayCampAmount(p.amount),
      amountRaw: p.amount.toString(),
      reason: p.reason,
      proposer: p.proposer,
      approvalCount: Number(p.approvalCount),
      executed: p.executed,
      hasApproved,
    })
  }
  return items
}
