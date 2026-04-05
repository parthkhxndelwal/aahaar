"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { adminCourtApi } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function AdminIndexPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAuthenticated } = useUnifiedAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Still loading auth state
    if (authLoading) return

    // Not authenticated at all - redirect to login
    if (!isAuthenticated) {
      router.replace("/auth/login")
      return
    }

    // Authenticated but user data not populated yet - wait
    if (!user) {
      return
    }

    // Wrong role - redirect to login
    if (user.role !== "admin") {
      router.replace("/auth/login")
      return
    }

    // Fetch admin's courts and redirect appropriately
    const checkCourts = async () => {
      try {
        const response = await adminCourtApi.list()
        const courts = response.courts || []

        if (courts.length === 0) {
          // No courts - redirect to dashboard for court creation
          router.replace("/admin/dashboard")
        } else {
          // Has courts - redirect to first court's dashboard
          router.replace(`/admin/${courts[0].courtId}`)
        }
      } catch (error) {
        console.error("Error fetching courts:", error)
        // On error, go to dashboard (they can create a court there)
        router.replace("/admin/dashboard")
      } finally {
        setChecking(false)
      }
    }

    checkCourts()
  }, [user, authLoading, isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Loading your dashboard...</span>
      </div>
    </div>
  )
}
