"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConnectionRecovery } from '@/hooks/use-connection-recovery'
import { useSocketConnection } from '@/contexts/socket-connection-context'
import { LogoSpinnerSmall } from './logo-spinner'

interface ConnectionStatusProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showWhenHealthy?: boolean
  compact?: boolean
  className?: string
}

export function ConnectionStatus({ 
  position = 'top-right',
  showWhenHealthy = false,
  compact = false,
  className = ''
}: ConnectionStatusProps) {
  const { status, retryCount, forceRecovery } = useConnectionRecovery()
  const { isConnected, error, shouldConnect } = useSocketConnection()

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  // Only show connection status if we should be connected (on order pages)
  const shouldShow = shouldConnect && (!isConnected || error || status !== 'healthy' || showWhenHealthy)

  const getStatusColor = () => {
    if (isConnected && status === 'healthy') return 'bg-green-500'
    if (status === 'recovering') return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected'
    if (error) return 'Connection Error'
    if (status === 'recovering') return `Reconnecting... (${retryCount})`
    if (status === 'failed') return 'Connection Failed'
    return 'Connected'
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`fixed ${positionClasses[position]} z-50 ${className}`}
        >
          <div className={`
            bg-white dark:bg-neutral-900 
            border border-neutral-200 dark:border-neutral-800 
            rounded-lg shadow-lg 
            ${compact ? 'p-2' : 'p-3'}
            max-w-xs
          `}>
            {compact ? (
              <div className="flex items-center space-x-2">
                {status === 'recovering' ? (
                  <LogoSpinnerSmall size={16} showBorder={false} />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                )}
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  {getStatusText()}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {status === 'recovering' ? (
                    <LogoSpinnerSmall size={20} />
                  ) : (
                    <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
                  )}
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {getStatusText()}
                  </span>
                </div>

                {error && !isConnected && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {error}
                  </p>
                )}

                {(status === 'failed' || (!isConnected && retryCount > 3)) && (
                  <button
                    onClick={forceRecovery}
                    className="w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Retry Connection
                  </button>
                )}

                {status === 'recovering' && (
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1">
                    <div 
                      className="bg-orange-500 h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((retryCount / 10) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Auto-retry banner for critical connection failures
export function ConnectionRetryBanner() {
  const { status, retryCount } = useConnectionRecovery()
  const { isConnected, error, shouldConnect } = useSocketConnection()

  // Only show banner if we should be connected (on order pages) and there are issues
  const showBanner = shouldConnect && !isConnected && (status === 'failed' || retryCount > 5)

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-3"
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LogoSpinnerSmall size={24} className="text-white" />
              <div>
                <p className="font-medium">Connection Issues Detected</p>
                <p className="text-sm opacity-90">
                  Automatically retrying... ({retryCount} attempts)
                </p>
              </div>
            </div>
            <div className="text-sm opacity-75">
              Please check your internet connection
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
