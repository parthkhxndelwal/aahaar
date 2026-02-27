import { useEffect, useState, useCallback } from 'react'
import { useSocket } from './use-socket'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
    imageUrl?: string
  }>
  totalAmount: number
  status: string
  estimatedPreparationTime: number
  queuePosition?: number
  orderOtp: string
  createdAt: string
  acceptedAt?: string
}

interface VendorQueueUpdate {
  section: 'upcoming' | 'queue' | 'ready'
  order: Order
  action: 'new_order' | 'status_update' | 'queue_update' | 'order_removed'
  sectionCounts: {
    upcoming: number
    queue: number
    ready: number
  }
}

export const useVendorOrders = (vendorId: string | null) => {
  const { socket, isConnected, error } = useSocket('/vendor')
  const [orders, setOrders] = useState<{
    upcoming: Order[]
    queue: Order[]
    ready: Order[]
  }>({
    upcoming: [],
    queue: [],
    ready: []
  })
  const [sectionCounts, setSectionCounts] = useState({
    upcoming: 0,
    queue: 0,
    ready: 0
  })
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Join vendor room when connected and vendorId is available
  useEffect(() => {
    if (socket && isConnected && vendorId) {
      console.log(`🏪 Joining vendor room: ${vendorId}`)
      socket.emit('join-vendor-room', vendorId)

      // Confirmation handler
      socket.on('joined-vendor-room', (data) => {
        console.log(`✅ Successfully joined vendor room:`, data)
      })

      return () => {
        if (socket && vendorId) {
          console.log(`🏪 Leaving vendor room: ${vendorId}`)
          socket.emit('leave-vendor-room', vendorId)
          socket.off('joined-vendor-room')
        }
      }
    }
  }, [socket, isConnected, vendorId])

  // Handle real-time order updates
  useEffect(() => {
    if (!socket || !isConnected) return

    console.log('🎧 Setting up vendor order event listeners')

    // New order received
    socket.on('new-order', (data: VendorQueueUpdate) => {
      console.log('📥 New order received:', data)
      setOrders(prev => ({
        ...prev,
        [data.section]: [...prev[data.section], data.order]
      }))
      setSectionCounts(data.sectionCounts)
      setLastUpdate(new Date())
    })

    // Order status updated
    socket.on('order-status-updated', (data: VendorQueueUpdate) => {
      console.log('🔄 Order status updated:', data)
      
      // Remove order from all sections first
      setOrders(prev => {
        const newOrders = {
          upcoming: prev.upcoming.filter(o => o.id !== data.order.id),
          queue: prev.queue.filter(o => o.id !== data.order.id),
          ready: prev.ready.filter(o => o.id !== data.order.id)
        }
        
        // Add to appropriate section based on new status
        if (data.section) {
          newOrders[data.section] = [...newOrders[data.section], data.order]
        }
        
        return newOrders
      })
      
      setSectionCounts(data.sectionCounts)
      setLastUpdate(new Date())
    })

    // Order removed (completed, cancelled, etc.)
    socket.on('order-removed', (data: { orderId: string, sectionCounts: any }) => {
      console.log('🗑️ Order removed:', data)
      setOrders(prev => ({
        upcoming: prev.upcoming.filter(o => o.id !== data.orderId),
        queue: prev.queue.filter(o => o.id !== data.orderId),
        ready: prev.ready.filter(o => o.id !== data.orderId)
      }))
      setSectionCounts(data.sectionCounts)
      setLastUpdate(new Date())
    })

    // Queue position updated
    socket.on('queue-updated', (data: { orders: Order[], section: string, sectionCounts: any }) => {
      console.log('📊 Queue updated:', data)
      setOrders(prev => ({
        ...prev,
        [data.section]: data.orders
      }))
      setSectionCounts(data.sectionCounts)
      setLastUpdate(new Date())
    })

    // Test message handler for debugging
    socket.on('test-message', (data) => {
      console.log('🧪 Test message received:', data)
    })

    return () => {
      console.log('🔌 Cleaning up vendor order event listeners')
      socket.off('new-order')
      socket.off('order-status-updated')
      socket.off('order-removed')
      socket.off('queue-updated')
      socket.off('test-message')
    }
  }, [socket, isConnected])

  // Update order counts for a specific section
  const updateOrdersForSection = useCallback((section: 'upcoming' | 'queue' | 'ready', newOrders: Order[]) => {
    setOrders(prev => ({
      ...prev,
      [section]: newOrders
    }))
  }, [])

  // Get orders for a specific section
  const getOrdersForSection = useCallback((section: 'upcoming' | 'queue' | 'ready') => {
    return orders[section]
  }, [orders])

  return {
    orders,
    sectionCounts,
    lastUpdate,
    updateOrdersForSection,
    getOrdersForSection,
    isConnected,
    connectionError: error,
    socket
  }
}
