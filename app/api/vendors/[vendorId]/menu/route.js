import { NextResponse } from "next/server"
import { authenticateToken } from "@/middleware/auth"
import { MenuService } from "@/lib/services/menu-service"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"

export async function GET(request, { params }) {
  try {
    const { vendorId } = await params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const status = searchParams.get("status")

    const { menuItems, categories } = await MenuService.getVendorMenu(vendorId, {
      category: category || undefined,
      status: status || undefined,
    })

    return successResponse({ menuItems, categories })
  } catch (error) {
    return handleServiceError(error)
  }
}

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId } = await params
    const menuItemData = await request.json()

    console.log("Creating menu item with data:", menuItemData)

    const isAdmin = user.role === "admin"
    
    const menuItem = await MenuService.createMenuItem(
      {
        vendorId,
        ...menuItemData,
      },
      user.id,
      isAdmin
    )

    return successResponse({ menuItem }, "Menu item created successfully", 201)
  } catch (error) {
    console.error("Create menu item error:", error)
    return handleServiceError(error)
  }
}
