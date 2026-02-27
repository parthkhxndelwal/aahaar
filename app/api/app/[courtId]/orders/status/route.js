import { NextResponse } from "next/server"
import { Order, User, Payment, OrderItem, MenuItem, Vendor } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"
import { Op } from "sequelize"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { courtId } = await params
    const { searchParams } = new URL(request.url)
    const parentOrderId = searchParams.get("parentOrderId")
    const status = searchParams.get("status")
    const activeOnly = searchParams.get("activeOnly") === "true"
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 20
    const offset = (page - 1) * limit

    // Build where clause
    const whereClause = { 
      userId: user.id, 
      courtId,
      isSubOrder: true // Only show sub-orders to avoid confusion
    }

    if (parentOrderId) {
      whereClause.parentOrderId = parentOrderId
    }

    if (status) {
      whereClause.status = status
    }

    // If activeOnly, filter for non-completed, non-rejected and non-cancelled orders
    if (activeOnly) {
      whereClause.status = {
        [Op.notIn]: ['completed', 'rejected', 'cancelled']
      }
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
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
        {
          model: Payment,
          as: "payment",
          attributes: ["id", "status", "paymentMethod", "amount"],
        },
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    })

    // Group orders by parentOrderId for better organization
    const groupedOrders = {}
    const orderSummaries = []

    for (const order of orders.rows) {
      const parentId = order.parentOrderId
      
      if (!groupedOrders[parentId]) {
        groupedOrders[parentId] = {
          parentOrderId: parentId,
          orderOtp: order.orderOtp,
          orders: [],
          totalAmount: 0,
          overallStatus: 'pending', // pending, partial, ready, completed, cancelled
          createdAt: order.createdAt,
          vendorsCount: 0,
          completedVendors: 0,
          rejectedVendors: 0,
          cancelledVendors: 0,
        }
      }

      const orderData = {
        id: order.id,
        orderNumber: order.orderNumber,
        vendor: order.vendor,
        items: order.items?.map((item) => ({
          id: item.id,
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
        estimatedPreparationTime: order.estimatedPreparationTime,
        queuePosition: order.queuePosition,
        specialInstructions: order.specialInstructions,
        createdAt: order.createdAt,
        acceptedAt: order.acceptedAt,
        preparingAt: order.preparingAt,
        readyAt: order.readyAt,
        completedAt: order.completedAt,
        rejectedAt: order.rejectedAt,
        rejectionReason: order.rejectionReason,
        refundAmount: order.refundAmount,
        refundStatus: order.refundStatus,
      }

      groupedOrders[parentId].orders.push(orderData)
      groupedOrders[parentId].totalAmount += order.totalAmount
      groupedOrders[parentId].vendorsCount++

      // Update completion counts
      if (order.status === 'completed') {
        groupedOrders[parentId].completedVendors++
      } else if (order.status === 'rejected') {
        groupedOrders[parentId].rejectedVendors++
      } else if (order.status === 'cancelled') {
        groupedOrders[parentId].cancelledVendors++
      }
    }

    // Calculate overall status for each parent order
    for (const parentId in groupedOrders) {
      const group = groupedOrders[parentId]
      const activeOrders = group.vendorsCount - group.rejectedVendors - group.cancelledVendors
      
      // If all orders are cancelled, mark as cancelled
      if (group.cancelledVendors === group.vendorsCount) {
        group.overallStatus = 'cancelled'
      }
      // If all non-cancelled orders are completed, mark as completed
      else if (group.completedVendors === activeOrders && activeOrders > 0) {
        group.overallStatus = 'completed'
      } 
      // If some orders are completed but not all, mark as partial
      else if (group.completedVendors > 0) {
        group.overallStatus = 'partial'
      } 
      // If any orders are ready, mark as ready
      else if (group.orders.some(o => o.status === 'ready')) {
        group.overallStatus = 'ready'
      } 
      // Default to pending
      else {
        group.overallStatus = 'pending'
      }

      orderSummaries.push(group)
    }

    // Sort by creation date
    orderSummaries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return NextResponse.json({
      success: true,
      data: {
        orderSummaries,
        pagination: {
          total: orders.count,
          page,
          limit,
          totalPages: Math.ceil(orders.count / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get user order status error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}

// Get specific order details by parent order ID
export async function POST(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { courtId } = await params
    const { parentOrderId } = await request.json()

    if (!parentOrderId) {
      return NextResponse.json({ success: false, message: "Parent order ID is required" }, { status: 400 })
    }

    const orders = await Order.findAll({
      where: { 
        userId: user.id, 
        courtId,
        parentOrderId,
        isSubOrder: true
      },
      include: [
        {
          model: Vendor,
          as: "vendor",
          attributes: ["id", "stallName", "vendorName", "contactPhone"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: MenuItem,
              as: "menuItem",
              attributes: ["id", "name", "imageUrl", "description"],
            },
          ],
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["id", "status", "paymentMethod", "amount"],
        },
      ],
      order: [["createdAt", "ASC"]],
    })

    if (orders.length === 0) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
    }

    const orderDetails = {
      parentOrderId,
      orderOtp: orders[0].orderOtp,
      createdAt: orders[0].createdAt,
      totalAmount: orders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0),
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        vendor: order.vendor,
        items: order.items?.map((item) => ({
          id: item.id,
          name: item.menuItem?.name || "Unknown Item",
          description: item.menuItem?.description,
          quantity: item.quantity,
          price: item.itemPrice,
          subtotal: item.subtotal,
          imageUrl: item.menuItem?.imageUrl,
          customizations: item.customizations,
        })) || [],
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.payment?.paymentMethod || "online",
        paymentStatus: order.payment?.status || "pending",
        estimatedPreparationTime: order.estimatedPreparationTime,
        queuePosition: order.queuePosition,
        specialInstructions: order.specialInstructions,
        statusHistory: order.statusHistory,
        timeline: {
          createdAt: order.createdAt,
          acceptedAt: order.acceptedAt,
          preparingAt: order.preparingAt,
          readyAt: order.readyAt,
          completedAt: order.completedAt,
          rejectedAt: order.rejectedAt,
        },
        rejectionReason: order.rejectionReason,
        refundAmount: order.refundAmount,
        refundStatus: order.refundStatus,
      })),
      summary: {
        totalVendors: orders.length,
        completedVendors: orders.filter(o => o.status === 'completed').length,
        pendingVendors: orders.filter(o => o.status === 'pending').length,
        preparingVendors: orders.filter(o => ['accepted', 'preparing'].includes(o.status)).length,
        readyVendors: orders.filter(o => o.status === 'ready').length,
        rejectedVendors: orders.filter(o => o.status === 'rejected').length,
        grandTotal: orders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0),
        totalRefunds: orders.reduce((sum, o) => sum + parseFloat(o.refundAmount || 0), 0),
      }
    }

    return NextResponse.json({
      success: true,
      data: orderDetails,
    })
  } catch (error) {
    console.error("Get order details error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}
