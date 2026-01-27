"use client"
import { use, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Check, Clock, MapPin, Copy, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useSmartOrderSocket } from "@/hooks/use-smart-order-socket"
import { useToast } from "@/hooks/use-toast"

export default function OrderSuccessPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ courtId: string }>
  searchParams: Promise<{ parentOrderId?: string; otp?: string }> 
}) {
  const { courtId } = use(params)
  const { parentOrderId, otp } = use(searchParams)
  const { user, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [otpCopied, setOtpCopied] = useState(false)

  // Smart socket connection for real-time updates (only when order is active)
  const { isConnected, hasActiveOrders, connectionState } = useSmartOrderSocket({
    parentOrderId,
    orders: orderDetails?.orders || [],
    onOrderUpdate: (data: any) => {
      console.log('[OrderSuccess] Real-time order update received:', data)
      console.log('[OrderSuccess] Current parentOrderId:', parentOrderId)
      if (data.parentOrderId === parentOrderId) {
        console.log('[OrderSuccess] Updating order details with:', data.order)
        setOrderDetails(data.order)
        toast({
          title: "Order Updated",
          description: "Your order has been updated in real-time",
          duration: 3000,
        })
      } else {
        console.log('[OrderSuccess] Order update ignored - parentOrderId mismatch')
      }
    },
    onOrderStatusChange: (data: any) => {
      console.log('[OrderSuccess] Real-time order status change received:', data)
      console.log('[OrderSuccess] Current parentOrderId:', parentOrderId)
      if (data.parentOrderId === parentOrderId) {
        console.log('[OrderSuccess] Updating vendor order status:', data.vendorOrderId, 'to', data.newStatus)
        // Update the specific vendor order in the current data
        setOrderDetails((prev: any) => {
          if (!prev) return prev
          
          const updatedOrders = prev.orders?.map((order: any) => 
            order.id === data.vendorOrderId 
              ? { ...order, status: data.newStatus }
              : order
          ) || []
          
          return {
            ...prev,
            orders: updatedOrders
          }
        })
        
        // Show toast notification
        const statusMessages = {
          accepted: "Order accepted by vendor",
          preparing: "Order is being prepared",
          ready: "Order is ready for pickup",
          completed: "Order completed",
          rejected: "Order was rejected"
        }
        
        toast({
          title: "Status Update",
          description: statusMessages[data.newStatus as keyof typeof statusMessages] || `Order status changed to ${data.newStatus}`,
          duration: 4000,
        })
      }
    },
    enabled: !!parentOrderId
  })

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  }

  const pageTransition = {
    type: "tween" as const,
    ease: "anticipate" as const,
    duration: 0.4
  }

  useEffect(() => {
    if (!user || !token || !parentOrderId) {
      router.push(`/app/${courtId}/login`)
      return
    }

    fetchOrderDetails()
  }, [user, token, parentOrderId, courtId])

  const fetchOrderDetails = async () => {
    try {
      console.log('Fetching order details for parentOrderId:', parentOrderId)
      const response = await fetch(`/api/app/${courtId}/orders/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parentOrderId }),
      })

      console.log('Order details API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Order details API response data:', data)
        if (data.success) {
          console.log('Setting order details:', data.data)
          setOrderDetails(data.data)
        } else {
          console.error('Order details API returned success: false', data.message)
        }
      } else {
        console.error('Order details API response not ok:', response.status, response.statusText)
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
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "accepted": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "preparing": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "ready": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "completed": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
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

  if (loading) {
    return (
      <motion.div 
        className="h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center"
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
        transition={pageTransition}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading order details...</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="min-h-screen bg-neutral-50 dark:bg-neutral-950"
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
    >
      {/* Header */}
      <motion.div 
        className="bg-white dark:bg-neutral-950 shadow-sm border-b border-neutral-200 dark:border-neutral-800 px-4 py-4"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => router.push(`/app/${courtId}`)}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Order Confirmed</h1>
          </div>
          {/* Real-time connection indicator */}
          <div className="flex items-center gap-2">
            {connectionState === 'connected' && hasActiveOrders && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs">
                Live updates
              </Badge>
            )}
            {connectionState === 'connecting' && hasActiveOrders && (
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 text-xs">
                Connecting...
              </Badge>
            )}
            {!hasActiveOrders && (
              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 text-xs">
                All complete
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      <div className="px-4 py-6 space-y-6">
        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Order Placed Successfully!</h2>
          <p className="text-neutral-600 dark:text-neutral-400">Your order has been split across vendors</p>
        </motion.div>

        {/* OTP Display */}
        {otp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
              <CardHeader>
                <CardTitle className="text-center text-green-800 dark:text-green-400">
                  Your Order OTP
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-mono font-bold text-green-900 dark:text-green-300 mb-3">
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
                <p className="text-sm text-green-700 dark:text-green-400">
                  Show this OTP to vendors when picking up your order
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Order Summary */}
        {orderDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Order ID</span>
                    <p className="font-mono text-neutral-900 dark:text-white">{orderDetails.parentOrderId || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Total Amount</span>
                    <p className="font-semibold text-neutral-900 dark:text-white">₹{Number(orderDetails.summary?.grandTotal || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Vendors</span>
                    <p className="text-neutral-900 dark:text-white">{orderDetails.summary?.totalVendors || 0}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400">Status</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {orderDetails.summary?.completedVendors || 0} Completed
                      </Badge>
                      {(orderDetails.summary?.pendingVendors || 0) > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          {orderDetails.summary?.pendingVendors || 0} Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Orders */}
            <div className="space-y-3">
              <h3 className="font-semibold text-neutral-900 dark:text-white">Orders by Vendor</h3>
              {orderDetails.orders && Array.isArray(orderDetails.orders) && orderDetails.orders.length > 0 ? (
                orderDetails.orders.map((vendorOrder: any, index: number) => (
                  <motion.div
                    key={vendorOrder.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-white">
                              {vendorOrder.vendor?.stallName || 'Unknown Vendor'}
                            </h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {vendorOrder.items?.length || 0} items • ₹{Number(vendorOrder.totalAmount || 0).toFixed(2)}
                            </p>
                          </div>
                          <Badge className={getStatusColor(vendorOrder.status)}>
                            {getStatusText(vendorOrder.status)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          {vendorOrder.items && Array.isArray(vendorOrder.items) && vendorOrder.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-neutral-700 dark:text-neutral-300">
                                {item.name} × {item.quantity}
                              </span>
                              <span className="text-neutral-900 dark:text-white">
                                ₹{Number(item.subtotal || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {vendorOrder.queuePosition && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <Clock className="h-4 w-4" />
                            Queue position: #{vendorOrder.queuePosition}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-neutral-600 dark:text-neutral-400">No vendor orders found.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <Button
            onClick={() => router.push(`/app/${courtId}/orders`)}
            className="w-full"
            variant="outline"
          >
            View All Orders
          </Button>
          <Button
            onClick={() => router.push(`/app/${courtId}`)}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white"
          >
            Continue Shopping
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}
