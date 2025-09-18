import { NextResponse } from "next/server"
import { Order, OrderItem, Vendor, MenuItem, Payment } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"

export async function GET(request) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const courtId = searchParams.get("courtId")
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 20
    const offset = (page - 1) * limit

    // Build where clause
    const whereClause = { userId: user.id }

    if (courtId) {
      whereClause.courtId = courtId
    }

    if (status) {
      whereClause.status = status
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [
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
    console.error("Get user orders error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
