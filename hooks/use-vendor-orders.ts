import { useEffect, useState, useCallback } from 'react'

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
      
      const token = localStorage.getItem('vendor_auth_token')
      console.log("🔑 Token exists:", !!token)
      console.log("🔑 Token value:", token)

      const response = await fetch(`/api/vendors/${vendorId}/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      console.log("📥 Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("❌ Response error:", errorText)
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("📦 Response data:", data)
      
      if (data.success) {
        // Group orders by status
        const upcoming = data.data.orders.filter((order: Order) => order.status === 'pending')
        const queue = data.data.orders.filter((order: Order) => 
          order.status === 'accepted' || order.status === 'preparing'
        )
        const ready = data.data.orders.filter((order: Order) => order.status === 'ready')

        setOrders({ upcoming, queue, ready })
        setSectionCounts({
          upcoming: upcoming.length,
          queue: queue.length,
          ready: ready.length
        })
        setLastUpdate(new Date())
      }
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
