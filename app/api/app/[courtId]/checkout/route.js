import { NextResponse } from "next/server"
import { Order, OrderItem, User, Vendor, MenuItem, Payment, Cart, CartItem } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"
import { Op } from "sequelize"

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status })
    }

    const { user } = authResult
    const { courtId } = await params
    const { paymentMethod = "online", specialInstructions = "" } = await request.json()

    // Get user's cart items
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
              include: [
                {
                  model: Vendor,
                  as: "vendor",
                  attributes: ["id", "stallName", "vendorName"],
                },
              ],
            },
          ],
        },
      ],
    })

    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart is empty",
        },
        { status: 400 }
      )
    }

    // Group cart items by vendor
    const vendorGroups = {}
    let grandTotal = 0

    for (const cartItem of cart.items) {
      const vendorId = cartItem.menuItem.vendor.id
      if (!vendorGroups[vendorId]) {
        vendorGroups[vendorId] = {
          vendor: cartItem.menuItem.vendor,
          items: [],
          subtotal: 0,
        }
      }

      const itemSubtotal = cartItem.menuItem.price * cartItem.quantity
      vendorGroups[vendorId].items.push({
        menuItemId: cartItem.menuItemId,
        name: cartItem.menuItem.name,
        price: cartItem.menuItem.price,
        quantity: cartItem.quantity,
        subtotal: itemSubtotal,
        customizations: cartItem.customizations || {},
      })
      vendorGroups[vendorId].subtotal += itemSubtotal
      grandTotal += itemSubtotal
    }

    // Calculate charges
    const gstAmount = grandTotal * 0.18 // 18% GST
    const serviceCharge = grandTotal * 0.05 // 5% Service Charge
    const platformCharge = 5 // ₹5 Platform Charge
    const totalAmount = grandTotal + gstAmount + serviceCharge + platformCharge

    // Generate shared OTP for the entire order
    const orderOtp = Math.floor(1000 + Math.random() * 9000).toString()
    
    // Generate parent order ID
    const parentOrderId = `PARENT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const createdOrders = []
    const createdPayments = []

    // Create sub-orders for each vendor
    for (const [vendorId, group] of Object.entries(vendorGroups)) {
      // Calculate vendor-specific charges proportionally
      const vendorSubtotal = group.subtotal
      const vendorProportion = vendorSubtotal / grandTotal
      const vendorGst = gstAmount * vendorProportion
      const vendorServiceCharge = serviceCharge * vendorProportion
      const vendorPlatformCharge = platformCharge * vendorProportion
      const vendorTotal = vendorSubtotal + vendorGst + vendorServiceCharge + vendorPlatformCharge

      // Generate unique order number for this vendor
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      // Create order for this vendor
      const order = await Order.create({
        orderNumber,
        courtId,
        userId: user.id,
        vendorId,
        customerName: user.fullName,
        customerPhone: user.phone,
        customerEmail: user.email,
        type: "user_initiated",
        paymentMethod,
        subtotal: vendorSubtotal,
        taxAmount: vendorGst,
        discountAmount: 0,
        totalAmount: vendorTotal,
        specialInstructions,
        estimatedPreparationTime: 15,
        status: "pending", // Initial status - awaiting vendor action
        paymentStatus: "pending",
        orderOtp,
        parentOrderId,
        isSubOrder: true,
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date(),
            note: "Order created, awaiting vendor acceptance",
          },
        ],
        metadata: {
          vendorProportion,
          originalGrandTotal: grandTotal,
          charges: {
            gst: vendorGst,
            serviceCharge: vendorServiceCharge,
            platformCharge: vendorPlatformCharge,
          },
        },
      })

      // Create order items for this vendor
      for (const item of group.items) {
        await OrderItem.create({
          orderId: order.id,
          menuItemId: item.menuItemId,
          itemName: item.name,
          itemPrice: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          customizations: item.customizations,
          specialInstructions: null,
        })
      }

      // Create payment record for this vendor's order
      const payment = await Payment.create({
        orderId: order.id,
        paymentMethod,
        amount: vendorTotal,
        status: "pending",
      })

      createdOrders.push({
        ...order.toJSON(),
        vendor: group.vendor,
        items: group.items,
      })
      createdPayments.push(payment)
    }

    // Clear the user's cart after successful order creation
    await CartItem.destroy({
      where: { cartId: cart.id },
    })

    // Update cart total
    await cart.update({ total: 0 })

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully",
        data: {
          parentOrderId,
          orderOtp,
          orders: createdOrders,
          totalAmount,
          grandTotal,
          charges: {
            gst: gstAmount,
            serviceCharge,
            platformCharge,
          },
          summary: {
            vendorsCount: Object.keys(vendorGroups).length,
            itemsCount: cart.items.length,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create multi-vendor order error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}
