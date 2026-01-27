import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import socketManager from '@/lib/socket'

export interface UseVendorSocketProps {
  vendorId: string | null
  onNewOrder?: (order: any) => void
  onOrderUpdate?: (order: any) => void
  onQueueUpdate?: (queue: any) => void
  onOrderStatusChange?: (data: any) => void
}

export const useVendorSocket = ({
  vendorId,
  onNewOrder,
  onOrderUpdate,
  onQueueUpdate,
  onOrderStatusChange
}: UseVendorSocketProps) => {
  const { token, user } = useAuth()
  const socketRef = useRef(socketManager)
  const isConnectedRef = useRef(false)

  // Memoize callbacks to prevent unnecessary re-renders
  const handleNewOrder = useCallback((data: any) => {
    console.log('Received new order:', data)
    onNewOrder?.(data.order)
  }, [onNewOrder])

  const handleOrderUpdate = useCallback((data: any) => {
    console.log('Received order update:', data)
    onOrderUpdate?.(data.order)
  }, [onOrderUpdate])

  const handleQueueUpdate = useCallback((data: any) => {
    console.log('Received queue update:', data)
    onQueueUpdate?.(data.queue)
  }, [onQueueUpdate])

  const handleOrderStatusChange = useCallback((data: any) => {
    console.log('Received order status change:', data)
    onOrderStatusChange?.(data)
  }, [onOrderStatusChange])

  // Initialize socket connection
  useEffect(() => {
    if (!token || !user || user.role !== 'vendor') {
      console.log('[VendorSocket] Socket initialization skipped:', { 
        hasToken: !!token, 
        hasUser: !!user, 
        userRole: user?.role 
      })
      return
    }

    console.log('[VendorSocket] Initializing socket connection for vendor...', {
      userId: user.id,
      userRole: user.role
    })
    const socket = socketRef.current.connect(token)
    
    if (socket && !isConnectedRef.current) {
      isConnectedRef.current = true
      
      console.log('[VendorSocket] Setting up event listeners')
      // Set up event listeners
      socketRef.current.onNewOrder(handleNewOrder)
      socketRef.current.onOrderUpdate(handleOrderUpdate)
      socketRef.current.onQueueUpdate(handleQueueUpdate)
      
      // Listen for order status changes
      const socket_instance = socketRef.current.getSocket()
      if (socket_instance) {
        socket_instance.on('order-status-change', handleOrderStatusChange)
        
        // Add connection event debugging
        socket_instance.on('connect', () => {
          console.log('[VendorSocket] Socket connected successfully')
        })
        
        socket_instance.on('disconnect', () => {
          console.log('[VendorSocket] Socket disconnected')
        })
        
        socket_instance.on('connect_error', (error: any) => {
          console.error('[VendorSocket] Socket connection error:', error)
        })
      }
    } else {
      console.warn('[VendorSocket] Socket already connected or failed to connect')
    }

    return () => {
      console.log('[VendorSocket] Cleaning up socket listeners...')
      socketRef.current.offNewOrder(handleNewOrder)
      socketRef.current.offOrderUpdate(handleOrderUpdate)
      socketRef.current.offQueueUpdate(handleQueueUpdate)
      
      const socket_instance = socketRef.current.getSocket()
      if (socket_instance) {
        socket_instance.off('order-status-change', handleOrderStatusChange)
      }
    }
  }, [token, user, handleNewOrder, handleOrderUpdate, handleQueueUpdate, handleOrderStatusChange])

  // Join/leave vendor queue room
  useEffect(() => {
    if (!vendorId) {
      console.log('[VendorSocket] No vendorId provided, skipping queue room join')
      return
    }

    const socket_instance = socketRef.current.getSocket()
    if (!socket_instance) {
      console.log('[VendorSocket] No socket instance, skipping queue room join')
      return
    }

    const handleConnect = () => {
      console.log(`[VendorSocket] Socket connected, joining vendor queue room: vendor-queue-${vendorId}`)
      socketRef.current.joinVendorQueue(vendorId)
    }

    // Listen for connection
    socket_instance.on('connect', handleConnect)

    // If already connected, join immediately
    if (socket_instance.connected) {
      console.log(`[VendorSocket] Socket already connected, joining vendor queue room: vendor-queue-${vendorId}`)
      socketRef.current.joinVendorQueue(vendorId)
    }

    return () => {
      console.log(`[VendorSocket] Leaving vendor queue room: vendor-queue-${vendorId}`)
      socket_instance.off('connect', handleConnect)
      if (socket_instance.connected) {
        socketRef.current.leaveVendorQueue(vendorId)
      }
    }
  }, [vendorId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnectedRef.current) {
        console.log('Disconnecting socket on component unmount')
        socketRef.current.disconnect()
        isConnectedRef.current = false
      }
    }
  }, [])

  return {
    socket: socketRef.current.getSocket(),
    isConnected: isConnectedRef.current && socketRef.current.getSocket()?.connected
  }
}
