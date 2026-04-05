"use client"

import { use } from "react"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { useVendorOrders } from "@/hooks/use-vendor-orders"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, Clock, CheckCircle2, AlertCircle, UtensilsCrossed, Box } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

export default function VendorDashboard({ params }: { params: Promise<{ courtId: string }> }) {
  const { user } = useUnifiedAuth()
  const { courtId } = use(params)
  
  // Use vendorProfile.id (Vendor ID), not user.id (User ID)
  const { orders, sectionCounts, isLoading } = useVendorOrders(user?.vendorProfile?.id || null)

  const stats = [
    {
      title: "New Orders",
      value: sectionCounts.upcoming,
      description: "Waiting for acceptance",
      icon: AlertCircle,
      color: "text-foreground",
      bg: "bg-muted"
    },
    {
      title: "In Kitchen",
      value: sectionCounts.queue,
      description: "Currently preparing",
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    },
    {
      title: "Ready",
      value: sectionCounts.ready,
      description: "Waiting for pickup",
      icon: CheckCircle2,
      color: "text-foreground",
      bg: "bg-muted"
    }
  ]

  // Calculate rough daily revenue from visible orders (just an estimate for the UI demo)
  const activeRevenue = [...orders.upcoming, ...orders.queue, ...orders.ready]
    .reduce((acc, order) => acc + order.totalAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.vendorProfile?.stallName || user?.fullName}. Here's what's happening today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-l-4" style={{ borderLeftColor: stat.color.replace('text-', '') }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "-" : stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
        
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Value
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                 <span className="text-emerald-500 font-bold">₹</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "-" : formatCurrency(activeRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Value of current active orders
              </p>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest orders requiring your attention.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? (
               <div className="py-8 text-center text-muted-foreground">Loading orders...</div>
             ) : orders.upcoming.length > 0 ? (
               <div className="space-y-4">
                 {orders.upcoming.slice(0, 5).map(order => (
                   <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">Order #{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground capitalize">{order.items.length} items • {formatCurrency(order.totalAmount)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-muted text-foreground px-2 py-1 rounded-full">{order.status}</span>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="py-8 text-center text-muted-foreground">
                 No pending orders.
               </div>
             )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={`/vendor/${courtId}/queue`}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Manage Orders
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={`/vendor/${courtId}/menu`}>
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                Manage Menu
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href={`/vendor/${courtId}/inventory`}>
                <Box className="mr-2 h-4 w-4" />
                Check Inventory
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
