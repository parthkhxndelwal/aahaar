import { NextResponse } from "next/server"
import { authenticateTokenNextJS } from "@/middleware/auth"
import { OrderService } from "@/lib/services/order-service"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status)
    }

    const { user, courtId: authCourtId } = authResult
    const { courtId } = await params

    // Verify user belongs to requested court (super admins can access any court)
    if (user.role !== "superadmin" && authCourtId !== courtId) {
      return errorResponse("Access denied", 403)
    }

    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const vendorId = searchParams.get("vendorId")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 10

    const result = await OrderService.getCourtOrders(courtId, {
      status,
      vendorId,
      userId,
      startDate,
      endDate,
      page,
      limit
    })

    return successResponse(result)

  } catch (error) {
    return handleServiceError(error)
  }
}

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status)
    }

    const { user, courtId: authCourtId } = authResult
    const { courtId } = await params

    // Verify user belongs to requested court (super admins can access any court)
    if (user.role !== "superadmin" && authCourtId !== courtId) {
      return errorResponse("Access denied", 403)
    }

    const {
      vendorId,
      items, 
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod = "online",
      specialInstructions,
    } = await request.json()

    if (!vendorId) {
      return errorResponse("vendorId is required", 400)
    }

    const orderResult = await OrderService.createOrder({
      userId: authResult.user?.id, 
      courtId,
      vendorId,
      items: items.map(i => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        customizations: i.customizations,
        specialInstructions: i.specialInstructions
      })),
      paymentMethod,
      specialInstructions,
      customerDetails: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail
      },
      applyCharges: false,
      skipActiveOrderCheck: true,
      orderSource: 'admin_create'
    })

    return successResponse({
      order: orderResult.orders[0],
      parentOrderId: orderResult.parentOrderId
    }, "Order created successfully", 201)

  } catch (error) {
    return handleServiceError(error)
  }
}
