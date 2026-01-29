"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Package, Menu, Settings, ChevronLeft, ChevronRight, Plus, LogOut, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface VendorSidebarProps {
  courtId: string
}

export function VendorSidebar({ courtId }: VendorSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const { logout } = useAuth()

  const navigation = [
    {
      name: "Home",
      href: `/vendor/${courtId}`,
      icon: Home,
    },
    {
      name: "Queue",
      href: `/vendor/${courtId}/queue`,
      icon: Clock,
    },
    {
      name: "Inventory",
      href: `/vendor/${courtId}/inventory`,
      icon: Package,
    },
    {
      name: "Menu",
      href: `/vendor/${courtId}/menu`,
      icon: Menu,
    },
    {
      name: "Settings",
      href: `/vendor/${courtId}/settings`,
      icon: Settings,
    },
  ]

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Mobile Bottom Navigation
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around py-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors rounded-lg",
                  isActive
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <item.icon className="h-6 w-6 mb-1" />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={logout}
            className="flex flex-col items-center py-2 px-3 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
          >
            <LogOut className="h-6 w-6 mb-1" />
            <span className="truncate">Logout</span>
          </Button>
        </div>
      </div>
    )
  }

  // Desktop Sidebar
  return (
    <div className={cn("bg-white shadow-lg transition-all duration-300 flex flex-col h-full", collapsed ? "w-16" : "w-64")}>
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && <h2 className="text-xl font-semibold text-gray-800">Vendor Panel</h2>}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="mt-6 flex-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {!collapsed && item.name}
            </Link>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 space-y-2">
          <Button asChild className="w-full">
            <Link href={`/vendor/${courtId}/orders/manual`}>
              <Plus className="h-4 w-4 mr-2" />
              Quick Order
            </Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={logout}
            className="w-full text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      )}

      {collapsed && (
        <div className="p-2 space-y-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={logout}
            className="w-full p-2"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
