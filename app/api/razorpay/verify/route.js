import crypto from "crypto"
import { Payment, Order } from "@/models"
import { CartService } from "@/lib/services/cart-service"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"

export async function POST(request) {
  try {
    const body = await request.json()
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, localOrderId } = body

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return errorResponse("Missing Razorpay parameters", 400)
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    const expected = crypto.createHmac("sha256", secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex")

    if (expected !== razorpay_signature) {
      console.warn("Razorpay signature mismatch", { expected, received: razorpay_signature })
      return errorResponse("Invalid signature", 400, "INVALID_SIGNATURE")
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
          if (order.paymentStatus === "paid") {
            console.log("Order already confirmed:", localOrderId)
          } else {
            // Keep status as "pending" so vendor can accept/reject
            // Only update paymentStatus to "paid"
            await order.update({ 
              paymentStatus: "paid",
              statusHistory: [
                ...(order.statusHistory || []),
                {
                  status: order.status,
                  timestamp: new Date(),
                  note: 'Payment verified and completed'
                }
              ]
            })
            
            // Clear cart only after successful payment verification
            if (order.userId && order.courtId) {
              await CartService.clearCart(order.userId, order.courtId)
              console.log("Cart cleared for user:", order.userId, "courtId:", order.courtId)
            }
          }
        }
      } catch (err) {
        console.error("Error updating payment/order after verification:", err)
      }
    }

    return successResponse(null, "Payment verified")
  } catch (error) {
    console.error("Error verifying razorpay payment", error)
    return handleServiceError(error)
  }
}
