import { useEffect, useState } from 'react'
import { connectionRecovery } from '@/lib/connection-recovery'

interface UseConnectionRecoveryReturn {
  isMonitoring: boolean
  retryCount: number
  lastSuccessfulCheck: Date
  checkersCount: number
  forceRecovery: () => Promise<boolean>
  status: 'healthy' | 'recovering' | 'failed'
}

/**
 * Hook to monitor and manage connection recovery
 */
export function useConnectionRecovery(): UseConnectionRecoveryReturn {
  const [status, setStatus] = useState<'healthy' | 'recovering' | 'failed'>('healthy')
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  useEffect(() => {
    // Poll connection recovery status
    const interval = setInterval(() => {
      const currentStatus = connectionRecovery.getStatus()
      
      // Determine overall status
      let newStatus: 'healthy' | 'recovering' | 'failed' = 'healthy'
      
      if (currentStatus.retryCount > 0) {
        if (currentStatus.retryCount >= 5) {
          newStatus = 'failed'
        } else {
          newStatus = 'recovering'
        }
      }
      
      setStatus(newStatus)
      setLastUpdate(Date.now())
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [])

  const forceRecovery = async (): Promise<boolean> => {
    setStatus('recovering')
    try {
      const result = await connectionRecovery.forceRecovery()
      setStatus(result ? 'healthy' : 'failed')
      return result
    } catch (error) {
      console.error('Force recovery failed:', error)
      setStatus('failed')
      return false
    }
  }

  const currentStatus = connectionRecovery.getStatus()

  return {
    isMonitoring: currentStatus.isMonitoring,
    retryCount: currentStatus.retryCount,
    lastSuccessfulCheck: new Date(currentStatus.lastSuccessfulCheck),
    checkersCount: currentStatus.checkersCount,
    forceRecovery,
    status
  }
}
