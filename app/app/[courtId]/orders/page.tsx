"use client"
import { use, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Clock, MapPin, Eye, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppAuth } from "@/contexts/app-auth-context"
import { useRouter } from "next/navigation"
import { useUserOrders } from "@/hooks/use-user-orders"

export default function OrdersPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const { user, token, loading: authLoading } = useAppAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeOrderIds, setActiveOrderIds] = useState<string[]>([])
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(new Set())

  // Use the socket hook for real-time updates
  const { 
    orderSummaries: socketOrderSummaries, 
    lastUpdate, 
    updateOrderSummaries,
    getActiveOrderIds,
    cancelOrder,
    isConnected: socketConnected,
    connectionError: socketError 
  } = useUserOrders(user?.id || null, activeOrderIds)

  // Use socket data as primary source
  const orderSummaries = socketOrderSummaries

  // Update active order IDs when order summaries change
  useEffect(() => {
    const newActiveOrderIds = orderSummaries
      .filter(summary => !['completed', 'rejected', 'cancelled'].includes(summary.overallStatus))
      .map(summary => summary.parentOrderId)
    
    setActiveOrderIds(newActiveOrderIds)
  }, [orderSummaries])

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  }

  const pageTransition = {
    type: "tween" as const,
    ease: "anticipate" as const,
    duration: 0.4
  }

  useEffect(() => {
    // Wait for auth context to finish loading
    if (authLoading) return
    
    if (!user || !token) {
      console.log('🚪 [UserOrders] No auth, redirecting to login')
      router.push(`/app/${courtId}/login`)
      return
    }

    console.log('✅ [UserOrders] Auth confirmed, fetching orders')
    fetchOrders()
  }, [user, token, courtId, authLoading])

  // Debug effect to track socket connection and updates
  useEffect(() => {
    console.log(`🔍 [UserOrders] Debug - userId: "${user?.id}", socketConnected: ${socketConnected}, hasOrders: ${orderSummaries.length}`)
    if (lastUpdate) {
      console.log(`⏰ [UserOrders] Last update: ${lastUpdate.toLocaleTimeString()}`)
    }
  }, [user?.id, socketConnected, orderSummaries.length, lastUpdate])

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await fetch(`/api/app/${courtId}/orders/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && updateOrderSummaries) {
          // Update socket hook state with fetched data
          updateOrderSummaries(data.data.orderSummaries)
          console.log('📊 [UserOrders] Initial orders fetched and updated in socket hook:', {
            count: data.data.orderSummaries.length,
            socketConnected
          })
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "partial": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "ready": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "completed": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
      case "cancelled": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getOverallStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Processing"
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
      const result = await cancelOrder(courtId, orderId, "Cancelled by customer", token)
      
      if (result.success) {
        // Refresh orders to get updated data
        await fetchOrders(true)
      } else {
        alert(result.message || "Failed to cancel order. Please try again.")
      }
    } catch (error) {
      console.error("Error cancelling order:", error)
      alert("Failed to cancel order. Please try again.")
    } finally {
      setCancellingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  if (authLoading || (loading && !orderSummaries.length)) {
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
          <p className="text-neutral-600 dark:text-neutral-400">
            {authLoading ? "Checking authentication..." : "Loading your orders..."}
          </p>
          {user?.id && (
            <p className="text-xs text-neutral-500 mt-2">
              Socket: {socketConnected ? '🟢 Connected' : '🔴 Disconnected'} | User: {user.id}
            </p>
          )}
          {socketError && (
            <p className="text-xs text-red-500 mt-1">
              Socket Error: {socketError}
            </p>
          )}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => router.push(`/app/${courtId}`)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
            </motion.button>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">My Orders</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {orderSummaries.length} orders found
              </p>
              {/* Socket Debug Info */}
              <div className="text-xs text-neutral-500 mt-1 flex items-center gap-4">
                <span>{socketConnected ? '🟢 Online' : '🔴 Offline'}</span>
                {user?.id && <span>User: {user.id}</span>}
                {lastUpdate && <span>Last Update: {lastUpdate.toLocaleTimeString()}</span>}
                {socketError && <span className="text-red-500">Error: {socketError}</span>}
              </div>
            </div>
          </div>
          <motion.button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`h-5 w-5 text-neutral-700 dark:text-neutral-300 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      <div className="px-4 py-6">
        {orderSummaries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">No orders yet</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">Start shopping to see your orders here</p>
            <Button onClick={() => router.push(`/app/${courtId}`)}>
              Start Shopping
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {orderSummaries.map((orderSummary, index) => (
                <motion.div
                  key={orderSummary.parentOrderId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-neutral-900 dark:text-white truncate">
                              Order #{orderSummary.parentOrderId.split('-').pop()}
                            </h3>
                            <Badge className={getOverallStatusColor(orderSummary.overallStatus)}>
                              {getOverallStatusText(orderSummary.overallStatus)}
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {orderSummary.vendorsCount} vendors • ₹{Number(orderSummary.totalAmount || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-500">
                            {new Date(orderSummary.createdAt).toLocaleDateString()} at {new Date(orderSummary.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      {/* OTP Display for ready/partial orders */}
                      {orderSummary.overallStatus === 'ready' || orderSummary.overallStatus === 'partial' ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                                Your OTP
                              </p>
                              <p className="text-xl font-mono font-bold text-green-900 dark:text-green-300">
                                {orderSummary.orderOtp}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-green-700 dark:text-green-400">
                                Show to vendor
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ) : null}

                      {/* Progress Summary */}
                      <div className="space-y-2 mb-4">
                        {orderSummary.overallStatus === 'cancelled' && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            <span className="text-neutral-700 dark:text-neutral-300">
                              All orders cancelled by customer
                            </span>
                          </div>
                        )}
                        {orderSummary.completedVendors > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-neutral-700 dark:text-neutral-300">
                              {orderSummary.completedVendors} of {orderSummary.vendorsCount} vendors completed
                            </span>
                          </div>
                        )}
                        {orderSummary.rejectedVendors > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-neutral-700 dark:text-neutral-300">
                              {orderSummary.rejectedVendors} vendors rejected (refund processed)
                            </span>
                          </div>
                        )}
                        {orderSummary.cancelledVendors > 0 && orderSummary.overallStatus !== 'cancelled' && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            <span className="text-neutral-700 dark:text-neutral-300">
                              {orderSummary.cancelledVendors} vendors cancelled by customer
                            </span>
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
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}
