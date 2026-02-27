"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useAppAuth } from "./app-auth-context"
import { usePathname } from "next/navigation"

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  subtotal: number
  customizations?: Record<string, any>
  vendorId: string
  imageUrl?: string
  vendorName?: string
}

interface Cart {
  items: CartItem[]
  total: number
}

interface CartContextType {
  cart: Cart
  isLoading: boolean
  hasActiveOrder: boolean
  activeOrderError: string | null
  addToCart: (menuItemId: string, quantity?: number, customizations?: Record<string, any>) => Promise<boolean>
  removeFromCart: (menuItemId: string) => Promise<boolean>
  updateQuantity: (menuItemId: string, quantity: number, isRetry?: boolean) => Promise<boolean>
  clearCart: () => Promise<boolean>
  refreshCart: () => Promise<void>
  checkActiveOrders: () => Promise<void>
  getTotalItems: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAppAuth()
  const pathname = usePathname()
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [hasActiveOrder, setHasActiveOrder] = useState(false)
  const [activeOrderError, setActiveOrderError] = useState<string | null>(null)

  // Only enable cart functionality on customer app pages
  const isCustomerApp = pathname.startsWith('/app/') && !pathname.endsWith('/login')

  const refreshCart = async () => {
    if (!user || !token || !isCustomerApp) {
      setCart({ items: [], total: 0 })
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch("/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCart(data.data.cart)
        }
      }
    } catch (error) {
      console.error("Error fetching cart:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkActiveOrders = async () => {
    if (!user || !token || !isCustomerApp) {
      setHasActiveOrder(false)
      setActiveOrderError(null)
      return
    }

    try {
      const courtId = pathname.split('/')[2] // Extract courtId from path like /app/democourt
      if (!courtId) return

      const response = await fetch(`/api/app/${courtId}/orders/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const hasActive = data.data.activeOrders.length > 0
          setHasActiveOrder(hasActive)
          setActiveOrderError(hasActive ? "You have an active order. Please wait for it to complete before placing a new order." : null)
        }
      } else {
        setHasActiveOrder(false)
        setActiveOrderError(null)
      }
    } catch (error) {
      console.error("Error checking active orders:", error)
      setHasActiveOrder(false)
      setActiveOrderError(null)
    }
  }

  const addToCart = async (menuItemId: string, quantity = 1, customizations = {}) => {
    if (!user || !token || !isCustomerApp) return false

    try {
      setIsLoading(true)
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          menuItemId,
          quantity,
          customizations,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCart(data.data.cart)
          return true
        }
      } else {
        console.error(`Failed to add item to cart: ${response.status}`)
      }
      return false
    } catch (error) {
      console.error("Error adding to cart:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromCart = async (menuItemId: string) => {
    if (!user || !token || !isCustomerApp) return false

    // Check if item exists in cart first
    const existingItem = cart.items.find(item => item.menuItemId === menuItemId)
    if (!existingItem) {
      console.warn(`Item ${menuItemId} not found in cart, skipping remove operation`)
      return true // Return true since item is already not in cart
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/cart/${menuItemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCart(data.data.cart)
          return true
        }
      } else {
        console.error(`Failed to remove cart item ${menuItemId}: ${response.status}`)
      }
      return false
    } catch (error) {
      console.error("Error removing from cart:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (menuItemId: string, quantity: number, isRetry = false): Promise<boolean> => {
    if (!user || !token || !isCustomerApp) return false

    if (quantity <= 0) {
      return removeFromCart(menuItemId)
    }

    // Check if item exists in cart first
    const existingItem = cart.items.find(item => item.menuItemId === menuItemId)
    
    if (!existingItem) {
      // Item not in cart, use addToCart instead
      console.warn(`Item ${menuItemId} not found in cart, using addToCart instead`)
      return addToCart(menuItemId, quantity)
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/cart/${menuItemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCart(data.data.cart)
          return true
        }
      } else if (response.status === 404 && !isRetry) {
        // Item not found in backend cart, refresh cart state and try once more
        console.warn(`Item ${menuItemId} not found in backend cart (404), refreshing cart state`)
        await refreshCart()
        
        // Try once more with retry flag
        return updateQuantity(menuItemId, quantity, true)
      } else if (response.status === 404 && isRetry) {
        // Still 404 after retry, add item instead
        console.warn(`Item ${menuItemId} still not found after retry, adding it instead`)
        return addToCart(menuItemId, quantity)
      } else {
        console.error(`Failed to update cart item ${menuItemId}: ${response.status}`)
      }
      return false
    } catch (error) {
      console.error("Error updating cart quantity:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = async () => {
    if (!user || !token || !isCustomerApp) return false

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setCart({ items: [], total: 0 })
        return true
      }
      return false
    } catch (error) {
      console.error("Error clearing cart:", error)
      return false
    }
  }

  const getTotalItems = () => {
    return cart.items.reduce((total, item) => total + item.quantity, 0)
  }

  useEffect(() => {
    refreshCart()
    checkActiveOrders()
  }, [user, token, isCustomerApp])

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        hasActiveOrder,
        activeOrderError,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        checkActiveOrders,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
