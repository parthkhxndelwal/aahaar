import { NextResponse } from "next/server"
import { authenticateTokenNextJS } from "@/middleware/auth"
import { OrderService } from "@/lib/services/order-service"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"
import { Op } from "sequelize"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status)
    }

    const { user } = authResult
    const { courtId } = await params
    const { searchParams } = new URL(request.url)
    const parentOrderId = searchParams.get("parentOrderId")
    const status = searchParams.get("status")
    const activeOnly = searchParams.get("activeOnly") === "true"
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 20

    const result = await OrderService.getUserOrders(user.id, {
      courtId,
      parentOrderId: parentOrderId || undefined,
      status: status || undefined,
      activeOnly,
      page,
      limit
    })

    const orders = result.orders

    // Group orders by parentOrderId for active order screen
    const groupedOrders = {}
    const orderSummaries = []

    for (const order of orders) {
      const parentId = order.parentOrderId
      
      if (!groupedOrders[parentId]) {
        groupedOrders[parentId] = {
          parentOrderId: parentId,
          orderOtp: order.orderOtp,
          orders: [],
          totalAmount: 0,
          overallStatus: 'pending',
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
        vendor: order.vendor, // Service include matches
        items: order.orderItems?.map((item) => ({
          id: item.id,
          name: item.itemName || item.menuItem?.name || "Unknown Item",
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
      groupedOrders[parentId].totalAmount += parseFloat(order.totalAmount || 0)
      groupedOrders[parentId].vendorsCount++

      if (order.status === 'completed') {
        groupedOrders[parentId].completedVendors++
      } else if (order.status === 'rejected') {
        groupedOrders[parentId].rejectedVendors++
      } else if (order.status === 'cancelled') {
        groupedOrders[parentId].cancelledVendors++
      }
    }

    // Calculate aggregated status
    for (const parentId in groupedOrders) {
      const group = groupedOrders[parentId]
      const activeOrders = group.vendorsCount - group.rejectedVendors - group.cancelledVendors
      
      if (group.cancelledVendors === group.vendorsCount) {
        group.overallStatus = 'cancelled'
      }
      else if (group.rejectedVendors === group.vendorsCount) {
        group.overallStatus = 'rejected'
      }
      else if (activeOrders === 0) {
        if (group.rejectedVendors > 0) group.overallStatus = 'rejected'
        else group.overallStatus = 'cancelled'
      }
      else if (group.completedVendors === activeOrders && activeOrders > 0) {
        group.overallStatus = 'completed'
      } 
      else if (group.orders.some(o => o.status === 'ready' && o.status !== 'cancelled' && o.status !== 'rejected')) {
        group.overallStatus = 'ready'
      }
      else if (group.completedVendors > 0 && activeOrders > group.completedVendors) {
        group.overallStatus = 'partial'
      } 
      else if (group.orders.some(o => o.status === 'preparing' || o.status === 'accepted')) {
        group.overallStatus = 'preparing'
      }
      else {
        group.overallStatus = 'pending'
      }

      orderSummaries.push(group)
    }

    orderSummaries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return successResponse({
      orderSummaries,
      pagination: result.pagination
    })

  } catch (error) {
    return handleServiceError(error)
  }
}

// Get specific order details by parent order ID
export async function POST(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status)
    }

    const { user } = authResult
    const { courtId } = await params
    const { parentOrderId } = await request.json()

    if (!parentOrderId) {
      return errorResponse("Parent order ID is required", 400)
    }

    // Service fetch does not sort by ASC, it sorts by DESC by default.
    // We might want to sort here or add sorting to service? 
    // Usually detail view sorting isn't critical, but original was ASC.
    const result = await OrderService.getUserOrders(user.id, {
      courtId,
      parentOrderId,
      limit: 100 // Fetch all sub-orders for this parent
    })
    
    // Sort logic handled in-memory if needed, or update service (Service sorts DESC)
    const orders = result.orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    if (orders.length === 0) {
      return errorResponse("Order not found", 404)
    }

    const orderDetails = {
      parentOrderId,
      orderOtp: orders[0].orderOtp,
      createdAt: orders[0].createdAt,
      totalAmount: orders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0),
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        vendor: order.vendor, // Service includes this
        items: order.orderItems?.map((item) => ({
          id: item.id,
          name: item.itemName || item.menuItem?.name || "Unknown Item",
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
        timeline: { // Inferred timeline, old code had manual fields maybe? Order model has timestamps?
            // Assuming model has these fields or they are undefined
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

    return successResponse(orderDetails)

  } catch (error) {
    return handleServiceError(error)
  }
}