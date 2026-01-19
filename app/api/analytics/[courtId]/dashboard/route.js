import { NextResponse } from "next/server"
import { Order, Payment, Vendor, User, sequelize } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { Op, Sequelize } from "sequelize"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { courtId } = await params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "7d" // 7d, 30d, 90d

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()

    switch (period) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(endDate.getDate() - 30)
        break
      case "90d":
        startDate.setDate(endDate.getDate() - 90)
        break
    }

    // Get total orders
    const totalOrders = await Order.count({
      where: {
        courtId,
        createdAt: { [Op.between]: [startDate, endDate] },
      },
    })

    // Get today's orders
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todayOrders = await Order.count({
      where: {
        courtId,
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      },
    })

    // Get total revenue
    const revenueResult = await Payment.findOne({
      attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "totalRevenue"]],
      include: [
        {
          model: Order,
          as: "order",
          where: {
            courtId,
            createdAt: { [Op.between]: [startDate, endDate] },
          },
          attributes: [],
        },
      ],
      where: { status: "completed" },
      raw: true,
    })

    const totalRevenue = revenueResult?.totalRevenue || 0

    // Get today's revenue
    const todayRevenueResult = await Payment.findOne({
      attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "todayRevenue"]],
      include: [
        {
          model: Order,
          as: "order",
          where: {
            courtId,
            createdAt: { [Op.between]: [todayStart, todayEnd] },
          },
          attributes: [],
        },
      ],
      where: { status: "completed" },
      raw: true,
    })

    const todayRevenue = todayRevenueResult?.todayRevenue || 0

    // Get active vendors count
    const activeVendors = await Vendor.count({
      where: { courtId, status: "active" },
    })

    console.log(`[DEBUG] Dashboard Analytics for court ${courtId}:`)
    console.log(`- Active vendors count: ${activeVendors}`)
    console.log(`- Total orders: ${totalOrders}`)
    console.log(`- Today orders: ${todayOrders}`)

    // Debug: Get all vendors to see their status
    const allVendorsForDebug = await Vendor.findAll({
      where: { courtId },
      attributes: ['id', 'stallName', 'status'],
      raw: true
    })
    console.log(`- All vendors:`, allVendorsForDebug)

    // Get registered users count
    const totalUsers = await User.count({
      where: { courtId, role: "user" },
    })

    // Get top vendors by order count
    const topVendors = await sequelize.query(
      `
      SELECT 
        v.id,
        v.stallName,
        v.vendorName,
        COUNT(o.id) as orderCount
      FROM vendors v
      LEFT JOIN orders o ON v.id = o.vendorId 
        AND o.createdAt BETWEEN :startDate AND :endDate
        AND o.courtId = :courtId
      WHERE v.courtId = :courtId
      GROUP BY v.id, v.stallName, v.vendorName
      ORDER BY orderCount DESC
      LIMIT 5
      `,
      {
        replacements: {
          courtId,
          startDate,
          endDate,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    )

    // Get order status distribution
    const orderStatusStats = await Order.findAll({
      where: {
        courtId,
        createdAt: { [Op.between]: [startDate, endDate] },
      },
      attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
      group: ["status"],
      raw: true,
    })

    // Calculate pending and completed orders
    const pendingOrders = orderStatusStats.find(stat => stat.status === 'pending')?.count || 0
    const completedOrders = orderStatusStats.find(stat => stat.status === 'completed')?.count || 0

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue: Number.parseFloat(totalRevenue),
          activeVendors,
          totalUsers,
          todayOrders,
          todayRevenue: Number.parseFloat(todayRevenue),
          pendingOrders,
          completedOrders,
        },
        topVendors,
        orderStatusStats,
        period,
      },
    })
  } catch (error) {
    console.error("Dashboard analytics error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
