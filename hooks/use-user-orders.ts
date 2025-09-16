import { useEffect, useState, useCallback } from 'react'

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

  // Fetch user orders from API
  const fetchUserOrders = useCallback(async () => {
    if (!userId || !courtId) {
      console.log('⚠️ [useUserOrders] No userId or courtId provided, skipping fetch')
      return
    }

    try {
      setError(null)
      setIsLoading(true)

      const token = localStorage.getItem('app_auth_token')
      console.log('🔑 [useUserOrders] Token present:', !!token)
      console.log('👤 [useUserOrders] Fetching orders for userId:', userId)

      if (!token) {
        throw new Error('No authentication token found. Please log in again.')
      }

      const response = await fetch(`/api/users/orders?courtId=${encodeURIComponent(courtId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📡 [useUserOrders] Response status:', response.status)
      console.log('📡 [useUserOrders] Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [useUserOrders] Response error:', response.status, errorText)

        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.')
        } else if (response.status === 403) {
          throw new Error('Access denied. You may not have permission to view these orders.')
        } else if (response.status === 404) {
          throw new Error('User not found or no orders available.')
        } else {
          throw new Error(`Failed to fetch user orders (${response.status}): ${errorText || 'Unknown error'}`)
        }
      }

      const data = await response.json()
      console.log('✅ [useUserOrders] Response data:', data)

      if (data.success) {
        setOrderSummaries(data.data.orders || [])
        setLastUpdate(new Date())
        console.log('✅ [useUserOrders] Successfully updated order summaries:', data.data.orders?.length || 0, 'orders')
      } else {
        throw new Error(data.message || 'Failed to fetch user orders')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user orders'
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
