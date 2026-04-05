"use client"

import type React from "react"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Spinner } from "@/components/ui/spinner"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useUnifiedAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={48} variant="dark" />
        </div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return <>{children}</>
}
