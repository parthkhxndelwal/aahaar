import { NextResponse } from "next/server"
import { Payment, Order, Vendor, User } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { Op } from "sequelize"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { courtId } = await params
    const { searchParams } = new URL(request.url)

    // Only admins can view all payments
    if (user.role !== "admin" || user.courtId !== courtId) {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const status = searchParams.get("status")
    const vendorId = searchParams.get("vendorId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Build where clause
    const whereClause = {}
    if (status) whereClause.status = status

    // Date filter
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    }

    // Include clause for order with court filter
    const includeClause = [
      {
        model: Order,
        as: "order",
        where: { courtId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName", "email", "phone"]
          },
          {
            model: Vendor,
            as: "vendor",
            attributes: ["stallName", "vendorName"]
          }
        ]
      }
    ]

    // Vendor filter
    if (vendorId) {
      includeClause[0].include[1].where = { id: vendorId }
    }

    const payments = await Payment.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [["createdAt", "DESC"]],
      limit,
      offset
    })

    // Transform data for frontend
    const transformedPayments = payments.rows.map(payment => ({
      id: payment.id,
      orderId: payment.orderId,
      orderNumber: payment.order?.orderNumber || "N/A",
      amount: payment.amount,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      vendorName: payment.order?.vendor?.stallName || "Unknown",
      customerName: payment.order?.user?.fullName || "Unknown",
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: {
        payments: transformedPayments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(payments.count / limit),
          totalItems: payments.count,
          itemsPerPage: limit
        }
      }
    })
  } catch (error) {
    console.error("Get payments error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
