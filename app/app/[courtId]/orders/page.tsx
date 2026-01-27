"use client"
import { use, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Clock, MapPin, Eye, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useSmartOrderSocket } from "@/hooks/use-smart-order-socket"

export default function OrdersPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const { user, token } = useAuth()
  const router = useRouter()
  const [orderSummaries, setOrderSummaries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Smart socket connection for real-time updates (only when orders are active)
  const { isConnected, hasActiveOrders, connectionState } = useSmartOrderSocket({
    orders: orderSummaries, // Pass current orders to determine if socket is needed
    onOrderUpdate: (data) => {
      console.log('Real-time order update received on orders page:', data)
      // Refresh the orders list when we receive any order update
      fetchOrders(true)
    },
    onOrderStatusChange: (data) => {
      console.log('Real-time order status change received on orders page:', data)
      // Update the specific order in the summaries and refresh to get latest status
      setOrderSummaries((prev) => {
        const updated = prev.map((summary) => {
          if (summary.parentOrderId === data.parentOrderId) {
            return {
              ...summary,
              lastUpdated: new Date().toISOString()
            }
          }
          return summary
        })
        // Also trigger a fresh fetch to get the latest status calculations
        setTimeout(() => fetchOrders(true), 500)
        return updated
      })
    },
    enabled: !!user
  })

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
    if (!user || !token) {
      router.push(`/app/${courtId}/login`)
      return
    }

    fetchOrders()
  }, [user, token, courtId])

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      console.log('Fetching orders for user:', user?.id, 'court:', courtId)
      const response = await fetch(`/api/app/${courtId}/orders/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Orders API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Orders API response data:', data)
        if (data.success) {
          console.log('Setting order summaries:', data.data.orderSummaries)
          setOrderSummaries(data.data.orderSummaries || [])
        } else {
          console.error('Orders API returned success: false', data.message)
          setOrderSummaries([])
        }
      } else {
        console.error('Orders API response not ok:', response.status, response.statusText)
        setOrderSummaries([])
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      setOrderSummaries([])
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
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getOverallStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Processing"
      case "partial": return "Partially Ready"
      case "ready": return "Ready for Pickup"
      case "completed": return "Completed"
      default: return status
    }
  }

  const viewOrderDetails = (parentOrderId: string) => {
    router.push(`/app/${courtId}/orders/${parentOrderId}`)
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
          <p className="text-neutral-600 dark:text-neutral-400">Loading your orders...</p>
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
              <div className="flex items-center gap-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {orderSummaries.length} orders found
                </p>
                {/* Smart connection indicator */}
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
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {loading ? "Loading orders..." : "Start shopping to see your orders here"}
            </p>
            <div className="space-y-3">
              <Button onClick={() => fetchOrders()} variant="outline">
                Refresh Orders
              </Button>
              <Button onClick={() => router.push(`/app/${courtId}`)}>
                Start Shopping
              </Button>
            </div>
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
