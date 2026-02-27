import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Hook to ensure all pending cart updates are synced before navigation
 * This prevents data loss when users navigate between pages with pending updates
 */
export function useCartSync() {
  const router = useRouter()

  useEffect(() => {
    // Trigger a custom event that ProductCard components can listen to
    const syncAllPendingUpdates = () => {
      console.log('🔄 [CartSync] Triggering sync for all pending cart updates')
      window.dispatchEvent(new CustomEvent('routeChangeStart'))
    }

    // Listen for Next.js router events if available
    const handleRouteChange = () => {
      syncAllPendingUpdates()
    }

    // For client-side navigation, we can patch the router methods
    const originalPush = router.push
    const originalReplace = router.replace
    const originalBack = router.back

    router.push = (...args) => {
      syncAllPendingUpdates()
      return originalPush.apply(router, args)
    }

    router.replace = (...args) => {
      syncAllPendingUpdates()
      return originalReplace.apply(router, args)
    }

    router.back = () => {
      syncAllPendingUpdates()
      return originalBack.apply(router)
    }

    // Cleanup
    return () => {
      router.push = originalPush
      router.replace = originalReplace
      router.back = originalBack
    }
  }, [router])

  // Return a function to manually trigger sync
  const syncPendingUpdates = () => {
    window.dispatchEvent(new CustomEvent('routeChangeStart'))
  }

  return { syncPendingUpdates }
}
