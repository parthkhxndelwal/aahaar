"use client"
import { Wifi, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { usePWA } from "@/hooks/use-pwa"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"

export default function OfflinePage() {
  const { capabilities } = usePWA()
  const [retrying, setRetrying] = useState(false)

  const handleRetry = async () => {
    setRetrying(true)
    
    // Try to reconnect
    try {
      // Use a simple endpoint to check connection - just make a basic request
      await apiClient.get('/health', {}, { skipAuth: true })
      window.location.reload()
    } catch (error) {
      console.log('Still offline')
    } finally {
      setTimeout(() => setRetrying(false), 1000)
    }
  }

  useEffect(() => {
    // Auto-retry when coming back online
    if (capabilities.isOnline) {
      window.location.reload()
    }
  }, [capabilities.isOnline])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto"
      >
        <motion.div
          animate={{ 
            rotate: capabilities.isOnline ? 0 : [0, -10, 10, -10, 0],
            scale: capabilities.isOnline ? 1 : [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: capabilities.isOnline ? 0 : Infinity,
            repeatDelay: 1 
          }}
          className="mb-6"
        >
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Wifi className={`w-10 h-10 ${capabilities.isOnline ? 'text-foreground' : 'text-muted-foreground'}`} />
          </div>
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          {capabilities.isOnline ? 'Reconnecting...' : 'You\'re offline'}
        </h1>

        <p className="text-muted-foreground mb-8">
          {capabilities.isOnline 
            ? 'Getting you back online...' 
            : 'Check your internet connection and try again'
          }
        </p>

        <motion.button
          onClick={handleRetry}
          disabled={retrying || capabilities.isOnline}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-foreground hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground text-background px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Retrying...' : 'Try Again'}
        </motion.button>

        <div className="mt-8 p-4 bg-muted rounded-xl">
          <h3 className="text-foreground font-medium mb-2">💡 Tip</h3>
          <p className="text-sm text-muted-foreground">
            Some features are available offline. Your cart items are saved locally and will sync when you're back online.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
