/**
 * Vendor API Service
 * Handles all vendor-related API calls
 */

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../config'
import type {
  Vendor,
  VendorWithMenu,
  VendorListParams,
  VendorListResponse,
  CreateVendorRequest,
  UpdateVendorRequest,
  MenuItem,
  MenuCategory,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  VendorQueue,
  VendorAnalytics,
  OrderListParams,
  OrderListResponse,
  UpdateOrderStatusRequest,
  OrderWithDetails,
} from '../types'

export const vendorApi = {
  // ============================================
  // Vendor Profile
  // ============================================

  /**
   * Get current vendor profile (self)
   */
  getMe: () => 
    apiClient.get<{ vendor: Vendor }>(API_ENDPOINTS.vendors.me),

  /**
   * Update vendor status (online/offline)
   */
  updateMyStatus: (status: 'active' | 'inactive') => 
    apiClient.patch<{ vendor: Vendor }>(API_ENDPOINTS.vendors.meStatus, { status }),

  /**
   * Get vendor profile by ID
   */
  getProfile: (vendorId: string) => 
    apiClient.get<{ vendor: Vendor }>(API_ENDPOINTS.vendors.profile(vendorId)),

  /**
   * Update vendor profile
   */
  updateProfile: (vendorId: string, data: UpdateVendorRequest) => 
    apiClient.put<{ vendor: Vendor }>(API_ENDPOINTS.vendors.profile(vendorId), data),

  /**
   * Update onboarding progress
   */
  updateOnboarding: (vendorId: string, data: { step: string; data: Record<string, unknown> }) => 
    apiClient.patch<{ vendor: Vendor }>(API_ENDPOINTS.vendors.onboarding(vendorId), data),

  // ============================================
  // Menu Management
  // ============================================

  /**
   * Get vendor's menu (items and categories)
   */
  getMenu: (vendorId: string) => 
    apiClient.get<{ menuItems: MenuItem[]; categories: MenuCategory[] }>(API_ENDPOINTS.vendors.menu(vendorId)),

  /**
   * Create menu item
   */
  createMenuItem: (vendorId: string, data: CreateMenuItemRequest) => 
    apiClient.post<{ menuItem: MenuItem }>(API_ENDPOINTS.vendors.menu(vendorId), data),

  /**
   * Update menu item
   */
  updateMenuItem: (vendorId: string, itemId: string, data: UpdateMenuItemRequest) => 
    apiClient.put<{ menuItem: MenuItem }>(API_ENDPOINTS.vendors.menuItem(vendorId, itemId), data),

  /**
   * Delete menu item
   */
  deleteMenuItem: (vendorId: string, itemId: string) => 
    apiClient.delete<{ success: boolean }>(API_ENDPOINTS.vendors.menuItem(vendorId, itemId)),

  /**
   * Toggle menu item availability
   */
  toggleItemAvailability: (vendorId: string, itemId: string, isAvailable: boolean) => 
    apiClient.patch<{ menuItem: MenuItem }>(API_ENDPOINTS.vendors.menuItem(vendorId, itemId), { isAvailable }),

  // ============================================
  // Category Management
  // ============================================

  /**
   * Get vendor's categories
   */
  getCategories: (vendorId: string) => 
    apiClient.get<{ categories: MenuCategory[] }>(API_ENDPOINTS.vendors.categories(vendorId)),

  /**
   * Create category
   */
  createCategory: (vendorId: string, data: CreateCategoryRequest) => 
    apiClient.post<{ category: MenuCategory }>(API_ENDPOINTS.vendors.categories(vendorId), data),

  /**
   * Update category
   */
  updateCategory: (vendorId: string, categoryId: string, data: UpdateCategoryRequest) => 
    apiClient.put<{ category: MenuCategory }>(API_ENDPOINTS.vendors.category(vendorId, categoryId), data),

  /**
   * Delete category
   */
  deleteCategory: (vendorId: string, categoryId: string) => 
    apiClient.delete<{ success: boolean }>(API_ENDPOINTS.vendors.category(vendorId, categoryId)),

  // ============================================
  // Order Management
  // ============================================

  /**
   * Get vendor's orders
   */
  getOrders: (vendorId: string, params?: OrderListParams) => 
    apiClient.get<OrderListResponse>(API_ENDPOINTS.vendors.orders(vendorId), params as Record<string, string | number | boolean | undefined>),

  /**
   * Update order status
   */
  updateOrderStatus: (vendorId: string, orderId: string, data: UpdateOrderStatusRequest) => 
    apiClient.patch<{ order: OrderWithDetails }>(API_ENDPOINTS.vendors.orderStatus(vendorId, orderId), data),

  /**
   * Create manual order (walk-in)
   */
  createManualOrder: (vendorId: string, data: {
    items: Array<{ menuItemId?: string; name?: string; price?: number; quantity: number }>
    customerName?: string
    customerPhone?: string
    paymentMethod?: 'cash' | 'upi'
  }) => 
    apiClient.post<{ order: OrderWithDetails }>(API_ENDPOINTS.vendors.manualOrder(vendorId), data),

  // ============================================
  // Queue Management
  // ============================================

  /**
   * Get vendor's current queue
   */
  getQueue: (vendorId: string) => 
    apiClient.get<VendorQueue>(API_ENDPOINTS.vendors.queue(vendorId)),

  // ============================================
  // Analytics
  // ============================================

  /**
   * Get vendor analytics
   */
  getAnalytics: (vendorId: string, params?: { startDate?: string; endDate?: string }) => 
    apiClient.get<VendorAnalytics>(API_ENDPOINTS.vendors.analytics(vendorId), params),
}

// ============================================
// Admin Vendor API
// ============================================

export const adminVendorApi = {
  /**
   * List all vendors (admin)
   */
  list: (params: VendorListParams) => 
    apiClient.get<VendorListResponse>(API_ENDPOINTS.admin.vendors.list, params as unknown as Record<string, string | number | boolean | undefined>),

  /**
   * Create vendor (admin)
   */
  create: (data: CreateVendorRequest) => 
    apiClient.post<{ vendor: Vendor }>(API_ENDPOINTS.admin.vendors.list, data),

  /**
   * Get vendor by ID (admin)
   */
  getById: (id: string) => 
    apiClient.get<{ vendor: VendorWithMenu }>(API_ENDPOINTS.admin.vendors.byId(id)),

  /**
   * Update vendor (admin)
   */
  update: (id: string, data: UpdateVendorRequest) => 
    apiClient.put<{ vendor: Vendor }>(API_ENDPOINTS.admin.vendors.byId(id), data),

  /**
   * Delete vendor (admin)
   */
  delete: (id: string) => 
    apiClient.delete<{ success: boolean }>(API_ENDPOINTS.admin.vendors.byId(id)),

  /**
   * Get Razorpay account status
   */
  getRazorpayStatus: (id: string) => 
    apiClient.get<{ status: string; accountId?: string }>(API_ENDPOINTS.admin.vendors.razorpayStatus(id)),

  /**
   * Create/update Razorpay account
   */
  createRazorpayAccount: (id: string, data: { createNew?: boolean }) => 
    apiClient.post<{ accountId: string; status: string }>(API_ENDPOINTS.admin.vendors.razorpayAccount(id), data),

  /**
   * Validate IFSC code
   */
  validateIfsc: (ifsc: string) => 
    apiClient.get<{ valid: boolean; bankName?: string; branch?: string }>(API_ENDPOINTS.admin.vendors.validateIfsc(ifsc)),

  /**
   * Reset vendor password
   */
  resetPassword: (data: { vendorId: string; newPassword: string }) => 
    apiClient.post<{ success: boolean }>(API_ENDPOINTS.admin.resetVendorPassword, data),
}
