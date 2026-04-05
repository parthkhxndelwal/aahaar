/**
 * Centralized API Types
 * All API request/response types are defined here for type safety
 */

// ============================================
// Common Types
// ============================================

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResponse {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  message: string
  code?: string
  details?: unknown
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
  phone: string
  otp: string
  courtId?: string
  role?: 'customer' | 'vendor' | 'admin'
}

export interface LoginResponse {
  token: string
  user: User
  vendor?: Vendor
}

export interface SendOtpRequest {
  phone: string
  purpose?: 'login' | 'register' | 'verify'
}

export interface SendOtpResponse {
  otpId: string
  expiresIn: number
}

export interface RegisterRequest {
  phone: string
  otp: string
  fullName: string
  email?: string
  courtId: string
}

export interface RegisterResponse {
  token: string
  user: User
}

// ============================================
// User Types
// ============================================

export interface User {
  id: string
  email?: string
  phone: string
  fullName: string
  role: 'customer' | 'vendor' | 'admin' | 'super_admin'
  status: 'active' | 'inactive' | 'suspended'
  courtId?: string
  phoneVerified: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface UserProfile extends User {
  court?: Court
  orders?: Order[]
}

export interface UpdateProfileRequest {
  fullName?: string
  email?: string
}

// ============================================
// Court Types
// ============================================

export interface Court {
  courtId: string
  instituteName: string
  instituteType: string
  status: 'active' | 'inactive' | 'pending'
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  contactEmail?: string
  contactPhone?: string
  logoUrl?: string
  bannerUrl?: string
  timezone?: string
  currency?: string
  createdAt: string
  updatedAt: string
}

export interface CourtSettings {
  id: string
  courtId: string
  serviceChargeRate: number
  platformCharge: number
  minOrderAmount: number
  maxOrderAmount: number
  operatingHours: Record<string, { open: string; close: string; closed: boolean }>
  paymentMethods: string[]
  features: Record<string, boolean>
}

// ============================================
// Vendor Types
// ============================================

export interface Vendor {
  id: string
  courtId: string
  userId?: string
  stallName: string
  vendorName: string
  description?: string
  contactEmail: string
  contactPhone: string
  stallLocation?: string
  cuisineType: string
  logoUrl?: string
  bannerUrl?: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  rating?: number
  totalOrders?: number
  operatingHours?: Record<string, { open: string; close: string; closed: boolean }>
  averagePreparationTime?: number
  maxOrdersPerHour?: number
  onboardingStatus: 'pending' | 'in_progress' | 'completed'
  onboardingStep?: string
  createdAt: string
  updatedAt: string
}

export interface VendorWithMenu extends Vendor {
  categories: MenuCategory[]
  menuItems: MenuItem[]
}

export interface CreateVendorRequest {
  courtId: string
  stallName: string
  vendorName: string
  contactEmail: string
  contactPhone: string
  stallLocation?: string
  cuisineType?: string
  description?: string
  logoUrl?: string
  bannerUrl?: string
  operatingHours?: Record<string, { open: string; close: string; closed: boolean }>
  bankAccountNumber?: string
  bankIfscCode?: string
  bankAccountHolderName?: string
  bankName?: string
  panNumber?: string
  gstin?: string
  maxOrdersPerHour?: number
  averagePreparationTime?: number
  businessType?: string
}

export interface UpdateVendorRequest extends Partial<CreateVendorRequest> {
  status?: 'active' | 'inactive' | 'pending' | 'suspended'
}

export interface VendorListParams extends PaginationParams {
  courtId: string
  status?: string
  onboarded?: boolean
}

export interface VendorListResponse {
  vendors: Vendor[]
  pagination: PaginationResponse & {
    hasNext: boolean
    hasPrev: boolean
    currentPage: number
    totalItems: number
  }
}

// ============================================
// Menu Types
// ============================================

export interface MenuCategory {
  id: string
  vendorId: string
  name: string
  description?: string
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MenuItem {
  id: string
  vendorId: string
  categoryId?: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  isVegetarian: boolean
  isVegan?: boolean
  spiceLevel?: 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot'
  allergens?: string[]
  nutritionalInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
  preparationTime?: number
  displayOrder?: number
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateMenuItemRequest {
  categoryId?: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isAvailable?: boolean
  isVegetarian?: boolean
  isVegan?: boolean
  spiceLevel?: string
  allergens?: string[]
  nutritionalInfo?: Record<string, number>
  preparationTime?: number
  tags?: string[]
}

export interface UpdateMenuItemRequest extends Partial<CreateMenuItemRequest> {}

export interface CreateCategoryRequest {
  name: string
  description?: string
  displayOrder?: number
  isActive?: boolean
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

// ============================================
// Cart Types
// ============================================

export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  subtotal: number
  customizations?: Record<string, unknown>
  vendorId: string
  vendorName?: string
  imageUrl?: string
}

export interface Cart {
  items: CartItem[]
  total: number
}

export interface CartSummary {
  cartId: string
  items: CartItem[]
  vendorGroups: Record<string, {
    vendor: { id: string; name: string }
    items: CartItem[]
    subtotal: number
  }>
  summary: {
    subtotal: number
    serviceCharge: number
    platformCharge: number
    total: number
    itemCount: number
  }
}

export interface AddToCartRequest {
  menuItemId: string
  quantity?: number
  customizations?: Record<string, unknown>
}

export interface UpdateCartItemRequest {
  quantity: number
}

// ============================================
// Order Types
// ============================================

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'completed' 
  | 'cancelled' 
  | 'rejected'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface Order {
  id: string
  orderNumber: string
  courtId: string
  userId?: string
  vendorId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: 'online' | 'cash' | 'upi' | 'cod'
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  specialInstructions?: string
  estimatedPreparationTime?: number
  orderOtp?: string
  parentOrderId?: string
  isSubOrder?: boolean
  type?: 'user_initiated' | 'vendor_initiated'
  statusHistory?: Array<{
    status: OrderStatus
    timestamp: string
    note?: string
  }>
  createdAt: string
  updatedAt: string
}

export interface OrderWithDetails extends Order {
  vendor?: Vendor
  user?: User
  orderItems: OrderItem[]
  payment?: Payment
}

export interface OrderItem {
  id: string
  orderId: string
  menuItemId?: string
  itemName: string
  itemPrice: number
  quantity: number
  subtotal: number
  customizations?: Record<string, unknown>
  specialInstructions?: string
  menuItem?: MenuItem
}

export interface CreateOrderRequest {
  items: Array<{
    menuItemId?: string
    name?: string
    price?: number
    quantity: number
    customizations?: Record<string, unknown>
    specialInstructions?: string
  }>
  paymentMethod?: 'online' | 'cash' | 'upi' | 'cod'
  specialInstructions?: string
}

export interface CreateOrderResponse {
  parentOrderId: string
  orderOtp: string
  orders: OrderWithDetails[]
  totalAmount: number
  grandTotal: number
  charges: {
    serviceCharge: number
    platformCharge: number
  }
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus
  note?: string
}

export interface OrderListParams extends PaginationParams {
  status?: OrderStatus | OrderStatus[]
  date?: string
  vendorId?: string
  userId?: string
  activeOnly?: boolean
}

export interface OrderListResponse {
  orders: OrderWithDetails[]
  pagination: PaginationResponse
}

// ============================================
// Payment Types
// ============================================

export interface Payment {
  id: string
  orderId: string
  paymentMethod: string
  amount: number
  status: PaymentStatus
  transactionId?: string
  razorpayPaymentId?: string
  razorpayOrderId?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface PaymentRequest {
  id: string
  vendorId: string
  courtId: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  requestedAt: string
  processedAt?: string
  adminNote?: string
}

export interface CreateRazorpayOrderRequest {
  amount: number
  orderId: string
}

export interface CreateRazorpayOrderResponse {
  razorpayOrderId: string
  amount: number
  currency: string
  key: string
}

export interface VerifyPaymentRequest {
  razorpayPaymentId: string
  razorpayOrderId: string
  razorpaySignature: string
  orderId: string
}

// ============================================
// Analytics Types
// ============================================

export interface DashboardAnalytics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  activeVendors: number
  activeUsers: number
  ordersByStatus: Record<OrderStatus, number>
  revenueByDay: Array<{ date: string; revenue: number }>
  topVendors: Array<{ vendor: Vendor; orderCount: number; revenue: number }>
  topItems: Array<{ item: MenuItem; orderCount: number }>
}

export interface VendorAnalytics {
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  totalRevenue: number
  averageOrderValue: number
  averagePreparationTime: number
  rating: number
  ordersByDay: Array<{ date: string; count: number; revenue: number }>
  topItems: Array<{ item: MenuItem; orderCount: number }>
}

// ============================================
// Queue Types
// ============================================

export interface QueueItem {
  order: OrderWithDetails
  position: number
  estimatedWaitTime: number
}

export interface VendorQueue {
  items: QueueItem[]
  totalCount: number
  averageWaitTime: number
}

// ============================================
// Audit Log Types
// ============================================

export interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  userId?: string
  courtId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface AuditLogListParams extends PaginationParams {
  courtId?: string
  userId?: string
  entity?: string
  action?: string
  startDate?: string
  endDate?: string
}
