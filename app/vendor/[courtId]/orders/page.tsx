"use client"
import { use, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  Package, 
  ArrowRight,
  RefreshCw,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useVendorAuth } from "@/contexts/vendor-auth-context"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useVendorOrders } from "@/hooks/use-vendor-orders"

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
    imageUrl?: string
  }>
  totalAmount: number
  status: string
  estimatedPreparationTime: number
  queuePosition?: number
  orderOtp: string
  createdAt: string
  acceptedAt?: string
}

export default function VendorOrdersPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const { user, token } = useVendorAuth()
  const router = useRouter()
  
  const [vendorId, setVendorId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [actionType, setActionType] = useState<'accept' | 'reject' | 'mark_ready' | 'complete' | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [otpInput, setOtpInput] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  // Use the socket hook for real-time updates
  const { 
    orders: socketOrders, 
    sectionCounts, 
    lastUpdate, 
    updateOrdersForSection,
    isConnected: socketConnected,
    connectionError: socketError 
  } = useVendorOrders(vendorId && vendorId.trim() ? vendorId : null)

  // Extract orders from socket hook
  const upcomingOrders = socketOrders.upcoming
  const queueOrders = socketOrders.queue
  const readyOrders = socketOrders.ready

  useEffect(() => {
    if (!user || !token) {
      router.push('/vendor/login')
      return
    }

    // Get vendor info first, then fetch orders
    fetchVendorInfo()
  }, [user, token, courtId])

  useEffect(() => {
    if (vendorId) {
      // Initial fetch, socket will handle real-time updates after this
      console.log(`🏪 VendorId available: ${vendorId}, starting initial fetch`)
      fetchOrders()
    }
  }, [vendorId])

  // Debug effect to track vendorId and socket connection
  useEffect(() => {
    console.log(`🔍 Debug - vendorId: "${vendorId}", socketConnected: ${socketConnected}, hasOrders: ${upcomingOrders.length + queueOrders.length + readyOrders.length}`)
  }, [vendorId, socketConnected, upcomingOrders.length, queueOrders.length, readyOrders.length])

  const fetchVendorInfo = async () => {
    try {
      const response = await fetch('/api/vendors/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setVendorId(data.data.vendor.id)
        }
      }
    } catch (error) {
      console.error("Error fetching vendor info:", error)
    }
  }

  const fetchOrders = async (isRefresh = false) => {
    if (!vendorId) return

    if (isRefresh) {
      setRefreshing(true)
    } else if (!upcomingOrders.length && !queueOrders.length && !readyOrders.length) {
      setLoading(true)
    }

    try {
      // Initial data fetch - socket will handle updates after this
      const [upcomingRes, queueRes, readyRes] = await Promise.all([
        fetch(`/api/vendors/${vendorId}/queue?section=upcoming`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/vendors/${vendorId}/queue?section=queue`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/vendors/${vendorId}/queue?section=ready`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const [upcomingData, queueData, readyData] = await Promise.all([
        upcomingRes.json(),
        queueRes.json(),
        readyRes.json()
      ])

      // Update socket hook state with fetched data
      if (upcomingData.success && updateOrdersForSection) {
        updateOrdersForSection('upcoming', upcomingData.data.orders)
      }
      if (queueData.success && updateOrdersForSection) {
        updateOrdersForSection('queue', queueData.data.orders)
      }
      if (readyData.success && updateOrdersForSection) {
        updateOrdersForSection('ready', readyData.data.orders)
      }

      console.log('📊 Initial vendor orders fetched and updated in socket hook:', {
        upcoming: upcomingData.success ? upcomingData.data.orders.length : 0,
        queue: queueData.success ? queueData.data.orders.length : 0,
        ready: readyData.success ? readyData.data.orders.length : 0,
        socketConnected
      })

    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleOrderAction = async () => {
    if (!selectedOrder || !actionType || !vendorId) return

    setActionLoading(true)
    try {
      let endpoint = `/api/vendors/${vendorId}/queue`
      let body: any = { orderId: selectedOrder.id }

      if (actionType === 'accept' || actionType === 'reject') {
        body.action = actionType
        if (actionType === 'reject') {
          body.reason = rejectionReason
        }
      } else {
        // For preparation status updates
        endpoint = `/api/vendors/${vendorId}/orders/${selectedOrder.id}/status`
        body.action = actionType
        if (actionType === 'complete') {
          body.otp = otpInput
        }
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh orders after successful action
        fetchOrders()
        closeDialog()
      } else {
        console.error("Action failed:", data.message)
        // TODO: Show error toast
      }
    } catch (error) {
      console.error("Error performing action:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const openDialog = (order: Order, action: typeof actionType) => {
    setSelectedOrder(order)
    setActionType(action)
    setRejectionReason("")
    setOtpInput("")
  }

  const closeDialog = () => {
    setSelectedOrder(null)
    setActionType(null)
    setRejectionReason("")
    setOtpInput("")
  }

  const OrderCard = ({ order, section }: { order: Order, section: 'upcoming' | 'queue' | 'ready' }) => {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  {order.customerName}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  #{order.orderNumber.split('-').pop()} • {order.customerPhone}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-neutral-900 dark:text-white">
                  ₹{Number(order.totalAmount || 0).toFixed(2)}
                </p>
                {order.queuePosition && (
                  <Badge variant="outline" className="mt-1">
                    Queue #{order.queuePosition}
                  </Badge>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {item.imageUrl && (
                    <div className="w-8 h-8 relative flex-shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <span className="flex-1 text-neutral-700 dark:text-neutral-300">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-neutral-900 dark:text-white">
                    ₹{Number(item.subtotal || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions based on section */}
            <div className="flex gap-2">
              {section === 'upcoming' && (
                <>
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => openDialog(order, 'accept')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => openDialog(order, 'reject')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}
              
              {section === 'queue' && order.status === 'preparing' && (
                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => openDialog(order, 'mark_ready')}
                >
                  <Package className="h-4 w-4 mr-1" />
                  Mark Ready
                </Button>
              )}

              {section === 'ready' && (
                <Button
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => openDialog(order, 'complete')}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete Order
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading orders...</p>
          {vendorId && (
            <p className="text-xs text-neutral-500 mt-2">
              Socket: {socketConnected ? '🟢 Connected' : '🔴 Disconnected'} | Vendor: {vendorId}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-950 shadow-sm border-b border-neutral-200 dark:border-neutral-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Order Management</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Manage your incoming orders
            </p>
            {/* Socket Debug Info */}
            <div className="text-xs text-neutral-500 mt-1 flex items-center gap-4">
              <span>Socket: {socketConnected ? '🟢 Connected' : '🔴 Disconnected'}</span>
              {vendorId && <span>Vendor: {vendorId}</span>}
              {lastUpdate && <span>Last Update: {lastUpdate.toLocaleTimeString()}</span>}
              {socketError && <span className="text-red-500">Error: {socketError}</span>}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Upcoming ({sectionCounts.upcoming})
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Queue ({sectionCounts.queue})
            </TabsTrigger>
            <TabsTrigger value="ready" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ready ({sectionCounts.ready})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                New orders awaiting your action
              </div>
              <AnimatePresence mode="popLayout">
                {upcomingOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400">No pending orders</p>
                  </div>
                ) : (
                  upcomingOrders.map(order => (
                    <OrderCard key={order.id} order={order} section="upcoming" />
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="queue" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Orders being prepared in queue
              </div>
              <AnimatePresence mode="popLayout">
                {queueOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400">No orders in queue</p>
                  </div>
                ) : (
                  queueOrders.map(order => (
                    <OrderCard key={order.id} order={order} section="queue" />
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="ready" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Orders ready for customer pickup
              </div>
              <AnimatePresence mode="popLayout">
                {readyOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400">No orders ready</p>
                  </div>
                ) : (
                  readyOrders.map(order => (
                    <OrderCard key={order.id} order={order} section="ready" />
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Dialog */}
      <Dialog open={!!selectedOrder && !!actionType} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'accept' && 'Accept Order'}
              {actionType === 'reject' && 'Reject Order'}
              {actionType === 'mark_ready' && 'Mark as Ready'}
              {actionType === 'complete' && 'Complete Order'}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <>
                  Order #{selectedOrder.orderNumber.split('-').pop()} for {selectedOrder.customerName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'reject' && (
              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
            )}

            {actionType === 'complete' && (
              <div className="space-y-2">
                <Label htmlFor="otp">Customer OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="Enter 4-digit OTP from customer"
                  maxLength={4}
                  required
                />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Ask the customer to show their OTP before completing the order.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleOrderAction}
              disabled={actionLoading || (actionType === 'reject' && !rejectionReason.trim()) || (actionType === 'complete' && otpInput.length !== 4)}
            >
              {actionLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
