import { NextResponse } from "next/server"
import { Order, OrderItem, MenuItem, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function POST(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { qrData } = await request.json()

    if (!qrData) {
      return NextResponse.json({ success: false, message: "QR data is required" }, { status: 400 })
    }

    let parsedData
    try {
      parsedData = JSON.parse(qrData)
    } catch {
      return NextResponse.json({ success: false, message: "Invalid QR code format" }, { status: 400 })
    }

    const { orderId } = parsedData

    // Find order with details
    const order = await Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: Vendor,
          as: "vendor",
          attributes: ["id", "stallName", "vendorName"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: MenuItem,
              as: "menuItem",
              attributes: ["id", "name", "imageUrl"],
            },
          ],
        },
      ],
    })

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
    }

    // Update order with user info if not already set
    if (!order.userId && user.role === "user") {
      await order.update({
        userId: user.id,
        customerEmail: user.email,
      })
    }

    return NextResponse.json({
      success: true,
      message: "QR code scanned successfully",
      data: { order },
    })
  } catch (error) {
    console.error("QR scan error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
