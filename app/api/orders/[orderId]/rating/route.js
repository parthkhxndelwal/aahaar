import { NextResponse } from "next/server"
import { Order, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { orderId } = params
    const { rating, feedback } = await request.json()

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, message: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const order = await Order.findOne({
      where: { id: orderId, userId: user.id },
      include: [{ model: Vendor, as: "vendor" }],
    })

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
    }

    if (order.status !== "completed") {
      return NextResponse.json({ success: false, message: "Can only rate completed orders" }, { status: 400 })
    }

    if (order.rating) {
      return NextResponse.json({ success: false, message: "Order already rated" }, { status: 400 })
    }

    // Update order with rating
    await order.update({ rating, feedback })

    // Update vendor rating
    const vendor = order.vendor
    const newTotalRatings = vendor.totalRatings + 1
    const newRating = (vendor.rating * vendor.totalRatings + rating) / newTotalRatings

    await vendor.update({
      rating: newRating,
      totalRatings: newTotalRatings,
    })

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
      data: { order },
    })
  } catch (error) {
    console.error("Submit rating error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
