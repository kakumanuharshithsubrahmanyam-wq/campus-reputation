import { CAMPUS_TOKEN_ADDRESS } from '../blockchain/config.js'
import { formatDate, shortAddress } from './format.js'
import { displayCampAmount } from './campAmount.js'

export function mapAchievement(a) {
  const points = displayCampAmount(a.campAmount)
  return {
    id: a.id,
    title: a.title || a.reason || 'Achievement',
    category: a.category?.name || 'General',
    points,
    date: formatDate(a.awardedAt),
    by: a.teacherWallet ? shortAddress(a.teacherWallet) : 'Faculty',
    reason: a.reason,
    evidenceUrl: a.evidenceUrl,
    proof: {
      network: 'Ethereum Sepolia',
      transactionHash: a.transactionHash,
      blockNumber: a.blockNumber,
      studentWallet: a.studentWallet,
      teacherWallet: a.teacherWallet,
      contractAddress: CAMPUS_TOKEN_ADDRESS,
      timestamp: a.awardedAt,
    },
  }
}
