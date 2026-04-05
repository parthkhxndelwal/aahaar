"use client"
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { useUnifiedAuth } from "./unified-auth-context"
import { usePathname } from "next/navigation"
import { cartApi, orderApi, apiClient } from "@/lib/api"
import type { Cart, CartItem } from "@/lib/api"

interface CartContextType {
  cart: Cart
  isLoading: boolean
  hasActiveOrder: boolean
  activeOrderError: string | null
  addToCart: (menuItemId: string, quantity?: number, customizations?: Record<string, unknown>) => Promise<boolean>
  removeFromCart: (menuItemId: string) => Promise<boolean>
  updateQuantity: (menuItemId: string, quantity: number, isRetry?: boolean) => Promise<boolean>
  clearCart: () => Promise<boolean>
  refreshCart: () => Promise<void>
  checkActiveOrders: () => Promise<void>
  getTotalItems: () => number
  // Optimistic update methods
  addToCartOptimistic: (menuItemId: string, name: string, price: number, vendorId: string, vendorName?: string, imageUrl?: string, quantity?: number, customizations?: Record<string, unknown>) => Promise<boolean>
  updateQuantityOptimistic: (menuItemId: string, quantity: number) => Promise<boolean>
  removeFromCartOptimistic: (menuItemId: string) => Promise<boolean>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, token } = useUnifiedAuth()
  const pathname = usePathname()
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [hasActiveOrder, setHasActiveOrder] = useState(false)
  const [activeOrderError, setActiveOrderError] = useState<string | null>(null)

  // Only enable cart functionality on customer app pages
  const isCustomerApp = pathname.startsWith('/app/') && !pathname.endsWith('/login')

  // Set up token getter for API client when token changes
  useEffect(() => {
    apiClient.setTokenGetter(() => token)
  }, [token])

  const refreshCart = useCallback(async () => {
    if (!user || !token || !isCustomerApp) {
      setCart({ items: [], total: 0 })
      return
    }

    try {
      setIsLoading(true)
      const data = await cartApi.getCart()
      if (data.cart) {
        setCart(data.cart)
      }
    } catch (error) {
      console.error("Error fetching cart:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user, token, isCustomerApp])

  const checkActiveOrders = useCallback(async () => {
    if (!user || !token || !isCustomerApp) {
      setHasActiveOrder(false)
      setActiveOrderError(null)
      return
    }

    try {
      const courtId = pathname.split('/')[2] // Extract courtId from path like /app/democourt
      if (!courtId) return

      const data = await orderApi.getActiveOrders(courtId)
      const hasActive = data.activeOrders.length > 0
      setHasActiveOrder(hasActive)
      setActiveOrderError(hasActive ? "You have an active order. Please wait for it to complete before placing a new order." : null)
    } catch (error) {
      console.error("Error checking active orders:", error)
      setHasActiveOrder(false)
      setActiveOrderError(null)
    }
  }, [user, token, isCustomerApp, pathname])

  const addToCart = useCallback(async (menuItemId: string, quantity = 1, customizations = {}) => {
    if (!user || !token || !isCustomerApp) return false

    try {
      setIsLoading(true)
      const data = await cartApi.addItem({ menuItemId, quantity, customizations })
      if (data.cart) {
        setCart(data.cart)
        return true
      }
      return false
    } catch (error) {
      console.error("Error adding to cart:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, token, isCustomerApp])

  const removeFromCart = useCallback(async (menuItemId: string) => {
    if (!user || !token || !isCustomerApp) return false

    // Check if item exists in cart first
    const existingItem = cart.items.find(item => item.menuItemId === menuItemId)
    if (!existingItem) {
      console.warn(`Item ${menuItemId} not found in cart, skipping remove operation`)
      return true // Return true since item is already not in cart
    }

    try {
      setIsLoading(true)
      const data = await cartApi.removeItem(menuItemId)
      if (data.cart) {
        setCart(data.cart)
        return true
      }
      return false
    } catch (error) {
      console.error("Error removing from cart:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, token, isCustomerApp, cart.items])

  const updateQuantity = useCallback(async (menuItemId: string, quantity: number, isRetry = false): Promise<boolean> => {
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
      const data = await cartApi.updateItem(menuItemId, { quantity })
      if (data.cart) {
        setCart(data.cart)
        return true
      }
      return false
    } catch (error: any) {
      if (error.status === 404 && !isRetry) {
        // Item not found in backend cart, refresh cart state and try once more
        console.warn(`Item ${menuItemId} not found in backend cart (404), refreshing cart state`)
        await refreshCart()
        return updateQuantity(menuItemId, quantity, true)
      } else if (error.status === 404 && isRetry) {
        // Still 404 after retry, add item instead
        console.warn(`Item ${menuItemId} still not found after retry, adding it instead`)
        return addToCart(menuItemId, quantity)
      }
      console.error("Error updating cart quantity:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, token, isCustomerApp, cart.items, removeFromCart, addToCart, refreshCart])

  const clearCart = useCallback(async () => {
    if (!user || !token || !isCustomerApp) return false

    try {
      await cartApi.clearCart()
      setCart({ items: [], total: 0 })
      return true
    } catch (error) {
      console.error("Error clearing cart:", error)
      return false
    }
  }, [user, token, isCustomerApp])

  const getTotalItems = useCallback(() => {
    return cart.items.reduce((total, item) => total + item.quantity, 0)
  }, [cart.items])

  // Optimistic update methods
  const addToCartOptimistic = useCallback(async (
    menuItemId: string, 
    name: string, 
    price: number, 
    vendorId: string, 
    vendorName?: string, 
    imageUrl?: string, 
    quantity = 1, 
    customizations = {}
  ) => {
    if (!user || !token || !isCustomerApp) return false

    // Update local state immediately
    const existingItemIndex = cart.items.findIndex(item => item.menuItemId === menuItemId)
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...cart.items]
      const existingItem = updatedItems[existingItemIndex]
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + quantity,
        subtotal: (existingItem.quantity + quantity) * price
      }
      
      const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0)
      setCart({ items: updatedItems, total: newTotal })
    } else {
      // Add new item
      const newItem: CartItem = {
        menuItemId,
        name,
        price,
        quantity,
        subtotal: quantity * price,
        customizations,
        vendorId,
        vendorName,
        imageUrl
      }
      
      const updatedItems = [...cart.items, newItem]
      const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0)
      setCart({ items: updatedItems, total: newTotal })
    }

    // Sync with server in background
    try {
      const success = await addToCart(menuItemId, quantity, customizations)
      if (!success) {
        // Rollback on server error
        await refreshCart()
      }
      return success
    } catch (error) {
      // Rollback on error
      await refreshCart()
      return false
    }
  }, [user, token, isCustomerApp, cart.items, addToCart, refreshCart])

  const updateQuantityOptimistic = useCallback(async (menuItemId: string, quantity: number) => {
    if (!user || !token || !isCustomerApp) return false

    // Store original cart for potential rollback
    const originalCart = { ...cart, items: [...cart.items] }

    if (quantity <= 0) {
      return removeFromCartOptimistic(menuItemId)
    }

    // Update local state immediately
    const existingItemIndex = cart.items.findIndex(item => item.menuItemId === menuItemId)
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...cart.items]
      const existingItem = updatedItems[existingItemIndex]
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity,
        subtotal: quantity * existingItem.price
      }
      
      const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0)
      setCart({ items: updatedItems, total: newTotal })

      // Sync with server in background
      try {
        const success = await updateQuantity(menuItemId, quantity)
        if (!success) {
          // Rollback on server error
          setCart(originalCart)
          await refreshCart()
        }
        return success
      } catch (error) {
        // Rollback on error
        setCart(originalCart)
        await refreshCart()
        return false
      }
    } else {
      // Item not found, this shouldn't happen but refresh cart just in case
      await refreshCart()
      return false
    }
  }, [user, token, isCustomerApp, cart, updateQuantity, refreshCart])

  const removeFromCartOptimistic = useCallback(async (menuItemId: string) => {
    if (!user || !token || !isCustomerApp) return false

    // Store original cart for potential rollback
    const originalCart = { ...cart, items: [...cart.items] }

    // Update local state immediately
    const updatedItems = cart.items.filter(item => item.menuItemId !== menuItemId)
    const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0)
    setCart({ items: updatedItems, total: newTotal })

    // Sync with server in background
    try {
      const success = await removeFromCart(menuItemId)
      if (!success) {
        // Rollback on server error
        setCart(originalCart)
        await refreshCart()
      }
      return success
    } catch (error) {
      // Rollback on error
      setCart(originalCart)
      await refreshCart()
      return false
    }
  }, [user, token, isCustomerApp, cart, removeFromCart, refreshCart])

  useEffect(() => {
    refreshCart()
    checkActiveOrders()
  }, [refreshCart, checkActiveOrders])

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
        addToCartOptimistic,
        updateQuantityOptimistic,
        removeFromCartOptimistic,
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
