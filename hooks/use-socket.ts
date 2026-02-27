import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { connectionRecovery, createSocketChecker } from '@/lib/connection-recovery'

interface UseSocketOptions {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionDelay?: number
  reconnectionAttempts?: number
  timeout?: number
  maxReconnectionDelay?: number
  reconnectionDelayMax?: number
}

// Socket.io connection hook with enhanced retry logic
export const useSocket = (namespace: string = '', options: UseSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Enhanced reconnection with exponential backoff
  const attemptReconnection = (attempt: number = 0) => {
    if (attempt >= (options.reconnectionAttempts || 10)) {
      console.log('❌ [Socket] Max reconnection attempts reached')
      setError('Maximum reconnection attempts reached. Please refresh the page.')
      return
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(1000 * Math.pow(2, attempt), options.maxReconnectionDelay || 30000)
    
    console.log(`🔄 [Socket] Scheduling reconnection attempt ${attempt + 1} in ${delay}ms`)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && !socketRef.current.connected) {
        console.log(`🔄 [Socket] Attempting reconnection ${attempt + 1}`)
        setReconnectAttempt(attempt + 1)
        socketRef.current.connect()
      }
    }, delay)
  }

  // Heartbeat to detect dead connections
  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.connected) {
        // Send a ping to check if connection is alive
        const startTime = Date.now()
        socketRef.current.emit('ping', startTime, (response: any) => {
          const latency = Date.now() - startTime
          console.log(`💓 [Socket] Heartbeat successful, latency: ${latency}ms`)
        })

        // If no pong received within 5 seconds, consider connection dead
        setTimeout(() => {
          if (socketRef.current && socketRef.current.connected) {
            const currentTime = Date.now()
            if (currentTime - startTime > 5000) {
              console.log('💀 [Socket] Heartbeat timeout, forcing reconnection')
              socketRef.current.disconnect()
              attemptReconnection(0)
            }
          }
        }, 5000)
      }
    }, 30000) // Check every 30 seconds
  }

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }

  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'development' 
      ? 'https://aahaar-cms-socket.onrender.com' 
      : process.env.NEXT_PUBLIC_SOCKET_URL || 'https://aahaar-cms-socket.onrender.com'

    // For Socket.io, the namespace should be specified in the path parameter, not concatenated to URL
    const connectionPath = namespace || '/'

    console.log(`🔗 [Socket] Connecting to: ${socketUrl} with namespace: ${connectionPath}`)

    // Initialize socket connection with enhanced options
    socketRef.current = io(socketUrl + connectionPath, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      autoConnect: true,
      reconnection: false, // We'll handle reconnection manually for better control
      timeout: options.timeout || 20000,
      forceNew: true,
      ...options
    })

    const socket = socketRef.current

    // Connection handlers
    socket.on('connect', () => {
      console.log(`✅ [Socket] Connected to ${socketUrl}${connectionPath}`, socket.id)
      setIsConnected(true)
      setError(null)
      setReconnectAttempt(0)
      
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      // Start heartbeat monitoring
      startHeartbeat()
      
      // Register with connection recovery service
      const checkerName = `socket-${namespace || 'default'}`
      connectionRecovery.removeChecker(checkerName) // Remove any existing checker
      connectionRecovery.addChecker(createSocketChecker(socket, checkerName))
      
      // Start monitoring if not already started
      connectionRecovery.startMonitoring()
    })

    socket.on('disconnect', (reason: string) => {
      console.log(`❌ [Socket] Disconnected from ${socketUrl}${connectionPath}:`, reason)
      setIsConnected(false)
      stopHeartbeat()
      
      // Only attempt reconnection for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        setError('Server disconnected the connection')
      } else {
        // Client side disconnect or network issues, attempt reconnection
        console.log('🔄 [Socket] Starting automatic reconnection...')
        attemptReconnection(0)
      }
    })

    socket.on('connect_error', (err: any) => {
      console.error(`❌ [Socket] Connection error for ${socketUrl}${connectionPath}:`, err)
      setIsConnected(false)
      stopHeartbeat()
      
      // Handle specific timeout errors
      if (err.message && err.message.includes('timeout')) {
        console.log('⏰ [Socket] Timeout error detected, attempting reconnection...')
        setError('Connection timeout - retrying...')
        attemptReconnection(reconnectAttempt)
      } else {
        setError(err.message)
        // For other errors, also attempt reconnection
        attemptReconnection(reconnectAttempt)
      }
    })

    socket.on('reconnect', (attempt: number) => {
      console.log(`🔄 [Socket] Reconnected to ${socketUrl}${connectionPath} after ${attempt} attempts`)
      setIsConnected(true)
      setError(null)
      setReconnectAttempt(0)
      startHeartbeat()
    })

    socket.on('reconnect_error', (err: any) => {
      console.error(`❌ [Socket] Reconnection error for ${socketUrl}${connectionPath}:`, err)
      setError(`Reconnection failed: ${err.message}`)
    })

    // Handle pong responses for heartbeat
    socket.on('pong', (data: any) => {
      console.log(`💓 [Socket] Pong received:`, data)
    })

    // Cleanup on unmount
    return () => {
      console.log(`🔌 [Socket] Cleaning up socket connection to ${socketUrl}${connectionPath}`)
      
      // Clear timers
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      stopHeartbeat()
      
      // Remove from connection recovery service
      const checkerName = `socket-${namespace || 'default'}`
      connectionRecovery.removeChecker(checkerName)
      
      if (socketRef.current) {
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [namespace, reconnectAttempt])

  // Manual reconnection function
  const forceReconnect = () => {
    console.log('🔄 [Socket] Force reconnection requested')
    setReconnectAttempt(0)
    setError(null)
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current.connect()
    }
  }

  return {
    socket: socketRef.current,
    isConnected,
    error,
    reconnectAttempt,
    forceReconnect
  }
}
