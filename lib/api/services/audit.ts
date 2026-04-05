/**
 * Audit Log API Service
 * Handles audit log API calls
 */

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../config'
import type { AuditLog, AuditLogListParams, PaginationResponse } from '../types'

interface AuditLogListResponse {
  logs: AuditLog[]
  pagination: PaginationResponse
}

export const auditApi = {
  /**
   * List audit logs
   */
  list: (params?: AuditLogListParams) => 
    apiClient.get<AuditLogListResponse>(API_ENDPOINTS.admin.auditLogs.list, params as unknown as Record<string, string | number | boolean | undefined>),

  /**
   * Get audit log by ID
   */
  getById: (logId: string) => 
    apiClient.get<{ log: AuditLog }>(API_ENDPOINTS.admin.auditLogs.byId(logId)),
}
