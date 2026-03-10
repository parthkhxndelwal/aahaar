import { NextResponse } from "next/server"
import { authenticateTokenNextJS } from "@/middleware/auth"
import { CartService } from "@/lib/services/cart-service"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"

// Helper to format cart for legacy frontend compatibility
const formatCartResponse = (cartSummary) => {
  // cartSummary.items is the array of Sequelize objects
  // We need to map it to the flat structure expected by frontend
  const items = cartSummary.items.map(item => {
    // Check if menuItem is loaded (it should be via getCart)
    const menuItem = item.menuItem || {}
    const vendor = menuItem.vendor || {}

    return {
      menuItemId: item.menuItemId,
      name: menuItem.name || "Unknown Item",
      price: parseFloat(item.unitPrice || 0),
      quantity: item.quantity,
      subtotal: parseFloat(item.subtotal || 0),
      customizations: item.customizations,
      vendorId: menuItem.vendorId,
      imageUrl: menuItem.imageUrl,
      vendorName: vendor.stallName || vendor.vendorName || 'Unknown Vendor'
    }
  })

  return {
    items,
    total: cartSummary.summary.subtotal, // Use subtotal as legacy 'total' (pre-tax) or total (post-tax)? 
    // Old route used cart.total which was sum of subtotals. Cleanest is subtotal.
    summary: cartSummary.summary // Include new rich summary as well
  }
}

export async function GET(request) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      // Allow 401? Cart might be guest?
      // Old route returned error.
      return errorResponse(authResult.error, authResult.status)
    }

    const { user } = authResult
    // CartService.getCartSummary requires userId, courtId.
    // If user.courtId is missing, what happens? 
    // Assuming authResult includes courtId or user has it.
    // Middleware usually attaches courtId if in params, but here it's global cart route.
    // We rely on user.courtId.
    
    if (!user.courtId) {
        // Fallback or error?
        // Old code: user.courtId
    }

    const summary = await CartService.getCartSummary(user.id, user.courtId)
    
    // Return formatted data
    return successResponse({ cart: formatCartResponse(summary) })

  } catch (error) {
    return handleServiceError(error)
  }
}

export async function POST(request) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status)
    }

    const { user } = authResult
    const { menuItemId, quantity = 1, customizations = {} } = await request.json()

    const summary = await CartService.addItem(user.id, user.courtId, {
      menuItemId,
      quantity,
      customizations
    })

    return successResponse({ cart: formatCartResponse(summary) }, "Item added to cart")

  } catch (error) {
    return handleServiceError(error)
  }
}

export async function DELETE(request) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status)
    }

    const { user } = authResult

    await CartService.clearCart(user.id, user.courtId)

    return successResponse({
      cart: { items: [], total: 0 }
    }, "Cart cleared")

  } catch (error) {
    return handleServiceError(error)
  }
}
