"use client"
import { useEffect, useState, use } from "react"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Store, ShoppingCart, DollarSign, TrendingUp, Plus, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { AuditLogsPreview } from "@/components/admin/audit-logs-preview"
import { adminCourtApi, analyticsApi, orderApi, apiClient } from "@/lib/api"
import { Spinner } from "@/components/ui/spinner"

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
  const { user, token, loading: authLoading } = useUnifiedAuth()
  const router = useRouter()
  const { courtId } = use(params)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [accessChecked, setAccessChecked] = useState(false)

  // Set up API client token
  useEffect(() => {
    if (token) {
      apiClient.setTokenGetter(() => token)
    }
  }, [token])

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return

    if (!user || user.role !== "admin") {
      router.push("/auth/login")
      return
    }

    // Check if user has access to this court
    checkAccess()
  }, [user, authLoading, courtId])

  const checkAccess = async () => {
    try {
      // Verify user has access to this court
      const data = await adminCourtApi.list()
      const hasAccess = data.courts?.some((court) => court.courtId === courtId)
      
      if (!hasAccess) {
        // Redirect to admin index which will pick the right court
        router.push("/admin")
        return
      }
      
      setAccessChecked(true)
      // User has access, fetch dashboard data
      fetchDashboardData()
    } catch (error) {
      console.error("Error checking access:", error)
      router.push("/admin")
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch dashboard stats and recent orders in parallel
      const [statsResult, ordersResult] = await Promise.allSettled([
        analyticsApi.getDashboard(courtId),
        orderApi.getCourtOrders(courtId, { limit: 10 })
      ])

      // Handle stats
      if (statsResult.status === 'fulfilled') {
        const statsData = statsResult.value as any
        setStats({
          totalOrders: statsData?.summary?.totalOrders || 0,
          totalRevenue: statsData?.summary?.totalRevenue || 0,
          activeVendors: statsData?.summary?.activeVendors || 0,
          totalUsers: statsData?.summary?.totalUsers || 0,
          todayOrders: statsData?.summary?.todayOrders || 0,
          todayRevenue: statsData?.summary?.todayRevenue || 0,
          pendingOrders: statsData?.summary?.pendingOrders || 0,
          completedOrders: statsData?.summary?.completedOrders || 0,
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

      // Handle orders
      if (ordersResult.status === 'fulfilled') {
        setRecentOrders((ordersResult.value as any)?.orders || [])
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
        return "bg-muted text-muted-foreground"
      case "preparing":
        return "bg-muted text-foreground"
      case "ready":
        return "bg-muted text-foreground"
      case "completed":
        return "bg-muted text-foreground"
      case "cancelled":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-muted text-foreground"
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size={48} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.fullName}</p>
        </div>
        <div className="flex gap-2">
          <Button  onClick={() => router.push(`/admin/${courtId}/vendors`)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
          <Button variant="outline" onClick={() => router.push(`/admin/${courtId}/orders`)}>
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

          {/* Audit Logs Preview */}
          {token && <AuditLogsPreview courtId={courtId} token={token} />}
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
                      <p className="text-sm text-muted-foreground">
                        {order.customerName} • {order.vendorName}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
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
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Detailed analytics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
