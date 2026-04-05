import { useEffect, useState, useCallback } from 'react'
import { orderApi, apiClient } from '@/lib/api'

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

export const useOrderDetails = (userId: string | null, parentOrderId: string | null, courtId: string | null) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetailsData | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [statusUpdates, setStatusUpdates] = useState<OrderUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Set up token getter for API client
  useEffect(() => {
    apiClient.setTokenGetter(() => localStorage.getItem('app_auth_token'))
  }, [])

  // Fetch order details from API
  const fetchOrderDetails = useCallback(async () => {
    if (!userId || !parentOrderId || !courtId) return

    try {
      setError(null)
      
      const data = await orderApi.getOrderDetails(courtId, parentOrderId)
      
      // Transform the response to match the expected format
      const transformedData: OrderDetailsData = {
        parentOrderId: data.parentOrderId,
        orderOtp: data.orderOtp,
        totalAmount: data.totalAmount,
        orders: data.orders,
        summary: data.summary
      }
      
      setOrderDetails(transformedData)
      setLastUpdate(new Date())
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch order details'
      setError(errorMessage)
      console.error('Failed to fetch order details:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId, parentOrderId, courtId])

  // Set up polling every 5 seconds
  useEffect(() => {
    if (!userId || !parentOrderId || !courtId) return

    // Initial fetch
    fetchOrderDetails()

    // Set up polling interval
    const interval = setInterval(fetchOrderDetails, 5000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [userId, parentOrderId, courtId, fetchOrderDetails])

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
    isLoading,
    error,
    refetch: fetchOrderDetails
  }
}
