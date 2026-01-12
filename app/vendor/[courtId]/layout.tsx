"use client"

import type React from "react"
import { use } from "react"
import { useState, useEffect } from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { VendorSidebar } from "@/components/vendor/vendor-sidebar"
import { VendorHeader } from "@/components/vendor/vendor-header"

export default function VendorLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ courtId: string }>
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { courtId } = use(params)
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

  useEffect(() => {
    if (!loading && (!user || user.role !== "vendor" || user.courtId !== courtId)) {
      router.push("/vendor/login")
    }
  }, [user, loading, courtId, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user || user.role !== "vendor") {
    return null
  }

  return (
    <div className={`flex h-screen bg-gray-100 ${isMobile ? 'flex-col' : ''}`}>
      {/* Desktop Sidebar */}
      {!isMobile && <VendorSidebar courtId={courtId} />}
      
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'pb-16' : ''}`}>
        <VendorHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <VendorSidebar courtId={courtId} />}
    </div>
  )
}
