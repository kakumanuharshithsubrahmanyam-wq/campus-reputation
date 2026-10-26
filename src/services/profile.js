import { authFetch } from './auth.js'

export function updateProfile(payload) {
  return authFetch('/api/v1/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function updatePreferences(payload) {
  return authFetch('/api/v1/profile/preferences', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
