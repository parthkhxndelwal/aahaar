/**
 * Connection Recovery Service
 * Handles automatic recovery from network and socket connection issues
 */

interface ConnectionRecoveryOptions {
  pingInterval?: number // How often to check connection health (ms)
  pingTimeout?: number // How long to wait for ping response (ms)
  maxRetries?: number // Maximum number of retry attempts
  retryDelay?: number // Initial retry delay (ms)
  maxRetryDelay?: number // Maximum retry delay (ms)
  exponentialBackoff?: boolean // Whether to use exponential backoff
}

interface ConnectionChecker {
  isHealthy: () => Promise<boolean>
  recover: () => Promise<boolean>
  name: string
}

class ConnectionRecoveryService {
  private options: Required<ConnectionRecoveryOptions>
  private checkers: ConnectionChecker[] = []
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private retryCount = 0
  private lastSuccessfulCheck = Date.now()

  constructor(options: ConnectionRecoveryOptions = {}) {
    this.options = {
      pingInterval: options.pingInterval || 30000, // 30 seconds
      pingTimeout: options.pingTimeout || 5000, // 5 seconds
      maxRetries: options.maxRetries || 10,
      retryDelay: options.retryDelay || 1000, // 1 second
      maxRetryDelay: options.maxRetryDelay || 30000, // 30 seconds
      exponentialBackoff: options.exponentialBackoff ?? true
    }
  }

  /**
   * Add a connection checker (e.g., socket, API endpoint)
   */
  addChecker(checker: ConnectionChecker) {
    this.checkers.push(checker)
    console.log(`🔧 [ConnectionRecovery] Added checker: ${checker.name}`)
  }

  /**
   * Remove a connection checker
   */
  removeChecker(name: string) {
    this.checkers = this.checkers.filter(checker => checker.name !== name)
    console.log(`🔧 [ConnectionRecovery] Removed checker: ${name}`)
  }

  /**
   * Start monitoring connections
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ [ConnectionRecovery] Already monitoring')
      return
    }

    console.log('🔍 [ConnectionRecovery] Starting connection monitoring')
    this.isMonitoring = true
    this.retryCount = 0
    this.lastSuccessfulCheck = Date.now()
    
    this.monitoringInterval = setInterval(() => {
      this.checkConnections()
    }, this.options.pingInterval)

    // Initial check
    this.checkConnections()
  }

  /**
   * Stop monitoring connections
   */
  stopMonitoring() {
    if (!this.isMonitoring) return

    console.log('🛑 [ConnectionRecovery] Stopping connection monitoring')
    this.isMonitoring = false
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  /**
   * Check all registered connections
   */
  private async checkConnections() {
    if (!this.isMonitoring || this.checkers.length === 0) return

    console.log(`🔍 [ConnectionRecovery] Checking ${this.checkers.length} connections`)

    const healthChecks = await Promise.allSettled(
      this.checkers.map(async (checker) => {
        try {
          const isHealthy = await Promise.race([
            checker.isHealthy(),
            new Promise<boolean>((_, reject) => 
              setTimeout(() => reject(new Error('Health check timeout')), this.options.pingTimeout)
            )
          ])
          
          return { checker: checker.name, healthy: isHealthy, error: null }
        } catch (error) {
          console.warn(`❌ [ConnectionRecovery] Health check failed for ${checker.name}:`, error)
          return { checker: checker.name, healthy: false, error }
        }
      })
    )

    const failedCheckers = healthChecks
      .map(result => result.status === 'fulfilled' ? result.value : null)
      .filter(result => result && !result.healthy)

    if (failedCheckers.length > 0) {
      console.warn(`🚨 [ConnectionRecovery] ${failedCheckers.length} connection(s) failed health check`)
      await this.handleFailedConnections(failedCheckers.map(f => f!.checker))
    } else {
      // All connections healthy, reset retry count
      if (this.retryCount > 0) {
        console.log('✅ [ConnectionRecovery] All connections healthy, resetting retry count')
        this.retryCount = 0
      }
      this.lastSuccessfulCheck = Date.now()
    }
  }

  /**
   * Handle failed connections by attempting recovery
   */
  private async handleFailedConnections(failedCheckerNames: string[]) {
    if (this.retryCount >= this.options.maxRetries) {
      console.error('❌ [ConnectionRecovery] Maximum retry attempts reached')
      // Could emit an event here for the UI to show a critical error
      return
    }

    this.retryCount++
    const delay = this.calculateRetryDelay()
    
    console.log(`🔄 [ConnectionRecovery] Attempting recovery ${this.retryCount}/${this.options.maxRetries} in ${delay}ms`)
    
    // Wait before attempting recovery
    await new Promise(resolve => setTimeout(resolve, delay))

    // Attempt to recover each failed connection
    const recoveryPromises = failedCheckerNames.map(async (checkerName) => {
      const checker = this.checkers.find(c => c.name === checkerName)
      if (!checker) return false

      try {
        console.log(`🔧 [ConnectionRecovery] Attempting recovery for ${checkerName}`)
        const recovered = await checker.recover()
        
        if (recovered) {
          console.log(`✅ [ConnectionRecovery] Successfully recovered ${checkerName}`)
        } else {
          console.warn(`❌ [ConnectionRecovery] Failed to recover ${checkerName}`)
        }
        
        return recovered
      } catch (error) {
        console.error(`💥 [ConnectionRecovery] Recovery error for ${checkerName}:`, error)
        return false
      }
    })

    const recoveryResults = await Promise.allSettled(recoveryPromises)
    const successfulRecoveries = recoveryResults.filter(
      result => result.status === 'fulfilled' && result.value === true
    ).length

    console.log(`📊 [ConnectionRecovery] Recovery results: ${successfulRecoveries}/${failedCheckerNames.length} successful`)
    
    // If all recoveries failed, schedule another attempt
    if (successfulRecoveries === 0) {
      console.log('🔄 [ConnectionRecovery] All recovery attempts failed, will retry...')
    } else if (successfulRecoveries === failedCheckerNames.length) {
      console.log('🎉 [ConnectionRecovery] All connections recovered successfully')
      this.retryCount = 0
    }
  }

  /**
   * Calculate retry delay with optional exponential backoff
   */
  private calculateRetryDelay(): number {
    if (!this.options.exponentialBackoff) {
      return this.options.retryDelay
    }

    const exponentialDelay = this.options.retryDelay * Math.pow(2, this.retryCount - 1)
    return Math.min(exponentialDelay, this.options.maxRetryDelay)
  }

  /**
   * Force immediate recovery attempt for all connections
   */
  async forceRecovery(): Promise<boolean> {
    console.log('⚡ [ConnectionRecovery] Force recovery requested')
    
    const recoveryPromises = this.checkers.map(async (checker) => {
      try {
        return await checker.recover()
      } catch (error) {
        console.error(`💥 [ConnectionRecovery] Force recovery error for ${checker.name}:`, error)
        return false
      }
    })

    const results = await Promise.allSettled(recoveryPromises)
    const successCount = results.filter(
      result => result.status === 'fulfilled' && result.value === true
    ).length

    const success = successCount === this.checkers.length
    console.log(`📊 [ConnectionRecovery] Force recovery: ${successCount}/${this.checkers.length} successful`)
    
    if (success) {
      this.retryCount = 0
      this.lastSuccessfulCheck = Date.now()
    }
    
    return success
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      retryCount: this.retryCount,
      lastSuccessfulCheck: this.lastSuccessfulCheck,
      checkersCount: this.checkers.length,
      checkers: this.checkers.map(c => c.name)
    }
  }
}

// Create and export singleton instance
export const connectionRecovery = new ConnectionRecoveryService()

// Export factory function for creating socket checkers
export const createSocketChecker = (socket: any, name: string = 'socket'): ConnectionChecker => ({
  name,
  async isHealthy() {
    if (!socket) return false
    
    return new Promise((resolve) => {
      if (!socket.connected) {
        resolve(false)
        return
      }

      // Send ping to check if connection is responsive
      const timeout = setTimeout(() => resolve(false), 3000)
      
      socket.emit('ping', Date.now(), () => {
        clearTimeout(timeout)
        resolve(true)
      })
    })
  },
  async recover() {
    if (!socket) return false
    
    return new Promise((resolve) => {
      if (socket.connected) {
        resolve(true)
        return
      }

      const timeout = setTimeout(() => resolve(false), 10000)
      
      const onConnect = () => {
        clearTimeout(timeout)
        socket.off('connect', onConnect)
        socket.off('connect_error', onError)
        resolve(true)
      }
      
      const onError = () => {
        clearTimeout(timeout)
        socket.off('connect', onConnect)
        socket.off('connect_error', onError)
        resolve(false)
      }
      
      socket.once('connect', onConnect)
      socket.once('connect_error', onError)
      socket.connect()
    })
  }
})

// Export factory function for creating API checkers
export const createApiChecker = (endpoint: string, name: string = 'api'): ConnectionChecker => ({
  name,
  async isHealthy() {
    try {
      const response = await fetch(endpoint, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      })
      return response.ok
    } catch {
      return false
    }
  },
  async recover() {
    // For API endpoints, recovery is just checking if it's back online
    return this.isHealthy()
  }
})
