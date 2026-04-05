/**
 * Auth API Service
 * Handles all authentication-related API calls
 */

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../config'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  SendOtpRequest,
  SendOtpResponse,
} from '../types'

export const authApi = {
  /**
   * Send OTP to phone number
   */
  sendOtp: (data: SendOtpRequest) => 
    apiClient.post<SendOtpResponse>(API_ENDPOINTS.auth.sendOtp, data, { skipAuth: true }),

  /**
   * Verify OTP (custom OTP flow for customer app)
   */
  verifyOtp: (data: { phone: string; otp: string; courtId: string; type: 'login' | 'signup'; name?: string }) => 
    apiClient.post<{ success: boolean; token: string; user: any; message?: string }>(API_ENDPOINTS.auth.verifyOtp, data, { skipAuth: true }),

  /**
   * Login with phone and OTP
   */
  login: (data: LoginRequest) => 
    apiClient.post<LoginResponse>(API_ENDPOINTS.auth.login, data, { skipAuth: true }),

  /**
   * Register new user
   */
  register: (data: RegisterRequest) => 
    apiClient.post<RegisterResponse>(API_ENDPOINTS.auth.register, data, { skipAuth: true }),

  /**
   * Check if email/phone is available
   */
  checkAvailability: (params: { email?: string; phone?: string }) => 
    apiClient.get<{ available: boolean; field: string }>(API_ENDPOINTS.auth.checkAvailability, params, { skipAuth: true }),

  /**
   * Complete profile after initial registration
   */
  completeProfile: (data: { fullName: string; email?: string }) => 
    apiClient.post<{ user: import('../types').User }>(API_ENDPOINTS.auth.completeProfile, data),
}
