import { NextResponse } from "next/server"
import { Order } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"
import { Op } from "sequelize"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { courtId } = await params

    // Check for active orders (not completed, rejected, or cancelled)
    const activeOrders = await Order.findAll({
      where: {
        userId: user.id,
        courtId,
        status: {
          [Op.notIn]: ['completed', 'rejected', 'cancelled']
        }
      },
      attributes: ['id', 'orderNumber', 'status', 'parentOrderId', 'totalAmount', 'createdAt'],
      order: [['createdAt', 'DESC']]
    })

    console.log(`🔍 [ActiveOrders] Found ${activeOrders.length} active orders for user ${user.id}`)

    return NextResponse.json({
      success: true,
      data: {
        activeOrders: activeOrders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          parentOrderId: order.parentOrderId,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt
        }))
      }
    })
  } catch (error) {
    console.error("❌ [ActiveOrders] Error checking active orders:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
