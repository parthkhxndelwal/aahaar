"use client"
import { createContext, useContext, useState, ReactNode, useEffect } from "react"
import { useCart } from "./cart-context"

interface BottomNavContextType {
  shouldOrderBeVisible: boolean
  shouldCartBeVisible: boolean
  hasActiveOrder: boolean
  toggleOrderVisibility: () => void
  toggleCartVisibility: (visible?: boolean) => void
  setActiveOrder: (hasOrder: boolean) => void
}

const BottomNavContext = createContext<BottomNavContextType | undefined>(undefined)

export function BottomNavProvider({ children }: { children: ReactNode }) {
  const [hasActiveOrder, setHasActiveOrder] = useState(false) // Track if there's an active order
  const [shouldOrderBeVisible, setShouldOrderBeVisible] = useState(false)
  const [shouldCartBeVisible, setShouldCartBeVisible] = useState(false)
  
  // Get cart context to check for items
  const { getTotalItems } = useCart()

  // Update cart visibility based on cart items
  useEffect(() => {
    const totalItems = getTotalItems()
    setShouldCartBeVisible(totalItems > 0)
  }, [getTotalItems])

  // Update order visibility based on active order status
  useEffect(() => {
    setShouldOrderBeVisible(hasActiveOrder)
  }, [hasActiveOrder])

  const toggleOrderVisibility = () => {
    setShouldOrderBeVisible(prev => !prev)
  }

  const toggleCartVisibility = (visible?: boolean) => {
    if (typeof visible === 'boolean') {
      setShouldCartBeVisible(visible)
    } else {
      setShouldCartBeVisible(prev => !prev)
    }
  }

  const setActiveOrder = (hasOrder: boolean) => {
    setHasActiveOrder(hasOrder)
  }

  return (
    <BottomNavContext.Provider
      value={{
        shouldOrderBeVisible,
        shouldCartBeVisible,
        hasActiveOrder,
        toggleOrderVisibility,
        toggleCartVisibility,
        setActiveOrder,
      }}
    >
      {children}
    </BottomNavContext.Provider>
  )
}

export function useBottomNav() {
  const context = useContext(BottomNavContext)
  if (context === undefined) {
    throw new Error("useBottomNav must be used within a BottomNavProvider")
  }
  return context
}
