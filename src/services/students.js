import { apiRequest } from './apiClient.js'

export function getStudent(wallet) {
  return apiRequest(`/api/v1/students/${wallet}`)
}

export function getStudentAchievements(wallet, page = 1, limit = 20) {
  return apiRequest(`/api/v1/students/${wallet}/achievements?page=${page}&limit=${limit}`)
}

export function getStudentActivity(wallet, page = 1, limit = 20) {
  return apiRequest(`/api/v1/students/${wallet}/activity?page=${page}&limit=${limit}`)
}

export function getStudentReputation(wallet) {
  return apiRequest(`/api/v1/students/${wallet}/reputation`)
}

export function getPublicProfile(wallet) {
  return apiRequest(`/api/v1/profile/${wallet}`)
}
