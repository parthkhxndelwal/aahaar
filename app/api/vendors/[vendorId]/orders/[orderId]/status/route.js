import { NextResponse } from "next/server"
import { Order, User, Payment, OrderItem, MenuItem, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { emitToVendor, emitToUser, emitToOrder } from "@/lib/socket"
import { Op } from "sequelize"

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

    // Get updated section counts for the vendor
    const sectionCounts = await Promise.all([
      Order.count({ where: { vendorId, status: "pending" } }),
      Order.count({ where: { vendorId, status: "preparing" } }),
      Order.count({ where: { vendorId, status: "ready" } }),
    ])

    // Fetch updated order with items for socket emission
    const updatedOrder = await Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: OrderItem,
          as: "items",
        },
      ],
    })

    // Prepare order data for socket emission
    const orderData = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      customerName: updatedOrder.customerName,
      customerPhone: updatedOrder.customerPhone,
      items: updatedOrder.items,
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

    // Determine which section the order belongs to now
    let targetSection
    if (newStatus === "ready") {
      targetSection = "ready"
    } else if (newStatus === "completed") {
      targetSection = null // Order will be removed from all sections
    }

    // Emit socket events
    if (targetSection) {
      // Emit order status update to vendor
      emitToVendor(vendorId, 'order-status-updated', {
        section: targetSection,
        order: orderData,
        action: 'status_update',
        sectionCounts: {
          upcoming: sectionCounts[0],
          queue: sectionCounts[1],
          ready: sectionCounts[2],
        }
      })
    } else if (newStatus === "completed") {
      // Order completed - remove from vendor sections
      emitToVendor(vendorId, 'order-removed', {
        orderId: updatedOrder.id,
        sectionCounts: {
          upcoming: sectionCounts[0],
          queue: sectionCounts[1],
          ready: sectionCounts[2],
        }
      })
    }

    // Notify user of order status update
    if (updatedOrder.userId) {
      emitToUser(updatedOrder.userId, 'order-status-updated', {
        parentOrderId: updatedOrder.parentOrderId,
        vendorOrder: orderData,
        action: 'status_update'
      })

      // Also emit to the specific order room
      emitToOrder(updatedOrder.parentOrderId, 'order-status-updated', {
        parentOrderId: updatedOrder.parentOrderId,
        vendorOrder: orderData,
        action: 'status_update'
      })
    }

    console.log(`📡 Socket events emitted for order status update: ${orderId} -> ${newStatus}`)

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
