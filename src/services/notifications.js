import { authFetch } from './auth.js'

export function listNotifications(page = 1, limit = 20) {
  return authFetch(`/api/v1/notifications?page=${page}&limit=${limit}`)
}

export function markNotificationRead(id) {
  return authFetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
}

export function markAllNotificationsRead() {
  return authFetch('/api/v1/notifications/read-all', { method: 'PATCH' })
}
