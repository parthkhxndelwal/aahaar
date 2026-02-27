import { NextResponse } from "next/server"
import { Order, Payment, Vendor } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"
import { Op } from "sequelize"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { vendorId } = params

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

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get today's orders
    const todayOrders = await Order.findAll({
      where: {
        vendorId,
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
      include: [
        {
          model: Payment,
          as: "payment",
          attributes: ["amount", "status"],
        },
      ],
    })

    // Get pending orders
    const pendingOrders = await Order.count({
      where: {
        vendorId,
        status: {
          [Op.in]: ["pending", "preparing"],
        },
      },
    })

    // Calculate today's revenue
    const todayRevenue = todayOrders
      .filter((order) => order.payment && order.payment.status === "completed")
      .reduce((total, order) => total + Number.parseFloat(order.totalAmount), 0)

    // Get completed orders count
    const completedOrders = await Order.count({
      where: {
        vendorId,
        status: "completed",
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    })

    // Get vendor rating
    const vendor = await Vendor.findByPk(vendorId, {
      attributes: ["rating", "averagePreparationTime"],
    })

    const analytics = {
      todayOrders: todayOrders.length,
      todayRevenue,
      pendingOrders,
      completedOrders,
      averagePreparationTime: vendor?.averagePreparationTime || 0,
      rating: vendor?.rating || 0,
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    console.error("Get vendor analytics error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
