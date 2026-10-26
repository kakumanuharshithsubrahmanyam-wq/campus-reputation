import { apiRequest } from './apiClient.js'

export function listAchievements(params = {}) {
  const q = new URLSearchParams()
  if (params.student) q.set('student', params.student)
  if (params.teacher) q.set('teacher', params.teacher)
  if (params.category) q.set('category', params.category)
  q.set('page', params.page || 1)
  q.set('limit', params.limit || 20)
  return apiRequest(`/api/v1/achievements?${q}`)
}
