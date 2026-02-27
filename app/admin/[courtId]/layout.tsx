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
    if (!loading && (!user || user.role !== "admin" || user.courtId !== courtId)) {
      router.push("/admin/login")
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
    <div className="dark flex h-screen w-screen overflow-hidden fixed inset-0">
      <AdminSidebar courtId={courtId} />
      <div className="flex-1 flex flex-col min-h-0">
        {/* <AdminHeader /> */}
        <main className="flex-1 overflow-y-auto p-6 dark:bg-neutral-950">{children}</main>
      </div>
    </div>
  )
}
