/**
 * Admin API Service
 * Handles all admin-related API calls including courts, vendors, users
 */

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../config'
import type {
  Court,
  Vendor,
  User,
  PaginationParams,
  PaginationResponse,
} from '../types'

// ============================================
// Types
// ============================================

export interface AdminCourtListResponse {
  courts: Court[]
  pagination?: PaginationResponse
}

export interface AdminVendorResponse {
  vendor: Vendor
}

export interface PaymentRequestCreateData {
  vendorId: string
  courtId: string
  bankAccountNumber?: string
  bankIfscCode?: string
  bankAccountHolderName?: string
  bankName?: string
  panNumber?: string
  gstin?: string
  businessType?: string
  addressStreet1?: string
  addressStreet2?: string
  addressCity?: string
  addressState?: string
  addressPostalCode?: string
  addressCountry?: string
  resubmissionMessage?: string | null
}

export interface PaymentRequest {
  id: string
  vendorId: string
  vendor?: Vendor
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  requestedAt: string
  processedAt?: string
  notes?: string
}

export interface PaymentRequestListResponse {
  paymentRequests: PaymentRequest[]
  pagination?: PaginationResponse
}

export interface AuditLog {
  id: string
  courtId: string
  userId?: string
  user?: User
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface AuditLogListResponse {
  auditLogs: AuditLog[]
  pagination?: PaginationResponse
}

// ============================================
// Admin Courts API
// ============================================

export const adminCourtApi = {
  /**
   * List all courts (admin)
   */
  list: (params?: PaginationParams & { status?: string }) => 
    apiClient.get<AdminCourtListResponse>(API_ENDPOINTS.admin.courts, params as unknown as Record<string, string | number | boolean | undefined>),

  /**
   * Create a new court (admin)
   */
  create: (data: {
    courtId: string
    instituteName: string
    instituteType?: string
    contactEmail?: string
    contactPhone?: string
    status?: string
  }) => 
    apiClient.post<{ court: Court }>(API_ENDPOINTS.admin.courts, data),

  /**
   * Get onboarding status
   */
  getOnboarding: () => 
    apiClient.get<{ status: string; steps: Record<string, boolean> }>(API_ENDPOINTS.admin.onboarding),

  /**
   * Update onboarding step
   */
  updateOnboarding: (data: { step: string; completed: boolean; data?: Record<string, unknown> }) => 
    apiClient.post<{ status: string }>(API_ENDPOINTS.admin.onboarding, data),
}

// ============================================
// Admin Payment Requests API
// ============================================

export const adminPaymentApi = {
  /**
   * List payment requests
   */
  listRequests: (params?: PaginationParams & { status?: string; vendorId?: string; courtId?: string }) => 
    apiClient.get<PaymentRequestListResponse>(API_ENDPOINTS.admin.paymentRequests, params as unknown as Record<string, string | number | boolean | undefined>),

  /**
   * Create payment request
   */
  createRequest: (data: { vendorId: string; amount: number; notes?: string }) => 
    apiClient.post<{ paymentRequest: PaymentRequest }>(API_ENDPOINTS.admin.paymentRequests, data),

  /**
   * Update payment request status
   */
  updateRequest: (data: { requestId: string; status: 'approved' | 'rejected' | 'completed'; notes?: string }) => 
    apiClient.put<{ paymentRequest: PaymentRequest }>(API_ENDPOINTS.admin.paymentRequests, data),
}

// ============================================
// Admin Audit Logs API
// ============================================

export const adminAuditApi = {
  /**
   * List audit logs
   */
  list: (params?: PaginationParams & { 
    courtId?: string
    userId?: string
    action?: string
    entityType?: string
    startDate?: string
    endDate?: string 
  }) => 
    apiClient.get<AuditLogListResponse>(API_ENDPOINTS.admin.auditLogs.list, params as unknown as Record<string, string | number | boolean | undefined>),

  /**
   * Get audit log by ID
   */
  getById: (logId: string) => 
    apiClient.get<{ auditLog: AuditLog }>(API_ENDPOINTS.admin.auditLogs.byId(logId)),

  /**
   * Get audit logs preview (recent)
   */
  getPreview: (params?: { courtId?: string; limit?: number }) => 
    apiClient.get<{ auditLogs: AuditLog[] }>(API_ENDPOINTS.admin.auditLogs.preview, params),
}

// ============================================
// Admin Vendors API
// ============================================

export const adminVendorApi = {
  /**
   * Get vendor by ID
   */
  getById: (vendorId: string, courtId: string) => 
    apiClient.get<AdminVendorResponse>(
      `${API_ENDPOINTS.admin.vendors.byId(vendorId)}?courtId=${courtId}`
    ),

  /**
   * Update vendor
   */
  update: (vendorId: string, data: Partial<Vendor> & { courtId: string }) => 
    apiClient.patch<AdminVendorResponse>(
      API_ENDPOINTS.admin.vendors.byId(vendorId),
      data
    ),

  /**
   * Reset vendor password
   */
  resetPassword: (data: { email: string; courtId: string; newPassword: string }) => 
    apiClient.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.admin.resetVendorPassword,
      data
    ),

  /**
   * Create payment request for vendor
   */
  createPaymentRequest: (data: PaymentRequestCreateData) => 
    apiClient.post<{ success: boolean; message?: string }>(
      API_ENDPOINTS.admin.paymentRequests,
      data
    ),
}

// ============================================
// Admin Court Settings API
// ============================================

export interface CourtSettings {
  instituteName: string
  instituteType: string
  logoUrl?: string
  address: string
  contactPhone: string
  operatingHours: Record<string, {
    isOpen: boolean
    startTime: string
    endTime: string
    breakStart?: string
    breakEnd?: string
  }>
  enableOnlinePayments: boolean
  enableCOD: boolean
  razorpayKeyId?: string
  platformCommission: number
  maxOrdersPerStall: number
  orderBufferTime: number
  autoConfirmOrders: boolean
  allowAdvanceOrders: boolean
  requireEmailVerification: boolean
  requirePhoneVerification: boolean
  allowedEmailDomains: string[]
  maxOrdersPerUser: number
  timezone?: string
  minimumOrderAmount?: number
  maximumOrderAmount?: number
  orderCancellationWindow?: number
}

export const adminSettingsApi = {
  /**
   * Get court settings
   */
  get: (courtId: string) => 
    apiClient.get<{ settings: CourtSettings }>(
      API_ENDPOINTS.courts.settings(courtId)
    ),

  /**
   * Update court settings
   */
  update: (courtId: string, settings: Partial<CourtSettings>) => 
    apiClient.put<{ settings: CourtSettings }>(
      API_ENDPOINTS.courts.settings(courtId),
      settings
    ),
}

// ============================================
// Admin Orders API
// ============================================

export interface AdminOrder {
  id: string
  orderNumber: string
  customerName: string
  customerPhone?: string
  vendorName: string
  totalAmount: number
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  items: Array<{
    itemName: string
    quantity: number
    itemPrice: number
  }>
}

export interface AdminOrdersResponse {
  orders: AdminOrder[]
  pagination: {
    total: number
    totalPages: number
    page: number
    limit: number
  }
}

export const adminOrdersApi = {
  /**
   * List court orders
   */
  list: (courtId: string, params?: {
    page?: number
    limit?: number
    status?: string
    startDate?: string
    endDate?: string
  }) => 
    apiClient.get<AdminOrdersResponse>(
      API_ENDPOINTS.courts.orders(courtId),
      params as unknown as Record<string, string | number | boolean | undefined>
    ),
}

// ============================================
// Admin Payments API
// ============================================

export interface AdminPayment {
  id: string
  orderId: string
  orderNumber: string
  amount: number
  razorpayOrderId?: string
  razorpayPaymentId?: string
  vendorName: string
  customerName: string
  paymentMethod: 'online' | 'cod'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  createdAt: string
  updatedAt: string
}

export interface AdminPayout {
  id: string
  vendorId: string
  vendorName: string
  amount: number
  razorpayTransferId?: string
  status: 'pending' | 'processed' | 'reversed'
  transferDate: string
  ordersCount: number
}

export const adminPaymentsApi = {
  /**
   * List payments for a court
   */
  listPayments: (courtId: string, params?: {
    status?: string
    startDate?: string
    endDate?: string
  }) => 
    apiClient.get<{ payments: AdminPayment[] }>(
      API_ENDPOINTS.courts.payments(courtId),
      params
    ),

  /**
   * List payouts for a court
   */
  listPayouts: (courtId: string, params?: {
    status?: string
    startDate?: string
    endDate?: string
  }) => 
    apiClient.get<{ payouts: AdminPayout[] }>(
      API_ENDPOINTS.courts.payouts(courtId),
      params
    ),
}
