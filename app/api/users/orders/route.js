import { NextResponse } from "next/server"
import { authenticateTokenNextJS } from "@/middleware/auth"
import { OrderService } from "@/lib/services/order-service"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"

export async function GET(request) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status)
    }

    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const courtId = searchParams.get("courtId")
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 20

    const result = await OrderService.getUserOrders(user.id, {
      courtId,
      status,
      page,
      limit
    })

    return successResponse({
      orders: result.orders,
      pagination: result.pagination
    })
    
  } catch (error) {
    return handleServiceError(error)
  }
}