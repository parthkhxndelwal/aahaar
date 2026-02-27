import { NextResponse } from "next/server"
import { Order, OrderItem, Vendor, Payment } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import QRCode from "qrcode"

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof NextResponse) return authResult

    const { user } = authResult
    const { vendorId } = params
    const { items, customerName, customerPhone, paymentMethod = "online", customPrices = false } = await request.json()

    // Verify vendor ownership
    const vendor = await Vendor.findByPk(vendorId)
    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 })
    }

    const isVendorOwner = vendor.userId === user.id
    if (!isVendorOwner && user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Calculate totals
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const price = customPrices ? item.customPrice : item.price
      const itemSubtotal = price * item.quantity
      subtotal += itemSubtotal

      orderItems.push({
        menuItemId: item.menuItemId || null,
        itemName: item.name,
        itemPrice: price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        customizations: item.customizations || {},
      })
    }

    const totalAmount = subtotal

    // Generate order number
    const orderNumber = `MAN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order
    const order = await Order.create({
      orderNumber,
      courtId: vendor.courtId,
      vendorId,
      customerName,
      customerPhone,
      type: "vendor_initiated",
      paymentMethod,
      subtotal,
      totalAmount,
      estimatedPreparationTime: vendor.averagePreparationTime,
      status: paymentMethod === "cod" ? "preparing" : "pending",
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      statusHistory: [
        {
          status: paymentMethod === "cod" ? "preparing" : "pending",
          timestamp: new Date(),
          note: "Manual order created by vendor",
        },
      ],
    })

    // Create order items
    for (const orderItem of orderItems) {
      await OrderItem.create({
        orderId: order.id,
        ...orderItem,
      })
    }

    // Create payment record
    await Payment.create({
      orderId: order.id,
      paymentMethod,
      amount: totalAmount,
      status: paymentMethod === "cod" ? "pending" : "pending",
    })

    // Generate QR code for order acknowledgment
    const qrData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      vendorId: vendor.id,
      amount: totalAmount,
      paymentMethod,
    }

    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData))

    await order.update({ qrCode: qrCodeUrl })

    return NextResponse.json(
      {
        success: true,
        message: "Manual order created successfully",
        data: {
          order: {
            ...order.toJSON(),
            items: orderItems,
            qrCode: qrCodeUrl,
          },
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create manual order error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
