import { useEffect, useState, useCallback } from 'react'
import { useSocket } from './use-socket'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  subtotal: number
  imageUrl?: string
}

interface VendorOrder {
  id: string
  orderNumber: string
  vendor: {
    id: string
    stallName: string
    vendorName: string
  }
  items: OrderItem[]
  totalAmount: number
  status: string
  estimatedPreparationTime: number
  queuePosition?: number
  createdAt: string
  acceptedAt?: string
  preparingAt?: string
  readyAt?: string
  completedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  refundAmount?: number
  refundStatus?: string
}

interface OrderDetailsData {
  parentOrderId: string
  orderOtp: string
  orders: VendorOrder[]
  totalAmount: number
  summary: {
    totalVendors: number
    completedVendors: number
    pendingVendors: number
    preparingVendors: number
    readyVendors: number
    rejectedVendors: number
    grandTotal: number
  }
}

interface OrderUpdate {
  parentOrderId: string
  vendorOrder: VendorOrder
  action: 'status_update' | 'vendor_update' | 'order_complete'
}

export const useOrderDetails = (userId: string | null, parentOrderId: string | null) => {
  const { socket, isConnected, error } = useSocket('/app')
  const [orderDetails, setOrderDetails] = useState<OrderDetailsData | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [statusUpdates, setStatusUpdates] = useState<OrderUpdate[]>([])

  // Join user and order rooms when connected
  useEffect(() => {
    if (socket && isConnected && userId && parentOrderId) {
      console.log(`📱 [OrderDetails] Joining rooms - User: ${userId}, Order: ${parentOrderId}`)
      
      // Join user room
      socket.emit('join-user-room', userId)
      
      // Join specific order room
      socket.emit('join-order-room', parentOrderId)

      // Confirmation handlers
      socket.on('joined-user-room', (data) => {
        console.log(`✅ [OrderDetails] Successfully joined user room:`, data)
      })

      socket.on('joined-order-room', (data) => {
        console.log(`✅ [OrderDetails] Successfully joined order room:`, data)
      })

      return () => {
        if (socket) {
          console.log(`📱 [OrderDetails] Leaving rooms - User: ${userId}, Order: ${parentOrderId}`)
          socket.emit('leave-user-room', userId)
          socket.emit('leave-order-room', parentOrderId)
          socket.off('joined-user-room')
          socket.off('joined-order-room')
        }
      }
    }
  }, [socket, isConnected, userId, parentOrderId])

  // Handle real-time order updates
  useEffect(() => {
    if (!socket || !isConnected || !orderDetails) return

    console.log('🎧 [OrderDetails] Setting up real-time event listeners')

    // Order status updated for specific vendor
    const handleOrderStatusUpdate = (data: OrderUpdate) => {
      console.log('🔄 [OrderDetails] Order status updated:', data)
      
      // Only process updates for this specific order
      if (data.parentOrderId !== parentOrderId) return
      
      setOrderDetails(prev => {
        if (!prev || prev.parentOrderId !== data.parentOrderId) return prev
        
        // Update the specific vendor order
        const updatedOrders = prev.orders.map(order => 
          order.id === data.vendorOrder.id ? {
            ...order,
            status: data.vendorOrder.status,
            acceptedAt: data.vendorOrder.acceptedAt,
            preparingAt: data.vendorOrder.preparingAt,
            readyAt: data.vendorOrder.readyAt,
            completedAt: data.vendorOrder.completedAt,
            rejectedAt: data.vendorOrder.rejectedAt,
            rejectionReason: data.vendorOrder.rejectionReason,
            queuePosition: data.vendorOrder.queuePosition
          } : order
        )
        
        // Recalculate summary
        const completedVendors = updatedOrders.filter(o => o.status === 'completed').length
        const pendingVendors = updatedOrders.filter(o => o.status === 'pending').length
        const preparingVendors = updatedOrders.filter(o => o.status === 'preparing' || o.status === 'accepted').length
        const readyVendors = updatedOrders.filter(o => o.status === 'ready').length
        const rejectedVendors = updatedOrders.filter(o => o.status === 'rejected').length
        
        return {
          ...prev,
          orders: updatedOrders,
          summary: {
            ...prev.summary,
            completedVendors,
            pendingVendors,
            preparingVendors,
            readyVendors,
            rejectedVendors
          }
        }
      })
      
      setStatusUpdates(prev => [...prev, data])
      setLastUpdate(new Date())
    }

    // Vendor order rejected with reason
    const handleVendorOrderRejected = (data: OrderUpdate & { reason: string }) => {
      console.log('❌ [OrderDetails] Vendor order rejected:', data)
      
      if (data.parentOrderId !== parentOrderId) return
      
      setOrderDetails(prev => {
        if (!prev || prev.parentOrderId !== data.parentOrderId) return prev
        
        const updatedOrders = prev.orders.map(order => 
          order.id === data.vendorOrder.id ? {
            ...order,
            status: 'rejected',
            rejectedAt: data.vendorOrder.rejectedAt,
            rejectionReason: data.reason,
            refundAmount: data.vendorOrder.refundAmount,
            refundStatus: data.vendorOrder.refundStatus
          } : order
        )
        
        const rejectedVendors = updatedOrders.filter(o => o.status === 'rejected').length
        
        return {
          ...prev,
          orders: updatedOrders,
          summary: {
            ...prev.summary,
            rejectedVendors
          }
        }
      })
      
      setStatusUpdates(prev => [...prev, data])
      setLastUpdate(new Date())
    }

    // Order completed
    const handleOrderCompleted = (data: OrderUpdate) => {
      console.log('✅ [OrderDetails] Order completed:', data)
      
      if (data.parentOrderId !== parentOrderId) return
      
      // Handle full order completion
      setStatusUpdates(prev => [...prev, data])
      setLastUpdate(new Date())
    }

    // Test message for debugging
    const handleTestMessage = (data: any) => {
      console.log('🧪 [OrderDetails] Test message received:', data)
    }

    // Register event listeners
    socket.on('order-status-updated', handleOrderStatusUpdate)
    socket.on('vendor-order-rejected', handleVendorOrderRejected)
    socket.on('order-completed', handleOrderCompleted)
    socket.on('test-message', handleTestMessage)

    return () => {
      console.log('🔌 [OrderDetails] Cleaning up event listeners')
      socket.off('order-status-updated', handleOrderStatusUpdate)
      socket.off('vendor-order-rejected', handleVendorOrderRejected)
      socket.off('order-completed', handleOrderCompleted)
      socket.off('test-message', handleTestMessage)
    }
  }, [socket, isConnected, orderDetails, parentOrderId])

  // Update order details manually (for initial fetch)
  const updateOrderDetails = useCallback((newOrderDetails: OrderDetailsData) => {
    setOrderDetails(newOrderDetails)
    setLastUpdate(new Date())
  }, [])

  // Clear status updates
  const clearStatusUpdates = useCallback(() => {
    setStatusUpdates([])
  }, [])

  return {
    orderDetails,
    lastUpdate,
    statusUpdates,
    updateOrderDetails,
    clearStatusUpdates,
    isConnected,
    connectionError: error,
    socket
  }
}
