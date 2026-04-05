import {
  Order,
  OrderItem,
  User,
  Vendor,
  MenuItem,
  Payment,
  sequelize,
  // @ts-ignore
} from '@/models'
import { Op, Transaction } from 'sequelize'
import { ServiceError } from '@/lib/api-response'

// Types
export interface OrderItemInput {
  menuItemId?: string | null
  // Name and Price can be provided for manual items or overrides
  name?: string 
  price?: number
  quantity: number
  customizations?: any
  specialInstructions?: string
}

export interface CreateOrderPayload {
  userId?: string // Optional for manual orders (guest/walk-in)
  courtId: string
  vendorId?: string // Optional, enforces single-vendor order if present
  items: OrderItemInput[]
  customerDetails?: {
    name: string
    phone: string
    email?: string
  }
  paymentMethod?: 'online' | 'cash' | 'upi' | 'cod'
  specialInstructions?: string
  skipActiveOrderCheck?: boolean
  applyCharges?: boolean // Whether to apply service/platform charges
  orderSource?: 'app_checkout' | 'admin_create' | 'vendor_manual'
}

export interface OrderResult {
  parentOrderId: string
  orderOtp: string
  orders: any[]
  totalAmount: number
  grandTotal: number
  charges: {
    serviceCharge: number
    platformCharge: number
  }
}

export class OrderService {
  /**
   * Core function to create orders (supports multi-vendor split)
   */
  static async createOrder(payload: CreateOrderPayload): Promise<OrderResult> {
    const {
      userId,
      courtId,
      items,
      paymentMethod = 'online',
      specialInstructions = '',
      skipActiveOrderCheck = false,
      applyCharges = true,
      orderSource = 'app_checkout',
      customerDetails,
      vendorId: enforceVendorId
    } = payload

    // 1. Validate Active Orders (if needed)
    if (!skipActiveOrderCheck && userId) {
      const activeOrders = await Order.findAll({
        where: {
          userId,
          courtId,
          status: {
            [Op.notIn]: ['completed', 'rejected', 'cancelled'],
          },
        },
        attributes: ['id', 'orderNumber', 'status'],
      })

      if (activeOrders.length > 0) {
        throw new ServiceError(
          'You have an active order. Please wait for it to complete.',
          400,
          'ACTIVE_ORDER_EXISTS',
          { activeOrders }
        )
      }
    }

    // 2. Fetch Menu Items & Vendor Details
    // Filter items that have menuItemId
    const menuItemIds = items.filter(i => i.menuItemId).map((i) => i.menuItemId)
    let menuItems: any[] = []
    
    if (menuItemIds.length > 0) {
      menuItems = await MenuItem.findAll({
        where: {
          id: { [Op.in]: menuItemIds },
        },
        include: [
          {
            model: Vendor,
            as: 'vendor',
            attributes: ['id', 'stallName', 'vendorName', 'razorpayAccountId', 'status', 'averagePreparationTime'],
          },
        ],
      })
      
      // Validate all requested menu items exist
      if (menuItems.length !== menuItemIds.length) {
        throw new ServiceError('Some menu items not found', 400, 'ITEM_NOT_FOUND')
      }
    }

    // 3. User Details Fallback
    let userDetails = customerDetails
    if (!userDetails && userId) {
      const user = await User.findByPk(userId)
      if (user) {
        userDetails = {
          name: user.fullName,
          phone: user.phone,
          email: user.email,
        }
      }
    }
    
    // If still no user details (e.g., manual order without user account)
    if (!userDetails) {
      if (orderSource === 'app_checkout') {
        throw new ServiceError('User details required', 400, 'USER_REQUIRED')
      }
      userDetails = { name: 'Guest', phone: '', email: '' }
    }

    // 4. Group Items by Vendor & Calculate Totals
    const vendorGroups: Record<string, { vendor: any; items: any[]; subtotal: number }> = {}
    let grandTotal = 0

    for (const itemInput of items) {
      let menuItem: any = null
      let vendorId: string | undefined = undefined
      let price = itemInput.price || 0
      let name = itemInput.name || 'Custom Item'
      let vendor: any = null

      if (itemInput.menuItemId) {
        menuItem = menuItems.find((m: any) => m.id === itemInput.menuItemId)
        vendorId = menuItem.vendor.id
        price = menuItem.price // Always trust DB price for menu items unless overridden?
        if (orderSource !== 'app_checkout' && itemInput.price !== undefined) {
          price = itemInput.price // Allow override for admin/manual
        }
        name = menuItem.name
        vendor = menuItem.vendor
        
        // Validation: Check Vendor Status only for app orders
        if (orderSource === 'app_checkout' && vendor.status !== 'active') {
          throw new ServiceError(`Vendor ${vendor.stallName} is currently unavailable`, 400, 'VENDOR_INACTIVE')
        }
      } else {
        // Validation: Manual item must rely on enforceVendorId
        if (!enforceVendorId) {
             throw new ServiceError('Cannot create custom item without explicit vendorId', 400, 'VENDOR_ID_REQUIRED')
        }
        vendorId = enforceVendorId
        // Fetch vendor if not already fetched (optimization: fetch once if needed, but here inside loop for simplicity or assume passed)
        // For simplicity, we assume if enforceVendorId is passed, we might need to fetch the vendor to get names/details
      }

      // If enforceVendorId is active, ensure item matches
      if (enforceVendorId && vendorId !== enforceVendorId) {
         throw new ServiceError(`Item ${name} does not belong to the selected vendor`, 400, 'VENDOR_MISMATCH')
      }

      if (!vendor) {
        // We need vendor details if not found via menuItem
         vendor = await Vendor.findByPk(vendorId)
         if (!vendor) throw new ServiceError(`Vendor ${vendorId} not found`, 404, 'VENDOR_NOT_FOUND')
      }

      if (!vendorGroups[vendorId!]) {
        vendorGroups[vendorId!] = {
          vendor: vendor,
          items: [],
          subtotal: 0,
        }
      }

      const itemSubtotal = price * itemInput.quantity
      
      vendorGroups[vendorId!].items.push({
        menuItemId: itemInput.menuItemId || null,
        name: name,
        price: price,
        quantity: itemInput.quantity,
        subtotal: itemSubtotal,
        customizations: itemInput.customizations || {},
        specialInstructions: itemInput.specialInstructions
      })
      
      vendorGroups[vendorId!].subtotal += itemSubtotal
      grandTotal += itemSubtotal
    }

    // 5. Calculate Global Charges
    let serviceCharge = 0
    let platformCharge = 0

    if (applyCharges) {
      // Use ConfigService for rates (imported at top or inline)
      // For now, keep defaults but mark for ConfigService integration
      const SERVICE_CHARGE_RATE = 0.05 // TODO: ConfigService.getChargesConfig(courtId)
      const PLATFORM_CHARGE_FIXED = 5

      serviceCharge = grandTotal * SERVICE_CHARGE_RATE
      platformCharge = PLATFORM_CHARGE_FIXED
    }
    
    const totalAmount = grandTotal + serviceCharge + platformCharge

    // 6. Generate Context IDs
    const parentOrderId = `PARENT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const orderOtp = Math.floor(1000 + Math.random() * 9000).toString()

    const createdOrders: any[] = []
    
    // 7. Execute Transaction
    const transaction = await sequelize.transaction()

    try {
      for (const [vendorId, group] of Object.entries(vendorGroups)) {
        // Distribute fees proportionally
        const vendorSubtotal = group.subtotal
        const vendorProportion = grandTotal > 0 ? vendorSubtotal / grandTotal : 1
        
        const vendorServiceCharge = serviceCharge * vendorProportion
        const vendorPlatformCharge = platformCharge * vendorProportion
        const vendorTotal = vendorSubtotal + vendorServiceCharge + vendorPlatformCharge

        // Unique Order Number
        const prefix = orderSource === 'vendor_manual' ? 'MAN' : 'ORD'
        const orderNumber = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

        // Create Order Record
        const order = await Order.create({
          orderNumber,
          courtId,
          userId: userId || null, // Allow null for guests
          vendorId,
          
          customerName: userDetails.name,
          customerPhone: userDetails.phone,
          customerEmail: userDetails.email,
          
          paymentMethod,
          subtotal: vendorSubtotal,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: vendorTotal,
          
          specialInstructions,
          estimatedPreparationTime: group.vendor.averagePreparationTime || 15,
          status: 'pending',
          paymentStatus: 'pending', 
          
          orderOtp,
          parentOrderId,
          isSubOrder: true,
          type: orderSource === 'app_checkout' ? 'user_initiated' : 'vendor_initiated',

          statusHistory: [
            {
              status: 'pending',
              timestamp: new Date(),
              note: `Order created via ${orderSource}`,
            },
          ],
          
          metadata: {
            vendorProportion,
            originalGrandTotal: grandTotal,
            charges: {
              serviceCharge: vendorServiceCharge,
              platformCharge: vendorPlatformCharge,
            },
          },
          
          vendors: {
            [vendorId]: {
              accountId: group.vendor.razorpayAccountId || 'default_acc',
              name: group.vendor.stallName || group.vendor.vendorName,
            },
          },
          items: group.items.map((item: any, index: number) => ({
            itemId: `item_${index + 1}`,
            vendorId: vendorId,
            itemName: item.name,
            price: Math.round(item.price * 100), // Paise
            quantity: item.quantity,
          })),
          platformCommission: Math.round(vendorTotal * 0.1 * 100),
        }, { transaction })

        // Create Order Items
        for (const item of group.items) {
          await OrderItem.create({
            orderId: order.id,
            menuItemId: item.menuItemId,
            itemName: item.name,
            itemPrice: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            customizations: item.customizations,
            specialInstructions: item.specialInstructions || null,
          }, { transaction })
        }

        // Create Initial Payment Record
        await Payment.create({
          orderId: order.id,
          paymentMethod,
          amount: vendorTotal,
          status: 'pending',
        }, { transaction })

        createdOrders.push({
          ...order.toJSON(),
          vendor: group.vendor,
          items: group.items
        })
      }

      await transaction.commit()

      return {
        parentOrderId,
        orderOtp,
        orders: createdOrders,
        totalAmount,
        grandTotal,
        charges: {
          serviceCharge,
          platformCharge
        }
      }

    } catch (error) {
      await transaction.rollback()
      console.error('Create Order Transaction Failed:', error)
      throw new ServiceError('Failed to create order', 500, 'ORDER_CREATION_FAILED', error)
    }
  }

  /**
   * Fetch orders for a user with standardized filtering
   */
  static async getUserOrders(userId: string, filters: {
    courtId?: string
    status?: string
    parentOrderId?: string
    activeOnly?: boolean
    page?: number
    limit?: number
  }) {
    const { courtId, status, parentOrderId, activeOnly, page = 1, limit = 20 } = filters
    const offset = (page - 1) * limit

    const whereClause: any = {
      userId,
      isSubOrder: true 
    }

    if (courtId) whereClause.courtId = courtId
    if (status) whereClause.status = status
    if (parentOrderId) whereClause.parentOrderId = parentOrderId

    if (activeOnly) {
      whereClause.status = {
        [Op.notIn]: ['completed', 'rejected', 'cancelled']
      }
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'stallName', 'vendorName', 'logoUrl'],
        },
        {
          model: OrderItem,
          as: 'orderItems', 
          include: [
            {
              model: MenuItem,
              as: 'menuItem',
              attributes: ['id', 'name', 'imageUrl'],
            },
          ],
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'status', 'paymentMethod', 'amount'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true, // For accurate count with includes
    })

    return {
      orders: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }
  }

  /**
   * Fetch orders for a vendor dashboard with filters
   */
  static async getVendorOrders(vendorId: string, filters: {
    status?: string | string[]
    date?: string
    page?: number
    limit?: number
  }) {
    const { status, date, page = 1, limit = 50 } = filters
    const offset = (page - 1) * limit

    const whereClause: any = {
      vendorId,
    }

    if (status) {
       if (Array.isArray(status)) {
         whereClause.status = { [Op.in]: status }
       } else {
         whereClause.status = status
       }
    }

    if (date) {
      const targetDate = new Date(date)
      if (!isNaN(targetDate.getTime())) {
        const startOfDay = new Date(targetDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(targetDate)
        endOfDay.setHours(23, 59, 59, 999)
        whereClause.createdAt = {
            [Op.between]: [startOfDay, endOfDay]
        }
      }
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user', // Ensure relation exists in User/Order models
          attributes: ['id', 'fullName', 'phone'],
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            { model: MenuItem, as: 'menuItem', attributes: ['id', 'name'] }
          ]
        },
        // We might want payment info too if needed
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    })

    return {
      orders: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }
  }

  /**
   * Admin: Get all orders for a court with advanced filtering
   */
  static async getCourtOrders(courtId: string, options: {
    status?: string
    vendorId?: string
    userId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) {
    const { status, vendorId, userId, startDate, endDate, page = 1, limit = 10 } = options
    const offset = (page - 1) * limit

    const whereClause: any = { courtId }

    if (status) {
      whereClause.status = status
    }

    if (vendorId) {
      whereClause.vendorId = vendorId
    }

    if (userId) {
      whereClause.userId = userId
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          whereClause.createdAt = {
            [Op.between]: [start, end],
          }
      }
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "phone"],
        },
        {
          model: Vendor,
          as: "vendor",
          attributes: ["id", "stallName", "vendorName"],
        },
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            {
              model: MenuItem,
              as: "menuItem",
              attributes: ["id", "name", "imageUrl"],
            },
          ],
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["id", "status", "paymentMethod", "amount"],
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      distinct: true
    })

    return {
      orders: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    }
  }
}
