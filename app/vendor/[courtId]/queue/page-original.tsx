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
  AlertTriangle,
  User,
  Phone,
  Hash,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface OrderItem {
  name: string
  quantity: number
  price: number
  subtotal: number
  imageUrl?: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  items: OrderItem[]
  totalAmount: number
  status: string
  estimatedPreparationTime: number
  queuePosition?: number
  orderOtp: string
  parentOrderId: string
  isSubOrder: boolean
  createdAt: string
  acceptedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  specialInstructions?: string
}

interface QueueData {
  orders: Order[]
  sectionCounts: {
    upcoming: number
    queue: number
    ready: number
  }
}

export default function VendorQueuePage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const { user, token } = useAuth()
  const router = useRouter()
  
  const [vendorId, setVendorId] = useState<string>("")
  const [activeTab, setActiveTab] = useState("upcoming")
  const [queueData, setQueueData] = useState<QueueData>({
    orders: [],
    sectionCounts: { upcoming: 0, queue: 0, ready: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Dialogs
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; orderId: string | null }>({
    open: false,
    orderId: null
  })
  const [rejectionReason, setRejectionReason] = useState("")
  const [otpDialog, setOtpDialog] = useState<{ open: boolean; orderId: string | null }>({
    open: false,
    orderId: null
  })
  const [enteredOtp, setEnteredOtp] = useState("")

  useEffect(() => {
    if (!user || !token) {
      router.push(`/vendor/login`)
      return
    }

    // Get vendor ID from user
    fetchVendorInfo()
  }, [user, token, courtId])

  useEffect(() => {
    if (vendorId) {
      fetchQueueData()
    }
  }, [vendorId, activeTab])

  const fetchVendorInfo = async () => {
    try {
      const response = await fetch(`/api/vendors/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.vendor) {
          setVendorId(data.data.vendor.id)
        }
      }
    } catch (error) {
      console.error("Error fetching vendor info:", error)
    }
  }

  const fetchQueueData = async () => {
    if (!vendorId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/vendors/${vendorId}/queue?section=${activeTab}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setQueueData(data.data)
        }
      }
    } catch (error) {
      console.error("Error fetching queue data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOrderAction = async (orderId: string, action: string, additionalData?: any) => {
    setActionLoading(orderId)
    
    try {
      if (action === "accept" || action === "reject") {
        // Use queue PATCH endpoint for accept/reject
        const response = await fetch(`/api/vendors/${vendorId}/queue`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId,
            action,
            reason: additionalData?.reason || "",
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // Refresh queue data
            await fetchQueueData()
            
            if (action === "reject") {
              setRejectDialog({ open: false, orderId: null })
              setRejectionReason("")
            }
          }
        }
      } else {
        // Use order status endpoint for status updates
        const response = await fetch(`/api/vendors/${vendorId}/orders/${orderId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action,
            otp: additionalData?.otp || "",
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // Refresh queue data
            await fetchQueueData()
            
            if (action === "complete") {
              setOtpDialog({ open: false, orderId: null })
              setEnteredOtp("")
            }
          }
        }
      }
    } catch (error) {
      console.error("Error performing order action:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const openRejectDialog = (orderId: string) => {
    setRejectDialog({ open: true, orderId })
  }

  const openOtpDialog = (orderId: string) => {
    setOtpDialog({ open: true, orderId })
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

  const renderOrderCard = (order: Order) => (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-4"
    >
      {/* Order Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-neutral-500" />
            <span className="font-bold text-lg">{order.orderNumber}</span>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {order.status === "accepted" ? "In Queue" : order.status}
          </Badge>
        </div>
        
        {order.queuePosition && (
          <div className="text-right">
            <div className="text-sm text-neutral-500">Queue Position</div>
            <div className="text-2xl font-bold text-blue-600">#{order.queuePosition}</div>
          </div>
        )}
      </div>

      {/* Customer Info */}
      <div className="flex items-center gap-4 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-xl">
        <User className="h-5 w-5 text-neutral-500" />
        <div className="flex-1">
          <div className="font-semibold">{order.customerName}</div>
          <div className="text-sm text-neutral-500 flex items-center gap-2">
            <Phone className="h-3 w-3" />
            {order.customerPhone}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Order Items</div>
        {order.items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
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

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
          <div className="text-sm font-medium text-amber-800 dark:text-amber-400 mb-1">Special Instructions</div>
          <div className="text-sm text-amber-700 dark:text-amber-300">{order.specialInstructions}</div>
        </div>
      )}

      {/* Order Total */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-600">
        <div className="text-lg font-bold">Total: ₹{Number(order.totalAmount || 0).toFixed(2)}</div>
        <div className="text-sm text-neutral-500">
          {new Date(order.createdAt).toLocaleString()}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {order.status === "pending" && (
          <>
            <Button
              onClick={() => handleOrderAction(order.id, "accept")}
              disabled={actionLoading === order.id}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {actionLoading === order.id ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Accept
            </Button>
            <Button
              onClick={() => openRejectDialog(order.id)}
              disabled={actionLoading === order.id}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </>
        )}

        {order.status === "accepted" && (
          <Button
            onClick={() => handleOrderAction(order.id, "start_preparing")}
            disabled={actionLoading === order.id}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            {actionLoading === order.id ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start Preparing
          </Button>
        )}

        {order.status === "preparing" && (
          <Button
            onClick={() => handleOrderAction(order.id, "mark_ready")}
            disabled={actionLoading === order.id}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {actionLoading === order.id ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            Mark Ready
          </Button>
        )}

        {order.status === "ready" && (
          <Button
            onClick={() => openOtpDialog(order.id)}
            disabled={actionLoading === order.id}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle className="h-4 w-4" />
            Complete Order
          </Button>
        )}
      </div>

      {/* OTP Display for Ready Orders */}
      {order.status === "ready" && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
          <div className="text-sm font-medium text-emerald-800 dark:text-emerald-400 mb-1">Customer OTP</div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">
            {order.orderOtp}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Customer will provide this OTP for order completion
          </div>
        </div>
      )}
    </motion.div>
  )

  if (loading && !vendorId) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div>Loading vendor information...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
          <h1 className="text-2xl font-bold mb-2">Order Queue Management</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Manage your incoming orders and track their progress
          </p>
        </div>

        {/* Queue Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming" className="relative">
              Upcoming Orders
              {queueData.sectionCounts.upcoming > 0 && (
                <Badge className="ml-2 bg-yellow-500 text-white">
                  {queueData.sectionCounts.upcoming}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="queue" className="relative">
              In Queue
              {queueData.sectionCounts.queue > 0 && (
                <Badge className="ml-2 bg-blue-500 text-white">
                  {queueData.sectionCounts.queue}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="relative">
              Ready for Pickup
              {queueData.sectionCounts.ready > 0 && (
                <Badge className="ml-2 bg-green-500 text-white">
                  {queueData.sectionCounts.ready}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="upcoming" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upcoming Orders</h2>
              <Button onClick={fetchQueueData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <div>Loading orders...</div>
              </div>
            ) : queueData.orders.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <div className="text-lg font-medium">No upcoming orders</div>
                <div className="text-neutral-500">New orders will appear here</div>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {queueData.orders.map((order) => renderOrderCard(order))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Orders in Queue</h2>
              <Button onClick={fetchQueueData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <div>Loading orders...</div>
              </div>
            ) : queueData.orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <div className="text-lg font-medium">No orders in queue</div>
                <div className="text-neutral-500">Accepted orders will appear here</div>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {queueData.orders.map((order) => renderOrderCard(order))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ready" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Ready for Pickup</h2>
              <Button onClick={fetchQueueData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <div>Loading orders...</div>
              </div>
            ) : queueData.orders.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <div className="text-lg font-medium">No orders ready</div>
                <div className="text-neutral-500">Completed orders will appear here</div>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {queueData.orders.map((order) => renderOrderCard(order))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Reject Order Dialog */}
        <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, orderId: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Order</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this order. The customer will be refunded automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Out of stock, Kitchen closed, etc."
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setRejectDialog({ open: false, orderId: null })}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectDialog.orderId && handleOrderAction(rejectDialog.orderId, "reject", { reason: rejectionReason })}
                disabled={!rejectionReason.trim() || actionLoading === rejectDialog.orderId}
              >
                {actionLoading === rejectDialog.orderId ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Reject Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* OTP Verification Dialog */}
        <Dialog open={otpDialog.open} onOpenChange={(open) => setOtpDialog({ open, orderId: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Order</DialogTitle>
              <DialogDescription>
                Enter the 4-digit OTP provided by the customer to complete this order.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="otp-input">Customer OTP</Label>
                <Input
                  id="otp-input"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Enter 4-digit OTP"
                  className="mt-1 text-center text-2xl tracking-wider"
                  maxLength={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setOtpDialog({ open: false, orderId: null })}
              >
                Cancel
              </Button>
              <Button
                onClick={() => otpDialog.orderId && handleOrderAction(otpDialog.orderId, "complete", { otp: enteredOtp })}
                disabled={enteredOtp.length !== 4 || actionLoading === otpDialog.orderId}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {actionLoading === otpDialog.orderId ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Complete Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
