import { useEffect, useState, useCallback } from 'react'
import { orderApi, apiClient } from '@/lib/api'

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

export const useUserOrders = (userId: string | null, courtId: string | null, activeOrderIds: string[] = []) => {
  const [orderSummaries, setOrderSummaries] = useState<OrderSummary[]>([])
  const [orderUpdates, setOrderUpdates] = useState<OrderUpdate[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('🔍 [useUserOrders] Hook initialized with userId:', userId)

  // Set up token getter for API client
  useEffect(() => {
    apiClient.setTokenGetter(() => localStorage.getItem('app_auth_token'))
  }, [])

  // Fetch user orders from API
  const fetchUserOrders = useCallback(async () => {
    if (!userId || !courtId) {
      console.log('⚠️ [useUserOrders] No userId or courtId provided, skipping fetch')
      return
    }

    try {
      setError(null)
      setIsLoading(true)

      console.log('👤 [useUserOrders] Fetching orders for userId:', userId)

      const data = await orderApi.getOrderStatusList(courtId, { activeOnly: true })
      console.log('✅ [useUserOrders] Response data:', data)

      setOrderSummaries((data as any).orderSummaries || [])
      setLastUpdate(new Date())
      console.log('✅ [useUserOrders] Successfully updated order summaries:', (data as any).orderSummaries?.length || 0, 'orders')
    } catch (err: any) {
      let errorMessage = 'Failed to fetch user orders'
      
      if (err.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.'
      } else if (err.status === 403) {
        errorMessage = 'Access denied. You may not have permission to view these orders.'
      } else if (err.status === 404) {
        errorMessage = 'User not found or no orders available.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      console.error('❌ [useUserOrders] Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId, courtId])

  // Set up polling every 5 seconds
  useEffect(() => {
    if (!userId) return

    // Initial fetch
    fetchUserOrders()

    // Set up polling interval
    const interval = setInterval(fetchUserOrders, 5000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [userId, fetchUserOrders])

  // Update orders manually (for initial fetch or external updates)
  const updateOrderSummaries = useCallback((newOrderSummaries: OrderSummary[]) => {
    setOrderSummaries(newOrderSummaries)
    setLastUpdate(new Date())
  }, [])

  // Add order update
  const addOrderUpdate = useCallback((update: OrderUpdate) => {
    setOrderUpdates(prev => [...prev, update])
    setLastUpdate(new Date())
  }, [])

  // Clear order updates
  const clearOrderUpdates = useCallback(() => {
    setOrderUpdates([])
  }, [])

  // Get specific order by parent order ID
  const getOrderByParentId = useCallback((parentOrderId: string) => {
    return orderSummaries.find(order => order.parentOrderId === parentOrderId)
  }, [orderSummaries])

  return {
    orderSummaries,
    orderUpdates,
    lastUpdate,
    updateOrderSummaries,
    addOrderUpdate,
    clearOrderUpdates,
    getOrderByParentId,
    isLoading,
    error,
    refetch: fetchUserOrders
  }
}
