"use client"

import { CartProvider } from "@/contexts/cart-context"
import { BottomNavProvider } from "@/contexts/bottom-nav-context"
import { CustomerLayout } from "@/components/app/customer-layout"
import { PWAInstallPrompt } from "@/components/app/pwa-install-prompt"
import { PWAUpdatePrompt } from "@/components/app/pwa-update-prompt"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { use, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ courtId: string }>
}) {
  const { courtId } = use(params)
  const pathname = usePathname()
  const router = useRouter()
  const { user, token, loading: authLoading } = useUnifiedAuth()
  const isLoginPage = pathname.endsWith("/login")
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isLoginPage && !authLoading && (!user || !token)) {
      router.replace(`/app/${courtId}/login`)
    }
  }, [user, token, authLoading, isLoginPage, courtId, router])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/app-sw.js', { scope: '/app/' })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  const loadingScreen = (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  )

  // Show loading during hydration or auth check
  if (!isHydrated || (!isLoginPage && authLoading)) {
    return loadingScreen
  }

  // Show loading while redirecting to login
  if (!isLoginPage && (!user || !token)) {
    return loadingScreen
  }

  // Login page renders without layout
  if (isLoginPage) {
    return <>{children}</>
  }

  // Main app with unified navigation
  return (
    <CartProvider>
      <BottomNavProvider>
        <CustomerLayout
          courtId={courtId}
          user={{
            name: user?.fullName || user?.phone || "Guest",
            email: user?.email || user?.phone || "",
          }}
        >
          {children}
          <PWAInstallPrompt />
          <PWAUpdatePrompt />
        </CustomerLayout>
      </BottomNavProvider>
    </CartProvider>
  )
}
