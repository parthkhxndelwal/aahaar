import { NextResponse } from "next/server"
import { Payment, Order, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { Op, Sequelize } from "sequelize"

export async function GET(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d"

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

    // Payment method distribution
    const paymentMethods = await Payment.findAll({
      attributes: ["paymentMethod", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
      include: [
        {
          model: Order,
          as: "order",
          where: {
            courtId: user.courtId,
            createdAt: { [Op.between]: [startDate, endDate] },
          },
          attributes: [],
        },
      ],
      group: ["paymentMethod"],
    })

    // Revenue by vendor
    const vendorRevenue = await Payment.findAll({
      attributes: [[Sequelize.fn("SUM", Sequelize.col("amount")), "revenue"]],
      include: [
        {
          model: Order,
          as: "order",
          where: {
            courtId: user.courtId,
            createdAt: { [Op.between]: [startDate, endDate] },
          },
          include: [
            {
              model: Vendor,
              as: "vendor",
              attributes: ["id", "stallName"],
            },
          ],
        },
      ],
      where: { status: "completed" },
      group: ["order.vendor.id"],
      order: [[Sequelize.literal("revenue"), "DESC"]],
      limit: 10,
    })

    // Platform fees collected
    const platformFees = await Payment.findOne({
      attributes: [[Sequelize.fn("SUM", Sequelize.col("platformFee")), "totalFees"]],
      include: [
        {
          model: Order,
          as: "order",
          where: {
            courtId: user.courtId,
            createdAt: { [Op.between]: [startDate, endDate] },
          },
          attributes: [],
        },
      ],
      where: { status: "completed" },
    })

    return NextResponse.json({
      success: true,
      data: {
        paymentMethods,
        vendorRevenue,
        platformFees: Number.parseFloat(platformFees?.dataValues?.totalFees || 0),
        period,
      },
    })
  } catch (error) {
    console.error("Payment analytics error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
