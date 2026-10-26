import { apiRequest } from './apiClient.js'

export function getActivity({ page = 1, limit = 20, student, teacher, eventType } = {}) {
  const params = new URLSearchParams({ page, limit })
  if (student) params.set('student', student)
  if (teacher) params.set('teacher', teacher)
  if (eventType) params.set('eventType', eventType)
  return apiRequest(`/api/v1/activity?${params}`)
}
