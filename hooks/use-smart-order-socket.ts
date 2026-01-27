import { useEffect, useCallback, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import socketManager from '@/lib/socket'

interface UseSmartOrderSocketOptions {
  parentOrderId?: string
  orders?: any[] // Array of order objects to check status
  connect?: boolean // Flag from API indicating if connection is needed
  onOrderUpdate?: (data: any) => void
  onOrderStatusChange?: (data: any) => void
  enabled?: boolean
}

export function useSmartOrderSocket({
  parentOrderId,
  orders = [],
  connect,
  onOrderUpdate,
  onOrderStatusChange,
  enabled = true
}: UseSmartOrderSocketOptions) {
  const { user, token } = useAuth()
  const socketRef = useRef<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const parentOrderIdRef = useRef<string | undefined>(parentOrderId)
  const lastConnectStateRef = useRef<boolean>(false)
  const stabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update refs when props change
  useEffect(() => {
    parentOrderIdRef.current = parentOrderId
  }, [parentOrderId])

  // Determine if socket connection is needed
  const shouldConnect = useCallback(() => {
    if (!enabled || !user || !token) {
      console.log('[useSmartOrderSocket] Should not connect:', { enabled, hasUser: !!user, hasToken: !!token })
      return false
    }

    // Prioritize the connect flag from the API if available
    if (connect !== undefined) {
      console.log('[useSmartOrderSocket] Using API connect flag:', connect)
      return connect
    }

    // If we have orders data, check if any need real-time updates
    if (orders && orders.length > 0) {
      const needsConnection = orders.some(order => {
        const status = order.status || order.overallStatus
        return status !== 'completed'
      })
      console.log('[useSmartOrderSocket] Connection needed based on order statuses:', needsConnection, 'orders:', orders.map(o => ({id: o.parentOrderId || o.id, status: o.status || o.overallStatus})))
      return needsConnection
    }

    // If we have parentOrderId but no orders data yet, assume we need connection
    if (parentOrderId) {
      console.log('[useSmartOrderSocket] No orders data yet, but have parentOrderId - assuming connection needed')
      return true
    }

    // No parentOrderId and no orders - don't connect
    console.log('[useSmartOrderSocket] No parentOrderId and no orders - no connection needed')
    return false
  }, [enabled, user, token, parentOrderId, orders, connect])

  // Check if orders need real-time updates
  const hasActiveOrders = useCallback((orderList: any[]) => {
    if (!orderList || orderList.length === 0) return false
    
    const activeCount = orderList.filter(order => {
      const status = order.status || order.overallStatus
      return status !== 'completed'
    }).length

    return activeCount > 0
  }, [])

  const handleOrderUpdate = useCallback((data: any) => {
    console.log('[useSmartOrderSocket] Received order update:', data)
    if (onOrderUpdate) {
      onOrderUpdate(data)
    }
  }, [onOrderUpdate])

  const handleOrderStatusChange = useCallback((data: any) => {
    console.log('[useSmartOrderSocket] Received order status change:', data)
    if (onOrderStatusChange) {
      onOrderStatusChange(data)
    }
  }, [onOrderStatusChange])

  const connectSocket = useCallback(() => {
    if (!user || !token) {
      console.log('[useSmartOrderSocket] Cannot connect - missing user or token:', { 
        hasUser: !!user, 
        hasToken: !!token,
        userId: user?.id,
        userRole: user?.role 
      })
      return
    }

    if (connectionState !== 'disconnected') {
      console.log('[useSmartOrderSocket] Already connecting or connected:', connectionState)
      return
    }

    console.log('[useSmartOrderSocket] Connecting socket for active orders...', {
      userId: user.id,
      userRole: user.role,
      parentOrderId,
      connectionState,
      tokenLength: token.length
    })
    setConnectionState('connecting')
    
    // Connect to socket
    const socket = socketManager.connect(token)
    socketRef.current = socket

    if (!socket) {
      console.error('[useSmartOrderSocket] Failed to connect to socket')
      setConnectionState('disconnected')
      return
    }

    // Join customer orders room for general order updates
    if (user.id) {
      console.log('[useSmartOrderSocket] Joining customer orders room for user:', user.id)
      socketManager.joinCustomerOrdersRoom(user.id)
    }

    // Join specific order room if parentOrderId is provided (for order details page)
    if (parentOrderId) {
      console.log('[useSmartOrderSocket] Joining customer order room for parent order:', parentOrderId)
      socketManager.joinCustomerOrderRoom(parentOrderId)
    } else {
      console.log('[useSmartOrderSocket] No parentOrderId - only joining general customer orders room for real-time updates')
    }

    // Set up event listeners
    socketManager.onCustomerOrderUpdate(handleOrderUpdate)
    socketManager.onCustomerOrderStatusChange(handleOrderStatusChange)

    // Add connection event listeners
    if (socket) {
      socket.on('connect', () => {
        console.log('[useSmartOrderSocket] Socket connected successfully')
        setIsConnected(true)
        setConnectionState('connected')
        // Re-join rooms when reconnected
        if (user.id) {
          socketManager.joinCustomerOrdersRoom(user.id)
        }
        if (parentOrderId) {
          socketManager.joinCustomerOrderRoom(parentOrderId)
        }
      })
      
      socket.on('disconnect', () => {
        console.log('[useSmartOrderSocket] Socket disconnected')
        setIsConnected(false)
        setConnectionState('disconnected')
      })
      
      socket.on('connect_error', (error: any) => {
        console.error('[useSmartOrderSocket] Socket connection error:', error)
        setIsConnected(false)
        setConnectionState('disconnected')
      })
    }
  }, [user, token, parentOrderId, handleOrderUpdate, handleOrderStatusChange, connectionState])

  const disconnectSocket = useCallback(() => {
    if (connectionState === 'disconnected') {
      console.log('[useSmartOrderSocket] Already disconnected, skipping')
      return
    }

    console.log('[useSmartOrderSocket] Disconnecting socket - no active orders', {
      connectionState,
      userId: user?.id,
      parentOrderId: parentOrderIdRef.current
    })
    
    // Clear any pending timeouts
    if (stabilityTimeoutRef.current) {
      clearTimeout(stabilityTimeoutRef.current)
      stabilityTimeoutRef.current = null
    }

    // Leave rooms
    if (user?.id) {
      console.log('[useSmartOrderSocket] Leaving customer orders room for user:', user.id)
      socketManager.leaveCustomerOrdersRoom(user.id)
    }
    
    if (parentOrderIdRef.current) {
      console.log('[useSmartOrderSocket] Leaving customer order room for parent order:', parentOrderIdRef.current)
      socketManager.leaveCustomerOrderRoom(parentOrderIdRef.current)
    }

    // Remove event listeners
    socketManager.offCustomerOrderUpdate(handleOrderUpdate)
    socketManager.offCustomerOrderStatusChange(handleOrderStatusChange)

    // Disconnect socket
    console.log('[useSmartOrderSocket] Calling socketManager.disconnect()')
    socketManager.disconnect()
    socketRef.current = null
    setIsConnected(false)
    setConnectionState('disconnected')
    console.log('[useSmartOrderSocket] Disconnection complete')
  }, [user, handleOrderUpdate, handleOrderStatusChange, connectionState])

  // Simplified main effect: Only connect/disconnect when the connection need actually changes
  useEffect(() => {
    const connectNeeded = shouldConnect()
    
    console.log('[useSmartOrderSocket] Connection evaluation:', { 
      connectNeeded,
      connectionState,
      lastConnectState: lastConnectStateRef.current,
      enabled, 
      user: user?.id,
      token: !!token,
      parentOrderId
    })

    // Only act if the connection need has actually changed
    if (connectNeeded !== lastConnectStateRef.current) {
      lastConnectStateRef.current = connectNeeded
      
      if (connectNeeded && connectionState === 'disconnected') {
        console.log('[useSmartOrderSocket] Starting connection...')
        connectSocket()
      } else if (!connectNeeded && connectionState !== 'disconnected') {
        console.log('[useSmartOrderSocket] Stopping connection...')
        disconnectSocket()
      }
    }

    return () => {
      if (stabilityTimeoutRef.current) {
        clearTimeout(stabilityTimeoutRef.current)
      }
    }
  }, [shouldConnect, connectionState, connectSocket, disconnectSocket])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[useSmartOrderSocket] Component unmounting - cleaning up')
      if (stabilityTimeoutRef.current) {
        clearTimeout(stabilityTimeoutRef.current)
      }
      disconnectSocket()
    }
  }, [disconnectSocket])

  const joinOrderRoom = useCallback((orderId: string) => {
    if (socketRef.current && user) {
      socketManager.joinCustomerOrderRoom(orderId)
      parentOrderIdRef.current = orderId
    }
  }, [user])

  const leaveOrderRoom = useCallback((orderId: string) => {
    if (socketRef.current) {
      socketManager.leaveCustomerOrderRoom(orderId)
      if (parentOrderIdRef.current === orderId) {
        parentOrderIdRef.current = undefined
      }
    }
  }, [])

  return {
    joinOrderRoom,
    leaveOrderRoom,
    isConnected,
    hasActiveOrders: hasActiveOrders(orders),
    disconnect: disconnectSocket,
    connectionState
  }
}
