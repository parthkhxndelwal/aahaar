import { NextResponse } from "next/server"
import { Order, Vendor } from "@/models"
import { authenticateTokenNextJS } from "@/middleware/auth"
import { OrderService } from "@/lib/services/order-service"
import { successResponse, errorResponse, handleServiceError } from "@/lib/api-response"
import QRCode from "qrcode"

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateTokenNextJS(request)
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status)
    }

    const { user } = authResult
    const { vendorId } = await params
    const { items, customerName, customerPhone, paymentMethod = "online", customPrices = false } = await request.json()

    // Verify vendor ownership
    const vendor = await Vendor.findByPk(vendorId)
    if (!vendor) {
      return errorResponse("Vendor not found", 404)
    }

    // Allow Admin or Vendor Owner
    const isVendorOwner = vendor.userId === user.id
    if (!isVendorOwner && user.role !== "admin") {
      return errorResponse("Access denied", 403)
    }

    // Map items for Service
    const mappedItems = items.map((item) => ({
      menuItemId: item.menuItemId || null,
      name: item.name, 
      price: customPrices ? (item.customPrice || item.price) : item.price,
      quantity: item.quantity,
      customizations: item.customizations,
    }))

    // Create Order
    const result = await OrderService.createOrder({
      courtId: vendor.courtId,
      vendorId: vendor.id,
      items: mappedItems,
      customerDetails: {
        name: customerName,
        phone: customerPhone || "Walk-in"
      },
      paymentMethod,
      applyCharges: false, // Manual orders exclude platform fees
      skipActiveOrderCheck: true,
      orderSource: "vendor_manual"
    })

    const createdOrderData = result.orders[0]
    
    // Generate QR code for order acknowledgment
    const qrData = {
      orderId: createdOrderData.id,
      orderNumber: createdOrderData.orderNumber,
      vendorId: vendor.id,
      amount: createdOrderData.totalAmount,
      paymentMethod,
    }

    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData))

    // Update with QR Code
    await Order.update({ qrCode: qrCodeUrl }, { where: { id: createdOrderData.id } })
    
    createdOrderData.qrCode = qrCodeUrl

    return successResponse({
      order: createdOrderData
    }, "Manual order created successfully", 201)

  } catch (error) {
    return handleServiceError(error)
  }
}
