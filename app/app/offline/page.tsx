"use client"
import { Wifi, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { usePWA } from "@/hooks/use-pwa"
import { useEffect, useState } from "react"

export default function OfflinePage() {
  const { capabilities } = usePWA()
  const [retrying, setRetrying] = useState(false)

  const handleRetry = async () => {
    setRetrying(true)
    
    // Try to reconnect
    try {
      const response = await fetch('/api/health', { cache: 'no-store' })
      if (response.ok) {
        window.location.reload()
      }
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
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
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
          <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto">
            <Wifi className={`w-10 h-10 ${capabilities.isOnline ? 'text-green-400' : 'text-neutral-400'}`} />
          </div>
        </motion.div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {capabilities.isOnline ? 'Reconnecting...' : 'You\'re offline'}
        </h1>

        <p className="text-neutral-400 mb-8">
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
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-700 disabled:text-neutral-400 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Retrying...' : 'Try Again'}
        </motion.button>

        <div className="mt-8 p-4 bg-neutral-900 rounded-xl">
          <h3 className="text-white font-medium mb-2">💡 Tip</h3>
          <p className="text-sm text-neutral-400">
            Some features are available offline. Your cart items are saved locally and will sync when you're back online.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
