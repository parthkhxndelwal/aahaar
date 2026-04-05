/**
 * Order API Service
 * Handles all order-related API calls
 */

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../config'
import type {
  OrderWithDetails,
  OrderListParams,
  OrderListResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  UpdateOrderStatusRequest,
} from '../types'

// Order status response types
interface OrderItem {
  id: string
  name: string
  description?: string
  quantity: number
  price: number
  subtotal: number
  imageUrl?: string
  customizations?: unknown
}

interface VendorOrder {
  id: string
  orderNumber: string
  vendor: {
    id: string
    stallName: string
    vendorName: string
  }
  items: OrderItem[]
  totalAmount: number
  status: string
  paymentMethod?: string
  paymentStatus?: string
  estimatedPreparationTime: number
  queuePosition?: number
  specialInstructions?: string
  statusHistory?: unknown
  timeline?: {
    createdAt: string
    acceptedAt?: string
    preparingAt?: string
    readyAt?: string
    completedAt?: string
    rejectedAt?: string
  }
  createdAt: string
  acceptedAt?: string
  preparingAt?: string
  readyAt?: string
  completedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  refundAmount?: number
  refundStatus?: string
}

export interface OrderSummary {
  parentOrderId: string
  orderOtp: string
  orders: VendorOrder[]
  totalAmount: number
  overallStatus: string
  createdAt: string
  vendorsCount: number
  completedVendors: number
  rejectedVendors: number
  cancelledVendors: number
}

export interface OrderStatusListResponse {
  success: boolean
  data: {
    orderSummaries: OrderSummary[]
    pagination: {
      page: number
      limit: number
      totalCount: number
      totalPages: number
    }
  }
}

export interface OrderDetailsResponse {
  success: boolean
  data: {
    parentOrderId: string
    orderOtp: string
    createdAt: string
    totalAmount: number
    orders: VendorOrder[]
    summary: {
      totalVendors: number
      completedVendors: number
      pendingVendors: number
      preparingVendors: number
      readyVendors: number
      rejectedVendors: number
      grandTotal: number
      totalRefunds?: number
    }
  }
}

export const orderApi = {
  // ============================================
  // Customer Orders
  // ============================================

  /**
   * Create order from cart (checkout)
   */
  checkout: (courtId: string, data: CreateOrderRequest) => 
    apiClient.post<CreateOrderResponse>(API_ENDPOINTS.app.checkout(courtId), data),

  /**
   * Get active orders for current user
   */
  getActiveOrders: (courtId: string) => 
    apiClient.get<{ activeOrders: OrderWithDetails[] }>(API_ENDPOINTS.app.orders.active(courtId)),

  /**
   * Get order status list (GET)
   */
  getOrderStatusList: (courtId: string, params?: { 
    parentOrderId?: string
    status?: string
    activeOnly?: boolean
    page?: number
    limit?: number 
  }) => 
    apiClient.get<OrderStatusListResponse['data']>(API_ENDPOINTS.app.orders.status(courtId), params as unknown as Record<string, string | number | boolean | undefined>),

  /**
   * Get specific order details by parentOrderId (POST)
   */
  getOrderDetails: (courtId: string, parentOrderId: string) => 
    apiClient.post<OrderDetailsResponse['data']>(API_ENDPOINTS.app.orders.status(courtId), { parentOrderId }),

  /**
   * Cancel order
   */
  cancelOrder: (courtId: string, orderId: string, data?: { reason?: string }) => 
    apiClient.post<{ order: OrderWithDetails }>(API_ENDPOINTS.app.orders.cancel(courtId, orderId), data),

  /**
   * Cancel order (generic endpoint)
   */
  cancelOrderGeneric: (data: { courtId: string; orderId: string; cancelReason?: string }) => 
    apiClient.post<{ success: boolean; message?: string }>(API_ENDPOINTS.orders.cancel, data),

  /**
   * Get user's order history
   */
  getUserOrders: (params?: OrderListParams) => 
    apiClient.get<OrderListResponse>(API_ENDPOINTS.users.orders, params as unknown as Record<string, string | number | boolean | undefined>),

  // ============================================
  // Order Details
  // ============================================

  /**
   * Get order by ID
   */
  getById: (orderId: string) => 
    apiClient.get<{ order: OrderWithDetails }>(API_ENDPOINTS.orders.byId(orderId)),

  /**
   * Update order status (generic)
   */
  updateStatus: (orderId: string, data: UpdateOrderStatusRequest) => 
    apiClient.patch<{ order: OrderWithDetails }>(API_ENDPOINTS.orders.status(orderId), data),

  /**
   * Submit order rating
   */
  submitRating: (orderId: string, data: { rating: number; review?: string }) => 
    apiClient.post<{ success: boolean }>(API_ENDPOINTS.orders.rating(orderId), data),

  /**
   * Scan QR code for order
   */
  scanQr: (data: { qrCode: string }) => 
    apiClient.post<{ order: OrderWithDetails }>(API_ENDPOINTS.orders.qrScan, data),

  // ============================================
  // Court/Admin Orders
  // ============================================

  /**
   * Get court orders (admin)
   */
  getCourtOrders: (courtId: string, params?: OrderListParams) => 
    apiClient.get<OrderListResponse>(API_ENDPOINTS.courts.orders(courtId), params as unknown as Record<string, string | number | boolean | undefined>),
}
