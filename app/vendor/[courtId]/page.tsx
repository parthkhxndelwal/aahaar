"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ShoppingCart, Clock, DollarSign, TrendingUp, AlertCircle, CheckCircle, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone?: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  totalAmount: number
  status: string
  paymentMethod: string
  paymentStatus: string
  specialInstructions?: string
  createdAt: string
  estimatedPreparationTime: number
}

interface VendorStats {
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  completedOrders: number
  averageOrderValue: number
  totalOrders: number
}

export default function VendorDashboard({ params }: { params: Promise<{ courtId: string }> }) {
  const { user, token } = useAuth()
  const router = useRouter()
  const { courtId } = use(params)
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== "vendor" || user.courtId !== courtId) {
      router.push("/vendor/login")
      return
    }

    fetchData()

    // Set up real-time updates (polling for now)
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [user, courtId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch vendor orders
      const ordersResponse = await fetch(`/api/vendors/${user?.vendorProfile?.id}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData.data.orders)
      }

      // Fetch vendor analytics
      const analyticsResponse = await fetch(`/api/vendors/${user?.vendorProfile?.id}/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setStats(analyticsData.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Refresh orders
        fetchData()
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const toggleOnlineStatus = async () => {
    try {
      const response = await fetch(`/api/vendors/${user?.vendorProfile?.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isOnline: !isOnline }),
      })

      if (response.ok) {
        setIsOnline(!isOnline)
      }
    } catch (error) {
      console.error("Error updating online status:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "preparing":
        return "bg-orange-100 text-orange-800"
      case "ready":
        return "bg-purple-100 text-purple-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusActions = (order: Order) => {
    switch (order.status) {
      case "pending":
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => updateOrderStatus(order.id, "confirmed")}>
              Accept
            </Button>
            <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, "cancelled")}>
              Reject
            </Button>
          </div>
        )
      case "confirmed":
        return (
          <Button size="sm" onClick={() => updateOrderStatus(order.id, "preparing")}>
            Start Preparing
          </Button>
        )
      case "preparing":
        return (
          <Button size="sm" onClick={() => updateOrderStatus(order.id, "ready")}>
            Mark Ready
          </Button>
        )
      case "ready":
        return (
          <Button size="sm" onClick={() => updateOrderStatus(order.id, "completed")}>
            Complete Order
          </Button>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.fullName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Online Status</span>
            <Switch checked={isOnline} onCheckedChange={toggleOnlineStatus} />
          </div>
          <Button onClick={() => router.push(`/vendor/${params.courtId}/menu`)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayOrders || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.pendingOrders || 0} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.todayRevenue || 0}</div>
            <p className="text-xs text-muted-foreground">Avg: ₹{stats?.averageOrderValue || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Live Orders</TabsTrigger>
          <TabsTrigger value="menu">Menu Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Order Feed</CardTitle>
              <CardDescription>Manage incoming orders in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders
                  .filter((order) => ["pending", "confirmed", "preparing", "ready"].includes(order.status))
                  .map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{order.orderNumber}</span>
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          <Badge variant="outline">{order.paymentMethod === "online" ? "Paid" : "COD"}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{order.totalAmount}</p>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Customer Details</h4>
                          <p className="text-sm">{order.customerName}</p>
                          {order.customerPhone && <p className="text-sm text-gray-600">{order.customerPhone}</p>}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Order Items</h4>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>
                                  {item.quantity}x {item.name}
                                </span>
                                <span>₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {order.specialInstructions && (
                        <div>
                          <h4 className="font-medium mb-1">Special Instructions</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{order.specialInstructions}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          Est. {order.estimatedPreparationTime} min
                        </div>
                        <div className="flex gap-2">{getStatusActions(order)}</div>
                      </div>
                    </div>
                  ))}

                {orders.filter((order) => ["pending", "confirmed", "preparing", "ready"].includes(order.status))
                  .length === 0 && (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No active orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Menu Management</CardTitle>
              <CardDescription>Manage your menu items and availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Plus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Menu management interface</p>
                <Button onClick={() => router.push(`/vendor/${params.courtId}/menu`)}>Manage Menu</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>Performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Detailed analytics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
