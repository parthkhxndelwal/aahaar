import { Cart, CartItem, MenuItem, Vendor } from '@/models'
import { ServiceError } from '@/lib/api-response'

export class CartService {
  /**
   * Get or Create active cart for user
   */
  static async getCart(userId: string, courtId: string) {
    let cart = await Cart.findOne({
      where: {
        userId,
        courtId,
        status: 'active',
      },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: MenuItem,
              as: 'menuItem',
              attributes: ['id', 'name', 'price', 'imageUrl', 'vendorId', 'isAvailable'],
              include: [
                {
                  model: Vendor,
                  as: 'vendor',
                  attributes: ['id', 'stallName', 'vendorName', 'status'],
                },
              ],
            },
          ],
        },
      ],
    })

    if (!cart) {
      cart = await Cart.create({
        userId,
        courtId,
        status: 'active',
        total: 0,
      })
      // reload to get items association (empty array)
      cart = await Cart.findByPk(cart.id, {
        include: [{ model: CartItem, as: 'items' }]
      })
    }

    return cart
  }

  /**
   * Clear cart items (e.g. after checkout)
   */
  static async clearCart(userId: string, courtId: string) {
    const cart = await this.getCart(userId, courtId)
    if (!cart) return

    await CartItem.destroy({
      where: { cartId: cart.id },
    })

    await cart.update({ total: 0 })
    return true
  }

  /**
   * Calculate cart totals and structure for frontend
   */
  static async getCartSummary(userId: string, courtId: string) {
    const cart = await this.getCart(userId, courtId)
    
    // Group by vendor similar to checkout logic for preview
    const vendorGroups: Record<string, any> = {}
    let grandTotal = 0
    let itemCount = 0

    if (cart.items) {
      for (const item of cart.items) {
        // Skip invalid items
        if (!item.menuItem || !item.menuItem.vendor) continue

        const vendorId = item.menuItem.vendor.id
        if (!vendorGroups[vendorId]) {
          vendorGroups[vendorId] = {
            vendor: {
              id: item.menuItem.vendor.id,
              name: item.menuItem.vendor.stallName || item.menuItem.vendor.vendorName,
            },
            items: [],
            subtotal: 0,
          }
        }

        const itemTotal = item.menuItem.price * item.quantity
        vendorGroups[vendorId].items.push({
          ...item.toJSON(),
          subtotal: itemTotal
        })
        vendorGroups[vendorId].subtotal += itemTotal
        grandTotal += itemTotal
        itemCount += 1
      }
    }

    return {
      cartId: cart.id,
      items: cart.items || [],
      vendorGroups,
      summary: {
        subtotal: grandTotal,
        serviceCharge: Math.round(grandTotal * 0.05),
        platformCharge: 5,
        total: Math.round(grandTotal * 1.05) + 5,
        itemCount
      }
    }
  }

  /**
   * Add Item to Cart
   */
  static async addItem(userId: string, courtId: string, payload: {
    menuItemId: string
    quantity: number
    customizations?: any
  }) {
    const { menuItemId, quantity = 1, customizations = {} } = payload

    const menuItem = await MenuItem.findByPk(menuItemId)
    if (!menuItem || !menuItem.isAvailable) {
      throw new ServiceError("Menu item not available", 400)
    }

    const cart = await this.getCart(userId, courtId)

    // Check if item already exists in cart
    // Note: customization matching is complex, here assuming same item ID = same row
    // If strict uniqueness by variance is needed, we'd check customizations too.
    // For MVP, we stick to menuItemId.
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
    
    // @ts-ignore
    const newTotal = cartItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0)
    await cart.update({ total: newTotal })

    return this.getCartSummary(userId, courtId)
  }
}
