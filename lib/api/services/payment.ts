/**
 * Payment API Service
 * Handles all payment-related API calls
 */

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../config'
import type {
  Payment,
  PaymentRequest,
  CreateRazorpayOrderResponse,
  VerifyPaymentRequest,
  PaginationParams,
  PaginationResponse,
} from '../types'

interface PayoutListResponse {
  payouts: PaymentRequest[]
  pagination: PaginationResponse
}

interface PaymentAnalyticsResponse {
  totalRevenue: number
  totalTransactions: number
  pendingPayouts: number
  completedPayouts: number
  revenueByDay: Array<{ date: string; revenue: number }>
  revenueByVendor: Array<{ vendorId: string; vendorName: string; revenue: number }>
}

export const paymentApi = {
  // ============================================
  // Razorpay Integration
  // ============================================

  /**
   * Verify Razorpay payment
   */
  verifyPayment: (data: VerifyPaymentRequest) => 
    apiClient.post<{ success: boolean; payment: Payment }>(API_ENDPOINTS.razorpay.verify, data),

  /**
   * Get payment transfers
   */
  getTransfers: (params?: { orderId?: string }) => 
    apiClient.get<{ transfers: unknown[] }>(API_ENDPOINTS.razorpay.transfers, params),

  // ============================================
  // Vendor Payouts
  // ============================================

  /**
   * Get vendor payouts
   */
  getVendorPayouts: (params?: PaginationParams & { vendorId?: string; status?: string }) => 
    apiClient.get<PayoutListResponse>(API_ENDPOINTS.payments.vendorPayouts, params as unknown as Record<string, string | number | boolean | undefined>),

  /**
   * Create payout request
   */
  createPayoutRequest: (data: { vendorId: string; amount: number }) => 
    apiClient.post<{ paymentRequest: PaymentRequest }>(API_ENDPOINTS.payments.vendorPayouts, data),

  // ============================================
  // Payment Analytics
  // ============================================

  /**
   * Get payment analytics
   */
  getAnalytics: (params?: { courtId?: string; startDate?: string; endDate?: string }) => 
    apiClient.get<PaymentAnalyticsResponse>(API_ENDPOINTS.payments.analytics, params),

  // ============================================
  // Admin Payment Requests
  // ============================================

  /**
   * Get payment requests (admin)
   */
  getPaymentRequests: (params?: PaginationParams & { courtId?: string; status?: string }) => 
    apiClient.get<{ requests: PaymentRequest[]; pagination: PaginationResponse }>(
      API_ENDPOINTS.admin.paymentRequests, 
      params as unknown as Record<string, string | number | boolean | undefined>
    ),

  /**
   * Update payment request (admin)
   */
  updatePaymentRequest: (requestId: string, data: { status: string; adminNote?: string }) => 
    apiClient.patch<{ request: PaymentRequest }>(`${API_ENDPOINTS.admin.paymentRequests}/${requestId}`, data),
}
