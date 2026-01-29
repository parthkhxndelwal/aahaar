"use client"
import { use, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Image from "next/image"

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
  const { user, token } = useAuth()
  const router = useRouter()
  const [orderDetails, setOrderDetails] = useState<OrderDetailsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [otpCopied, setOtpCopied] = useState(false)

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
    if (!user || !token || !parentOrderId) {
      router.push(`/app/${courtId}/login`)
      return
    }

    fetchOrderDetails()
  }, [user, token, parentOrderId, courtId])

  const fetchOrderDetails = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await fetch(`/api/app/${courtId}/orders/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parentOrderId }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setOrderDetails(data.data)
        }
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

  if (loading) {
    return (
      <motion.div 
        className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center"
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
        transition={pageTransition}
      >
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div>Loading order details...</div>
        </div>
      </motion.div>
    )
  }

  if (!orderDetails) {
    return (
      <motion.div 
        className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center"
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
        transition={pageTransition}
      >
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
          <div className="text-lg font-medium">Order not found</div>
          <div className="text-neutral-500">The order you're looking for doesn't exist</div>
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
              onClick={() => router.push(`/app/${courtId}/orders`)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
            </motion.button>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Order Details</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {getOverallStatus(orderDetails.orders)}
              </p>
            </div>
          </div>
          <motion.button
            onClick={() => fetchOrderDetails(true)}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`h-5 w-5 text-neutral-700 dark:text-neutral-300 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      <div className="px-4 py-6 space-y-6">
        {/* Order Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-neutral-500">Order ID</div>
                  <div className="font-mono text-sm">{orderDetails?.parentOrderId || 'Loading...'}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-500">Total Amount</div>
                  <div className="font-bold text-lg">₹{Number(orderDetails?.totalAmount || 0).toFixed(2)}</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{getProgressPercentage(orderDetails?.orders)}% Complete</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <motion.div
                    className="bg-green-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage(orderDetails?.orders)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>

              {/* Order Statistics */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{orderDetails?.summary?.totalVendors || 0}</div>
                  <div className="text-sm text-neutral-500">Vendors</div>
                </div>
                <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{orderDetails?.summary?.completedVendors || 0}</div>
                  <div className="text-sm text-neutral-500">Completed</div>
                </div>
              </div>

              {/* OTP Display */}
              {orderDetails?.orderOtp && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Pickup OTP</div>
                      <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">
                        {orderDetails.orderOtp}
                      </div>
                    </div>
                    <Button
                      onClick={copyOtp}
                      variant="outline"
                      size="sm"
                      className="border-emerald-200 hover:bg-emerald-100"
                    >
                      {otpCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                    Show this OTP to the vendor for order completion
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Vendor Orders */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Orders by Vendor</h2>
          
          <AnimatePresence mode="popLayout">
            {orderDetails?.orders && Array.isArray(orderDetails.orders) ? orderDetails.orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{order.vendor.stallName}</CardTitle>
                        <div className="text-sm text-neutral-500">Order #{order.orderNumber}</div>
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
                        <div key={itemIndex} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
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
                              <div className="text-sm text-neutral-500">Qty: {item.quantity}</div>
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
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Order placed - {new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        {order.acceptedAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Accepted by vendor - {new Date(order.acceptedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {order.preparingAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Preparation started - {new Date(order.preparingAt).toLocaleString()}</span>
                          </div>
                        )}
                        {order.readyAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Ready for pickup - {new Date(order.readyAt).toLocaleString()}</span>
                          </div>
                        )}
                        {order.completedAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Completed - {new Date(order.completedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {order.rejectedAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Rejected - {new Date(order.rejectedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Queue Position */}
                    {order.queuePosition && order.status === "accepted" && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-blue-800 dark:text-blue-400">Queue Position</div>
                          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">#{order.queuePosition}</div>
                        </div>
                      </div>
                    )}

                    {/* Rejection Info */}
                    {order.status === "rejected" && order.rejectionReason && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">Rejection Reason</div>
                        <div className="text-sm text-red-700 dark:text-red-300">{order.rejectionReason}</div>
                        {order.refundAmount && (
                          <div className="text-sm text-red-700 dark:text-red-300 mt-2">
                            Refund: ₹{order.refundAmount} ({order.refundStatus})
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order Total */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="text-lg font-bold">Total: ₹{Number(order.totalAmount || 0).toFixed(2)}</div>
                      <div className="text-sm text-neutral-500">
                        Est. {order.estimatedPreparationTime} mins
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )) : (
              <div className="text-center py-8">
                <p className="text-neutral-600 dark:text-neutral-400">No order details available</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
