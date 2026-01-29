import { NextResponse } from "next/server"
import { Order, AuditLog } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"

export async function PATCH(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { orderId } = params
    const { status, note } = await request.json()

    // Validate status
    const validStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 })
    }

    // Find the order
    const order = await Order.findByPk(orderId)
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
    }

    // Check permissions
    if (user.role === "vendor") {
      // Vendors can only update their own orders
      const vendor = await user.getVendor()
      if (!vendor || order.vendorId !== vendor.id) {
        return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
      }
    } else if (user.role === "admin") {
      // Admins can update orders in their court
      if (order.courtId !== user.courtId) {
        return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
      }
    } else {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Update status history
    const statusHistory = order.statusHistory || []
    statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || "",
      updatedBy: user.id,
    })

    // Update order
    const updateData = {
      status,
      statusHistory,
    }

    // Set timestamp fields based on status
    switch (status) {
      case "confirmed":
        updateData.confirmedAt = new Date()
        break
      case "preparing":
        updateData.preparingAt = new Date()
        break
      case "ready":
        updateData.readyAt = new Date()
        break
      case "completed":
        updateData.completedAt = new Date()
        break
      case "cancelled":
        updateData.cancelledAt = new Date()
        break
    }

    await order.update(updateData)

    // Create audit log
    await AuditLog.create({
      courtId: order.courtId,
      userId: user.id,
      action: "order_status_updated",
      entityType: "order",
      entityId: order.id,
      oldValues: { status: order.status },
      newValues: { status },
      metadata: { note },
    })

    // TODO: Send notifications to user and admin
    // TODO: Update payment status if needed

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      data: { order },
    })
  } catch (error) {
    console.error("Update order status error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
