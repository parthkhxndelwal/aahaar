/**
 * App (Customer) API Service
 * Handles customer-facing API calls
 */

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../config'
import type {
  Vendor,
  VendorWithMenu,
  MenuItem,
} from '../types'

interface VendorsResponse {
  vendors: Vendor[]
}

interface MenuItemWithVendor extends MenuItem {
  vendor?: {
    id: string
    stallName: string
    cuisineType?: string
    isOnline?: boolean
    averagePreparationTime?: number
  }
}

interface VendorMenuResponse {
  menuItems: MenuItemWithVendor[]
}

export const appApi = {
  /**
   * Get vendors for a court (customer view)
   */
  getVendors: (courtId: string, params?: { category?: string; search?: string }) => 
    apiClient.get<VendorsResponse>(API_ENDPOINTS.app.vendors(courtId), params),

  /**
   * Get vendor detail with menu (customer view)
   */
  getVendorDetail: (vendorId: string) => 
    apiClient.get<{ vendor: VendorWithMenu }>(API_ENDPOINTS.app.vendorDetail(vendorId)),

  /**
   * Get menu items for a specific vendor in a court (customer view)
   */
  getVendorMenu: (courtId: string, vendorId: string, params?: { category?: string }) =>
    apiClient.get<VendorMenuResponse>(API_ENDPOINTS.courts.menu(courtId), { 
      vendorId,
      ...params 
    }),

  /**
   * Get categories for a court (customer view)
   */
  getCategories: (courtId: string) =>
    apiClient.get<{ categories: Array<{ category: string; itemCount: number }> }>(`/api/app/${courtId}/categories`),

  /**
   * Get menu items by category (customer view)
   */
  getCategoryItems: (courtId: string, category: string) =>
    apiClient.get<{ items: MenuItemWithVendor[]; category: string }>(`/api/app/${courtId}/categories/${encodeURIComponent(category)}`),
}
