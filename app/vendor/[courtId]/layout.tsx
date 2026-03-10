"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useVendorAuth } from "@/contexts/vendor-auth-context"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Settings, Box } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

export default function VendorLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ courtId: string }>
}) {
  const { user, loading, logout } = useVendorAuth()
  const router = useRouter()
  const { courtId } = use(params)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && mounted) {
        if (!user || user.role !== "vendor") {
             router.push("/vendor/login")
        } else if (user.courtId !== courtId) {
             router.push(`/vendor/${user.courtId}`)
        }
    }
  }, [user, loading, courtId, router, mounted])

  if (loading || !mounted) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-muted/20">
        <Spinner size={32} />
      </div>
    )
  }
  
  if (!user) return null;

  const navItems = [
    { title: "Overview", href: `/vendor/${courtId}`, icon: LayoutDashboard },
    { title: "Live Orders", href: `/vendor/${courtId}/queue`, icon: ClipboardList },
    { title: "Menu", href: `/vendor/${courtId}/menu`, icon: UtensilsCrossed },
    { title: "Inventory", href: `/vendor/${courtId}/inventory`, icon: Box },
    { title: "Settings", href: `/vendor/${courtId}/settings`, icon: Settings },
  ]

  return (
    <DashboardShell
        navItems={navItems}
        user={{
            name: user.vendorProfile?.stallName || user.fullName,
            email: user.email || user.phone || 'No email',
            role: "Vendor",
        }}
        onLogout={logout}
        appName="Vendor Portal"
    >
        {children}
    </DashboardShell>
  )
}
