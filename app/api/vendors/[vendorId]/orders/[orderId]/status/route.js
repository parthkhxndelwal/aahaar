import { NextResponse } from "next/server"
import { Order, Payment, OrderItem, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"

export async function PATCH(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId, orderId } = await params
    const { action, otp } = await request.json() // action: 'mark_ready' | 'complete'

    // Check permissions
    if (user.role === "vendor") {
      const vendor = await Vendor.findOne({ where: { userId: user.id } })
      if (!vendor || vendor.id !== vendorId) {
        return errorResponse("Access denied", 403, "FORBIDDEN")
      }
    } else if (user.role === "admin") {
      const vendor = await Vendor.findOne({ where: { id: vendorId, courtId: user.courtId } })
      if (!vendor) {
        return errorResponse("Vendor not found", 404, "VENDOR_NOT_FOUND")
      }
    } else {
      return errorResponse("Access denied", 403, "FORBIDDEN")
    }

    // Find the order
    const order = await Order.findOne({
      where: { id: orderId, vendorId },
    })

    if (!order) {
      return errorResponse("Order not found", 404, "ORDER_NOT_FOUND")
    }

    let newStatus
    let updateData = {}
    let message

    switch (action) {
      case "mark_ready":
        if (order.status !== "preparing") {
          return errorResponse(
            "Order must be in preparing status to mark as ready",
            400,
            "INVALID_STATUS_TRANSITION"
          )
        }
        newStatus = "ready"
        updateData.readyAt = new Date()
        message = "Order marked as ready for pickup"
        break

      case "complete":
        if (order.status !== "ready") {
          return errorResponse(
            "Order must be in ready status to complete",
            400,
            "INVALID_STATUS_TRANSITION"
          )
        }

        // Verify OTP
        if (!otp || otp !== order.orderOtp) {
          return errorResponse(
            "Invalid OTP. Please check the OTP provided by the customer.",
            400,
            "INVALID_OTP"
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
        return errorResponse("Invalid action", 400, "INVALID_ACTION")
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

    // Fetch updated order with items
    const updatedOrder = await Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: OrderItem,
          as: "orderItems",
        },
      ],
    })

    // Prepare order data
    const orderData = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      customerName: updatedOrder.customerName,
      customerPhone: updatedOrder.customerPhone,
      items: updatedOrder.orderItems,
      totalAmount: updatedOrder.totalAmount,
      status: newStatus,
      estimatedPreparationTime: updatedOrder.estimatedPreparationTime,
      queuePosition: updatedOrder.queuePosition,
      orderOtp: updatedOrder.orderOtp,
      createdAt: updatedOrder.createdAt,
      acceptedAt: updatedOrder.acceptedAt,
      preparingAt: updateData.preparingAt || updatedOrder.preparingAt,
      readyAt: updateData.readyAt || updatedOrder.readyAt,
      completedAt: updateData.completedAt || updatedOrder.completedAt,
    }

    console.log(`📋 Order status updated: ${orderId} -> ${newStatus}`)

    return successResponse({
      orderId: order.id,
      status: newStatus,
      orderOtp: order.orderOtp,
      parentOrderId: order.parentOrderId,
      order: orderData,
    }, message)
  } catch (error) {
    console.error("Update order preparation status error:", error)
    return handleServiceError(error)
  }
}
