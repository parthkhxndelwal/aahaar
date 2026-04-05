/**
 * Court API Service
 * Handles all court-related API calls
 */

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../config'
import type {
  Court,
  CourtSettings,
  Vendor,
  User,
  MenuItem,
  PaginationParams,
  PaginationResponse,
} from '../types'

interface CourtListResponse {
  courts: Court[]
  pagination?: PaginationResponse
}

interface CourtVendorsResponse {
  vendors: Vendor[]
  pagination?: PaginationResponse
}

interface CourtUsersResponse {
  users: User[]
  pagination?: PaginationResponse
}

interface MenuSearchResponse {
  items: MenuItem[]
  total: number
}

export const courtApi = {
  // ============================================
  // Court CRUD
  // ============================================

  /**
   * List all courts
   */
  list: (params?: PaginationParams) => 
    apiClient.get<CourtListResponse>(API_ENDPOINTS.courts.list, params as unknown as Record<string, string | number | boolean | undefined>),

  /**
   * Get court by ID
   */
  getById: (courtId: string) => 
    apiClient.get<{ court: Court }>(API_ENDPOINTS.courts.byId(courtId)),

  /**
   * Update court
   */
  update: (courtId: string, data: Partial<Court>) => 
    apiClient.put<{ court: Court }>(API_ENDPOINTS.courts.byId(courtId), data),

  // ============================================
  // Court Settings
  // ============================================

  /**
   * Get court settings
   */
  getSettings: (courtId: string) => 
    apiClient.get<{ settings: CourtSettings }>(API_ENDPOINTS.courts.settings(courtId)),

  /**
   * Update court settings
   */
  updateSettings: (courtId: string, data: Partial<CourtSettings>) => 
    apiClient.put<{ settings: CourtSettings }>(API_ENDPOINTS.courts.settings(courtId), data),

  // ============================================
  // Court Vendors
  // ============================================

  /**
   * Get vendors in court
   */
  getVendors: (courtId: string, params?: PaginationParams & { status?: string }) => 
    apiClient.get<CourtVendorsResponse>(API_ENDPOINTS.courts.vendors(courtId), params as unknown as Record<string, string | number | boolean | undefined>),

  /**
   * Get vendor detail in court context
   */
  getVendorDetail: (courtId: string, vendorId: string) => 
    apiClient.get<{ vendor: Vendor }>(API_ENDPOINTS.courts.vendorDetail(courtId, vendorId)),

  // ============================================
  // Court Users
  // ============================================

  /**
   * Get users in court
   */
  getUsers: (courtId: string, params?: PaginationParams & { role?: string; status?: string }) => 
    apiClient.get<CourtUsersResponse>(API_ENDPOINTS.courts.users(courtId), params as unknown as Record<string, string | number | boolean | undefined>),

  // ============================================
  // Court Menu
  // ============================================

  /**
   * Get all menu items in court (across vendors)
   */
  getMenu: (courtId: string) => 
    apiClient.get<{ menuItems: MenuItem[] }>(API_ENDPOINTS.courts.menu(courtId)),

  /**
   * Search menu items
   */
  searchMenu: (courtId: string, params: { query: string; category?: string; vendorId?: string }) => 
    apiClient.get<MenuSearchResponse>(API_ENDPOINTS.courts.menuSearch(courtId), params),

  /**
   * Get hot/trending items
   */
  getHotItems: (courtId: string) => 
    apiClient.get<MenuItem[]>(API_ENDPOINTS.courts.hotItems(courtId)),

  // ============================================
  // Court Payments
  // ============================================

  /**
   * Get court payments
   */
  getPayments: (courtId: string, params?: PaginationParams & { status?: string; vendorId?: string }) => 
    apiClient.get<{ payments: unknown[]; pagination: PaginationResponse }>(API_ENDPOINTS.courts.payments(courtId), params as unknown as Record<string, string | number | boolean | undefined>),

  /**
   * Get court payouts
   */
  getPayouts: (courtId: string, params?: PaginationParams & { status?: string; vendorId?: string }) => 
    apiClient.get<{ payouts: unknown[]; pagination: PaginationResponse }>(API_ENDPOINTS.courts.payouts(courtId), params as unknown as Record<string, string | number | boolean | undefined>),
}
