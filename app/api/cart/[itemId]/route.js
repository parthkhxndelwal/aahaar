import { NextResponse } from "next/server"
import { authenticateToken } from "@/middleware/auth"
import { Cart, CartItem, MenuItem } from "@/models"

export async function PUT(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { itemId } = await params
    const { quantity } = await request.json()

    // Find user's active cart
    const cart = await Cart.findOne({
      where: {
        userId: user.id,
        courtId: user.courtId,
        status: 'active'
      }
    })

    if (!cart) {
      return NextResponse.json({ success: false, message: "Cart not found" }, { status: 404 })
    }

    // Find the cart item
    const cartItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        menuItemId: itemId
      },
      include: [
        {
          model: MenuItem,
          as: 'menuItem'
        }
      ]
    })

    if (!cartItem) {
      return NextResponse.json({ success: false, message: "Item not found in cart. Use POST to add new items." }, { status: 404 })
    }

    if (quantity <= 0) {
      // Remove item from cart
      await cartItem.destroy()
    } else {
      // Update quantity
      cartItem.quantity = quantity
      cartItem.subtotal = quantity * cartItem.unitPrice
      await cartItem.save()
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
      message: "Cart updated",
      data: { cart: formattedCart },
    })
  } catch (error) {
    console.error("Update cart error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { itemId } = await params

    // Find user's active cart
    const cart = await Cart.findOne({
      where: {
        userId: user.id,
        courtId: user.courtId,
        status: 'active'
      }
    })

    if (!cart) {
      return NextResponse.json({ success: false, message: "Cart not found" }, { status: 404 })
    }

    // Find and remove the cart item
    const cartItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        menuItemId: itemId
      }
    })

    if (!cartItem) {
      return NextResponse.json({ success: false, message: "Item not found in cart" }, { status: 404 })
    }

    await cartItem.destroy()

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
      message: "Item removed from cart",
      data: { cart: formattedCart },
    })
  } catch (error) {
    console.error("Delete cart item error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
