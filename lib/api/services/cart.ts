/**
 * Cart API Service
 * Handles all cart-related API calls
 */

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../config'
import type {
  Cart,
  CartSummary,
  AddToCartRequest,
  UpdateCartItemRequest,
} from '../types'

interface CartResponse {
  cart: Cart & { summary?: CartSummary['summary'] }
}

interface ValidationIssue {
  type: 'vendor_offline' | 'item_unavailable' | 'out_of_stock' | 'item_inactive' | 'no_stock' | 'insufficient_stock'
  message: string
}

interface ValidationResult {
  cartItemId: string
  menuItemId: string
  itemName: string
  vendorName: string
  quantity: number
  isValid: boolean
  issues: ValidationIssue[]
}

interface ValidationSummary {
  totalItems: number
  validItems: number
  invalidItems: number
  offlineVendors: string[]
  unavailableItems: string[]
  stockIssues: Array<{
    name: string
    requested: number
    available: number
  }>
}

export interface CartValidationResponse {
  success: boolean
  valid: boolean
  message: string
  validationResults: ValidationResult[]
  summary: ValidationSummary
}

export const cartApi = {
  /**
   * Get current cart
   */
  getCart: () => 
    apiClient.get<CartResponse>(API_ENDPOINTS.cart.base),

  /**
   * Add item to cart
   */
  addItem: (data: AddToCartRequest) => 
    apiClient.post<CartResponse>(API_ENDPOINTS.cart.base, data),

  /**
   * Update cart item quantity
   */
  updateItem: (itemId: string, data: UpdateCartItemRequest) => 
    apiClient.put<CartResponse>(API_ENDPOINTS.cart.item(itemId), data),

  /**
   * Remove item from cart
   */
  removeItem: (itemId: string) => 
    apiClient.delete<CartResponse>(API_ENDPOINTS.cart.item(itemId)),

  /**
   * Clear entire cart
   */
  clearCart: () => 
    apiClient.delete<CartResponse>(API_ENDPOINTS.cart.base),

  /**
   * Validate cart before checkout (POST method)
   */
  validateCart: (courtId: string) => 
    apiClient.post<CartValidationResponse>(API_ENDPOINTS.cart.validate(courtId)),
}
