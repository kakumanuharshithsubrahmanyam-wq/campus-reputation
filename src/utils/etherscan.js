const BASE = 'https://sepolia.etherscan.io'

export function txUrl(hash) {
  return `${BASE}/tx/${hash}`
}

export function addressUrl(address) {
  return `${BASE}/address/${address}`
}

export function contractUrl(address) {
  return `${BASE}/address/${address}`
}
