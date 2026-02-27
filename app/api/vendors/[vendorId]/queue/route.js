import { NextResponse } from "next/server"
import { Order, User, Payment, OrderItem, MenuItem, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { Op } from "sequelize"
import { emitToVendor, emitToUser, emitToOrder } from "@/lib/socket"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId } = await params
    const { searchParams } = new URL(request.url)

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

    // Get query parameters
    const queueSection = searchParams.get("section") // upcoming, queue, ready
    const date = searchParams.get("date")
    const limit = parseInt(searchParams.get("limit") || "50")
    const page = parseInt(searchParams.get("page") || "1")
    const offset = (page - 1) * limit

    // Build where condition based on queue section
    const whereCondition = { vendorId }

    if (queueSection === "upcoming") {
      whereCondition.status = "pending"
    } else if (queueSection === "queue") {
      whereCondition.status = "preparing"
    } else if (queueSection === "ready") {
      whereCondition.status = "ready"
    } else {
      // Default: show all active orders (not completed, cancelled, or rejected)
      whereCondition.status = {
        [Op.in]: ["pending", "accepted", "preparing", "ready"],
      }
    }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      whereCondition.createdAt = {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      }
    }

    // Fetch orders
    const orders = await Order.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["fullName", "phone", "email"],
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["paymentMethod", "status", "amount"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: MenuItem,
              as: "menuItem",
              attributes: ["name", "price", "imageUrl"],
            },
          ],
        },
      ],
      order: [
        // For queue section, order by queue position
        ...(queueSection === "queue" ? [["queuePosition", "ASC"]] : []),
        ["createdAt", "DESC"],
      ],
      limit,
      offset,
    })

    // Transform orders for frontend
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user?.fullName || "Unknown",
      customerPhone: order.user?.phone,
      customerEmail: order.user?.email,
      items: order.items?.map((item) => ({
        name: item.menuItem?.name || "Unknown Item",
        quantity: item.quantity,
        price: item.itemPrice,
        subtotal: item.subtotal,
        imageUrl: item.menuItem?.imageUrl,
      })) || [],
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMethod: order.payment?.paymentMethod || "online",
      paymentStatus: order.payment?.status || "pending",
      specialInstructions: order.specialInstructions,
      estimatedPreparationTime: order.estimatedPreparationTime || 15,
      queuePosition: order.queuePosition,
      orderOtp: order.orderOtp,
      parentOrderId: order.parentOrderId,
      isSubOrder: order.isSubOrder,
      createdAt: order.createdAt,
      acceptedAt: order.acceptedAt,
      rejectedAt: order.rejectedAt,
      rejectionReason: order.rejectionReason,
    }))

    // Get total count for pagination
    const totalCount = await Order.count({
      where: whereCondition,
    })

    // Get counts for each section for the vendor
    const sectionCounts = await Promise.all([
      Order.count({ where: { vendorId, status: "pending" } }),
      Order.count({ where: { vendorId, status: "preparing" } }),
      Order.count({ where: { vendorId, status: "ready" } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        sectionCounts: {
          upcoming: sectionCounts[0],
          queue: sectionCounts[1],
          ready: sectionCounts[2],
        },
      },
    })
  } catch (error) {
    console.error("Get vendor queue orders error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}

// Accept or reject order
export async function PATCH(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId } = await params
    const { orderId, action, reason } = await request.json() // action: 'accept' | 'reject'

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
      where: { id: orderId, vendorId, status: "pending" },
      include: [
        {
          model: OrderItem,
          as: "items",
        },
      ],
    })

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found or not in pending status" },
        { status: 404 }
      )
    }

    if (action === "accept") {
      // Get current queue position (last position + 1)
      const maxQueuePosition = await Order.max("queuePosition", {
        where: { vendorId, status: { [Op.in]: ["preparing"] } },
      })
      const queuePosition = (maxQueuePosition || 0) + 1

      // Update order directly to preparing status (skip confirmed step)
      await order.update({
        status: "preparing",
        queuePosition,
        acceptedAt: new Date(),
        confirmedAt: new Date(), // Set both acceptedAt and confirmedAt since they mean the same
        preparingAt: new Date(),
        statusHistory: [
          ...order.statusHistory,
          {
            status: "accepted",
            timestamp: new Date(),
            note: "Order accepted by vendor",
            updatedBy: user.id,
          },
          {
            status: "preparing",
            timestamp: new Date(),
            note: "Order moved to preparation",
            updatedBy: user.id,
          },
        ],
      })

      // Get updated section counts for the vendor
      const sectionCounts = await Promise.all([
        Order.count({ where: { vendorId, status: "pending" } }),
        Order.count({ where: { vendorId, status: { [Op.in]: ["accepted", "preparing"] } } }),
        Order.count({ where: { vendorId, status: "ready" } }),
      ])

      // Emit socket event to vendor for real-time update
      const updatedOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        items: order.items,
        totalAmount: order.totalAmount,
        status: "preparing",
        estimatedPreparationTime: order.estimatedPreparationTime,
        queuePosition,
        orderOtp: order.orderOtp,
        createdAt: order.createdAt,
        acceptedAt: new Date(),
      }

      // Notify vendor of order status update
      emitToVendor(vendorId, 'order-status-updated', {
        section: 'queue',
        order: updatedOrder,
        action: 'status_update',
        sectionCounts: {
          upcoming: sectionCounts[0],
          queue: sectionCounts[1],
          ready: sectionCounts[2],
        }
      })

      // Notify user of order acceptance
      if (order.userId) {
        emitToUser(order.userId, 'order-status-updated', {
          parentOrderId: order.parentOrderId,
          vendorOrder: updatedOrder,
          action: 'status_update'
        })
      }

      // Also emit to the specific order room
      emitToOrder(order.parentOrderId, 'order-status-updated', {
        parentOrderId: order.parentOrderId,
        vendorOrder: updatedOrder,
        action: 'status_update'
      })

      console.log(`📡 Socket events emitted for order acceptance: ${order.id}`)

      return NextResponse.json({
        success: true,
        message: "Order accepted and moved to preparation",
        data: {
          orderId: order.id,
          queuePosition,
          status: "preparing",
        },
      })
    } else if (action === "reject") {
      // Calculate refund amount
      const refundAmount = order.totalAmount

      // Update order to rejected status
      await order.update({
        status: "rejected",
        rejectedAt: new Date(),
        rejectionReason: reason || "No reason provided",
        refundAmount,
        refundStatus: "pending",
        statusHistory: [
          ...order.statusHistory,
          {
            status: "rejected",
            timestamp: new Date(),
            note: `Order rejected by vendor: ${reason || "No reason provided"}`,
            updatedBy: user.id,
          },
        ],
      })

      // Get updated section counts for the vendor
      const sectionCounts = await Promise.all([
        Order.count({ where: { vendorId, status: "pending" } }),
        Order.count({ where: { vendorId, status: { [Op.in]: ["accepted", "preparing"] } } }),
        Order.count({ where: { vendorId, status: "ready" } }),
      ])

      // Emit socket event to vendor to remove order from upcoming
      emitToVendor(vendorId, 'order-removed', {
        orderId: order.id,
        sectionCounts: {
          upcoming: sectionCounts[0],
          queue: sectionCounts[1],
          ready: sectionCounts[2],
        }
      })

      // Notify user of order rejection
      if (order.userId) {
        const rejectedOrder = {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          items: order.items,
          totalAmount: order.totalAmount,
          status: "rejected",
          estimatedPreparationTime: order.estimatedPreparationTime,
          queuePosition: null,
          orderOtp: order.orderOtp,
          createdAt: order.createdAt,
          rejectedAt: new Date(),
          rejectionReason: reason || "No reason provided",
        }

        emitToUser(order.userId, 'order-status-updated', {
          parentOrderId: order.parentOrderId,
          vendorOrder: rejectedOrder,
          action: 'status_update'
        })

        // Also emit to the specific order room
        emitToOrder(order.parentOrderId, 'order-status-updated', {
          parentOrderId: order.parentOrderId,
          vendorOrder: rejectedOrder,
          action: 'status_update'
        })
      }

      console.log(`📡 Socket events emitted for order rejection: ${order.id}`)

      // TODO: Process refund credits to user
      // TODO: Send notification to user about rejection and refund

      return NextResponse.json({
        success: true,
        message: "Order rejected successfully",
        data: {
          orderId: order.id,
          refundAmount,
          status: "rejected",
        },
      })
    } else {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Update vendor order status error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}
