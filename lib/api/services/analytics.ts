/**
 * Analytics API Service
 * Handles all analytics-related API calls
 */

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../config'
import type { DashboardAnalytics } from '../types'

export const analyticsApi = {
  /**
   * Get dashboard analytics for a court
   */
  getDashboard: (courtId: string, params?: { startDate?: string; endDate?: string }) => 
    apiClient.get<DashboardAnalytics>(API_ENDPOINTS.analytics.dashboard(courtId), params),
}
