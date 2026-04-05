"use client"
import { use, useEffect, useState } from "react"
import { Check, Clock, MapPin, Copy, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { useRouter } from "next/navigation"
import { useOrderDetails } from "@/hooks/use-order-details"
import { orderApi } from "@/lib/api"

export default function OrderSuccessPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ courtId: string }>
  searchParams: Promise<{ parentOrderId?: string; otp?: string }> 
}) {
  const { courtId } = use(params)
  const { parentOrderId, otp } = use(searchParams)
  const { user, token, loading: authLoading } = useUnifiedAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
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
  } = useOrderDetails(user?.id || null, parentOrderId || null, courtId)

  useEffect(() => {
    // Wait for auth context to finish loading
    if (authLoading) return
    
    if (!user || !token || !parentOrderId) {
      console.log('🚪 [OrderSuccess] No auth, redirecting to login')
      router.push(`/app/${courtId}/login`)
      return
    }

    console.log('✅ [OrderSuccess] Auth confirmed, fetching order details')
    fetchOrderDetails()
  }, [user, token, parentOrderId, courtId, authLoading])

  // Debug effect to track polling connection and updates
  useEffect(() => {
    console.log(`🔍 [OrderSuccess] Debug - userId: "${user?.id}", parentOrderId: "${parentOrderId}", polling: ${!orderDetailsError}`)
    if (lastUpdate) {
      console.log(`⏰ [OrderSuccess] Last update: ${lastUpdate.toLocaleTimeString()}`)
    }
    if (statusUpdates.length > 0) {
      console.log(`📊 [OrderSuccess] Status updates count: ${statusUpdates.length}`)
    }
  }, [user?.id, parentOrderId, orderDetailsError, lastUpdate, statusUpdates.length])

  const fetchOrderDetails = async () => {
    try {
      const data = await orderApi.getOrderDetails(courtId, parentOrderId!)
      if (data && updateOrderDetails) {
        // Update polling hook state with fetched data
        updateOrderDetails(data as any)
        console.log('📊 [OrderSuccess] Initial order details fetched and updated in polling hook:', {
          parentOrderId: data.parentOrderId,
          vendorsCount: data.summary.totalVendors
        })
      }
    } catch (error) {
      console.error("Error fetching order details:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyOtp = () => {
    if (otp) {
      navigator.clipboard.writeText(otp)
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

  if (authLoading || loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {authLoading ? "Checking authentication..." : "Loading order details..."}
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/app/${courtId}`)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Order Confirmed</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Success Message */}
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Order Placed Successfully!</h2>
          <p className="text-muted-foreground">Your order has been split across vendors</p>
        </div>

        {/* OTP Display */}
        {otp && (
          <div>
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-center">
                  Your Order OTP
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-mono font-bold text-foreground mb-3">
                  {otp}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyOtp}
                  className="mb-3"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {otpCopied ? "Copied!" : "Copy OTP"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Show this OTP to vendors when picking up your order
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Order Summary */}
        {orderDetails && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Order ID</span>
                    <p className="font-mono">{orderDetails.parentOrderId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Amount</span>
                    <p className="font-semibold">₹{Number(orderDetails.summary.grandTotal || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vendors</span>
                    <p>{orderDetails.summary.totalVendors}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge className="bg-muted text-foreground">
                        {orderDetails.summary.completedVendors} Completed
                      </Badge>
                      {orderDetails.summary.pendingVendors > 0 && (
                        <Badge className="bg-muted text-muted-foreground">
                          {orderDetails.summary.pendingVendors} Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Orders */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Orders by Vendor</h3>
              {(orderDetails?.orders || []).map((vendorOrder: any, index: number) => (
                <div key={vendorOrder.id}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">
                            {vendorOrder.vendor.stallName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {vendorOrder.items.length} items • ₹{Number(vendorOrder.totalAmount || 0).toFixed(2)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(vendorOrder.status)}>
                          {getStatusText(vendorOrder.status)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {vendorOrder.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.name} × {item.quantity}
                            </span>
                            <span className="text-foreground">
                              ₹{Number(item.subtotal || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {vendorOrder.queuePosition && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Queue position: #{vendorOrder.queuePosition}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push(`/app/${courtId}/orders`)}
            className="w-full"
            variant="outline"
          >
            View All Orders
          </Button>
          <Button
            onClick={() => router.push(`/app/${courtId}`)}
            className="w-full"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  )
}
