"use client"

import type React from "react"
import { use } from "react"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Spinner } from "@/components/ui/spinner"

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ courtId: string }>
}) {
  const { user, loading } = useAdminAuth()
  const router = useRouter()
  const { courtId } = use(params)

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/admin/auth")
    }
  }, [user, loading, courtId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={48} variant="dark" />
        </div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="flex h-screen w-full">
      <AdminSidebar courtId={courtId} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 bg-neutral-950">
          {children}
        </main>
      </div>
    </div>
  )
}
