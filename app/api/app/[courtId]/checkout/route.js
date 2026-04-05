import { NextResponse } from "next/server"
import { OrderService } from "@/lib/services/order-service"
import { CartService } from "@/lib/services/cart-service"
import { authenticateTokenNextJS } from "@/middleware/auth"
import Razorpay from "razorpay"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status)
    }

    const { user } = authResult
    const { courtId } = await params
    const { paymentMethod = "online", specialInstructions = "" } = await request.json()

    // 1. Get Cart Items
    const cart = await CartService.getCart(user.id, courtId)

    if (!cart || !cart.items || cart.items.length === 0) {
      return errorResponse("Cart is empty", 400)
    }

    // 2. Prepare Items for Order Service
    const orderItems = cart.items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      customizations: item.customizations || {},
      specialInstructions: item.specialInstructions
    }))

    // 3. Create Orders (Logic extracted to Service)
    const orderResult = await OrderService.createOrder({
      userId: user.id,
      courtId,
      items: orderItems,
      paymentMethod,
      specialInstructions,
      // Pass user details for receipt/notifications
      customerDetails: {
        name: user.fullName,
        phone: user.phone,
        email: user.email
      }
    })

    // 4. Store cart info for later clearing (after payment verification)
    // Cart will be cleared in the payment verification endpoint
    // This prevents cart from being cleared if payment fails

    // 5. Build Response Data structure
    const responseData = {
      ...orderResult,
      summary: {
        vendorsCount: orderResult.orders.length,
        itemsCount: cart.items.length,
      },
    }

    // 6. Handle Online Payment (Razorpay)
    if (paymentMethod === "online") {
      try {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
          console.error("Razorpay keys missing")
          // Return success but with warning? Or fail? 
          // Previous logic returned 500.
          return errorResponse("Payment gateway not configured", 500)
        }

        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        })

        const amountPaise = Math.round(orderResult.totalAmount * 100)
        const receipt = `aahaar_${orderResult.parentOrderId}`

        const rOrder = await razorpay.orders.create({
          amount: amountPaise,
          currency: "INR",
          receipt,
          payment_capture: 1,
          notes: {
            parentOrderId: orderResult.parentOrderId,
          },
        })

        // Append Razorpay details
        responseData.razorpayOrderId = rOrder.id
        responseData.razorpayOrderAmount = rOrder.amount
      } catch (err) {
        console.error("Razorpay initiation failed:", err)
        return errorResponse("Payment initialization failed", 500, "PAYMENT_INIT_ERROR", err.message)
      }
    }

    return successResponse(responseData, "Order placed successfully", 201)

  } catch (error) {
    return handleServiceError(error)
  }
}
