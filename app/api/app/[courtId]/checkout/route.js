import { NextResponse } from "next/server"
import { Order, OrderItem, User, Vendor, MenuItem, Payment, Cart, CartItem, sequelize } from "@/models"
import Razorpay from "razorpay"
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

    // Check for active orders before allowing checkout
    const activeOrders = await Order.findAll({
      where: {
        userId: user.id,
        courtId,
        status: {
          [Op.notIn]: ['completed', 'rejected', 'cancelled']
        }
      },
      attributes: ['id', 'orderNumber', 'status']
    })

    if (activeOrders.length > 0) {
      console.log(`❌ [Checkout] User ${user.id} has ${activeOrders.length} active orders, blocking checkout`)
      return NextResponse.json(
        {
          success: false,
          message: "You have an active order. Please wait for it to complete before placing a new order.",
          activeOrders: activeOrders.map(order => ({
            orderNumber: order.orderNumber,
            status: order.status
          }))
        },
        { status: 400 }
      )
    }

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

    // Calculate charges (GST is already included in menu item prices)
    const serviceCharge = grandTotal * 0.05 // 5% Service Charge
    const platformCharge = 5 // ₹5 Platform Charge
    const totalAmount = grandTotal + serviceCharge + platformCharge

    // Generate shared OTP for the entire order
    const orderOtp = Math.floor(1000 + Math.random() * 9000).toString()
    
    // Generate parent order ID
    const parentOrderId = `PARENT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const createdOrders = []
    const createdPayments = []

    // Use transaction for atomic order creation
    const transaction = await sequelize.transaction()

    try {
      // Create sub-orders for each vendor
      for (const [vendorId, group] of Object.entries(vendorGroups)) {
        // Calculate vendor-specific charges proportionally (no GST since it's already included)
        const vendorSubtotal = group.subtotal
        const vendorProportion = vendorSubtotal / grandTotal
        const vendorServiceCharge = serviceCharge * vendorProportion
        const vendorPlatformCharge = platformCharge * vendorProportion
        const vendorTotal = vendorSubtotal + vendorServiceCharge + vendorPlatformCharge

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
          taxAmount: 0, // GST is already included in menu item prices
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
              serviceCharge: vendorServiceCharge,
              platformCharge: vendorPlatformCharge,
            },
          },
          // Populate JSON fields for multi-vendor structure
          vendors: {
            [vendorId]: {
              accountId: group.vendor.accountId || "default_acc",
              name: group.vendor.stallName || group.vendor.vendorName,
            },
          },
          items: group.items.map((item, index) => ({
            itemId: `item_${index + 1}`,
            vendorId: vendorId,
            itemName: item.name,
            price: Math.round(item.price * 100), // Convert to paise
            quantity: item.quantity,
          })),
          platformCommission: Math.round(vendorTotal * 0.1 * 100), // 10% commission in paise
        }, { transaction })

        console.log(`✅ Order created: ${order.id} for vendor ${vendorId}`)

        // Create order items for this vendor
        for (const item of group.items) {
          console.log(`📦 Creating order item for order ${order.id}, menuItem ${item.menuItemId}`)
          await OrderItem.create({
            orderId: order.id,
            menuItemId: item.menuItemId,
            itemName: item.name,
            itemPrice: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            customizations: item.customizations,
            specialInstructions: null,
          }, { transaction })
        }

        // Create payment record for this vendor's order
        console.log(`💳 Creating payment for order ${order.id}`)
        const payment = await Payment.create({
          orderId: order.id,
          paymentMethod,
          amount: vendorTotal,
          status: "pending",
        }, { transaction })

        createdOrders.push({
          ...order.toJSON(),
          vendor: group.vendor,
          items: group.items,
        })
        createdPayments.push(payment)

        console.log(`📦 New order created: ${order.id} for vendor: ${vendorId} (will be picked up by vendor polling)`)
      }

  // Commit the transaction
  await transaction.commit()

      // Clear the user's cart after successful order creation
      await CartItem.destroy({
        where: { cartId: cart.id },
      })

      // Update cart total
      await cart.update({ total: 0 })

      // If online payment, create a Razorpay order and include it in the response
      if (paymentMethod === "online") {
        try {
          // Ensure Razorpay credentials are present
          if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error('Razorpay keys missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment.')
            return NextResponse.json({ success: false, message: 'Payment gateway not configured (missing keys).' }, { status: 500 })
          }

          // Diagnostic log: print key prefix (safe) and NODE_ENV to confirm test vs live
          try {
            const keyPreview = process.env.RAZORPAY_KEY_ID.slice(0, 8)
            console.log(`Razorpay init - NODE_ENV=${process.env.NODE_ENV}, keyPreview=${keyPreview}`)
          } catch (e) {
            console.log('Razorpay init - NODE_ENV=', process.env.NODE_ENV)
          }

          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          })

          // amount to collect from customer in paise
          const amountPaise = Math.round(totalAmount * 100)
          const receipt = `aahaar_${parentOrderId}`

          const rOrder = await razorpay.orders.create({
            amount: amountPaise,
            currency: "INR",
            receipt,
            payment_capture: 1,
            notes: {
              parentOrderId,
            },
          })

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
                  serviceCharge,
                  platformCharge,
                },
                summary: {
                  vendorsCount: Object.keys(vendorGroups).length,
                  itemsCount: cart.items.length,
                },
                razorpayOrderId: rOrder.id,
                razorpayOrderAmount: rOrder.amount,
              },
            },
            { status: 201 }
          )
        } catch (err) {
          console.error("Razorpay order creation failed:", err)
          // Fall back to returning created orders/payments so client can handle
          return NextResponse.json(
            {
              success: false,
              message: "Payment initialization failed",
              error: err.message,
            },
            { status: 500 }
          )
        }
      }

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
      // Rollback transaction on error
      await transaction.rollback()
      console.error("Checkout transaction error:", error)
      throw error // Re-throw to be caught by outer catch
    }
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
