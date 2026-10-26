import { formatEther, getBigInt } from 'ethers'

/** Proposal / indexed event amounts are usually the raw integer the teacher entered. */
export function rawCampAmount(value) {
  if (value == null || value === '') return 0
  try {
    return Math.floor(Number(getBigInt(value)))
  } catch {
    const num = Number(value)
    return Number.isFinite(num) ? Math.floor(num) : 0
  }
}

/** balanceOf returns 18-decimal wei — same as legacy campTokens.js weiToCamp */
export function weiToCamp(weiValue) {
  if (weiValue == null) return 0
  try {
    return Math.floor(parseFloat(formatEther(weiValue)))
  } catch {
    return 0
  }
}

/** Achievement rows may store either raw award units or wei strings from older indexing. */
export function displayCampAmount(stored) {
  if (stored == null || stored === '') return 0
  try {
    const bi = getBigInt(stored)
    if (bi > 1_000_000_000_000_000_000n) return weiToCamp(bi)
    return Number(bi)
  } catch {
    return rawCampAmount(stored)
  }
}
