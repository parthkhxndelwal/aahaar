"use client"

import type React from "react"
import { use } from "react"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { LayoutDashboard, ShoppingBag, Store, Users, BarChart3, Settings, FileText } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ courtId: string }>
}) {
  const { user, loading, logout } = useUnifiedAuth()
  const router = useRouter()
  const { courtId } = use(params)

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={48} />
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={48} />
      </div>
    )
  }

  const navItems = [
    { title: "Dashboard", href: `/admin/${courtId}`, icon: LayoutDashboard },
    { title: "Orders", href: `/admin/${courtId}/orders`, icon: ShoppingBag },
    { title: "Vendors", href: `/admin/${courtId}/vendors`, icon: Store },
    { title: "Users", href: `/admin/${courtId}/users`, icon: Users },
    { title: "Analytics", href: `/admin/${courtId}/analytics`, icon: BarChart3 },
    { title: "Audit Logs", href: `/admin/${courtId}/audit-logs`, icon: FileText },
    { title: "Settings", href: `/admin/${courtId}/settings`, icon: Settings },
  ]

  return (
    <MainLayout
      navItems={navItems}
      user={{
        name: user.fullName || user.email || "Admin",
        email: user.email || "",
        role: "Admin",
      }}
      onLogout={logout}
      appName="Admin Panel"
      courtId={courtId}
    >
      {children}
    </MainLayout>
  )
}
