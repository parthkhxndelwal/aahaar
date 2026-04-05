/**
 * Config Service
 * Centralized configuration management
 * Extracts hardcoded values into a configurable service
 */

import { CourtSettings } from '@/models'

// Default configuration values
export const DEFAULT_CONFIG = {
  // Charges
  SERVICE_CHARGE_RATE: 0.05, // 5%
  PLATFORM_CHARGE: 5, // ₹5
  
  // Order settings
  DEFAULT_PREPARATION_TIME: 15, // minutes
  MAX_ORDERS_PER_HOUR: 10,
  MIN_ORDER_AMOUNT: 0,
  MAX_ORDER_AMOUNT: 10000,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // Auth
  OTP_EXPIRY_MINUTES: 10,
  JWT_EXPIRES_IN: '7d',
  
  // Queue settings
  QUEUE_POLL_INTERVAL: 5000, // 5 seconds
  
  // Stock settings
  DEFAULT_MIN_STOCK_LEVEL: 5,
  DEFAULT_MAX_STOCK_LEVEL: 100,
  
  // Platform commission
  PLATFORM_COMMISSION_RATE: 0.10, // 10%
  
  // Currency
  DEFAULT_CURRENCY: 'INR',
  CURRENCY_SYMBOL: '₹',
}

export interface ChargesConfig {
  serviceChargeRate: number
  platformCharge: number
  minOrderAmount: number
  maxOrderAmount: number
}

export interface OrderConfig {
  defaultPreparationTime: number
  maxOrdersPerHour: number
}

// Cache for court settings
const courtSettingsCache = new Map<string, { settings: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export class ConfigService {
  /**
   * Get charges configuration for a court
   */
  static async getChargesConfig(courtId: string): Promise<ChargesConfig> {
    const settings = await this.getCourtSettings(courtId)
    
    return {
      serviceChargeRate: settings?.serviceChargeRate ?? DEFAULT_CONFIG.SERVICE_CHARGE_RATE,
      platformCharge: settings?.platformCharge ?? DEFAULT_CONFIG.PLATFORM_CHARGE,
      minOrderAmount: settings?.minOrderAmount ?? DEFAULT_CONFIG.MIN_ORDER_AMOUNT,
      maxOrderAmount: settings?.maxOrderAmount ?? DEFAULT_CONFIG.MAX_ORDER_AMOUNT,
    }
  }

  /**
   * Get order configuration for a court
   */
  static async getOrderConfig(courtId: string): Promise<OrderConfig> {
    const settings = await this.getCourtSettings(courtId)
    
    return {
      defaultPreparationTime: settings?.defaultPreparationTime ?? DEFAULT_CONFIG.DEFAULT_PREPARATION_TIME,
      maxOrdersPerHour: settings?.maxOrdersPerHour ?? DEFAULT_CONFIG.MAX_ORDERS_PER_HOUR,
    }
  }

  /**
   * Calculate order charges
   */
  static async calculateCharges(courtId: string, subtotal: number): Promise<{
    subtotal: number
    serviceCharge: number
    platformCharge: number
    total: number
  }> {
    const config = await this.getChargesConfig(courtId)
    
    const serviceCharge = Math.round(subtotal * config.serviceChargeRate)
    const platformCharge = config.platformCharge
    const total = subtotal + serviceCharge + platformCharge
    
    return {
      subtotal,
      serviceCharge,
      platformCharge,
      total,
    }
  }

  /**
   * Get court settings with caching
   */
  static async getCourtSettings(courtId: string): Promise<any | null> {
    // Check cache
    const cached = courtSettingsCache.get(courtId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.settings
    }

    try {
      const settings = await CourtSettings.findOne({
        where: { courtId },
      })

      // Update cache
      courtSettingsCache.set(courtId, {
        settings,
        timestamp: Date.now(),
      })

      return settings
    } catch (error) {
      console.error('Error fetching court settings:', error)
      return null
    }
  }

  /**
   * Clear court settings cache
   */
  static clearCache(courtId?: string): void {
    if (courtId) {
      courtSettingsCache.delete(courtId)
    } else {
      courtSettingsCache.clear()
    }
  }

  /**
   * Get environment-specific config
   */
  static getEnvConfig() {
    return {
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-dev',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_CONFIG.JWT_EXPIRES_IN,
      databaseUrl: process.env.DATABASE_URL,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
      cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
      cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    }
  }

  /**
   * Get feature flags
   */
  static async getFeatureFlags(courtId: string): Promise<Record<string, boolean>> {
    const settings = await this.getCourtSettings(courtId)
    return settings?.features || {
      enableOnlinePayment: true,
      enableCashOnDelivery: true,
      enableUpiPayment: true,
      enableOrderTracking: true,
      enableRatings: true,
      enableNotifications: true,
    }
  }

  /**
   * Get payment methods for a court
   */
  static async getPaymentMethods(courtId: string): Promise<string[]> {
    const settings = await this.getCourtSettings(courtId)
    return settings?.paymentMethods || ['online', 'cash', 'upi']
  }

  /**
   * Get operating hours for a court
   */
  static async getOperatingHours(courtId: string): Promise<Record<string, { open: string; close: string; closed: boolean }>> {
    const settings = await this.getCourtSettings(courtId)
    return settings?.operatingHours || {
      monday: { open: '09:00', close: '21:00', closed: false },
      tuesday: { open: '09:00', close: '21:00', closed: false },
      wednesday: { open: '09:00', close: '21:00', closed: false },
      thursday: { open: '09:00', close: '21:00', closed: false },
      friday: { open: '09:00', close: '21:00', closed: false },
      saturday: { open: '09:00', close: '21:00', closed: false },
      sunday: { open: '09:00', close: '21:00', closed: false },
    }
  }

  /**
   * Check if court is currently open
   */
  static async isCourtOpen(courtId: string): Promise<boolean> {
    const hours = await this.getOperatingHours(courtId)
    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = dayNames[now.getDay()]
    const todayHours = hours[today]

    if (!todayHours || todayHours.closed) {
      return false
    }

    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    return currentTime >= todayHours.open && currentTime <= todayHours.close
  }
}
