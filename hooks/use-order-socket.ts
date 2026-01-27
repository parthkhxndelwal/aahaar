import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import socketManager from '@/lib/socket'

interface UseOrderSocketOptions {
  parentOrderId?: string
  onOrderUpdate?: (data: any) => void
  onOrderStatusChange?: (data: any) => void
  enabled?: boolean
}

export function useOrderSocket({
  parentOrderId,
  onOrderUpdate,
  onOrderStatusChange,
  enabled = true
}: UseOrderSocketOptions) {
  const { user, token } = useAuth()
  const socketRef = useRef<any>(null)
  const parentOrderIdRef = useRef<string | undefined>(parentOrderId)

  // Update refs when props change
  useEffect(() => {
    parentOrderIdRef.current = parentOrderId
  }, [parentOrderId])

  const handleOrderUpdate = useCallback((data: any) => {
    console.log('[useOrderSocket] Received order update:', data)
    console.log('[useOrderSocket] Current parentOrderId:', parentOrderIdRef.current)
    if (onOrderUpdate) {
      onOrderUpdate(data)
    }
  }, [onOrderUpdate])

  const handleOrderStatusChange = useCallback((data: any) => {
    console.log('[useOrderSocket] Received order status change:', data)
    console.log('[useOrderSocket] Current parentOrderId:', parentOrderIdRef.current)
    if (onOrderStatusChange) {
      onOrderStatusChange(data)
    }
  }, [onOrderStatusChange])

  useEffect(() => {
    if (!enabled || !user || !token) {
      console.log('[useOrderSocket] Socket disabled:', { enabled, hasUser: !!user, hasToken: !!token })
      return
    }

    console.log('[useOrderSocket] Setting up order socket connection...', { 
      userId: user.id, 
      userRole: user.role,
      parentOrderId 
    })
    
    // Connect to socket
    const socket = socketManager.connect(token)
    socketRef.current = socket

    if (!socket) {
      console.error('[useOrderSocket] Failed to connect to socket')
      return
    }

    // Join customer orders room for general order updates
    if (user.id) {
      console.log('[useOrderSocket] Joining customer orders room:', `customer-orders-${user.id}`)
      socketManager.joinCustomerOrdersRoom(user.id)
    }

    // Join specific order room if parentOrderId is provided
    if (parentOrderId) {
      console.log('[useOrderSocket] Joining customer order room:', `customer-order-${parentOrderId}`)
      socketManager.joinCustomerOrderRoom(parentOrderId)
    }

    // Set up event listeners
    console.log('[useOrderSocket] Setting up event listeners')
    socketManager.onCustomerOrderUpdate(handleOrderUpdate)
    socketManager.onCustomerOrderStatusChange(handleOrderStatusChange)

    // Add connection event listeners for debugging
    if (socket) {
      socket.on('connect', () => {
        console.log('[useOrderSocket] Socket connected successfully')
        // Re-join rooms when reconnected
        if (user.id) {
          console.log('[useOrderSocket] Re-joining customer orders room after connect:', `customer-orders-${user.id}`)
          socketManager.joinCustomerOrdersRoom(user.id)
        }
        if (parentOrderId) {
          console.log('[useOrderSocket] Re-joining customer order room after connect:', `customer-order-${parentOrderId}`)
          socketManager.joinCustomerOrderRoom(parentOrderId)
        }
      })
      
      socket.on('disconnect', () => {
        console.log('[useOrderSocket] Socket disconnected')
      })
      
      socket.on('connect_error', (error: any) => {
        console.error('[useOrderSocket] Socket connection error:', error)
      })
    }

    return () => {
      console.log('[useOrderSocket] Cleaning up order socket connection...')
      
      // Leave rooms
      if (user.id) {
        console.log('[useOrderSocket] Leaving customer orders room:', `customer-orders-${user.id}`)
        socketManager.leaveCustomerOrdersRoom(user.id)
      }
      
      if (parentOrderIdRef.current) {
        console.log('[useOrderSocket] Leaving customer order room:', `customer-order-${parentOrderIdRef.current}`)
        socketManager.leaveCustomerOrderRoom(parentOrderIdRef.current)
      }

      // Remove event listeners
      socketManager.offCustomerOrderUpdate(handleOrderUpdate)
      socketManager.offCustomerOrderStatusChange(handleOrderStatusChange)
    }
  }, [enabled, user, token, parentOrderId, handleOrderUpdate, handleOrderStatusChange])

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
    isConnected: !!socketRef.current?.connected
  }
}
