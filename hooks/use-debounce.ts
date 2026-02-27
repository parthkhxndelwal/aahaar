import { useCallback, useRef, useEffect } from 'react'

/**
 * Custom hook for debouncing function calls
 * 
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * Custom hook for debounced cart operations with optimistic updates
 * 
 * @param cartOperations - Object containing cart operation functions
 * @param delay - Debounce delay in milliseconds (default: 500)
 * @returns Object with debounced cart operations and state
 */
export function useDebouncedCart(
  cartOperations: {
    addToCart: (id: string, quantity: number) => Promise<boolean>
    updateQuantity: (id: string, quantity: number) => Promise<boolean>
    removeFromCart: (id: string) => Promise<boolean>
  },
  delay: number = 500
) {
  const pendingOperationsRef = useRef<Map<string, number>>(new Map())
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const syncOperation = useCallback(
    async (itemId: string, targetQuantity: number) => {
      try {
        let success = false

        if (targetQuantity === 0) {
          success = await cartOperations.removeFromCart(itemId)
        } else {
          // Try update first, fallback to add if item doesn't exist
          success = await cartOperations.updateQuantity(itemId, targetQuantity)
          if (!success) {
            success = await cartOperations.addToCart(itemId, targetQuantity)
          }
        }

        if (success) {
          pendingOperationsRef.current.delete(itemId)
        }

        return success
      } catch (error) {
        console.error(`Failed to sync cart operation for item ${itemId}:`, error)
        pendingOperationsRef.current.delete(itemId)
        return false
      }
    },
    [cartOperations]
  )

  const debouncedUpdate = useCallback(
    (itemId: string, quantity: number) => {
      // Clear existing timeout for this item
      const existingTimeout = timeoutsRef.current.get(itemId)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // Store pending operation
      pendingOperationsRef.current.set(itemId, quantity)

      // Set new timeout
      const timeout = setTimeout(() => {
        syncOperation(itemId, quantity)
        timeoutsRef.current.delete(itemId)
      }, delay)

      timeoutsRef.current.set(itemId, timeout)
    },
    [syncOperation, delay]
  )

  const isPending = useCallback((itemId: string) => {
    return pendingOperationsRef.current.has(itemId)
  }, [])

  const getPendingQuantity = useCallback((itemId: string) => {
    return pendingOperationsRef.current.get(itemId) ?? null
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current.clear()
      pendingOperationsRef.current.clear()
    }
  }, [])

  return {
    debouncedUpdate,
    isPending,
    getPendingQuantity,
    pendingOperations: pendingOperationsRef.current
  }
}
