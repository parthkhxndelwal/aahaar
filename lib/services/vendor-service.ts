/**
 * Vendor Service
 * Handles vendor business logic
 */

import { Op } from 'sequelize'
import { Vendor, User, MenuItem, MenuCategory, Court } from '@/models'
import { ServiceError } from '@/lib/api-response'

export interface CreateVendorData {
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
  addressStreet1?: string
  addressStreet2?: string
  addressCity?: string
  addressState?: string
  addressPostalCode?: string
  addressCountry?: string
  onboardingStep?: string
  onboardingStatus?: string
}

export interface UpdateVendorData extends Partial<CreateVendorData> {
  status?: 'active' | 'inactive' | 'pending' | 'suspended'
  isOnline?: boolean
}

export interface VendorFilters {
  courtId: string
  status?: string
  onboarded?: boolean
  page?: number
  limit?: number
}

const DEFAULT_OPERATING_HOURS = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '18:00', closed: false },
  sunday: { open: '09:00', close: '18:00', closed: true },
}

export class VendorService {
  /**
   * Get vendor list with filters
   */
  static async getVendors(filters: VendorFilters) {
    const { courtId, status, onboarded, page = 1, limit = 10 } = filters
    const offset = (page - 1) * limit

    const whereClause: any = { courtId }

    if (status) {
      whereClause.status = status
    }

    if (onboarded !== undefined) {
      if (onboarded) {
        whereClause.onboardingStatus = 'completed'
      } else {
        whereClause.onboardingStatus = { [Op.ne]: 'completed' }
      }
    }

    const { count, rows } = await Vendor.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'fullName', 'phone'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    })

    return {
      vendors: rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1,
      },
    }
  }

  /**
   * Get vendor by ID
   */
  static async getVendorById(vendorId: string, includeMenu = false) {
    const include: any[] = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'fullName', 'phone'],
        required: false,
      },
      {
        model: Court,
        as: 'court',
        attributes: ['courtId', 'instituteName', 'status'],
        required: false,
      },
    ]

    if (includeMenu) {
      include.push({
        model: MenuItem,
        as: 'menuItems',
        where: { isAvailable: true },
        required: false,
        include: [
          {
            model: MenuCategory,
            as: 'menuCategory',
            attributes: ['id', 'name', 'color'],
          },
        ],
      })
      include.push({
        model: MenuCategory,
        as: 'categories',
        where: { isActive: true },
        required: false,
      })
    }

    const vendor = await Vendor.findByPk(vendorId, { include })

    if (!vendor) {
      throw new ServiceError('Vendor not found', 404, 'VENDOR_NOT_FOUND')
    }

    return vendor
  }

  /**
   * Get vendor by user ID
   */
  static async getVendorByUserId(userId: string) {
    const vendor = await Vendor.findOne({
      where: { userId },
      include: [
        {
          model: Court,
          as: 'court',
          attributes: ['courtId', 'instituteName', 'status'],
        },
      ],
    })

    if (!vendor) {
      throw new ServiceError('Vendor profile not found', 404, 'VENDOR_NOT_FOUND')
    }

    return vendor
  }

  /**
   * Create vendor
   */
  static async createVendor(data: CreateVendorData) {
    const normalizedEmail = data.contactEmail?.toLowerCase()

    // Check for duplicates
    const orChecks: any[] = []
    if (normalizedEmail) orChecks.push({ contactEmail: normalizedEmail })
    if (data.contactPhone) orChecks.push({ contactPhone: data.contactPhone })
    if (data.panNumber) orChecks.push({ panNumber: data.panNumber })

    if (orChecks.length > 0) {
      const existingVendor = await Vendor.findOne({
        where: {
          courtId: data.courtId,
          [Op.or]: orChecks,
        },
        attributes: ['id', 'contactEmail', 'contactPhone', 'panNumber'],
      })

      if (existingVendor) {
        let field = 'email'
        if (existingVendor.contactEmail === normalizedEmail) field = 'email'
        else if (existingVendor.contactPhone === data.contactPhone) field = 'phone'
        else if (data.panNumber && existingVendor.panNumber === data.panNumber) field = 'panNumber'
        
        throw new ServiceError(`A vendor with this ${field} already exists`, 409, 'DUPLICATE_VENDOR', { field })
      }
    }

    // Check for duplicate stall name
    const existingStall = await Vendor.findOne({
      where: {
        courtId: data.courtId,
        stallName: data.stallName,
      },
    })

    if (existingStall) {
      throw new ServiceError('A stall with this name already exists in this court', 409, 'DUPLICATE_STALL_NAME', { field: 'stallName' })
    }

    // Create vendor
    const vendor = await Vendor.create({
      courtId: data.courtId,
      stallName: data.stallName,
      vendorName: data.vendorName,
      contactEmail: normalizedEmail,
      contactPhone: data.contactPhone,
      stallLocation: data.stallLocation || null,
      cuisineType: data.cuisineType || 'general',
      description: data.description || null,
      logoUrl: data.logoUrl || null,
      bannerUrl: data.bannerUrl,
      operatingHours: data.operatingHours || DEFAULT_OPERATING_HOURS,
      bankAccountNumber: data.bankAccountNumber || '',
      bankIfscCode: data.bankIfscCode || '',
      bankAccountHolderName: data.bankAccountHolderName || '',
      bankName: data.bankName || '',
      panNumber: data.panNumber || '',
      gstin: data.gstin,
      maxOrdersPerHour: data.maxOrdersPerHour || 10,
      averagePreparationTime: data.averagePreparationTime || 15,
      onboardingStatus: data.onboardingStatus || 'in_progress',
      onboardingStep: data.onboardingStep || 'password',
      onboardingStartedAt: new Date(),
      metadata: {
        ...(data.businessType ? { businessType: data.businessType } : {}),
        ...(data.addressStreet1 || data.addressCity ? {
          registeredAddress: {
            addressStreet1: data.addressStreet1,
            addressStreet2: data.addressStreet2,
            addressCity: data.addressCity,
            addressState: data.addressState,
            addressPostalCode: data.addressPostalCode,
            addressCountry: data.addressCountry || 'IN',
          },
        } : {}),
        paymentStatus: 'not_requested',
      },
    })

    // Create associated user account
    let vendorUser = null
    try {
      const existingUser = await User.findOne({
        where: { email: normalizedEmail },
      })

      if (existingUser) {
        if (existingUser.role === 'vendor' && existingUser.vendorProfile) {
          throw new ServiceError('A vendor user account already exists with this email', 409, 'DUPLICATE_USER')
        }
        
        vendorUser = await existingUser.update({
          role: 'vendor',
          fullName: data.vendorName,
          phone: data.contactPhone,
          status: 'active',
          phoneVerified: true,
          emailVerified: true,
        })
      } else {
        vendorUser = await User.create({
          courtId: data.courtId,
          email: normalizedEmail,
          phone: data.contactPhone,
          fullName: data.vendorName,
          role: 'vendor',
          status: 'active',
          phoneVerified: true,
          emailVerified: true,
        })
      }

      await vendor.update({ userId: vendorUser.id })
    } catch (userError) {
      console.error('Error creating vendor user account:', userError)
      // Don't fail the vendor creation if user creation fails
    }

    return vendor
  }

  /**
   * Update vendor
   */
  static async updateVendor(vendorId: string, data: UpdateVendorData, userId?: string, isAdmin = false) {
    const vendor = await Vendor.findByPk(vendorId)

    if (!vendor) {
      throw new ServiceError('Vendor not found', 404, 'VENDOR_NOT_FOUND')
    }

    // Check authorization
    if (!isAdmin && userId && vendor.userId !== userId) {
      throw new ServiceError('Access denied', 403, 'FORBIDDEN')
    }

    // If email is being changed, check for duplicates
    if (data.contactEmail && data.contactEmail.toLowerCase() !== vendor.contactEmail) {
      const existingVendor = await Vendor.findOne({
        where: {
          courtId: vendor.courtId,
          contactEmail: data.contactEmail.toLowerCase(),
          id: { [Op.ne]: vendorId },
        },
      })

      if (existingVendor) {
        throw new ServiceError('A vendor with this email already exists', 409, 'DUPLICATE_VENDOR', { field: 'email' })
      }
    }

    // If stall name is being changed, check for duplicates
    if (data.stallName && data.stallName !== vendor.stallName) {
      const existingStall = await Vendor.findOne({
        where: {
          courtId: vendor.courtId,
          stallName: data.stallName,
          id: { [Op.ne]: vendorId },
        },
      })

      if (existingStall) {
        throw new ServiceError('A stall with this name already exists in this court', 409, 'DUPLICATE_STALL_NAME', { field: 'stallName' })
      }
    }

    await vendor.update(data)
    return vendor
  }

  /**
   * Update vendor status (online/offline)
   */
  static async updateVendorStatus(vendorId: string, isOnline: boolean, userId?: string) {
    const vendor = await Vendor.findByPk(vendorId)

    if (!vendor) {
      throw new ServiceError('Vendor not found', 404, 'VENDOR_NOT_FOUND')
    }

    if (userId && vendor.userId !== userId) {
      throw new ServiceError('Access denied', 403, 'FORBIDDEN')
    }

    await vendor.update({ isOnline })
    return vendor
  }

  /**
   * Delete vendor
   */
  static async deleteVendor(vendorId: string) {
    const vendor = await Vendor.findByPk(vendorId)

    if (!vendor) {
      throw new ServiceError('Vendor not found', 404, 'VENDOR_NOT_FOUND')
    }

    // Soft delete or hard delete based on requirements
    await vendor.update({ status: 'inactive' })
    return { success: true }
  }

  /**
   * Check if email/phone/stallName exists for validation
   */
  static async checkExists(courtId: string, checks: { email?: string; phone?: string; stallName?: string }) {
    const orConditions: any[] = []
    if (checks.email) orConditions.push({ contactEmail: checks.email })
    if (checks.phone) orConditions.push({ contactPhone: checks.phone })
    if (checks.stallName) orConditions.push({ stallName: checks.stallName })

    if (orConditions.length === 0) {
      return { exists: false, vendor: null }
    }

    const existingVendor = await Vendor.findOne({
      where: {
        courtId,
        [Op.or]: orConditions,
      },
      attributes: ['id', 'contactEmail', 'contactPhone', 'stallName'],
    })

    return {
      exists: !!existingVendor,
      vendor: existingVendor,
    }
  }
}
