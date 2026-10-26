import { apiRequest } from './apiClient.js'

export function verifyWallet(address) {
  return apiRequest(`/api/v1/verify/wallet/${address}`)
}

export function verifyTransaction(hash) {
  return apiRequest(`/api/v1/verify/transaction/${hash}`)
}

export function verifyAchievement(id) {
  return apiRequest(`/api/v1/verify/achievement/${id}`)
}
