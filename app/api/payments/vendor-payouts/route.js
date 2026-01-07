import { NextResponse } from "next/server"
import { Payment, Order, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { createPayout } from "@/utils/razorpay"
import { Op } from "sequelize"

export async function POST(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    // Only admin can trigger payouts
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const { vendorId, courtId } = await request.json()

    // Get pending payouts for vendor
    const pendingPayments = await Payment.findAll({
      where: {
        vendorPayoutStatus: "pending",
        status: "completed",
      },
      include: [
        {
          model: Order,
          as: "order",
          where: {
            vendorId,
            courtId,
            paymentStatus: "paid",
          },
          include: [
            {
              model: Vendor,
              as: "vendor",
              attributes: ["id", "stallName", "razorpayFundAccountId"],
            },
          ],
        },
      ],
    })

    if (!pendingPayments.length) {
      return NextResponse.json({ success: false, message: "No pending payouts found" }, { status: 404 })
    }

    const vendor = pendingPayments[0].order.vendor
    if (!vendor.razorpayFundAccountId) {
      return NextResponse.json({ success: false, message: "Vendor fund account not configured" }, { status: 400 })
    }

    // Calculate total payout amount
    let totalPayoutAmount = 0
    const paymentIds = []

    for (const payment of pendingPayments) {
      const platformFee = (payment.amount * 2.5) / 100 // 2.5% platform fee
      const vendorAmount = payment.amount - platformFee
      totalPayoutAmount += vendorAmount
      paymentIds.push(payment.id)
    }

    // Create Razorpay payout
    const payoutResult = await createPayout(vendor.razorpayFundAccountId, totalPayoutAmount, `BATCH-${Date.now()}`)

    if (!payoutResult.success) {
      return NextResponse.json({ success: false, message: "Failed to create payout" }, { status: 500 })
    }

    // Update payment records
    await Payment.update(
      {
        vendorPayoutStatus: "processing",
        razorpayTransferId: payoutResult.payoutId,
        vendorPayoutAmount: totalPayoutAmount,
        vendorPayoutAt: new Date(),
      },
      {
        where: { id: { [Op.in]: paymentIds } },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Payout initiated successfully",
      data: {
        payoutId: payoutResult.payoutId,
        amount: totalPayoutAmount,
        paymentsCount: paymentIds.length,
      },
    })
  } catch (error) {
    console.error("Vendor payout error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
