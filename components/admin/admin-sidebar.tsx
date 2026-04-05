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
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { CourtSwitcher } from "@/components/admin/court-switcher"
import { adminCourtApi } from "@/lib/api"

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
  const { logout, user, token } = useUnifiedAuth()
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
      const response = await adminCourtApi.list()
      const courtsData = response.courts || []
      // Map to local Court interface, using courtId as fallback for id
      const mappedCourts: Court[] = courtsData.map(c => ({
        id: c.courtId, // Use courtId as id if not provided
        courtId: c.courtId,
        instituteName: c.instituteName,
        instituteType: c.instituteType,
        status: c.status,
        logoUrl: c.logoUrl
      }))
      setCourts(mappedCourts)
    } catch (error) {
      console.error("Error fetching courts:", error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
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
      "h-full bg-background border-r border-border flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={24} height={24} />
            <h2 className="text-xl font-semibold text-foreground">Aahaar</h2>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      
      {!collapsed && (
        <div className="p-4 border-b border-border">
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
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
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
      
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
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
