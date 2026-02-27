"use client"
import { Sidebar } from "@/components/app/sidebar"
import { BottomNavigation } from "@/components/app/bottom-navigation"
import { BottomNavProvider } from "@/contexts/bottom-nav-context"
import { CartProvider } from "@/contexts/cart-context"
import { PWAInstallPrompt } from "@/components/app/pwa-install-prompt"
import { PWAUpdatePrompt } from "@/components/app/pwa-update-prompt"
import { useAppAuth } from "@/contexts/app-auth-context"
import { use, useEffect } from "react"
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
  const { user, token, loading: authLoading } = useAppAuth()
  const isLoginPage = pathname.endsWith("/login")
  const isCartPage = pathname.endsWith("/cart")

  // Redirect to login if not authenticated (except on login page)
  useEffect(() => {
    if (!isLoginPage && !authLoading && (!user || !token)) {
      console.log('🚪 [AppLayout] No auth, redirecting to login')
      router.replace(`/app/${courtId}/login`)
    }
  }, [user, token, authLoading, isLoginPage, courtId, router])

  // Register service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/app-sw.js', { scope: '/app/' })
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error)
        })
    }
  }, [])

  // Prevent zooming on mobile devices
  useEffect(() => {
    const preventZoom = (e: Event) => {
      if ((e as any).touches?.length > 1) {
        e.preventDefault()
      }
    }

    const preventDoubleTapZoom = (e: TouchEvent) => {
      const currentTime = new Date().getTime()
      const tapLength = currentTime - (window as any).lastTap || 0
      if (tapLength < 500 && tapLength > 0) {
        e.preventDefault()
      }
      ;(window as any).lastTap = currentTime
    }

    // Prevent pinch zoom
    document.addEventListener('touchmove', preventZoom, { passive: false })
    document.addEventListener('gesturestart', preventZoom, { passive: false })
    document.addEventListener('gesturechange', preventZoom, { passive: false })
    document.addEventListener('gestureend', preventZoom, { passive: false })
    
    // Prevent double tap zoom
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false })

    return () => {
      document.removeEventListener('touchmove', preventZoom)
      document.removeEventListener('gesturestart', preventZoom)
      document.removeEventListener('gesturechange', preventZoom)
      document.removeEventListener('gestureend', preventZoom)
      document.removeEventListener('touchend', preventDoubleTapZoom)
    }
  }, [])

  // Show loading while checking authentication
  if (!isLoginPage && authLoading) {
    return (
      <div className="min-h-screen dark bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-neutral-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render protected content if not authenticated (except login page)
  if (!isLoginPage && (!user || !token)) {
    return (
      <div className="min-h-screen dark bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-neutral-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <CartProvider>
      <BottomNavProvider>
        <div className="min-h-screen dark bg-neutral-950 flex w-full max-w-full overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 flex flex-col w-full max-w-full overflow-hidden">
            <main className={`flex-1 ${isCartPage ? 'p-0' : 'p-4 md:p-6 pb-20 md:pb-6'} mx-auto w-full flex justify-center overflow-hidden`}>
              <div className={isCartPage ? 'w-full md:max-w-[70%] lg:max-w-[60%] xl:max-w-[50%]' : 'w-full md:max-w-[70%] lg:max-w-[60%] xl:max-w-[50%]'}>
                {children}
              </div>
            </main>
            {/* Mobile Bottom Navigation - hidden on desktop, login page, and cart page */}
            {!isLoginPage && !isCartPage && (
              <div className="">
                <BottomNavigation courtId={courtId} />
              </div>
            )}
          </div>
          
          {/* PWA Components */}
          <PWAInstallPrompt />
          <PWAUpdatePrompt />
        </div>
      </BottomNavProvider>
    </CartProvider>
  )
}
