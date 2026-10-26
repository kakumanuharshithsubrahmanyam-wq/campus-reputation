import { authFetch } from './auth.js'

export function getAdminStats() {
  return authFetch('/api/v1/admin/stats')
}
