import { apiRequest } from './apiClient.js'

export function getLeaderboard({ page = 1, limit = 20, department, year } = {}) {
  const params = new URLSearchParams({ page, limit })
  if (department) params.set('department', department)
  if (year) params.set('year', year)
  return apiRequest(`/api/v1/leaderboard?${params}`)
}
