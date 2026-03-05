"use client"
import { useEffect, useState, use } from "react"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Store, ShoppingCart, DollarSign, TrendingUp, Plus, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  activeVendors: number
  totalUsers: number
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  completedOrders: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  vendorName: string
  totalAmount: number
  status: string
  createdAt: string
}

export default function AdminDashboard({ params }: { params: Promise<{ courtId: string }> }) {
  const { user, token } = useAdminAuth()
  const router = useRouter()
  const { courtId } = use(params)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/admin/auth")
      return
    }

    // Check if user has access to this court
    checkAccess()
  }, [user, courtId])

  const checkAccess = async () => {
    try {
      // Verify user has access to this court
      const response = await fetch(`/api/admin/courts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const hasAccess = data.data.some((court: any) => court.courtId === courtId)
        
        if (!hasAccess) {
          router.push("/admin/auth")
          return
        }
        
        // User has access, fetch dashboard data
        fetchDashboardData()
      } else {
        router.push("/admin/auth")
      }
    } catch (error) {
      console.error("Error checking access:", error)
      router.push("/admin/auth")
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch dashboard stats
      const statsResponse = await fetch(`/api/analytics/${courtId}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        // Extract data from the summary object returned by analytics API
        setStats({
          totalOrders: statsData.data?.summary?.totalOrders || 0,
          totalRevenue: statsData.data?.summary?.totalRevenue || 0,
          activeVendors: statsData.data?.summary?.activeVendors || 0,
          totalUsers: statsData.data?.summary?.totalUsers || 0,
          todayOrders: statsData.data?.summary?.todayOrders || 0,
          todayRevenue: statsData.data?.summary?.todayRevenue || 0,
          pendingOrders: statsData.data?.summary?.pendingOrders || 0,
          completedOrders: statsData.data?.summary?.completedOrders || 0,
        })
      } else {
        // Set default stats for new court
        setStats({
          totalOrders: 0,
          totalRevenue: 0,
          activeVendors: 0,
          totalUsers: 0,
          todayOrders: 0,
          todayRevenue: 0,
          pendingOrders: 0,
          completedOrders: 0,
        })
      }

      // Fetch recent orders
      const ordersResponse = await fetch(`/api/courts/${courtId}/orders?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setRecentOrders(ordersData.data?.orders || [])
      } else {
        setRecentOrders([])
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
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
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-neutral-500">Welcome back, {user?.fullName}</p>
        </div>
        <div className="flex gap-2">
          <Button  onClick={() => router.push(`/admin/${courtId}/vendors`)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
          <Button className="text-white" variant="outline" onClick={() => router.push(`/admin/${courtId}/orders`)}>
            <Eye className="h-4 w-4 mr-2" />
            View All Orders
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.todayOrders || 0} today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.totalRevenue || 0}</div>
            <p className="text-xs text-muted-foreground">₹{stats?.todayRevenue || 0} today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeVendors || 0}</div>
            <p className="text-xs text-muted-foreground">Stalls operating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Summary</CardTitle>
                <CardDescription>Current order distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Pending Orders</span>
                  <Badge variant="secondary">{stats?.pendingOrders || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completed Orders</span>
                  <Badge variant="secondary">{stats?.completedOrders || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/admin/${courtId}/vendors`)}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Manage Vendors
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/admin/${courtId}/orders`)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  View All Orders
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/admin/${courtId}/settings`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Court Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from your food court</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{order.orderNumber}</span>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.customerName} • {order.vendorName}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{order.totalAmount}</p>
                    </div>
                  </div>
                ))}
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
