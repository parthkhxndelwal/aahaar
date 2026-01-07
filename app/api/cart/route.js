import { NextResponse } from "next/server"
import { authenticateToken } from "@/middleware/auth"
import { MenuItem } from "@/models"

// In-memory cart storage (in production, use Redis or database)
const userCarts = new Map()

export async function GET(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const cart = userCarts.get(user.id) || { items: [], total: 0 }

    return NextResponse.json({
      success: true,
      data: { cart },
    })
  } catch (error) {
    console.error("Get cart error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { menuItemId, quantity = 1, customizations = {} } = await request.json()

    const menuItem = await MenuItem.findByPk(menuItemId)
    if (!menuItem || !menuItem.isAvailable) {
      return NextResponse.json({ success: false, message: "Menu item not available" }, { status: 400 })
    }

    const cart = userCarts.get(user.id) || { items: [], total: 0 }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex((item) => item.menuItemId === menuItemId)

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity
      cart.items[existingItemIndex].subtotal = cart.items[existingItemIndex].quantity * menuItem.price
    } else {
      cart.items.push({
        menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        subtotal: quantity * menuItem.price,
        customizations,
        vendorId: menuItem.vendorId,
      })
    }

    // Recalculate total
    cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0)

    userCarts.set(request.user.id, cart)

    return NextResponse.json({
      success: true,
      message: "Item added to cart",
      data: { cart },
    })
  } catch (error) {
    console.error("Add to cart error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    userCarts.delete(request.user.id)

    return NextResponse.json({
      success: true,
      message: "Cart cleared",
    })
  } catch (error) {
    console.error("Clear cart error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
