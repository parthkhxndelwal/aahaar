import { NextResponse } from "next/server"
import { Order, Vendor, User } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"
import { emitToVendor } from "@/lib/socket"

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { courtId, orderId } = await params
    const { reason = "Cancelled by customer" } = await request.json()

    // Find the order
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: user.id,
        courtId
      },
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'stallName', 'vendorName']
        }
      ]
    })

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      )
    }

    // Check if order can be cancelled (only pending orders can be cancelled by customers)
    if (order.status !== 'pending') {
      let message = "Order cannot be cancelled"
      
      switch (order.status) {
        case 'preparing':
          message = "Order has already been accepted by the vendor and cannot be cancelled"
          break
        case 'ready':
          message = "Order is ready for pickup and cannot be cancelled"
          break
        case 'completed':
          message = "Order has already been completed"
          break
        case 'cancelled':
          message = "Order is already cancelled"
          break
        case 'rejected':
          message = "Order has already been rejected"
          break
      }
      
      return NextResponse.json(
        { success: false, message },
        { status: 400 }
      )
    }

    // Update order status and add cancellation reason
    const previousStatus = order.status
    order.status = 'cancelled'
    order.cancellationReason = reason

    // Update status history
    const statusHistory = order.statusHistory || []
    statusHistory.push({
      status: 'cancelled',
      timestamp: new Date().toISOString(),
      updatedBy: 'customer',
      reason: reason
    })
    order.statusHistory = statusHistory

    await order.save()

    console.log(`✅ [OrderCancel] Order ${order.orderNumber} cancelled by customer ${user.id}`)

    // Emit real-time notification to vendor
    try {
      await emitToVendor(order.vendorId, 'orderCancelled', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        reason: reason,
        timestamp: new Date().toISOString()
      })
      console.log(`📡 [OrderCancel] Notification sent to vendor ${order.vendorId}`)
    } catch (socketError) {
      console.error(`❌ [OrderCancel] Failed to notify vendor:`, socketError)
      // Don't fail the request if socket notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          cancellationReason: order.cancellationReason,
          previousStatus
        }
      }
    })

  } catch (error) {
    console.error("❌ [OrderCancel] Error cancelling order:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
