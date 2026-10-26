import { apiRequest } from './apiClient.js'

const TOKEN_KEY = 'campus_rep_jwt'
const ADDR_KEY = 'campus_rep_auth_addr'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredAuthAddress() {
  return localStorage.getItem(ADDR_KEY)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ADDR_KEY)
}

export function saveAuth(token, address) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ADDR_KEY, address.toLowerCase())
}

export async function fetchNonce(address) {
  return apiRequest(`/api/v1/auth/nonce?address=${encodeURIComponent(address)}`)
}

export async function verifySignature(address, signature) {
  return apiRequest('/api/v1/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ address, signature }),
  })
}

export async function authFetch(path, options = {}) {
  const token = getStoredToken()
  return apiRequest(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
