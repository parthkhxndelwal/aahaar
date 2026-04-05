/**
 * Services Index
 * Export all services from a single entry point
 */

export { CartService } from './cart-service'
export { OrderService } from './order-service'
export type { OrderItemInput, CreateOrderPayload, OrderResult } from './order-service'

export { AuthService } from './auth-service'
export type { LoginCredentials, TokenPayload, LoginResult } from './auth-service'

export { VendorService } from './vendor-service'
export type { CreateVendorData, UpdateVendorData, VendorFilters } from './vendor-service'

export { MenuService } from './menu-service'
export type { CreateMenuItemData, UpdateMenuItemData, CreateCategoryData, UpdateCategoryData, MenuFilters } from './menu-service'

export { ConfigService, DEFAULT_CONFIG } from './config-service'
export type { ChargesConfig, OrderConfig } from './config-service'
