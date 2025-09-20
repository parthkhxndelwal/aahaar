"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Plus, Minus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useCart } from "@/contexts/cart-context"

interface CartItemProps {
  item: {
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
  index: number
  onRemove: (menuItemId: string) => void
  isLoading: boolean
}

export function CartItem({ item, index, onRemove, isLoading }: CartItemProps) {
  const { updateQuantityOptimistic, removeFromCartOptimistic } = useCart()
  
  // Local state for immediate UI updates
  const [displayQuantity, setDisplayQuantity] = useState(item.quantity)
  const [displaySubtotal, setDisplaySubtotal] = useState(item.subtotal)
  
  // Refs for debouncing
  const pendingQuantityRef = useRef<number | null>(null)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSyncingRef = useRef<boolean>(false)
  const lastUpdateTimeRef = useRef<number>(0)

  // Update display when cart item changes (from external updates)
  useEffect(() => {
    // Only update display if we don't have pending operations
    if (pendingQuantityRef.current === null && !isSyncingRef.current && syncTimeoutRef.current === null) {
      if (displayQuantity !== item.quantity) {
        setDisplayQuantity(item.quantity)
        setDisplaySubtotal(item.subtotal)
        console.log(`🔄 [CartItem] External update: ${item.name} display updated to ${item.quantity}`)
      }
    }
  }, [item.quantity, item.subtotal, item.name, displayQuantity])

  // Sync with backend
  const syncWithBackend = useCallback(async (targetQuantity: number) => {
    console.log(`🔄 [CartItem] Backend sync starting: ${item.name} → quantity ${targetQuantity}`)
    
    isSyncingRef.current = true
    
    try {
      let success = false
      
      if (targetQuantity === 0) {
        console.log(`🗑️ [CartItem] Removing ${item.name} from cart`)
        success = await removeFromCartOptimistic(item.menuItemId)
        if (success) {
          onRemove(item.menuItemId)
        }
      } else {
        console.log(`🔄 [CartItem] Updating ${item.name} quantity → ${targetQuantity}`)
        success = await updateQuantityOptimistic(item.menuItemId, targetQuantity)
      }
      
      if (success) {
        console.log(`✅ [CartItem] Backend sync successful for ${item.name}`)
        
        // Check if there's a newer pending quantity to sync
        const currentPending = pendingQuantityRef.current
        if (currentPending !== null && currentPending !== targetQuantity) {
          console.log(`🔄 [CartItem] Found newer pending quantity for ${item.name}: ${currentPending}, scheduling next sync`)
          
          // Schedule the next sync
          setTimeout(() => {
            if (!isSyncingRef.current) {
              syncWithBackend(currentPending)
            }
          }, 50)
        } else {
          // Clear pending quantity since we're up to date
          pendingQuantityRef.current = null
          console.log(`✅ [CartItem] All updates synced for ${item.name}, clearing pending`)
        }
      } else {
        console.warn(`❌ [CartItem] Backend sync failed for ${item.name}, reverting UI`)
        // Revert to original values on failure
        setDisplayQuantity(item.quantity)
        setDisplaySubtotal(item.subtotal)
        pendingQuantityRef.current = null
      }
    } catch (error) {
      console.error(`💥 [CartItem] Backend sync error for ${item.name}:`, error)
      // Revert to original values on error
      setDisplayQuantity(item.quantity)
      setDisplaySubtotal(item.subtotal)
      pendingQuantityRef.current = null
    } finally {
      isSyncingRef.current = false
    }
  }, [item.name, item.menuItemId, item.quantity, item.subtotal, updateQuantityOptimistic, removeFromCartOptimistic, onRemove])

  // Queue-based update function
  const queueUpdate = useCallback((newQuantity: number) => {
    const now = Date.now()
    lastUpdateTimeRef.current = now
    pendingQuantityRef.current = newQuantity
    
    console.log(`📝 [CartItem] Queuing update: ${item.name} → quantity ${newQuantity} (syncing: ${isSyncingRef.current})`)
    
    // If already syncing, just update the pending quantity
    if (isSyncingRef.current) {
      console.log(`⏳ [CartItem] Sync in progress for ${item.name}, updating pending quantity to ${newQuantity}`)
      return
    }
    
    // Clear any existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
      console.log(`🚫 [CartItem] Cancelled previous timeout for ${item.name}`)
    }
    
    // Set timeout for this update
    syncTimeoutRef.current = setTimeout(() => {
      // Check if this timeout is still the latest one and we have a pending quantity
      if (lastUpdateTimeRef.current === now && pendingQuantityRef.current !== null) {
        console.log(`⏰ [CartItem] Timeout triggered for ${item.name}, starting sync`)
        syncWithBackend(pendingQuantityRef.current)
      } else {
        console.log(`⏰ [CartItem] Timeout cancelled for ${item.name} (stale or no pending)`)
      }
    }, 500) // 500ms debounce
  }, [syncWithBackend, item.name])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  const handleQuantityIncrease = () => {
    const newQuantity = displayQuantity + 1
    const newSubtotal = newQuantity * item.price
    
    console.log(`🛒 [CartItem] Immediate UI update: ${item.name} quantity ${displayQuantity} → ${newQuantity}`)
    
    // Update UI immediately
    setDisplayQuantity(newQuantity)
    setDisplaySubtotal(newSubtotal)

    // Queue the backend update
    queueUpdate(newQuantity)
  }

  const handleQuantityDecrease = () => {
    if (displayQuantity <= 1) {
      handleRemoveItem()
      return
    }

    const newQuantity = displayQuantity - 1
    const newSubtotal = newQuantity * item.price
    
    console.log(`🛒 [CartItem] Immediate UI update: ${item.name} quantity ${displayQuantity} → ${newQuantity}`)
    
    // Update UI immediately
    setDisplayQuantity(newQuantity)
    setDisplaySubtotal(newSubtotal)

    // Queue the backend update
    queueUpdate(newQuantity)
  }

  const handleRemoveItem = () => {
    console.log(`🗑️ [CartItem] Immediate UI remove: ${item.name}`)
    
    // Queue the removal
    queueUpdate(0)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ 
        opacity: 0, 
        x: -100, 
        scale: 0.95,
        transition: { duration: 0.2 }
      }}
      transition={{ 
        delay: index * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 w-full hover:shadow-md dark:hover:shadow-neutral-800/50 transition-shadow"
    >
      <div className="flex gap-3 h-full">
        {/* Image */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
          {item.imageUrl ? (
            <Image 
              src={item.imageUrl} 
              alt={item.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
              <span className="text-neutral-400 dark:text-neutral-500 text-xs">No image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Header with Name and Remove Button */}
          <div className="flex items-start justify-between w-full mb-2">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-medium text-neutral-900 dark:text-white truncate text-sm">{item.name}</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                {item.vendorName || 'Unknown Vendor'}
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveItem}
                disabled={isLoading}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 h-auto flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          {/* Quantity Controls and Price */}
          <div className="flex justify-between items-center w-full">
            <motion.div 
              className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 flex-shrink-0"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQuantityDecrease}
                  disabled={isLoading}
                  className="h-7 w-7 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                >
                  <Minus className="h-3 w-3" />
                </Button>
              </motion.div>
              <motion.span 
                className="mx-1 min-w-[20px] text-center font-medium text-sm text-neutral-900 dark:text-white"
                key={displayQuantity}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                {displayQuantity}
              </motion.span>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQuantityIncrease}
                  disabled={isLoading}
                  className="h-7 w-7 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </motion.div>
            </motion.div>

            <div className="text-right flex-shrink-0 ml-2">
              <motion.p 
                className="font-semibold text-neutral-900 dark:text-white text-sm"
                key={displaySubtotal}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                ₹{Number(displaySubtotal || 0).toFixed(2)}
              </motion.p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">₹{Number(item.price || 0).toFixed(2)} each</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}