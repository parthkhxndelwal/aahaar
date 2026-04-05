/**
 * User API Service
 * Handles all user-related API calls
 */

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../config'
import type {
  User,
  UserProfile,
  UpdateProfileRequest,
  Vendor,
} from '../types'

export const userApi = {
  // ============================================
  // Profile Management
  // ============================================

  /**
   * Get current user profile
   */
  getProfile: () => 
    apiClient.get<{ user: UserProfile }>(API_ENDPOINTS.users.profile),

  /**
   * Update current user profile
   */
  updateProfile: (data: UpdateProfileRequest) => 
    apiClient.put<{ user: User }>(API_ENDPOINTS.users.profile, data),

  /**
   * Send OTP for profile verification
   */
  sendProfileOtp: (data: { phone?: string; email?: string; purpose: string }) => 
    apiClient.post<{ otpId: string }>(API_ENDPOINTS.users.profileSendOtp, data),

  /**
   * Verify profile OTP
   */
  verifyProfileOtp: (data: { otp: string; phone?: string; email?: string }) => 
    apiClient.post<{ verified: boolean }>(API_ENDPOINTS.users.profileVerifyOtp, data),

  // ============================================
  // User Management (Admin)
  // ============================================

  /**
   * Get user by ID
   */
  getById: (userId: string) => 
    apiClient.get<{ user: User }>(API_ENDPOINTS.users.byId(userId)),

  /**
   * Update user by ID
   */
  updateById: (userId: string, data: Partial<User>) => 
    apiClient.put<{ user: User }>(API_ENDPOINTS.users.byId(userId), data),

  /**
   * Get user's vendor profile
   */
  getVendorProfile: (userId: string) => 
    apiClient.get<{ vendor: Vendor }>(API_ENDPOINTS.users.vendorProfile(userId)),

  /**
   * Create/update user's vendor profile
   */
  updateVendorProfile: (userId: string, data: Partial<Vendor>) => 
    apiClient.put<{ vendor: Vendor }>(API_ENDPOINTS.users.vendorProfile(userId), data),
}

// ============================================
// Admin User API
// ============================================

export const adminUserApi = {
  /**
   * List all users
   */
  list: (params?: { courtId?: string; role?: string; status?: string; page?: number; limit?: number }) => 
    apiClient.get<{ users: User[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
      API_ENDPOINTS.admin.users, 
      params as unknown as Record<string, string | number | boolean | undefined>
    ),
}
