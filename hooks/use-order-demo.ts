// Simple demonstration of how to use the setActiveOrder function
// In a real app, this would be called when an order is placed or when checking order status

import { useBottomNav } from "@/contexts/bottom-nav-context"

export function useOrderDemo() {
  const { setActiveOrder } = useBottomNav()

  const simulateOrderPlaced = () => {
    setActiveOrder(true)
    
    // Simulate order completion after 30 seconds for demo
    setTimeout(() => {
      setActiveOrder(false)
    }, 30000)
  }

  const clearActiveOrder = () => {
    setActiveOrder(false)
  }

  return {
    simulateOrderPlaced,
    clearActiveOrder
  }
}
