import { apiRequest } from './apiClient.js'

export function listTeachers(page = 1, limit = 50) {
  return apiRequest(`/api/v1/teachers?page=${page}&limit=${limit}`)
}

export function getTeacherProposals(page = 1, limit = 50) {
  return apiRequest(`/api/v1/teacher/proposals?page=${page}&limit=${limit}`)
}
