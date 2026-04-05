import { useEffect, useState, useCallback } from 'react'
import { vendorApi, apiClient } from '@/lib/api'
import type { OrderWithDetails } from '@/lib/api'

interface OrderItem {
  name: string
  quantity: number
  price: number
  subtotal: number
  imageUrl?: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  totalAmount: number
  status: string
  estimatedPreparationTime: number
  queuePosition?: number
  orderOtp: string
  createdAt: string
  acceptedAt?: string
}

export const useVendorOrders = (vendorId: string | null) => {
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Set up token getter for API client
  useEffect(() => {
    apiClient.setTokenGetter(() => localStorage.getItem('vendor_auth_token'))
  }, [])

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    if (!vendorId) {
      console.log("⚠️ No vendorId provided to useVendorOrders")
      return
    }

    console.log("📡 Fetching orders for vendor:", vendorId)

    try {
      setIsLoading(true)
      setError(null)
      
      const data = await vendorApi.getOrders(vendorId)
      console.log("📦 Response data:", data)
      
      // Transform orders to expected format
      const transformedOrders: Order[] = data.orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || order.user?.fullName || "Unknown",
        customerPhone: order.customerPhone || order.user?.phone || "",
        items: order.orderItems?.map((item: any) => ({
          name: item.itemName || item.menuItem?.name || "Unknown Item",
          quantity: item.quantity,
          price: item.itemPrice,
          subtotal: item.subtotal,
          imageUrl: item.menuItem?.imageUrl
        })) || [],
        totalAmount: order.totalAmount,
        status: order.status,
        estimatedPreparationTime: order.estimatedPreparationTime || 15,
        orderOtp: order.orderOtp || "",
        createdAt: order.createdAt,
        acceptedAt: order.statusHistory?.find((h: any) => h.status === 'accepted')?.timestamp
      }))

      // Group orders by status
      const upcoming = transformedOrders.filter((order) => order.status === 'pending')
      const queue = transformedOrders.filter((order) => 
        order.status === 'accepted' || order.status === 'preparing'
      )
      const ready = transformedOrders.filter((order) => order.status === 'ready')

      setOrders({ upcoming, queue, ready })
      setSectionCounts({
        upcoming: upcoming.length,
        queue: queue.length,
        ready: ready.length
      })
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
      console.error('Failed to fetch vendor orders:', err)
    } finally {
      setIsLoading(false)
    }
  }, [vendorId])

  // Set up polling every 5 seconds
  useEffect(() => {
    if (!vendorId) return

    // Initial fetch
    fetchOrders()

    // Set up polling interval
    const interval = setInterval(fetchOrders, 5000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [vendorId, fetchOrders])

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
    isLoading,
    error,
    refetch: fetchOrders
  }
}
