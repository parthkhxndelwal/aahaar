"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Home, Package, Menu, Settings, ChevronLeft, ChevronRight, Plus, LogOut, Clock, ShoppingBag } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface VendorSidebarProps {
  courtId: string
}

export function VendorSidebar({ courtId }: VendorSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showTitle, setShowTitle] = useState(true)
  const [showLink, setShowLink] = useState(true)
  const pathname = usePathname()
  const { logout } = useAuth()

  const navigation = [
    {
      name: "Home",
      href: `/vendor/${courtId}`,
      icon: Home,
    },
    {
      name: "Orders",
      href: `/vendor/${courtId}/orders`,
      icon: ShoppingBag,
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

  useEffect(() => {
    if (collapsed) {
      setShowTitle(false)
      setShowLink(false)
    } else {
      const timer = setTimeout(() => {
        setShowTitle(true)
        setShowLink(true)
      }, 210)
      return () => clearTimeout(timer)
    }
  }, [collapsed])

  // Mobile Bottom Navigation
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-neutral-800 z-50">
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
                    ? "text-neutral-300 bg-neutral-900"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-950"
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
            className="flex flex-col items-center py-2 px-3 text-xs font-medium text-neutral-500 hover:text-neutral-300 hover:bg-neutral-950 rounded-lg"
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
    <div className={cn("transition-all duration-300 bg-black flex flex-col h-full", collapsed ? "w-24" : "w-64")}>
      <div className="flex items-center justify-between p-4 mt-2">
        <Image src="/logo.png" alt="Logo" width={32} height={32}></Image>
        {!collapsed && showTitle && <h2 className="text-xl font-semibold text-neutral-50">Vendor Panel</h2>}
        <button 
          className="p-2 hover:bg-neutral-900 rounded-md transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="mt-6 flex-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2.5 my-1 text-sm font-medium transition-colors ml-2 mr-4 rounded-xl",
                isActive
                  ? " text-neutral-300 border-r-2 bg-neutral-900 hover:bg-neutral-800 border-neutral-300"
                  : "text-neutral-500 hover:bg-neutral-950",
              )}
            >
              <item.icon className={cn("h-5 w-5 mr-3 p-0")} />
              {!collapsed && showLink && item.name}
            </Link>
          )
        })}
      </nav>

      {/* Quick Order Button - only in expanded mode */}
      {!collapsed && showLink && (
        <div className="px-6 pb-4">
          <Button asChild className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-100">
            <Link href={`/vendor/${courtId}/orders/manual`}>
              <Plus className="h-4 w-4 mr-2" />
              Quick Order
            </Link>
          </Button>








        </div>
      )}

      {/* Logout Button */}
      <div className="p-4 mt-auto">
        <Button
          variant="ghost"

          onClick={logout}
          className={cn(
            "w-full justify-start text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors",
            collapsed ? "px-2" : "px-4"
          )}
        >
          <LogOut className={cn("h-5 w-5", !collapsed && showLink ? "mr-3" : "")} />
          {!collapsed && showLink && "Logout"}
        </Button>
      </div>

    </div>
  )
}