import { NextResponse } from "next/server"
import { Order, User, Payment, OrderItem, MenuItem, Vendor, Cart, CartItem } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { courtId } = await params

    // Test order queue system stats
    const stats = {
      totalOrders: await Order.count({ where: { courtId } }),
      pendingOrders: await Order.count({ where: { courtId, status: "pending" } }),
      acceptedOrders: await Order.count({ where: { courtId, status: "accepted" } }),
      preparingOrders: await Order.count({ where: { courtId, status: "preparing" } }),
      readyOrders: await Order.count({ where: { courtId, status: "ready" } }),
      completedOrders: await Order.count({ where: { courtId, status: "completed" } }),
      rejectedOrders: await Order.count({ where: { courtId, status: "rejected" } }),
      subOrders: await Order.count({ where: { courtId, isSubOrder: true } }),
      parentOrders: await Order.count({ 
        where: { 
          courtId, 
          parentOrderId: { [require("sequelize").Op.ne]: null }
        } 
      }),
      ordersWithOtp: await Order.count({ 
        where: { 
          courtId, 
          orderOtp: { [require("sequelize").Op.ne]: null }
        } 
      }),
    }

    // Test vendor queue positions
    const vendorQueues = await Vendor.findAll({
      where: { courtId },
      attributes: ['id', 'stallName'],
      include: [
        {
          model: Order,
          as: 'orders',
          where: { status: 'accepted' },
          attributes: ['id', 'queuePosition', 'orderNumber'],
          required: false
        }
      ]
    })

    // Recent orders for testing
    const recentOrders = await Order.findAll({
      where: { courtId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'stallName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    })

    return NextResponse.json({
      success: true,
      message: "Order queue system test completed",
      data: {
        stats,
        vendorQueues: vendorQueues.map(v => ({
          vendorId: v.id,
          stallName: v.stallName,
          queueLength: v.orders.length,
          queueOrders: v.orders.sort((a, b) => a.queuePosition - b.queuePosition)
        })),
        recentOrders: recentOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.user?.fullName || o.customerName,
          vendorName: o.vendor?.stallName,
          status: o.status,
          isSubOrder: o.isSubOrder,
          parentOrderId: o.parentOrderId,
          orderOtp: o.orderOtp,
          queuePosition: o.queuePosition,
          totalAmount: o.totalAmount,
          createdAt: o.createdAt
        }))
      },
    })
  } catch (error) {
    console.error("Order system test error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message
      },
      { status: 500 }
    )
  }
}
