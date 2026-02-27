"use client"
import { useState, useEffect } from "react"

interface PWACapabilities {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  canShare: boolean
  supportsNotifications: boolean
  supportsPushNotifications: boolean
}

export function usePWA() {
  const [capabilities, setCapabilities] = useState<PWACapabilities>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    canShare: false,
    supportsNotifications: false,
    supportsPushNotifications: false
  })

  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Check PWA installation status
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      const isInstalled = isStandalone || isInWebAppiOS
      
      setCapabilities(prev => ({ ...prev, isInstalled }))
    }

    // Check Web Share API support
    const checkShareSupport = () => {
      const canShare = 'share' in navigator
      setCapabilities(prev => ({ ...prev, canShare }))
    }

    // Check Notification API support
    const checkNotificationSupport = () => {
      const supportsNotifications = 'Notification' in window
      const supportsPushNotifications = 'serviceWorker' in navigator && 'PushManager' in window
      
      setCapabilities(prev => ({ 
        ...prev, 
        supportsNotifications,
        supportsPushNotifications 
      }))
    }

    // Listen for online/offline events
    const handleOnline = () => setCapabilities(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setCapabilities(prev => ({ ...prev, isOnline: false }))

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setCapabilities(prev => ({ ...prev, isInstallable: true }))
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setCapabilities(prev => ({ 
        ...prev, 
        isInstalled: true, 
        isInstallable: false 
      }))
    }

    // Check for service worker updates
    const checkForUpdates = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true)
                }
              })
            }
          })
        }
      }
    }

    checkInstallStatus()
    checkShareSupport()
    checkNotificationSupport()
    checkForUpdates()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Request notification permission
  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!capabilities.supportsNotifications) {
      throw new Error('Notifications not supported')
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  // Share content using Web Share API
  const shareContent = async (data: ShareData): Promise<void> => {
    if (!capabilities.canShare) {
      throw new Error('Web Share API not supported')
    }

    try {
      await navigator.share(data)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        throw error
      }
    }
  }

  // Update the app
  const updateApp = async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    }
  }

  // Add to cart offline
  const addToCartOffline = (item: any): void => {
    const offlineCart = JSON.parse(localStorage.getItem('offline-cart') || '[]')
    offlineCart.push({
      ...item,
      timestamp: Date.now(),
      action: 'add'
    })
    localStorage.setItem('offline-cart', JSON.stringify(offlineCart))

    // Register background sync if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // Check if sync is supported
        if ('sync' in registration) {
          (registration as any).sync.register('cart-sync')
        }
      })
    }
  }

  // Get offline cart items
  const getOfflineCartItems = (): any[] => {
    return JSON.parse(localStorage.getItem('offline-cart') || '[]')
  }

  // Clear offline cart
  const clearOfflineCart = (): void => {
    localStorage.removeItem('offline-cart')
  }

  return {
    capabilities,
    updateAvailable,
    requestNotificationPermission,
    shareContent,
    updateApp,
    addToCartOffline,
    getOfflineCartItems,
    clearOfflineCart
  }
}
