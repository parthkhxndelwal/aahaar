import { NextResponse } from "next/server"
import { Order, OrderItem, User, Vendor, MenuItem, Payment } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { Op } from "sequelize"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    // Extract user and courtId from auth result
    const { user, courtId: authCourtId } = authResult

    const { courtId } = await params
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const vendorId = searchParams.get("vendorId")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 10
    const offset = (page - 1) * limit

    // Build where clause
    const whereClause = { courtId }

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
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      }
    }

    const orders = await Order.findAndCountAll({
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
          as: "items",
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
    })

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.rows,
        pagination: {
          total: orders.count,
          page,
          limit,
          totalPages: Math.ceil(orders.count / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { courtId } = await params
    const {
      vendorId,
      items, // Array of { menuItemId, quantity, customizations, specialInstructions }
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod = "online",
      specialInstructions,
      type = "user_initiated",
    } = await request.json()

    // Validation
    if (!vendorId || !items || !items.length || !customerName) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields: vendorId, items, customerName",
        },
        { status: 400 },
      )
    }

    // Verify vendor exists and is active
    const vendor = await Vendor.findOne({
      where: { id: vendorId, courtId, status: "active" },
    })

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor not found or inactive",
        },
        { status: 404 },
      )
    }

    // Fetch menu items and calculate totals
    const menuItemIds = items.map((item) => item.menuItemId)
    const menuItems = await MenuItem.findAll({
      where: {
        id: { [Op.in]: menuItemIds },
        vendorId,
        status: "active",
        isAvailable: true,
      },
    })

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Some menu items are not available",
        },
        { status: 400 },
      )
    }

    // Calculate order totals
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId)
      const itemSubtotal = menuItem.price * item.quantity
      subtotal += itemSubtotal

      orderItems.push({
        menuItemId: item.menuItemId,
        itemName: menuItem.name,
        itemPrice: menuItem.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        customizations: item.customizations || {},
        specialInstructions: item.specialInstructions || null,
      })
    }

    const taxAmount = 0 // Configure as needed
    const discountAmount = 0 // Configure as needed
    const totalAmount = subtotal + taxAmount - discountAmount

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order
    const order = await Order.create({
      orderNumber,
      courtId,
      userId: authResult.user?.id || null,
      vendorId,
      customerName,
      customerPhone,
      customerEmail,
      type,
      paymentMethod,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      specialInstructions,
      estimatedPreparationTime: vendor.averagePreparationTime,
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date(),
          note: "Order created",
        },
      ],
    })

    // Create order items
    for (const orderItem of orderItems) {
      await OrderItem.create({
        orderId: order.id,
        ...orderItem,
      })
    }

    // Create payment record
    const payment = await Payment.create({
      orderId: order.id,
      paymentMethod,
      amount: totalAmount,
      status: paymentMethod === "cod" ? "pending" : "pending",
    })

    // TODO: If online payment, create Razorpay order
    // TODO: Send notifications to vendor and user

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        data: {
          order: {
            ...order.toJSON(),
            items: orderItems,
            payment,
          },
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
