import { NextResponse } from "next/server"
import { Order, User, Payment, OrderItem, MenuItem, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { Op } from "sequelize"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId } = await params
    const { searchParams } = new URL(request.url)

    // Check permissions
    if (user.role === "vendor") {
      const vendor = await Vendor.findOne({ where: { userId: user.id } })
      if (!vendor || vendor.id !== vendorId) {
        return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
      }
    } else if (user.role === "admin") {
      const vendor = await Vendor.findOne({ where: { id: vendorId, courtId: user.courtId } })
      if (!vendor) {
        return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
      }
    } else {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Get query parameters
    const status = searchParams.get("status")
    const date = searchParams.get("date")
    const limit = parseInt(searchParams.get("limit") || "50")
    const page = parseInt(searchParams.get("page") || "1")
    const offset = (page - 1) * limit

    // Build where condition
    const whereCondition = {
      vendorId,
    }

    if (status) {
      whereCondition.status = status
    }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      whereCondition.createdAt = {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      }
    }

    // Fetch orders
    const orders = await Order.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["fullName", "phone", "email"],
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["method", "status", "amount"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: MenuItem,
              as: "menuItem",
              attributes: ["name", "price"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    })

    // Transform orders for frontend
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer?.fullName || "Unknown",
      customerPhone: order.customer?.phone,
      items: order.items?.map((item) => ({
        name: item.menuItem?.name || "Unknown Item",
        quantity: item.quantity,
        price: item.unitPrice,
      })) || [],
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMethod: order.payment?.method || "cash",
      paymentStatus: order.payment?.status || "pending",
      specialInstructions: order.specialInstructions,
      createdAt: order.createdAt,
      estimatedPreparationTime: order.estimatedPreparationTime || 15,
    }))

    // Get total count for pagination
    const totalCount = await Order.count({
      where: whereCondition,
    })

    return NextResponse.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get vendor orders error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
