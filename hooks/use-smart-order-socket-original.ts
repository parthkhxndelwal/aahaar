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
  const parentOrderIdRef = useRef<string | undefined>(parentOrderId)

  // Update refs when props change
  useEffect(() => {
    parentOrderIdRef.current = parentOrderId
  }, [parentOrderId])

  // Check if orders need real-time updates
  const hasActiveOrders = useCallback((orderList: any[]) => {
    if (!orderList || orderList.length === 0) return false
    
    // Check if any order is in an active status (not completed/rejected/cancelled)
    return orderList.some(order => {
      const status = order.status || order.overallStatus
      return !['completed', 'rejected', 'cancelled'].includes(status)
    })
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
      console.log('[useSmartOrderSocket] Cannot connect - missing user or token')
      return
    }

    if (socketRef.current?.connected) {
      console.log('[useSmartOrderSocket] Socket already connected')
      return
    }

    console.log('[useSmartOrderSocket] Connecting socket for active orders...', { 
      userId: user.id, 
      userRole: user.role,
      parentOrderId,
      hasActiveOrders: hasActiveOrders(orders)
    })
    
    // Connect to socket
    const socket = socketManager.connect(token)
    socketRef.current = socket

    if (!socket) {
      console.error('[useSmartOrderSocket] Failed to connect to socket')
      return
    }

    // Join customer orders room for general order updates
    if (user.id) {
      console.log('[useSmartOrderSocket] Joining customer orders room:', `customer-orders-${user.id}`)
      socketManager.joinCustomerOrdersRoom(user.id)
    }

    // Join specific order room if parentOrderId is provided
    if (parentOrderId) {
      console.log('[useSmartOrderSocket] Joining customer order room:', `customer-order-${parentOrderId}`)
      socketManager.joinCustomerOrderRoom(parentOrderId)
    }

    // Set up event listeners
    console.log('[useSmartOrderSocket] Setting up event listeners')
    socketManager.onCustomerOrderUpdate(handleOrderUpdate)
    socketManager.onCustomerOrderStatusChange(handleOrderStatusChange)

    // Add connection event listeners
    if (socket) {
      socket.on('connect', () => {
        console.log('[useSmartOrderSocket] Socket connected successfully')
        setIsConnected(true)
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
      })
      
      socket.on('connect_error', (error: any) => {
        console.error('[useSmartOrderSocket] Socket connection error:', error)
        setIsConnected(false)
      })
    }
  }, [user, token, parentOrderId, handleOrderUpdate, handleOrderStatusChange, orders, hasActiveOrders])

  const disconnectSocket = useCallback(() => {
    if (!socketRef.current) return

    console.log('[useSmartOrderSocket] Disconnecting socket - no active orders')
    
    // Leave rooms
    if (user?.id) {
      console.log('[useSmartOrderSocket] Leaving customer orders room:', `customer-orders-${user.id}`)
      socketManager.leaveCustomerOrdersRoom(user.id)
    }
    
    if (parentOrderIdRef.current) {
      console.log('[useSmartOrderSocket] Leaving customer order room:', `customer-order-${parentOrderIdRef.current}`)
      socketManager.leaveCustomerOrderRoom(parentOrderIdRef.current)
    }

    // Remove event listeners
    socketManager.offCustomerOrderUpdate(handleOrderUpdate)
    socketManager.offCustomerOrderStatusChange(handleOrderStatusChange)

    // Disconnect socket
    socketManager.disconnect()
    socketRef.current = null
    setIsConnected(false)
  }, [user, handleOrderUpdate, handleOrderStatusChange])

  // Main effect: Connect/disconnect based on order status
  useEffect(() => {
    if (!enabled) {
      console.log('[useSmartOrderSocket] Socket disabled')
      disconnectSocket()
      return
    }

    const needsSocket = hasActiveOrders(orders)
    const isCurrentlyConnected = socketRef.current?.connected

    console.log('[useSmartOrderSocket] Evaluating socket connection need:', {
      needsSocket,
      isCurrentlyConnected,
      ordersCount: orders.length,
      orderStatuses: orders.map(o => o.status || o.overallStatus)
    })

    if (needsSocket && !isCurrentlyConnected) {
      // Need socket but not connected - connect
      connectSocket()
    } else if (!needsSocket && isCurrentlyConnected) {
      // Don't need socket but connected - disconnect
      console.log('[useSmartOrderSocket] All orders completed - disconnecting socket to save resources')
      disconnectSocket()
    }
  }, [enabled, orders, connectSocket, disconnectSocket, hasActiveOrders])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[useSmartOrderSocket] Component unmounting - cleaning up socket')
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
    disconnect: disconnectSocket
  }
}
