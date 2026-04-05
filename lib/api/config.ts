/**
 * API Configuration
 * Central configuration for API endpoints and settings
 */

// API version for future versioning support
export const API_VERSION = 'v1'

// Base API path
export const API_BASE = '/api'

// Timeout in milliseconds
export const DEFAULT_TIMEOUT = 30000

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryOn: [408, 429, 500, 502, 503, 504],
}

/**
 * API Endpoints organized by domain
 * All endpoint definitions in one place for easy maintenance
 */
export const API_ENDPOINTS = {
  // ============================================
  // Auth Endpoints
  // ============================================
  auth: {
    login: `${API_BASE}/auth/login`,
    register: `${API_BASE}/auth/register`,
    sendOtp: `${API_BASE}/auth/send-otp`,
    verifyOtp: `${API_BASE}/auth/verify-otp`,
    checkAvailability: `${API_BASE}/auth/check-availability`,
    completeProfile: `${API_BASE}/auth/complete-profile`,
  },

  // ============================================
  // User Endpoints
  // ============================================
  users: {
    profile: `${API_BASE}/users/profile`,
    profileSendOtp: `${API_BASE}/users/profile/send-otp`,
    profileVerifyOtp: `${API_BASE}/users/profile/verify-otp`,
    orders: `${API_BASE}/users/orders`,
    byId: (userId: string) => `${API_BASE}/users/${userId}`,
    vendorProfile: (userId: string) => `${API_BASE}/users/${userId}/vendor-profile`,
  },

  // ============================================
  // Cart Endpoints
  // ============================================
  cart: {
    base: `${API_BASE}/cart`,
    item: (itemId: string) => `${API_BASE}/cart/${itemId}`,
    validate: (courtId: string) => `${API_BASE}/app/${courtId}/cart/validate`,
  },

  // ============================================
  // App (Customer) Endpoints
  // ============================================
  app: {
    vendors: (courtId: string) => `${API_BASE}/app/${courtId}/vendors`,
    vendorDetail: (vendorId: string) => `${API_BASE}/app/vendors/${vendorId}`,
    checkout: (courtId: string) => `${API_BASE}/app/${courtId}/checkout`,
    orders: {
      active: (courtId: string) => `${API_BASE}/app/${courtId}/orders/active`,
      status: (courtId: string) => `${API_BASE}/app/${courtId}/orders/status`,
      cancel: (courtId: string, orderId: string) => `${API_BASE}/app/${courtId}/orders/${orderId}/cancel`,
    },
  },

  // ============================================
  // Vendor Endpoints
  // ============================================
  vendors: {
    me: `${API_BASE}/vendors/me`,
    meStatus: `${API_BASE}/vendors/me/status`,
    profile: (vendorId: string) => `${API_BASE}/vendors/${vendorId}/profile`,
    onboarding: (vendorId: string) => `${API_BASE}/vendors/${vendorId}/onboarding`,
    menu: (vendorId: string) => `${API_BASE}/vendors/${vendorId}/menu`,
    menuItem: (vendorId: string, itemId: string) => `${API_BASE}/vendors/${vendorId}/menu/${itemId}`,
    categories: (vendorId: string) => `${API_BASE}/vendors/${vendorId}/categories`,
    category: (vendorId: string, categoryId: string) => `${API_BASE}/vendors/${vendorId}/categories/${categoryId}`,
    orders: (vendorId: string) => `${API_BASE}/vendors/${vendorId}/orders`,
    ordersStream: (vendorId: string) => `${API_BASE}/vendors/${vendorId}/orders/stream`,
    orderStatus: (vendorId: string, orderId: string) => `${API_BASE}/vendors/${vendorId}/orders/${orderId}/status`,
    manualOrder: (vendorId: string) => `${API_BASE}/vendors/${vendorId}/orders/manual`,
    queue: (vendorId: string) => `${API_BASE}/vendors/${vendorId}/queue`,
    analytics: (vendorId: string) => `${API_BASE}/vendors/${vendorId}/analytics`,
  },

  // ============================================
  // Court Endpoints
  // ============================================
  courts: {
    list: `${API_BASE}/courts`,
    byId: (courtId: string) => `${API_BASE}/courts/${courtId}`,
    settings: (courtId: string) => `${API_BASE}/courts/${courtId}/settings`,
    vendors: (courtId: string) => `${API_BASE}/courts/${courtId}/vendors`,
    vendorDetail: (courtId: string, vendorId: string) => `${API_BASE}/courts/${courtId}/vendors/${vendorId}`,
    users: (courtId: string) => `${API_BASE}/courts/${courtId}/users`,
    orders: (courtId: string) => `${API_BASE}/courts/${courtId}/orders`,
    menu: (courtId: string) => `${API_BASE}/courts/${courtId}/menu`,
    menuSearch: (courtId: string) => `${API_BASE}/courts/${courtId}/menu-items/search`,
    hotItems: (courtId: string) => `${API_BASE}/courts/${courtId}/hot-items`,
    payments: (courtId: string) => `${API_BASE}/courts/${courtId}/payments`,
    payouts: (courtId: string) => `${API_BASE}/courts/${courtId}/payouts`,
  },

  // ============================================
  // Order Endpoints
  // ============================================
  orders: {
    byId: (orderId: string) => `${API_BASE}/orders/${orderId}`,
    status: (orderId: string) => `${API_BASE}/orders/${orderId}/status`,
    rating: (orderId: string) => `${API_BASE}/orders/${orderId}/rating`,
    qrScan: `${API_BASE}/orders/qr-scan`,
    cancel: `${API_BASE}/orders/cancel`,
  },

  // ============================================
  // Payment Endpoints
  // ============================================
  payments: {
    vendorPayouts: `${API_BASE}/payments/vendor-payouts`,
    analytics: `${API_BASE}/payments/analytics`,
  },

  // ============================================
  // Razorpay Endpoints
  // ============================================
  razorpay: {
    verify: `${API_BASE}/razorpay/verify`,
    transfers: `${API_BASE}/razorpay/transfers`,
    webhook: `${API_BASE}/razorpay/webhook`,
  },

  // ============================================
  // Admin Endpoints
  // ============================================
  admin: {
    courts: `${API_BASE}/admin/courts`,
    vendors: {
      list: `${API_BASE}/admin/vendors`,
      byId: (id: string) => `${API_BASE}/admin/vendors/${id}`,
      razorpayStatus: (id: string) => `${API_BASE}/admin/vendors/${id}/razorpay-status`,
      razorpayAccount: (id: string) => `${API_BASE}/admin/vendors/${id}/razorpay-account`,
      validateIfsc: (ifsc: string) => `${API_BASE}/admin/vendors/validate-ifsc/${ifsc}`,
      checkDuplicates: `${API_BASE}/admin/vendors/check-duplicates`,
    },
    users: `${API_BASE}/admin/users`,
    paymentRequests: `${API_BASE}/admin/payment-requests`,
    auditLogs: {
      list: `${API_BASE}/admin/audit-logs`,
      byId: (logId: string) => `${API_BASE}/admin/audit-logs/${logId}`,
      preview: `${API_BASE}/admin/audit-logs/preview`,
    },
    onboarding: `${API_BASE}/admin/onboarding`,
    resetVendorPassword: `${API_BASE}/admin/reset-vendor-password`,
  },

  // ============================================
  // Analytics Endpoints
  // ============================================
  analytics: {
    dashboard: (courtId: string) => `${API_BASE}/analytics/${courtId}/dashboard`,
  },

  // ============================================
  // Upload Endpoints
  // ============================================
  upload: {
    base: `${API_BASE}/upload`,
    image: `${API_BASE}/upload/image`,
  },

  // ============================================
  // Notification Endpoints
  // ============================================
  notifications: {
    send: `${API_BASE}/notifications/send`,
  },

  // ============================================
  // PWA Endpoints
  // ============================================
  pwa: {
    manifest: `${API_BASE}/pwa/manifest`,
  },
} as const

/**
 * HTTP Error codes with descriptions
 */
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad Request - The request was invalid or cannot be served',
  401: 'Unauthorized - Authentication is required',
  403: 'Forbidden - You do not have permission to access this resource',
  404: 'Not Found - The requested resource could not be found',
  409: 'Conflict - The request conflicts with the current state',
  422: 'Unprocessable Entity - The request was well-formed but has semantic errors',
  429: 'Too Many Requests - You have exceeded the rate limit',
  500: 'Internal Server Error - Something went wrong on our end',
  502: 'Bad Gateway - The server received an invalid response',
  503: 'Service Unavailable - The server is temporarily unavailable',
  504: 'Gateway Timeout - The server did not respond in time',
}

/**
 * API Error codes used in the application
 */
export const API_ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Business logic errors
  ACTIVE_ORDER_EXISTS: 'ACTIVE_ORDER_EXISTS',
  VENDOR_INACTIVE: 'VENDOR_INACTIVE',
  ITEM_NOT_AVAILABLE: 'ITEM_NOT_AVAILABLE',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  ORDER_CANNOT_BE_CANCELLED: 'ORDER_CANNOT_BE_CANCELLED',
  
  // Payment errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_VERIFICATION_FAILED: 'PAYMENT_VERIFICATION_FAILED',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const
