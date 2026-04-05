import { Cart, CartItem, MenuItem, Vendor } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status)
    }

    const { user } = authResult
    const { courtId } = await params

    // Get user's cart items with detailed vendor and menu item information
    const cart = await Cart.findOne({
      where: { userId: user.id, courtId },
      include: [
        {
          model: CartItem,
          as: "items",
          include: [
            {
              model: MenuItem,
              as: "menuItem",
              attributes: [
                "id", "name", "price", "isAvailable", "status", 
                "hasStock", "stockQuantity", "vendorId"
              ],
              include: [
                {
                  model: Vendor,
                  as: "vendor",
                  attributes: ["id", "stallName", "vendorName", "isOnline"],
                },
              ],
            },
          ],
        },
      ],
    })

    if (!cart || !cart.items || cart.items.length === 0) {
      return successResponse({
        valid: true,
        message: "Cart is empty",
        validationResults: []
      })
    }

    const validationResults = []
    let hasInvalidItems = false

    // Validate each cart item
    for (const cartItem of cart.items) {
      const menuItem = cartItem.menuItem
      const vendor = menuItem.vendor
      const validationResult = {
        cartItemId: cartItem.id,
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        vendorName: vendor.stallName || vendor.vendorName,
        quantity: cartItem.quantity,
        isValid: true,
        issues: []
      }

      // Check if vendor is online
      if (!vendor.isOnline) {
        validationResult.isValid = false
        validationResult.issues.push({
          type: "vendor_offline",
          message: `${vendor.stallName || vendor.vendorName} is currently offline`
        })
        hasInvalidItems = true
      }

      // Check if menu item is available
      if (!menuItem.isAvailable) {
        validationResult.isValid = false
        validationResult.issues.push({
          type: "item_unavailable", 
          message: `${menuItem.name} is currently unavailable`
        })
        hasInvalidItems = true
      }

      // Check item status
      if (menuItem.status === "out_of_stock") {
        validationResult.isValid = false
        validationResult.issues.push({
          type: "out_of_stock",
          message: `${menuItem.name} is out of stock`
        })
        hasInvalidItems = true
      } else if (menuItem.status === "inactive") {
        validationResult.isValid = false
        validationResult.issues.push({
          type: "item_inactive",
          message: `${menuItem.name} is no longer available`
        })
        hasInvalidItems = true
      }

      // Check stock quantity if item has stock tracking
      if (menuItem.hasStock && menuItem.stockQuantity !== null) {
        if (menuItem.stockQuantity <= 0) {
          validationResult.isValid = false
          validationResult.issues.push({
            type: "no_stock",
            message: `${menuItem.name} is currently out of stock`
          })
          hasInvalidItems = true
        } else if (cartItem.quantity > menuItem.stockQuantity) {
          validationResult.isValid = false
          validationResult.issues.push({
            type: "insufficient_stock",
            message: `Only ${menuItem.stockQuantity} ${menuItem.name} available, but ${cartItem.quantity} requested`
          })
          hasInvalidItems = true
        }
      }

      validationResults.push(validationResult)
    }

    // Group invalid items by issue type for summary
    const summary = {
      totalItems: cart.items.length,
      validItems: validationResults.filter(item => item.isValid).length,
      invalidItems: validationResults.filter(item => !item.isValid).length,
      offlineVendors: [...new Set(
        validationResults
          .filter(item => item.issues.some(issue => issue.type === "vendor_offline"))
          .map(item => item.vendorName)
      )],
      unavailableItems: validationResults
        .filter(item => item.issues.some(issue => 
          ["item_unavailable", "out_of_stock", "item_inactive", "no_stock"].includes(issue.type)
        ))
        .map(item => item.itemName),
      stockIssues: validationResults
        .filter(item => item.issues.some(issue => issue.type === "insufficient_stock"))
        .map(item => ({
          name: item.itemName,
          requested: item.quantity,
          available: cart.items.find(ci => ci.menuItem.id === item.menuItemId)?.menuItem?.stockQuantity || 0
        }))
    }

    return successResponse({
      valid: !hasInvalidItems,
      validationResults,
      summary
    }, hasInvalidItems 
      ? "Some items in your cart are no longer available" 
      : "All cart items are valid")

  } catch (error) {
    console.error("Cart validation error:", error)
    return handleServiceError(error)
  }
}
