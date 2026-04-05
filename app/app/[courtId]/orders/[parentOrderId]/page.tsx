"use client"
import { use, useEffect, useState } from "react"
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  Package, 
  Copy, 
  RefreshCw,
  AlertTriangle,
  User,
  MapPin,
  Hash,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useOrderDetails } from "@/hooks/use-order-details"
import { orderApi } from "@/lib/api"

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  subtotal: number
  imageUrl?: string
}

interface VendorOrder {
  id: string
  orderNumber: string
  vendor: {
    id: string
    stallName: string
    vendorName: string
  }
  items: OrderItem[]
  totalAmount: number
  status: string
  estimatedPreparationTime: number
  queuePosition?: number
  createdAt: string
  acceptedAt?: string
  preparingAt?: string
  readyAt?: string
  completedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  refundAmount?: number
  refundStatus?: string
}

interface OrderDetailsData {
  parentOrderId: string
  orderOtp: string
  orders: VendorOrder[]
  totalAmount: number
  summary: {
    totalVendors: number
    completedVendors: number
    pendingVendors: number
    preparingVendors: number
    readyVendors: number
    rejectedVendors: number
    grandTotal: number
  }
}

export default function OrderDetailsPage({ 
  params
}: { 
  params: Promise<{ courtId: string; parentOrderId: string }>
}) {
  const { courtId, parentOrderId } = use(params)
  const { user, token, loading: authLoading } = useUnifiedAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [otpCopied, setOtpCopied] = useState(false)

  // Use the polling hook for real-time updates
  const { 
    orderDetails, 
    lastUpdate, 
    statusUpdates,
    updateOrderDetails,
    isLoading: orderDetailsLoading,
    error: orderDetailsError,
    refetch
  } = useOrderDetails(user?.id || null, parentOrderId, courtId)

  useEffect(() => {
    // Wait for auth context to finish loading
    if (authLoading) return
    
    if (!user || !token || !parentOrderId) {
      console.log('🚪 [OrderDetails] No auth, redirecting to login')
      router.push(`/app/${courtId}/login`)
      return
    }

    console.log('✅ [OrderDetails] Auth confirmed, fetching order details')
    fetchOrderDetails()
  }, [user, token, parentOrderId, courtId, authLoading])

  // Debug effect to track polling connection and updates
  useEffect(() => {
    console.log(`🔍 [OrderDetails] Debug - userId: "${user?.id}", parentOrderId: "${parentOrderId}", polling: ${!orderDetailsError}`)
    if (lastUpdate) {
      console.log(`⏰ [OrderDetails] Last update: ${lastUpdate.toLocaleTimeString()}`)
    }
    if (statusUpdates.length > 0) {
      console.log(`📊 [OrderDetails] Status updates count: ${statusUpdates.length}`)
    }
  }, [user?.id, parentOrderId, orderDetailsError, lastUpdate, statusUpdates.length])

  const fetchOrderDetails = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const data = await orderApi.getOrderDetails(courtId, parentOrderId)
      if (data && updateOrderDetails) {
        // Update polling hook state with fetched data
        updateOrderDetails(data as any)
        console.log('📊 [OrderDetails] Initial order details fetched and updated in polling hook:', {
          parentOrderId: data.parentOrderId,
          vendorsCount: data.summary.totalVendors
        })
      }
    } catch (error) {
      console.error("Error fetching order details:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const copyOtp = () => {
    if (orderDetails?.orderOtp) {
      navigator.clipboard.writeText(orderDetails.orderOtp)
      setOtpCopied(true)
      setTimeout(() => setOtpCopied(false), 2000)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-foreground text-background"
      case "rejected": return "bg-destructive text-destructive-foreground"
      default: return "bg-muted text-foreground"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Awaiting Vendor"
      case "accepted": return "In Queue"
      case "preparing": return "Preparing"
      case "ready": return "Ready for Pickup"
      case "completed": return "Completed"
      case "rejected": return "Rejected"
      default: return status
    }
  }

  const getProgressPercentage = (orders: VendorOrder[]) => {
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return 0
    }
    
    const totalOrders = orders.length
    const completedOrders = orders.filter(o => o.status === "completed").length
    const rejectedOrders = orders.filter(o => o.status === "rejected").length
    const processedOrders = completedOrders + rejectedOrders
    
    return Math.round((processedOrders / totalOrders) * 100)
  }

  const getOverallStatus = (orders: VendorOrder[]) => {
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return "No orders available"
    }
    
    const allCompleted = orders.every(o => o.status === "completed")
    const someRejected = orders.some(o => o.status === "rejected")
    const someReady = orders.some(o => o.status === "ready")
    const someProcessing = orders.some(o => ["accepted", "preparing"].includes(o.status))
    
    if (allCompleted) return "All orders completed"
    if (someReady) return "Some orders ready for pickup"
    if (someProcessing) return "Orders being prepared"
    if (someRejected) return "Some orders rejected"
    return "Waiting for vendor confirmation"
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div>
            {authLoading ? "Checking authentication..." : "Loading order details..."}
          </div>
        </div>
      </div>
    )
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <div className="text-lg font-medium">Order not found</div>
          <div className="text-muted-foreground">The order you're looking for doesn't exist</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background shadow-sm border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/app/${courtId}/orders`)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Order Details</h1>
              <p className="text-sm text-muted-foreground">
                {getOverallStatus(orderDetails?.orders || [])}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchOrderDetails(true)}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className={`h-5 w-5 text-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Order Summary Card */}
        <div>
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Order ID</div>
                  <div className="font-mono text-sm">{orderDetails?.parentOrderId || 'Loading...'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="font-bold text-lg">₹{Number(orderDetails?.totalAmount || 0).toFixed(2)}</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{getProgressPercentage(orderDetails?.orders)}% Complete</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-foreground h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage(orderDetails?.orders)}%` }}
                  />
                </div>
              </div>

              {/* Order Statistics */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{orderDetails?.summary?.totalVendors || 0}</div>
                  <div className="text-sm text-muted-foreground">Vendors</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{orderDetails?.summary?.completedVendors || 0}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </div>

              {/* OTP Display */}
              {orderDetails?.orderOtp && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground">Pickup OTP</div>
                      <div className="text-2xl font-bold text-foreground tracking-wider">
                        {orderDetails.orderOtp}
                      </div>
                    </div>
                    <Button
                      onClick={copyOtp}
                      variant="outline"
                      size="sm"
                    >
                      {otpCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Show this OTP to the vendor for order completion
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vendor Orders */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Orders by Vendor</h2>
          
          <div className="space-y-4">
            {orderDetails?.orders && Array.isArray(orderDetails.orders) ? orderDetails.orders.map((order, index) => (
              <div key={order.id}>
                <Card className="border border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{order.vendor.stallName}</CardTitle>
                        <div className="text-sm text-muted-foreground">Order #{order.orderNumber}</div>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">₹{Number(item.subtotal || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Status Timeline */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Order Timeline</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-foreground rounded-full"></div>
                          <span>Order placed - {new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        {order.acceptedAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-foreground rounded-full"></div>
                            <span>Accepted by vendor - {new Date(order.acceptedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {order.preparingAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-foreground rounded-full"></div>
                            <span>Preparation started - {new Date(order.preparingAt).toLocaleString()}</span>
                          </div>
                        )}
                        {order.readyAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-foreground rounded-full"></div>
                            <span>Ready for pickup - {new Date(order.readyAt).toLocaleString()}</span>
                          </div>
                        )}
                        {order.completedAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-foreground rounded-full"></div>
                            <span>Completed - {new Date(order.completedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {order.rejectedAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                            <span>Rejected - {new Date(order.rejectedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Queue Position */}
                    {order.queuePosition && order.status === "accepted" && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-foreground">Queue Position</div>
                          <div className="text-2xl font-bold text-foreground">#{order.queuePosition}</div>
                        </div>
                      </div>
                    )}

                    {/* Rejection Info */}
                    {order.status === "rejected" && order.rejectionReason && (
                      <div className="p-3 bg-muted border border-border rounded-lg">
                        <div className="text-sm font-medium text-foreground mb-1">Rejection Reason</div>
                        <div className="text-sm text-muted-foreground">{order.rejectionReason}</div>
                        {order.refundAmount && (
                          <div className="text-sm text-muted-foreground mt-2">
                            Refund: ₹{order.refundAmount} ({order.refundStatus})
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order Total */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="text-lg font-bold">Total: ₹{Number(order.totalAmount || 0).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        Est. {order.estimatedPreparationTime} mins
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No order details available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
