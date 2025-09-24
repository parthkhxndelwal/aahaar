import crypto from "crypto"
import { NextResponse } from "next/server"
import { Payment, Order } from "@/models"

export async function POST(request) {
  try {
    const body = await request.json()
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, localOrderId } = body

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ success: false, message: "Missing Razorpay parameters" }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    const expected = crypto.createHmac("sha256", secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex")

    if (expected !== razorpay_signature) {
      console.warn("Razorpay signature mismatch", { expected, received: razorpay_signature })
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 400 })
    }

    // Update payment and order records if present
    if (localOrderId) {
      try {
        const payment = await Payment.findOne({ where: { orderId: localOrderId } })
        if (payment) {
          // Idempotency: if already processed, skip
          if (payment.status === "completed" || payment.processedAt) {
            console.log("Payment already processed for order:", localOrderId)
          } else {
            await payment.update({
              status: "completed",
              razorpayOrderId: razorpay_order_id,
              razorpayPaymentId: razorpay_payment_id,
              razorpaySignature: razorpay_signature,
              processedAt: new Date(),
            })
          }
        }

        const order = await Order.findByPk(localOrderId)
        if (order) {
          // If order already marked as paid, skip
          if (order.paymentStatus === "paid" || order.status === "accepted") {
            console.log("Order already confirmed:", localOrderId)
          } else {
            await order.update({ status: "accepted", paymentStatus: "paid" })
          }
        }
      } catch (err) {
        console.error("Error updating payment/order after verification:", err)
      }
    }

    return NextResponse.json({ success: true, message: "Payment verified" }, { status: 200 })
  } catch (err) {
    console.error("Error verifying razorpay payment", err)
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
