import { NextResponse } from "next/server"
import { Vendor } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"
import { OrderService } from "@/lib/services/order-service"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status)
    }

    const { user } = authResult
    const { vendorId } = await params
    const { searchParams } = new URL(request.url)

    // Check permissions
    if (user.role === "vendor") {
      const vendor = await Vendor.findOne({ where: { userId: user.id } })
      if (!vendor || vendor.id !== vendorId) {
        return errorResponse("Access denied", 403)
      }
    } else if (user.role === "admin") {
      const vendor = await Vendor.findOne({ where: { id: vendorId, courtId: user.courtId } })
      if (!vendor) {
        return errorResponse("Vendor not found", 404)
      }
    } else {
      return errorResponse("Access denied", 403)
    }

    const status = searchParams.get("status")
    const date = searchParams.get("date")
    const limit = parseInt(searchParams.get("limit") || "50")
    const page = parseInt(searchParams.get("page") || "1")

    const result = await OrderService.getVendorOrders(vendorId, {
      status, 
      date,
      page,
      limit
    })

    // Transform for frontend compatibility
    const transformedOrders = result.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName || order.user?.fullName || "Unknown",
      customerPhone: order.customerPhone || order.user?.phone,
      items: order.orderItems?.map((item) => ({
        name: item.itemName || item.menuItem?.name || "Unknown Item",
        quantity: item.quantity,
        price: item.itemPrice, // using itemPrice stored in OrderItem
      })) || [],
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMethod: order.paymentMethod || "cash", // Order model has paymentMethod directly too
      paymentStatus: order.paymentStatus || "pending",
      specialInstructions: order.specialInstructions,
      createdAt: order.createdAt,
      estimatedPreparationTime: order.estimatedPreparationTime || 15,
    }))

    return successResponse({
      orders: transformedOrders,
      pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
          pages: result.pagination.totalPages 
          // Note: formatted 'pages' vs 'totalPages' in previous code
      },
    }, "Orders fetched successfully")

  } catch (error) {
    return handleServiceError(error)
  }
}