import { formatApiError } from '../utils/apiErrors.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const MAX_ATTEMPTS = 3
const RETRY_STATUS = new Set([502, 503, 504])

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(err, status) {
  if (err?.code === 'NETWORK_ERROR') return true
  return RETRY_STATUS.has(status)
}

export async function apiRequest(path, options = {}, attempt = 0) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch (networkErr) {
    const err = new Error(
      attempt < MAX_ATTEMPTS - 1
        ? 'Connecting to Campus Reputation…'
        : formatApiError(networkErr, 0),
    )
    err.code = 'NETWORK_ERROR'
    if (attempt < MAX_ATTEMPTS - 1 && isRetryable(err, 0)) {
      await sleep(800 * (attempt + 1))
      return apiRequest(path, options, attempt + 1)
    }
    throw err
  }

  if (RETRY_STATUS.has(res.status) && attempt < MAX_ATTEMPTS - 1) {
    await sleep(1000 * (attempt + 1))
    return apiRequest(path, options, attempt + 1)
  }

  const json = await res.json().catch(() => ({}))
  if (!json.success) {
    const base = json.error?.message || 'Request failed'
    const err = new Error(formatApiError({ message: base, code: json.error?.code }, res.status))
    err.code = json.error?.code
    err.status = res.status
    throw err
  }
  return json.data
}

export { API_BASE }
