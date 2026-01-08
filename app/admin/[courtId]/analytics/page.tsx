"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Store } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface AnalyticsData {
  summary: {
    totalOrders: number
    totalRevenue: number
    activeVendors: number
    totalUsers: number
  }
  topVendors: Array<{
    id: string
    stallName: string
    vendorName: string
    orderCount: number
  }>
  orderStatusStats: Array<{
    status: string
    count: number
  }>
  period: string
}

export default function AdminAnalyticsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("7d")
  const { toast } = useToast()
  const { token } = useAuth()
  const { courtId } = use(params)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/${courtId}/dashboard?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      const result = await response.json()
      if (result.success) {
        setAnalyticsData(result.data)
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch analytics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPeriodText = (period: string) => {
    switch (period) {
      case "7d": return "Last 7 Days"
      case "30d": return "Last 30 Days"
      case "90d": return "Last 90 Days"
      default: return "Last 7 Days"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">No Data Available</h2>
          <p className="text-gray-500">Analytics data could not be loaded.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100">Analytics</h1>
          <p className="text-neutral-600">Insights and performance metrics for {formatPeriodText(period)}</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="text-white" onClick={fetchAnalytics}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {formatPeriodText(period)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analyticsData.summary.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {formatPeriodText(period)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.activeVendors}</div>
            <p className="text-xs text-muted-foreground">Currently operating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vendors">Top Vendors</TabsTrigger>
          <TabsTrigger value="orders">Order Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>Performance overview for {formatPeriodText(period)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Order Value</span>
                  <span className="text-lg font-bold">
                    ₹{analyticsData.summary.totalOrders > 0 
                      ? Math.round(analyticsData.summary.totalRevenue / analyticsData.summary.totalOrders)
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Orders per Vendor</span>
                  <span className="text-lg font-bold">
                    {analyticsData.summary.activeVendors > 0 
                      ? Math.round(analyticsData.summary.totalOrders / analyticsData.summary.activeVendors)
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Revenue per User</span>
                  <span className="text-lg font-bold">
                    ₹{analyticsData.summary.totalUsers > 0 
                      ? Math.round(analyticsData.summary.totalRevenue / analyticsData.summary.totalUsers)
                      : 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Indicators</CardTitle>
                <CardDescription>Trends and growth metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Daily Average Orders</span>
                  <span className="text-lg font-bold">
                    {Math.round(analyticsData.summary.totalOrders / (period === "7d" ? 7 : period === "30d" ? 30 : 90))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Daily Average Revenue</span>
                  <span className="text-lg font-bold">
                    ₹{Math.round(analyticsData.summary.totalRevenue / (period === "7d" ? 7 : period === "30d" ? 30 : 90))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Vendor Utilization</span>
                  <span className="text-lg font-bold">
                    {Math.round((analyticsData.topVendors.length / analyticsData.summary.activeVendors) * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Vendors</CardTitle>
              <CardDescription>Vendors ranked by order volume for {formatPeriodText(period)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topVendors.length > 0 ? (
                  analyticsData.topVendors.map((vendor, index) => (
                    <div key={vendor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{vendor.stallName}</p>
                          <p className="text-sm text-gray-500">{vendor.vendorName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{vendor.orderCount} orders</p>
                        <p className="text-sm text-gray-500">
                          {Math.round((vendor.orderCount / analyticsData.summary.totalOrders) * 100)}% of total
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No vendor data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
              <CardDescription>Breakdown of orders by status for {formatPeriodText(period)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.orderStatusStats.length > 0 ? (
                  analyticsData.orderStatusStats.map((stat) => (
                    <div key={stat.status} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          stat.status === "completed" ? "bg-green-500" :
                          stat.status === "pending" ? "bg-yellow-500" :
                          stat.status === "preparing" ? "bg-blue-500" :
                          stat.status === "cancelled" ? "bg-red-500" :
                          "bg-gray-500"
                        }`}></div>
                        <span className="font-medium capitalize">{stat.status}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{stat.count} orders</p>
                        <p className="text-sm text-gray-500">
                          {Math.round((stat.count / analyticsData.summary.totalOrders) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No order status data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
