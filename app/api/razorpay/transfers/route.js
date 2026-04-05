import { NextResponse } from "next/server"
import Razorpay from "razorpay"
import { authenticateToken } from "@/middleware/auth"
import { Order, Payment } from "@/models"

export async function POST(request) {
  try {
    // Require authentication
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult

    // Only admins can create transfers
    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      )
    }

    const { razorpay_payment_id, razorpay_order_id, transfers } = await request.json()

    if (!razorpay_payment_id || !transfers || !Array.isArray(transfers)) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Verify the payment belongs to an order in this user's court
    const payment = await Payment.findOne({
      where: { razorpayPaymentId: razorpay_payment_id },
      include: [{ model: Order, as: "order", attributes: ["courtId"] }]
    })

    if (!payment || payment.order.courtId !== user.courtId) {
      return NextResponse.json(
        { success: false, message: "Payment not found or access denied" },
        { status: 403 }
      )
    }

    // Initialize Razorpay
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay keys missing for transfers')
      return NextResponse.json(
        { success: false, message: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    console.log('Creating transfers for payment:', razorpay_payment_id, 'by admin:', user.id)

    // Create transfers using Razorpay SDK
    try {
      const transferResult = await razorpay.payments.transfer(razorpay_payment_id, {
        transfers: transfers
      })

      return NextResponse.json({
        success: true,
        message: "Transfers created successfully",
        transfer: transferResult
      })
    } catch (transferError) {
      console.error('Transfer creation failed:', transferError)
      return NextResponse.json(
        { success: false, message: 'Failed to create transfers' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Error in transfers API:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}