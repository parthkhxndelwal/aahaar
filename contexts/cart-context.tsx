"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useAuth } from "./auth-context"

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  subtotal: number
  customizations?: Record<string, any>
  vendorId: string
  imageUrl?: string
}

interface Cart {
  items: CartItem[]
  total: number
}

interface CartContextType {
  cart: Cart
  isLoading: boolean
  addToCart: (menuItemId: string, quantity?: number, customizations?: Record<string, any>) => Promise<boolean>
  removeFromCart: (menuItemId: string) => Promise<boolean>
  updateQuantity: (menuItemId: string, quantity: number, isRetry?: boolean) => Promise<boolean>
  clearCart: () => Promise<boolean>
  refreshCart: () => Promise<void>
  getTotalItems: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 })
  const [isLoading, setIsLoading] = useState(false)

  const refreshCart = async () => {
    if (!user || !token) {
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

  const addToCart = async (menuItemId: string, quantity = 1, customizations = {}) => {
    if (!user || !token) return false

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
    if (!user || !token) return false

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
    if (!user || !token) return false

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
    if (!user || !token) return false

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
  }, [user, token])

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
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
