import { NextResponse } from "next/server"
import { Vendor, Payment, Order } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { Op, Sequelize } from "sequelize"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { courtId } = await params

    // Only admins can view payouts
    if (user.role !== "admin" || user.courtId !== courtId) {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    // For now, simulate payout data based on completed payments
    // In a real implementation, this would come from a Payouts table
    const vendors = await Vendor.findAll({
      where: { courtId },
      include: [
        {
          model: Order,
          as: "orders",
          include: [
            {
              model: Payment,
              as: "payment",
              where: { status: "completed" },
              required: false
            }
          ],
          where: { status: "completed" },
          required: false
        }
      ]
    })

    // Calculate payout data for each vendor
    const payouts = vendors.map(vendor => {
      const completedOrders = vendor.orders || []
      const totalAmount = completedOrders.reduce((sum, order) => {
        return sum + (order.payment ? order.payment.amount : 0)
      }, 0)
      
      // Simulate payout processing (85% goes to vendor, 15% platform fee)
      const vendorAmount = Math.round(totalAmount * 0.85)
      
      return {
        id: `payout_${vendor.id}`,
        vendorId: vendor.id,
        vendorName: vendor.stallName,
        amount: vendorAmount,
        ordersCount: completedOrders.length,
        status: vendorAmount > 0 ? "processed" : "pending",
        transferDate: new Date().toISOString(),
        razorpayTransferId: vendorAmount > 0 ? `tr_${Math.random().toString(36).substr(2, 9)}` : null
      }
    }).filter(payout => payout.amount > 0)

    return NextResponse.json({
      success: true,
      data: { payouts }
    })
  } catch (error) {
    console.error("Get payouts error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
