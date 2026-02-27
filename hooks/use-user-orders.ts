import { useEffect, useState, useCallback } from 'react'
import { useSocket } from './use-socket'

interface OrderItem {
  name: string
  quantity: number
  price: number
  subtotal: number
  imageUrl?: string
}

interface VendorOrder {
  id: string
  orderNumber: string
  vendorName: string
  vendorId: string
  items: OrderItem[]
  totalAmount: number
  status: string
  estimatedPreparationTime: number
  queuePosition?: number
  orderOtp: string
  createdAt: string
  acceptedAt?: string
  rejectedAt?: string
  rejectionReason?: string
}

interface OrderSummary {
  parentOrderId: string
  totalAmount: number
  vendorsCount: number
  overallStatus: string
  createdAt: string
  vendors: VendorOrder[]
  completedVendors: number
  rejectedVendors: number
  cancelledVendors: number
  orderOtp: string
}

interface OrderUpdate {
  parentOrderId: string
  vendorOrder: VendorOrder
  orderSummary?: OrderSummary
  action: 'status_update' | 'vendor_update' | 'order_complete'
}

export const useUserOrders = (userId: string | null, activeOrderIds: string[] = []) => {
  const { socket, isConnected, error } = useSocket('/app')
  const [orderSummaries, setOrderSummaries] = useState<OrderSummary[]>([])
  const [orderUpdates, setOrderUpdates] = useState<OrderUpdate[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Join user room when connected and userId is available
  useEffect(() => {
    if (socket && isConnected && userId) {
      console.log(`📱 Joining user room: ${userId}`)
      socket.emit('join-user-room', userId)

      // Confirmation handler
      socket.on('joined-user-room', (data) => {
        console.log(`✅ Successfully joined user room:`, data)
      })

      return () => {
        if (socket && userId) {
          console.log(`📱 Leaving user room: ${userId}`)
          socket.emit('leave-user-room', userId)
          socket.off('joined-user-room')
        }
      }
    }
  }, [socket, isConnected, userId])

  // Join specific order rooms for active orders
  useEffect(() => {
    if (socket && isConnected && activeOrderIds.length > 0) {
      activeOrderIds.forEach(orderId => {
        console.log(`📱 Joining order room: ${orderId}`)
        socket.emit('join-order-room', orderId)
      })

      // Confirmation handler
      socket.on('joined-order-room', (data) => {
        console.log(`✅ Successfully joined order room:`, data)
      })

      return () => {
        if (socket) {
          activeOrderIds.forEach(orderId => {
            console.log(`📱 Leaving order room: ${orderId}`)
            socket.emit('leave-order-room', orderId)
          })
          socket.off('joined-order-room')
        }
      }
    }
  }, [socket, isConnected, activeOrderIds])

  // Handle real-time order updates
  useEffect(() => {
    if (!socket || !isConnected) return

    console.log('🎧 Setting up user order event listeners')

    // Order status updated for specific vendor
    socket.on('order-status-updated', (data: OrderUpdate) => {
      console.log('🔄 Order status updated:', data)
      
      // Update the specific vendor order in order summaries
      setOrderSummaries(prev => prev.map(summary => {
        if (summary.parentOrderId === data.parentOrderId) {
          const updatedVendors = summary.vendors.map(vendor => 
            vendor.id === data.vendorOrder.id ? data.vendorOrder : vendor
          )
          
          // Recalculate overall status
          const completedCount = updatedVendors.filter(v => v.status === 'completed').length
          const rejectedCount = updatedVendors.filter(v => v.status === 'rejected').length
          const readyCount = updatedVendors.filter(v => v.status === 'ready').length
          const totalVendors = updatedVendors.length
          
          let overallStatus = 'pending'
          if (completedCount === totalVendors) {
            overallStatus = 'completed'
          } else if (rejectedCount === totalVendors) {
            overallStatus = 'rejected'
          } else if (readyCount + completedCount === totalVendors) {
            overallStatus = 'ready'
          } else if (readyCount > 0 || completedCount > 0) {
            overallStatus = 'partial'
          }
          
          return {
            ...summary,
            vendors: updatedVendors,
            overallStatus,
            completedVendors: completedCount,
            rejectedVendors: rejectedCount
          }
        }
        return summary
      }))
      
      setOrderUpdates(prev => [...prev, data])
      setLastUpdate(new Date())
    })

    // New order created
    socket.on('new-order-created', (data: { orderSummary: OrderSummary }) => {
      console.log('📥 New order created:', data)
      setOrderSummaries(prev => [data.orderSummary, ...prev])
      setLastUpdate(new Date())
    })

    // Order completed
    socket.on('order-completed', (data: OrderUpdate) => {
      console.log('✅ Order completed:', data)
      
      if (data.orderSummary) {
        setOrderSummaries(prev => prev.map(summary => 
          summary.parentOrderId === data.parentOrderId 
            ? data.orderSummary! 
            : summary
        ))
      }
      
      setOrderUpdates(prev => [...prev, data])
      setLastUpdate(new Date())
    })

    // Vendor order rejected
    socket.on('vendor-order-rejected', (data: OrderUpdate & { reason: string }) => {
      console.log('❌ Vendor order rejected:', data)
      
      setOrderSummaries(prev => prev.map(summary => {
        if (summary.parentOrderId === data.parentOrderId) {
          const updatedVendors = summary.vendors.map(vendor => 
            vendor.id === data.vendorOrder.id 
              ? { ...data.vendorOrder, rejectionReason: data.reason }
              : vendor
          )
          
          const rejectedCount = updatedVendors.filter(v => v.status === 'rejected').length
          
          return {
            ...summary,
            vendors: updatedVendors,
            rejectedVendors: rejectedCount
          }
        }
        return summary
      }))
      
      setOrderUpdates(prev => [...prev, data])
      setLastUpdate(new Date())
    })

    // Test message handler for debugging
    socket.on('test-message', (data) => {
      console.log('🧪 Test message received:', data)
    })

    return () => {
      console.log('🔌 Cleaning up user order event listeners')
      socket.off('order-status-updated')
      socket.off('new-order-created')
      socket.off('order-completed')
      socket.off('vendor-order-rejected')
      socket.off('test-message')
    }
  }, [socket, isConnected])

  // Update order summaries manually (fallback)
  const updateOrderSummaries = useCallback((newSummaries: OrderSummary[]) => {
    setOrderSummaries(newSummaries)
  }, [])

  // Get active order IDs (orders that are not completed or rejected)
  const getActiveOrderIds = useCallback(() => {
    return orderSummaries
      .filter(summary => !['completed', 'rejected'].includes(summary.overallStatus))
      .map(summary => summary.parentOrderId)
  }, [orderSummaries])

  // Clear old order updates
  const clearOrderUpdates = useCallback(() => {
    setOrderUpdates([])
  }, [])

  // Cancel order function
  const cancelOrder = useCallback(async (courtId: string, orderId: string, reason: string, token: string) => {
    try {
      const response = await fetch(`/api/app/${courtId}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      })

      const data = await response.json()
      
      if (data.success) {
        // Update local state to reflect cancellation immediately
        setOrderSummaries(prevSummaries => 
          prevSummaries.map(summary => ({
            ...summary,
            vendors: summary.vendors.map(vendor => 
              vendor.id === orderId ? { ...vendor, status: 'cancelled' } : vendor
            )
          }))
        )
        
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      return { success: false, message: 'Failed to cancel order' }
    }
  }, [])

  return {
    orderSummaries,
    orderUpdates,
    lastUpdate,
    updateOrderSummaries,
    getActiveOrderIds,
    clearOrderUpdates,
    cancelOrder,
    isConnected,
    connectionError: error,
    socket
  }
}
