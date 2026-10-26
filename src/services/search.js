import { apiRequest } from './apiClient.js'

export function searchQuery(q, page = 1, limit = 10) {
  return apiRequest(`/api/v1/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`)
}
