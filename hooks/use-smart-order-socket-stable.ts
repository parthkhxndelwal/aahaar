import { useEffect, useCallback, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import socketManager from '@/lib/socket'

interface UseSmartOrderSocketOptions {
  parentOrderId?: string
  orders?: any[] // Array of order objects to check status
  onOrderUpdate?: (data: any) => void
  onOrderStatusChange?: (data: any) => void
  enabled?: boolean
}

export function useSmartOrderSocket({
  parentOrderId,
  orders = [],
  onOrderUpdate,
  onOrderStatusChange,
  enabled = true
}: UseSmartOrderSocketOptions) {
  const { user, token } = useAuth()
  const socketRef = useRef<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const parentOrderIdRef = useRef<string | undefined>(parentOrderId)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastOrderStatusRef = useRef<string>('')
  const isInitializedRef = useRef(false)

  // Update refs when props change
  useEffect(() => {
    parentOrderIdRef.current = parentOrderId
  }, [parentOrderId])

  // Check if orders need real-time updates
  const hasActiveOrders = useCallback((orderList: any[]) => {
    if (!orderList || orderList.length === 0) return false
    
    // Check if any order is NOT completed (any other status needs real-time updates)
    const activeCount = orderList.filter(order => {
      const status = order.status || order.overallStatus
      return status !== 'completed'
    }).length

    return activeCount > 0
  }, [])

  // Create a stable string representation of order statuses for comparison
  const getOrderStatusString = useCallback((orderList: any[]) => {
    return orderList.map(order => {
      const status = order.status || order.overallStatus
      return `${order.id || order.parentOrderId}:${status}`
    }).sort().join('|')
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
      return
    }

    if (connectionState !== 'disconnected') {
      return
    }

    console.log('[useSmartOrderSocket] Connecting socket for active orders...')
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
      socketManager.joinCustomerOrdersRoom(user.id)
    }

    // Join specific order room if parentOrderId is provided
    if (parentOrderId) {
      socketManager.joinCustomerOrderRoom(parentOrderId)
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
    if (connectionState === 'disconnected') return

    console.log('[useSmartOrderSocket] Disconnecting socket - no active orders')
    
    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Leave rooms
    if (user?.id) {
      socketManager.leaveCustomerOrdersRoom(user.id)
    }
    
    if (parentOrderIdRef.current) {
      socketManager.leaveCustomerOrderRoom(parentOrderIdRef.current)
    }

    // Remove event listeners
    socketManager.offCustomerOrderUpdate(handleOrderUpdate)
    socketManager.offCustomerOrderStatusChange(handleOrderStatusChange)

    // Disconnect socket
    socketManager.disconnect()
    socketRef.current = null
    setIsConnected(false)
    setConnectionState('disconnected')
  }, [user, handleOrderUpdate, handleOrderStatusChange, connectionState])

  // Main effect: Connect/disconnect based on order status with debouncing and stability
  useEffect(() => {
    if (!enabled) {
      disconnectSocket()
      return
    }

    // Create a stable string representation of order statuses
    const currentOrderStatus = getOrderStatusString(orders)
    const needsSocket = hasActiveOrders(orders)
    
    // Only proceed if this is the first run or order status has actually changed
    if (!isInitializedRef.current) {
      isInitializedRef.current = true
      lastOrderStatusRef.current = currentOrderStatus
      
      // Initial connection if needed
      if (needsSocket && connectionState === 'disconnected') {
        console.log('[useSmartOrderSocket] Initial connection for active orders')
        connectSocket()
      }
      return
    }

    // Check if order status actually changed
    if (currentOrderStatus === lastOrderStatusRef.current) {
      return // No change, skip processing
    }

    // Clear any pending timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    console.log('[useSmartOrderSocket] Order status changed:', {
      needsSocket,
      connectionState,
      ordersCount: orders.length,
      previousStatus: lastOrderStatusRef.current,
      currentStatus: currentOrderStatus
    })

    lastOrderStatusRef.current = currentOrderStatus

    if (needsSocket && connectionState === 'disconnected') {
      // Need socket but not connected - connect after a delay to prevent rapid reconnections
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[useSmartOrderSocket] Connecting for active orders after delay')
        connectSocket()
      }, 1500)
    } else if (!needsSocket && connectionState === 'connected') {
      // Don't need socket but connected - disconnect after a longer delay to avoid immediate reconnections
      console.log('[useSmartOrderSocket] All orders completed - scheduling disconnect')
      reconnectTimeoutRef.current = setTimeout(() => {
        disconnectSocket()
      }, 3000)
    }
  }, [enabled, orders, connectSocket, disconnectSocket, hasActiveOrders, getOrderStatusString, connectionState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[useSmartOrderSocket] Component unmounting - cleaning up')
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
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
