"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Settings,
  BarChart3,
  CreditCard,
  UserCheck,
  LogOut,
  Store,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
} from "lucide-react"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { CourtSwitcher } from "@/components/admin/court-switcher"

interface Court {
  id: string
  courtId: string
  instituteName: string
  instituteType: string
  status: string
  logoUrl?: string
}

interface AdminSidebarProps {
  courtId: string
}

export function AdminSidebar({ courtId }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [courts, setCourts] = useState<Court[]>([])
  const [currentCourt, setCurrentCourt] = useState<Court | null>(null)
  const { logout, user, token } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetchCourts()
  }, [token])

  useEffect(() => {
    if (courts.length > 0 && courtId) {
      const court = courts.find(c => c.courtId === courtId)
      if (court) {
        setCurrentCourt(court)
      }
    }
  }, [courts, courtId])

  const fetchCourts = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/admin/courts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCourts(data.data)
        }
      }
    } catch (error) {
      console.error("Error fetching courts:", error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/admin/auth")
  }

  const navItems = [
    { 
      title: "Dashboard", 
      url: `/admin/${courtId}`, 
      icon: LayoutDashboard,
      isActive: pathname === `/admin/${courtId}`
    },
    { 
      title: "Orders", 
      url: `/admin/${courtId}/orders`, 
      icon: ShoppingBag,
      isActive: pathname.startsWith(`/admin/${courtId}/orders`)
    },
    { 
      title: "Vendors", 
      url: `/admin/${courtId}/vendors`, 
      icon: Store,
      isActive: pathname.startsWith(`/admin/${courtId}/vendors`)
    },
    { 
      title: "Users", 
      url: `/admin/${courtId}/users`, 
      icon: Users,
      isActive: pathname.startsWith(`/admin/${courtId}/users`)
    },
    { 
      title: "Analytics", 
      url: `/admin/${courtId}/analytics`, 
      icon: BarChart3,
      isActive: pathname.startsWith(`/admin/${courtId}/analytics`)
    },
    { 
      title: "Payments", 
      url: `/admin/${courtId}/payments`, 
      icon: CreditCard,
      isActive: pathname.startsWith(`/admin/${courtId}/payments`)
    },
    { 
      title: "Settings", 
      url: `/admin/${courtId}/settings`, 
      icon: Settings,
      isActive: pathname.startsWith(`/admin/${courtId}/settings`)
    },
  ]

  return (
    <div className={cn(
      "h-full bg-neutral-950 border-r border-neutral-800 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={24} height={24} />
            <h2 className="text-xl font-semibold text-white">Aahaar</h2>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-neutral-900 rounded-md transition-colors text-neutral-400 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      
      {!collapsed && (
        <div className="p-4 border-b border-neutral-800">
          <CourtSwitcher 
            courts={courts} 
            currentCourt={currentCourt}
            onCourtChange={setCurrentCourt}
          />
        </div>
      )}
      
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                item.isActive
                  ? "bg-blue-600 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </div>
      </nav>
      
      <div className="p-4 border-t border-neutral-800">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}
