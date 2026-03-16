import crypto from "crypto"
import { NextResponse } from "next/server"
import { Payment, Order } from "@/models"

export async function POST(request) {
  const bodyText = await request.text()
  const signature = request.headers.get("x-razorpay-signature") || ""
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ""

  // Verify signature
  if (!webhookSecret) {
    console.warn("No RAZORPAY_WEBHOOK_SECRET configured; rejecting webhook")
    return NextResponse.json({ success: false, message: "webhook secret not configured" }, { status: 403 })
  }

  const expected = crypto.createHmac("sha256", webhookSecret).update(bodyText).digest("hex")
  if (expected !== signature) {
    console.warn("Invalid razorpay webhook signature", { expected, signature })
    return NextResponse.json({ success: false, message: "invalid signature" }, { status: 400 })
  }

  const event = JSON.parse(bodyText)
  try {
    if (event.event === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity
      if (!paymentEntity) return NextResponse.json({ success: false, message: "missing payment entity" }, { status: 400 })

      const razorpayPaymentId = paymentEntity.id
      const razorpayOrderId = paymentEntity.order_id

      // Try to find local payment by razorpayOrderId or by orderId stored in payment
      let payment = await Payment.findOne({ where: { razorpayOrderId: razorpayOrderId } })
      if (!payment) {
        // fallback: try by razorpayPaymentId
        payment = await Payment.findOne({ where: { razorpayPaymentId: razorpayPaymentId } })
      }

      if (!payment) {
        console.warn("Local payment record not found for razorpayOrderId:", razorpayOrderId)
        return NextResponse.json({ success: false, message: "payment not found" }, { status: 404 })
      }

      // Idempotency: skip if already processed
      if (payment.status === "completed" || payment.processedAt) {
        console.log("Payment already processed:", payment.id)
        return NextResponse.json({ success: true })
      }

      // Mark payment as completed
      payment.razorpayPaymentId = razorpayPaymentId
      payment.razorpayOrderId = razorpayOrderId
      payment.razorpaySignature = signature
      payment.status = "completed"
      payment.processedAt = new Date()
      await payment.save()

      // Update the related order(s)
      const orderId = payment.orderId
      if (orderId) {
        const order = await Order.findByPk(orderId)
        if (order) {
          if (order.status !== "confirmed") {
            order.status = "confirmed"
            order.paymentStatus = "confirmed"
            await order.save()
          }
        }
      }

      // You can trigger vendor transfers here or via a separate process/webhook

      return NextResponse.json({ success: true })
    }

    // For other events, just acknowledge
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error in razorpay webhook handler:", err)
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
