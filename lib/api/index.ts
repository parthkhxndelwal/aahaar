/**
 * API Module Index
 * Centralized exports for the API client and services
 */

// Core client
export { apiClient, ApiClient, ApiError } from './client'
export type { RequestConfig } from './client'

// Configuration
export { API_ENDPOINTS, API_ERROR_CODES, API_VERSION, DEFAULT_TIMEOUT } from './config'

// Types
export * from './types'

// Services
export { authApi } from './services/auth'
export { cartApi } from './services/cart'
export type { CartValidationResponse } from './services/cart'
export { vendorApi, adminVendorApi } from './services/vendor'
export { orderApi } from './services/order'
export type { OrderSummary, OrderStatusListResponse, OrderDetailsResponse } from './services/order'
export { courtApi } from './services/court'
export { userApi, adminUserApi } from './services/user'
export { appApi } from './services/app'
export { paymentApi } from './services/payment'
export { analyticsApi } from './services/analytics'
export { uploadApi } from './services/upload'
export { auditApi } from './services/audit'

// Admin Services
export { 
  adminCourtApi, 
  adminPaymentApi, 
  adminAuditApi,
  adminVendorApi as adminVendorDetailApi,
  adminSettingsApi,
  adminOrdersApi,
  adminPaymentsApi,
} from './services/admin'
export type { 
  AdminCourtListResponse, 
  PaymentRequest, 
  PaymentRequestListResponse, 
  AuditLog, 
  AuditLogListResponse,
  AdminVendorResponse,
  PaymentRequestCreateData,
  CourtSettings,
  AdminOrder,
  AdminOrdersResponse,
  AdminPayment,
  AdminPayout,
} from './services/admin'
