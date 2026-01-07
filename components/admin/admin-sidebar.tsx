"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Settings,
  BarChart3,
  CreditCard,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface AdminSidebarProps {
  courtId: string
}

export function AdminSidebar({ courtId }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showTitle, setShowTitle] = useState(true)
  const [showLink, setShowLink] = useState(true)

  const pathname = usePathname()

  const navigation = [
    {
      name: "Dashboard",
      href: `/admin/${courtId}`,
      icon: LayoutDashboard,
    },
    {
      name: "Vendors",
      href: `/admin/${courtId}/vendors`,
      icon: Users,
    },
    {
      name: "Orders",
      href: `/admin/${courtId}/orders`,
      icon: ShoppingBag,
    },
    {
      name: "Users",
      href: `/admin/${courtId}/users`,
      icon: UserCheck,
    },
    {
      name: "Payments",
      href: `/admin/${courtId}/payments`,
      icon: CreditCard,
    },
    {
      name: "Analytics",
      href: `/admin/${courtId}/analytics`,
      icon: BarChart3,
    },
    {
      name: "Settings",
      href: `/admin/${courtId}/settings`,
      icon: Settings,
    },
  ]

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

  return (
    <div className={cn("transition-all duration-300 bg-black", collapsed ? "w-24" : "w-64")}>
      <div className="flex items-center justify-between p-4 mt-2">
        <Image src="/logo.png" alt="Logo" width={32} height={32}></Image>
        {!collapsed && showTitle && <h2 className="text-xl font-semibold ">Admin Panel</h2>}
        <button 
          className="p-2 hover:bg-neutral-900 rounded-md transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="mt-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium transition-colors ml-2 mr-4 rounded-xl",                isActive
                  ? " text-blue-700 border-r-2 bg-neutral-900 hover:bg-neutral-800 border-blue-700"
                  : "text-neutral-600 hover:bg-neutral-950",
              )}
            >
              <item.icon className={cn("h-5 w-5 mr-3 p-0")} />
              {!collapsed && showLink && item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
