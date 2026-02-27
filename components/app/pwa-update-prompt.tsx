"use client"
import { useState } from "react"
import { Download, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { usePWA } from "@/hooks/use-pwa"

export function PWAUpdatePrompt() {
  const { updateAvailable, updateApp } = usePWA()
  const [isUpdating, setIsUpdating] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      await updateApp()
    } catch (error) {
      console.error('Error updating app:', error)
      setIsUpdating(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  if (!updateAvailable || dismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <div className="bg-blue-500 text-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  Update Available
                </h3>
                <p className="text-xs text-blue-100">
                  New features and improvements
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 bg-white text-blue-500 text-sm font-medium py-2 px-4 rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? 'Updating...' : 'Update Now'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-sm text-blue-100 hover:text-white transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
