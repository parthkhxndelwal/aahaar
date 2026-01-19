import { NextResponse } from "next/server"
import { authenticateToken } from "@/middleware/auth"
import { MenuItem, Cart, CartItem, User } from "@/models"

export async function GET(request) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult

    // Find or create active cart for user
    let cart = await Cart.findOne({
      where: {
        userId: user.id,
        courtId: user.courtId,
        status: 'active'
      },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: MenuItem,
              as: 'menuItem',
              attributes: ['id', 'name', 'price', 'imageUrl']
            }
          ]
        }
      ]
    })

    if (!cart) {
      // Create new cart if none exists
      cart = await Cart.create({
        userId: user.id,
        courtId: user.courtId,
        status: 'active',
        total: 0
      })
      cart.items = []
    }

    // Format cart data for frontend
    const formattedCart = {
      items: cart.items?.map(item => ({
        menuItemId: item.menuItemId,
        name: item.menuItem.name,
        price: parseFloat(item.unitPrice),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal),
        customizations: item.customizations,
        vendorId: item.menuItem.vendorId
      })) || [],
      total: parseFloat(cart.total || 0)
    }

    return NextResponse.json({
      success: true,
      data: { cart: formattedCart },
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

    // Find or create active cart
    let cart = await Cart.findOne({
      where: {
        userId: user.id,
        courtId: user.courtId,
        status: 'active'
      }
    })

    if (!cart) {
      cart = await Cart.create({
        userId: user.id,
        courtId: user.courtId,
        status: 'active',
        total: 0
      })
    }

    // Check if item already exists in cart
    const existingCartItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        menuItemId: menuItemId
      }
    })

    if (existingCartItem) {
      // Update existing item
      existingCartItem.quantity += quantity
      existingCartItem.subtotal = existingCartItem.quantity * menuItem.price
      await existingCartItem.save()
    } else {
      // Create new cart item
      await CartItem.create({
        cartId: cart.id,
        menuItemId: menuItemId,
        quantity: quantity,
        unitPrice: menuItem.price,
        subtotal: quantity * menuItem.price,
        customizations: customizations
      })
    }

    // Recalculate cart total
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id }
    })
    
    cart.total = cartItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0)
    await cart.save()

    // Return updated cart
    const updatedCart = await Cart.findOne({
      where: { id: cart.id },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: MenuItem,
              as: 'menuItem',
              attributes: ['id', 'name', 'price', 'imageUrl', 'vendorId']
            }
          ]
        }
      ]
    })

    const formattedCart = {
      items: updatedCart.items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.menuItem.name,
        price: parseFloat(item.unitPrice),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal),
        customizations: item.customizations,
        vendorId: item.menuItem.vendorId
      })),
      total: parseFloat(updatedCart.total)
    }

    return NextResponse.json({
      success: true,
      message: "Item added to cart",
      data: { cart: formattedCart },
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

    userCarts.delete(user.id)

    return NextResponse.json({
      success: true,
      message: "Cart cleared",
    })
  } catch (error) {
    console.error("Clear cart error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
