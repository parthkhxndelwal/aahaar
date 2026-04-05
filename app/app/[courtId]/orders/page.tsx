"use client"
import { use, useEffect, useState } from "react"
import { ArrowLeft, Eye, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { useRouter } from "next/navigation"
import { useUserOrders } from "@/hooks/use-user-orders"
import { orderApi } from "@/lib/api"

export default function OrdersPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const { user, token, loading: authLoading } = useUnifiedAuth()
  const router = useRouter()
  const [activeOrderIds, setActiveOrderIds] = useState<string[]>([])
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(new Set())

  // Use the polling hook for real-time updates
  const { 
    orderSummaries, 
    orderUpdates,
    lastUpdate, 
    updateOrderSummaries,
    addOrderUpdate,
    clearOrderUpdates,
    getOrderByParentId,
    isLoading: ordersLoading,
    error: ordersError,
    refetch
  } = useUserOrders(user?.id || null, courtId, activeOrderIds)



  // Update active order IDs when order summaries change
  useEffect(() => {
    const newActiveOrderIds = orderSummaries
      .filter(summary => !['completed', 'rejected', 'cancelled'].includes(summary.overallStatus))
      .map(summary => summary.parentOrderId)
    
    setActiveOrderIds(newActiveOrderIds)
  }, [orderSummaries])

  useEffect(() => {
    // Wait for auth context to finish loading
    if (authLoading) return
    
    if (!user || !token) {
      console.log('🚪 [UserOrders] No auth, redirecting to login')
      router.push(`/app/${courtId}/login`)
      return
    }

    console.log('✅ [UserOrders] Auth confirmed, orders will be fetched by hook')
  }, [user, token, courtId, authLoading])

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-muted text-foreground"
      case "preparing": return "bg-muted text-foreground"
      case "partial": return "bg-muted text-foreground"
      case "ready": return "bg-foreground text-background"
      case "completed": return "bg-muted text-muted-foreground"
      case "cancelled": return "bg-muted text-muted-foreground"
      case "rejected": return "bg-muted text-muted-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getOverallStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Processing"
      case "preparing": return "Preparing"
      case "partial": return "Partially Ready"
      case "ready": return "Ready for Pickup"
      case "completed": return "Completed"
      case "cancelled": return "Cancelled"
      case "rejected": return "Rejected"
      default: return status
    }
  }

  const viewOrderDetails = (parentOrderId: string) => {
    router.push(`/app/${courtId}/orders/${parentOrderId}`)
  }

  const handleCancelOrder = async (orderId: string, vendorName: string) => {
    if (!token || cancellingOrders.has(orderId)) return

    const confirmed = confirm(
      `Are you sure you want to cancel your order from ${vendorName}? This action cannot be undone.`
    )

    if (!confirmed) return

    setCancellingOrders(prev => new Set(prev).add(orderId))

    try {
      await orderApi.cancelOrderGeneric({
        courtId,
        orderId,
        cancelReason: "Cancelled by customer"
      })
      
      // If we reach here, cancellation was successful
      // Refresh orders to get updated data
      await refetch()
    } catch (error) {
      console.error("Error cancelling order:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to cancel order. Please try again."
      alert(errorMessage)
    } finally {
      setCancellingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  if (authLoading || (ordersLoading && !orderSummaries.length)) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {authLoading ? "Checking authentication..." : "Loading your orders..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div 
        className="bg-background shadow-sm border-b border-border px-4 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/app/${courtId}`)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">My Orders</h1>
              <p className="text-sm text-muted-foreground">
                {orderSummaries.length} orders found
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={ordersLoading}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className={`h-5 w-5 text-foreground ${ordersLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {orderSummaries.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Button onClick={() => router.push(`/app/${courtId}`)}>
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orderSummaries.map((orderSummary, index) => (
              <div
                key={`${orderSummary.parentOrderId}-${index}`}
                className="py-4"
              >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          Order #{orderSummary.parentOrderId.split('-').pop()}
                        </h3>
                        <Badge className={getOverallStatusColor(orderSummary.overallStatus)}>
                          {getOverallStatusText(orderSummary.overallStatus)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {orderSummary.vendorsCount} vendors • ₹{Number(orderSummary.totalAmount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(orderSummary.createdAt).toLocaleDateString()} at {new Date(orderSummary.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* OTP Display for ready/partial orders */}
                  {orderSummary.overallStatus === 'ready' || orderSummary.overallStatus === 'partial' ? (
                    <div className="bg-muted border border-border rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Your OTP</p>
                          <p className="text-xl font-mono font-bold text-foreground">{orderSummary.orderOtp}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Show to vendor</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Progress Summary */}
                  <div className="space-y-2 mb-4">
                    {orderSummary.overallStatus === 'cancelled' && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                        <span className="text-muted-foreground">All orders cancelled by customer</span>
                      </div>
                    )}
                    {orderSummary.completedVendors > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-foreground rounded-full"></div>
                        <span className="text-foreground">{orderSummary.completedVendors} of {orderSummary.vendorsCount} vendors completed</span>
                      </div>
                    )}
                    {orderSummary.rejectedVendors > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                        <span className="text-muted-foreground">{orderSummary.rejectedVendors} vendors rejected (refund processed)</span>
                      </div>
                    )}
                    {orderSummary.cancelledVendors > 0 && orderSummary.overallStatus !== 'cancelled' && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                        <span className="text-muted-foreground">{orderSummary.cancelledVendors} vendors cancelled by customer</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewOrderDetails(orderSummary.parentOrderId)}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
