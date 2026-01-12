"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { Bell, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"

export function VendorHeader() {
  const { user, logout } = useAuth()
  const [isOnline, setIsOnline] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return (
    <header className="bg-white shadow-sm border-b px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className={isMobile ? "flex-1" : ""}>
          <h1 className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
            {isMobile ? "Dashboard" : "Vendor Dashboard"}
          </h1>
          {!isMobile && <p className="text-sm text-gray-500">Manage your stall and orders</p>}
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Online/Offline Switch */}
          <div className="flex items-center space-x-2">
            {!isMobile && <span className="text-sm">Offline</span>}
            <Switch checked={isOnline} onCheckedChange={setIsOnline} />
            {!isMobile && <span className="text-sm">Online</span>}
            {isMobile && (
              <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            )}
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={isMobile ? "px-2" : ""}>
                <User className="h-5 w-5 mr-2" />
                {!isMobile && user?.fullName}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
