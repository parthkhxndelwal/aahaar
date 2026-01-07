import { NextRequest } from "next/server"
import { Order, User, Payment, OrderItem, MenuItem, Vendor } from "@/models"
import { authenticateToken } from "@/middleware/auth"
import { Op } from "sequelize"

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateToken(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const { vendorId } = await params

    // Check permissions
    if (user.role === "vendor") {
      const vendor = await Vendor.findOne({ where: { userId: user.id } })
      if (!vendor || vendor.id !== vendorId) {
        return new Response("Access denied", { status: 403 })
      }
    } else if (user.role === "admin") {
      const vendor = await Vendor.findOne({ where: { id: vendorId, courtId: user.courtId } })
      if (!vendor) {
        return new Response("Vendor not found", { status: 404 })
      }
    } else {
      return new Response("Access denied", { status: 403 })
    }

    // Create SSE response
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        
        // Send initial connection message
        const initialData = `data: ${JSON.stringify({ type: "connected", message: "Real-time updates connected" })}\n\n`
        controller.enqueue(encoder.encode(initialData))

        // Function to send order updates
        const sendOrderUpdate = async () => {
          try {
            // Fetch latest orders
            const orders = await Order.findAll({
              where: {
                vendorId,
                status: {
                  [Op.in]: ["pending", "confirmed", "preparing", "ready"],
                },
              },
              include: [
                {
                  model: User,
                  as: "customer",
                  attributes: ["fullName", "phone"],
                },
                {
                  model: Payment,
                  as: "payment",
                  attributes: ["method", "status"],
                },
                {
                  model: OrderItem,
                  as: "items",
                  include: [
                    {
                      model: MenuItem,
                      as: "menuItem",
                      attributes: ["name", "price"],
                    },
                  ],
                },
              ],
              order: [["createdAt", "DESC"]],
              limit: 20,
            })

            const transformedOrders = orders.map((order) => ({
              id: order.id,
              orderNumber: order.orderNumber,
              customerName: order.customer?.fullName || "Unknown",
              customerPhone: order.customer?.phone,
              items: order.items?.map((item) => ({
                name: item.menuItem?.name || "Unknown Item",
                quantity: item.quantity,
                price: item.unitPrice,
              })) || [],
              totalAmount: order.totalAmount,
              status: order.status,
              paymentMethod: order.payment?.method || "cash",
              paymentStatus: order.payment?.status || "pending",
              specialInstructions: order.specialInstructions,
              createdAt: order.createdAt,
              estimatedPreparationTime: order.estimatedPreparationTime || 15,
            }))

            const data = `data: ${JSON.stringify({ type: "orders_update", orders: transformedOrders })}\n\n`
            controller.enqueue(encoder.encode(data))
          } catch (error) {
            console.error("Error fetching orders for SSE:", error)
          }
        }

        // Send updates every 10 seconds
        const interval = setInterval(sendOrderUpdate, 10000)

        // Send initial data
        sendOrderUpdate()

        // Cleanup function
        const cleanup = () => {
          clearInterval(interval)
          controller.close()
        }

        // Handle client disconnect
        request.signal.addEventListener("abort", cleanup)
        
        // Set a maximum connection time of 30 minutes
        setTimeout(cleanup, 30 * 60 * 1000)
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    })
  } catch (error) {
    console.error("SSE endpoint error:", error)
    return new Response("Internal server error", { status: 500 })
  }
}
