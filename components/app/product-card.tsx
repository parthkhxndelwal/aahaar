"use client"

import { motion } from "framer-motion"
import { Plus, Minus } from "lucide-react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Image from "next/image"
import { useCart } from "@/contexts/cart-context"

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  mrp?: number
  imageUrl?: string
  onAddToCart?: (id: string, quantity: number) => void
  className?: string
  // Stock management props
  hasStock?: boolean
  stockQuantity?: number
  stockUnit?: string
  status?: 'active' | 'inactive' | 'out_of_stock'
  // Vendor information for optimistic updates
  vendorId?: string
  vendorName?: string
  // Vendor online status
  isVendorOnline?: boolean
}

export function ProductCard({
  id,
  name,
  description,
  price,
  mrp,
  imageUrl,
  onAddToCart,
  className = "",
  hasStock = false,
  stockQuantity = 0,
  stockUnit = "pieces",
  status = "active",
  vendorId = "",
  vendorName = "",
  isVendorOnline = true
}: ProductCardProps) {
  const { cart, addToCartOptimistic, updateQuantityOptimistic, removeFromCartOptimistic, isLoading: cartLoading } = useCart()
  
  // Local state for immediate UI updates
  const [displayQuantity, setDisplayQuantity] = useState(0)
  
  // Debug logging to check prop values
  useEffect(() => {
    console.log(`🔍 [ProductCard] Debug props for ${name}:`, {
      price,
      mrp,
      priceType: typeof price,
      mrpType: typeof mrp,
      priceValue: price,
      mrpValue: mrp
    })
  }, [name, price, mrp])
  
  // Refs for queue-based syncing
  const lastUpdateTimeRef = useRef<number>(0)
  const pendingQuantityRef = useRef<number | null>(null)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSyncingRef = useRef<boolean>(false)

  // Update display quantity from cart
  useEffect(() => {
    const cartItem = cart.items.find(item => item.menuItemId === id)
    const cartQuantity = cartItem?.quantity || 0
    
    // Only update display if we don't have any pending operations
    if (pendingQuantityRef.current === null && !isSyncingRef.current && syncTimeoutRef.current === null) {
      if (displayQuantity !== cartQuantity) {
        setDisplayQuantity(cartQuantity)
        console.log(`🔄 [ProductCard] Cart sync: ${name} display updated to ${cartQuantity}`)
      }
    }
  }, [cart.items, id, name, displayQuantity])

  // Queue-based function to sync with backend
  const syncWithBackend = useCallback(async (targetQuantity: number) => {
    console.log(`🔄 [ProductCard] Backend sync starting: ${name} → quantity ${targetQuantity}`)
    
    // Check if cart is still loading before starting sync
    if (cartLoading) {
      console.log(`⏳ [ProductCard] Cart loading, postponing sync for ${name}`)
      // Reschedule this sync after a short delay
      setTimeout(() => {
        if (!cartLoading && !isSyncingRef.current) {
          syncWithBackend(targetQuantity)
        }
      }, 200)
      return
    }
    
    isSyncingRef.current = true
    // Don't set isUpdating here as it can cause UI blurring
    
    try {
      const currentCartItem = cart.items.find(item => item.menuItemId === id)
      const currentQuantity = currentCartItem?.quantity || 0
      
      let success = false
      
      if (targetQuantity === 0) {
        // Remove item completely
        console.log(`🗑️ [ProductCard] Removing ${name} from cart`)
        success = await removeFromCartOptimistic(id)
      } else if (currentQuantity === 0) {
        // Add new item
        console.log(`➕ [ProductCard] Adding ${name} to cart with quantity ${targetQuantity}`)
        success = await addToCartOptimistic(id, name, price, vendorId, vendorName, imageUrl, targetQuantity)
      } else {
        // Update existing item
        console.log(`🔄 [ProductCard] Updating ${name} quantity ${currentQuantity} → ${targetQuantity}`)
        success = await updateQuantityOptimistic(id, targetQuantity)
      }
      
      if (success) {
        console.log(`✅ [ProductCard] Backend sync successful for ${name}`)
        onAddToCart?.(id, targetQuantity)
        
        // Check if there's a newer pending quantity to sync
        const currentPending = pendingQuantityRef.current
        if (currentPending !== null && currentPending !== targetQuantity) {
          console.log(`🔄 [ProductCard] Found newer pending quantity for ${name}: ${currentPending}, scheduling next sync`)
          // Don't clear pending quantity yet, let the next sync handle it
          
          // Schedule the next sync immediately
          setTimeout(() => {
            if (!isSyncingRef.current) {
              syncWithBackend(currentPending)
            }
          }, 50)
        } else {
          // Clear pending quantity since we're up to date
          pendingQuantityRef.current = null
          console.log(`✅ [ProductCard] All updates synced for ${name}, clearing pending`)
        }
      } else {
        console.warn(`❌ [ProductCard] Backend sync failed for ${name}, reverting UI`)
        // Revert to cart quantity on failure
        const cartItem = cart.items.find(item => item.menuItemId === id)
        const actualQuantity = cartItem?.quantity || 0
        setDisplayQuantity(actualQuantity)
        pendingQuantityRef.current = null
      }
    } catch (error) {
      console.error(`💥 [ProductCard] Backend sync error for ${name}:`, error)
      
      // Revert to cart quantity on error
      const cartItem = cart.items.find(item => item.menuItemId === id)
      const actualQuantity = cartItem?.quantity || 0
      setDisplayQuantity(actualQuantity)
      pendingQuantityRef.current = null
    } finally {
      isSyncingRef.current = false
      // Don't set isUpdating(false) here to prevent UI flickering
    }
  }, [cart.items, id, addToCartOptimistic, updateQuantityOptimistic, removeFromCartOptimistic, onAddToCart, name, cartLoading, price, vendorId, vendorName, imageUrl])

  // Force sync any pending updates (useful for navigation)
  const forceSyncPending = useCallback(() => {
    if (pendingQuantityRef.current !== null && !isSyncingRef.current) {
      console.log(`⚡ [ProductCard] Force syncing pending update for ${name}`)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }
      syncWithBackend(pendingQuantityRef.current)
    }
  }, [syncWithBackend, name])

  // Queue-based update function
  const queueUpdate = useCallback((newQuantity: number) => {
    const now = Date.now()
    lastUpdateTimeRef.current = now
    pendingQuantityRef.current = newQuantity
    
    console.log(`📝 [ProductCard] Queuing update: ${name} → quantity ${newQuantity} (syncing: ${isSyncingRef.current})`)
    
    // If already syncing, just update the pending quantity and let the current sync finish
    if (isSyncingRef.current) {
      console.log(`⏳ [ProductCard] Sync in progress for ${name}, updating pending quantity to ${newQuantity}`)
      return
    }
    
    // Clear any existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
      console.log(`🚫 [ProductCard] Cancelled previous timeout for ${name}`)
    }
    
    // Set timeout for this update
    syncTimeoutRef.current = setTimeout(() => {
      // Check if this timeout is still the latest one and we have a pending quantity
      if (lastUpdateTimeRef.current === now && pendingQuantityRef.current !== null) {
        console.log(`⏰ [ProductCard] Timeout triggered for ${name}, starting sync`)
        syncWithBackend(pendingQuantityRef.current)
      } else {
        console.log(`⏰ [ProductCard] Timeout cancelled for ${name} (stale or no pending)`)
      }
    }, 500) // Reduced from 1500ms to 500ms for faster sync
  }, [syncWithBackend, name])

  // Cleanup timeout on unmount - but sync pending updates first
  useEffect(() => {
    return () => {
      // If there's a pending update when component unmounts, sync it immediately
      if (pendingQuantityRef.current !== null && !isSyncingRef.current) {
        console.log(`🔄 [ProductCard] Component unmounting with pending update for ${name}, syncing immediately`)
        // Force sync immediately before unmounting
        forceSyncPending()
      }
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [forceSyncPending, name])

  // Handle page visibility changes and beforeunload to sync pending updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && pendingQuantityRef.current !== null && !isSyncingRef.current) {
        console.log(`🔄 [ProductCard] Page becoming hidden with pending update for ${name}, syncing immediately`)
        forceSyncPending()
      }
    }

    const handleBeforeUnload = () => {
      if (pendingQuantityRef.current !== null && !isSyncingRef.current) {
        console.log(`🔄 [ProductCard] Page unloading with pending update for ${name}, syncing immediately`)
        forceSyncPending()
      }
    }

    // Custom event listener for router navigation
    const handleRouteChange = () => {
      if (pendingQuantityRef.current !== null && !isSyncingRef.current) {
        console.log(`🔄 [ProductCard] Route changing with pending update for ${name}, syncing immediately`)
        forceSyncPending()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('routeChangeStart', handleRouteChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('routeChangeStart', handleRouteChange)
    }
  }, [forceSyncPending, name])

  const handleAddToCart = () => {
    console.log(`🔍 [ProductCard] handleAddToCart called: cartLoading=${cartLoading}, displayQuantity=${displayQuantity}`)
    
    // Check if item can be ordered based on stock status
    if (!stockStatus.canOrder) {
      console.log(`🚫 [ProductCard] Cannot add ${name} to cart: ${stockStatus.message}`)
      return
    }
    
    // Check if adding would exceed available stock
    if (hasStock && stockQuantity > 0 && displayQuantity >= stockQuantity) {
      console.log(`🚫 [ProductCard] Cannot add ${name} to cart: would exceed stock (${displayQuantity}/${stockQuantity})`)
      return
    }
    
    const newQuantity = displayQuantity + 1
    
    console.log(`🛒 [ProductCard] Immediate UI update: ${name} quantity ${displayQuantity} → ${newQuantity}`)
    
    // Update UI immediately regardless of cart loading state
    setDisplayQuantity(newQuantity)

    // Queue the backend update (this will handle cart loading internally)
    queueUpdate(newQuantity)
  }

  const handleRemoveFromCart = () => {
    console.log(`🔍 [ProductCard] handleRemoveFromCart called: cartLoading=${cartLoading}, displayQuantity=${displayQuantity}`)
    if (displayQuantity <= 0) {
      console.log(`🚫 [ProductCard] Blocked by displayQuantity=${displayQuantity}`)
      return
    }
    
    const newQuantity = displayQuantity - 1
    
    console.log(`🛒 [ProductCard] Immediate UI update: ${name} quantity ${displayQuantity} → ${newQuantity}`)
    
    // Update UI immediately regardless of cart loading state
    setDisplayQuantity(newQuantity)

    // Queue the backend update (this will handle cart loading internally)
    queueUpdate(newQuantity)
  }

  const discount = useMemo(() => {
    // Convert string values to numbers if needed
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    const numMrp = typeof mrp === 'string' ? parseFloat(mrp) : mrp
    
    console.log(`🔍 [ProductCard] Discount calculation for ${name}:`, {
      originalPrice: price,
      originalMrp: mrp,
      convertedPrice: numPrice,
      convertedMrp: numMrp,
      priceType: typeof price,
      mrpType: typeof mrp
    })
    
    // Ensure both price and mrp are valid numbers
    if (!numMrp || !numPrice || typeof numMrp !== 'number' || typeof numPrice !== 'number') {
      console.log(`❌ [ProductCard] Invalid data for ${name}: price=${numPrice}, mrp=${numMrp}`)
      return 0
    }
    
    // MRP must be greater than selling price for a valid discount
    if (numMrp <= numPrice) {
      console.log(`❌ [ProductCard] No discount for ${name}: MRP (${numMrp}) <= Price (${numPrice})`)
      return 0
    }
    
    // Calculate discount percentage: ((MRP - Selling Price) / MRP) * 100
    const discountPercentage = ((numMrp - numPrice) / numMrp) * 100
    
    // Round to nearest integer and ensure it's between 0-100
    const finalDiscount = Math.min(Math.max(Math.round(discountPercentage), 0), 100)
    
    // Debug logging for discount calculation
    if (finalDiscount > 0) {
      console.log(`💰 [ProductCard] Discount calculated for ${name}: MRP ₹${numMrp} → Price ₹${numPrice} = ${finalDiscount}% off`)
    }
    
    return finalDiscount
  }, [mrp, price, name])

  // Calculate stock status
  const stockStatus = useMemo(() => {
    // If vendor is offline, override all other statuses
    if (!isVendorOnline) {
      return { status: 'vendor_offline', message: 'Vendor Offline', canOrder: false }
    }
    
    if (status === 'out_of_stock') {
      return { status: 'out_of_stock', message: 'Out of Stock', canOrder: false }
    }
    
    if (status === 'inactive') {
      return { status: 'inactive', message: 'Unavailable', canOrder: false }
    }
    
    if (!hasStock) {
      return { status: 'no_stock_tracking', message: '', canOrder: true }
    }
    
    if (stockQuantity <= 0) {
      return { status: 'out_of_stock', message: 'Out of Stock', canOrder: false }
    }
    
    if (stockQuantity <= 5) {
      return { 
        status: 'low_stock', 
        message: `Only ${stockQuantity} ${stockUnit} left!`, 
        canOrder: true 
      }
    }
    
    return { 
      status: 'in_stock', 
      message: `${stockQuantity} ${stockUnit} available`, 
      canOrder: true 
    }
  }, [hasStock, stockQuantity, stockUnit, status, isVendorOnline])

  return (
    <motion.div
      className={`bg-card rounded-2xl overflow-hidden shadow-sm border border-border ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      data-product-name={name}
      data-price={price}
      data-mrp={mrp}
      data-discount={discount}
    >
      {/* Image Section */}
      <div className="relative h-24 bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="text-muted-foreground text-[10px]">No Image</div>
          </div>
        )}
        
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] px-2 py-1 rounded font-semibold shadow-sm">
            {discount}% OFF
          </div>
        )}
        
        {/* Stock Status Badge */}
        {stockStatus.status === 'out_of_stock' && (
          <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] px-2 py-1 rounded font-semibold shadow-sm">
            Out of Stock
          </div>
        )}
        {stockStatus.status === 'low_stock' && (
          <div className="absolute top-2 right-2 bg-foreground/80 text-background text-[10px] px-2 py-1 rounded font-semibold shadow-sm">
            Low Stock
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 space-y-1">
        {/* Title */}
        <h2 className="font-bold text-[14px] text-foreground line-clamp-1 truncate">
          {name}
        </h2>

        {/* Description
        {description && (
          <p className="text-[10px] text-neutral-600 dark:text-neutral-400 line-clamp-2 truncate">
            {description}
          </p>
        )} */}

        {/* Vendor Name */}
        {vendorName && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground">
              by
            </span>
            <span className="text-[9px] text-muted-foreground font-medium truncate">
              {vendorName}
            </span>
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-center pt-2 gap-2">
          <span className="font-bold text-[16px] text-foreground">
            ₹{price}
          </span>
          {mrp && mrp > price && (
            <>
              <span className="text-[10px] text-muted-foreground line-through">
                ₹{mrp}
              </span>
              {discount > 0 && (
                <span className="text-[9px] text-muted-foreground font-medium">
                  {discount}% off
                </span>
              )}
            </>
          )}
        </div>

        {/* Add to Cart Section */}
        <div className="flex items-center justify-between pt-1">
          {/* Stock Status Display */}
          <div className="text-[10px] text-muted-foreground">
            {stockStatus.status === 'vendor_offline' ? (
              <span className="text-muted-foreground font-medium">
                Vendor Offline
              </span>
            ) : stockStatus.status === 'out_of_stock' ? (
              <span className="text-destructive font-medium">
                {stockStatus.message}
              </span>
            ) : stockStatus.status === 'low_stock' ? (
              <span className="text-foreground font-medium">
                {stockStatus.message}
              </span>
            ) : stockStatus.status === 'in_stock' ? (
              <span className="text-muted-foreground">
                {stockStatus.message}
              </span>
            ) : (
              <span>Available</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center pt-1">
          {!isVendorOnline ? (
            /* Vendor Offline State */
            <div className="w-full px-3 py-1.5 rounded-xl text-center bg-muted border border-border">
              <div className="text-[10px] font-medium text-foreground">
                Vendor Offline
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                Check back soon
              </div>
            </div>
          ) : displayQuantity === 0 ? (
            <motion.button
              onClick={handleAddToCart}
              disabled={!stockStatus.canOrder}
              className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-colors w-full ${
                !stockStatus.canOrder
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-foreground text-background hover:bg-foreground/90'
              }`}
              whileHover={stockStatus.canOrder ? { scale: 1.05 } : {}}
              whileTap={stockStatus.canOrder ? { scale: 0.95 } : {}}
            >
              <Plus className="h-3 w-3" />
              {stockStatus.status === 'out_of_stock' ? 'Out of Stock' : 'Add'}
            </motion.button>
          ) : (
            <div className="flex items-center justify-center gap-2 w-full">
              <motion.button
                onClick={handleRemoveFromCart}
                className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Minus className="h-3 w-3 text-foreground" />
              </motion.button>
              
              <span className="text-[14px] font-medium text-foreground min-w-[20px] text-center">
                {displayQuantity}
              </span>
              
              <motion.button
                onClick={handleAddToCart}
                disabled={!stockStatus.canOrder || (hasStock && displayQuantity >= stockQuantity)}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  !stockStatus.canOrder || (hasStock && displayQuantity >= stockQuantity)
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-foreground hover:bg-foreground/90'
                }`}
                whileHover={
                  stockStatus.canOrder && (!hasStock || displayQuantity < stockQuantity) 
                    ? { scale: 1.1 } 
                    : {}
                }
                whileTap={
                  stockStatus.canOrder && (!hasStock || displayQuantity < stockQuantity) 
                    ? { scale: 0.9 } 
                    : {}
                }
              >
                <Plus className={`h-3 w-3 ${
                  !stockStatus.canOrder || (hasStock && displayQuantity >= stockQuantity)
                    ? 'text-muted-foreground'
                    : 'text-background'
                }`} />
              </motion.button>
            </div>
          )}
          
          
        </div>

      </div>
    </motion.div>
  )
}
