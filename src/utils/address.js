import { getAddress } from 'ethers'

/** EIP-55 checksum address, or null if invalid */
export function normalizeAddress(value) {
  if (!value) return null
  try {
    return getAddress(value)
  } catch {
    return null
  }
}

export function sameAddress(a, b) {
  const left = normalizeAddress(a)
  const right = normalizeAddress(b)
  if (!left || !right) return false
  return left === right
}
