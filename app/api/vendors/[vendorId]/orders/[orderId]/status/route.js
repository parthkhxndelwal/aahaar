import { NextResponse } from "next/server"
import { Order, User, Payment, OrderItem, MenuItem, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"

export async function PATCH(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId, orderId } = await params
    const { action, otp } = await request.json() // action: 'start_preparing' | 'mark_ready' | 'complete'

    // Check permissions
    if (user.role === "vendor") {
      const vendor = await Vendor.findOne({ where: { userId: user.id } })
      if (!vendor || vendor.id !== vendorId) {
        return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
      }
    } else if (user.role === "admin") {
      const vendor = await Vendor.findOne({ where: { id: vendorId, courtId: user.courtId } })
      if (!vendor) {
        return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
      }
    } else {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Find the order
    const order = await Order.findOne({
      where: { id: orderId, vendorId },
    })

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
    }

    let newStatus
    let updateData = {}
    let message

    switch (action) {
      case "start_preparing":
        if (order.status !== "accepted") {
          return NextResponse.json(
            { success: false, message: "Order must be in accepted status to start preparing" },
            { status: 400 }
          )
        }
        newStatus = "preparing"
        updateData.preparingAt = new Date()
        message = "Order preparation started"
        break

      case "mark_ready":
        if (order.status !== "preparing") {
          return NextResponse.json(
            { success: false, message: "Order must be in preparing status to mark as ready" },
            { status: 400 }
          )
        }
        newStatus = "ready"
        updateData.readyAt = new Date()
        message = "Order marked as ready for pickup"
        break

      case "complete":
        if (order.status !== "ready") {
          return NextResponse.json(
            { success: false, message: "Order must be in ready status to complete" },
            { status: 400 }
          )
        }

        // Verify OTP
        if (!otp || otp !== order.orderOtp) {
          return NextResponse.json(
            { success: false, message: "Invalid OTP. Please check the OTP provided by the customer." },
            { status: 400 }
          )
        }

        newStatus = "completed"
        updateData.completedAt = new Date()
        message = "Order completed successfully"

        // Update payment status to completed
        await Payment.update(
          { status: "completed", processedAt: new Date() },
          { where: { orderId: order.id } }
        )
        break

      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }

    // Update order status
    await order.update({
      status: newStatus,
      ...updateData,
      statusHistory: [
        ...order.statusHistory,
        {
          status: newStatus,
          timestamp: new Date(),
          note: message,
          updatedBy: user.id,
        },
      ],
    })

    return NextResponse.json({
      success: true,
      message,
      data: {
        orderId: order.id,
        status: newStatus,
        orderOtp: order.orderOtp,
        parentOrderId: order.parentOrderId,
      },
    })
  } catch (error) {
    console.error("Update order preparation status error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}
