"use client"

import { motion } from "framer-motion"
import { Plus, Minus } from "lucide-react"
import { useState, useEffect } from "react"
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
}

export function ProductCard({
  id,
  name,
  description,
  price,
  mrp,
  imageUrl,
  onAddToCart,
  className = ""
}: ProductCardProps) {
  const { cart, addToCart, updateQuantity, removeFromCart, isLoading: cartLoading } = useCart()
  const [quantity, setQuantity] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Update quantity from cart
  useEffect(() => {
    const cartItem = cart.items.find(item => item.menuItemId === id)
    setQuantity(cartItem?.quantity || 0)
  }, [cart.items, id])

  const handleAddToCart = async () => {
    if (isLoading || cartLoading) return
    
    setIsLoading(true)
    const newQuantity = quantity + 1
    const success = await addToCart(id, 1)
    
    if (success) {
      onAddToCart?.(id, newQuantity)
    }
    setIsLoading(false)
  }

  const handleRemoveFromCart = async () => {
    if (quantity <= 0 || isLoading || cartLoading) return
    
    setIsLoading(true)
    const newQuantity = quantity - 1
    let success = false
    
    // Double-check if item still exists in cart
    const cartItem = cart.items.find(item => item.menuItemId === id)
    if (!cartItem) {
      console.warn(`Item ${id} not found in cart, skipping remove operation`)
      setIsLoading(false)
      return
    }
    
    if (newQuantity === 0) {
      // Remove item completely
      success = await removeFromCart(id)
    } else {
      // Update quantity
      success = await updateQuantity(id, newQuantity)
    }
    
    if (success) {
      onAddToCart?.(id, newQuantity)
    }
    setIsLoading(false)
  }

  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

  return (
    <motion.div
      className={`bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800 ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Image Section */}
      <div className="relative h-24 bg-neutral-100 dark:bg-neutral-800">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-neutral-200 dark:bg-neutral-700">
            <div className="text-neutral-400 text-xs">No Image</div>
          </div>
        )}
        
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            {discount}% OFF
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <h3 className="font-bold text-sm text-black dark:text-white line-clamp-1">
          {name}
        </h3>

        {/* Description */}
        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
          {description}
        </p>

        {/* Price Section */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-black dark:text-white">
            ₹{price}
          </span>
          {mrp && mrp > price && (
            <span className="text-xs text-neutral-500 line-through">
              ₹{mrp}
            </span>
          )}
        </div>

        {/* Add to Cart Section */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            2 pcs. {/* This could be dynamic */}
          </div>
          
          {quantity === 0 ? (
            <motion.button
              onClick={handleAddToCart}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white rounded-xl text-xs font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="h-3 w-3" />
              {isLoading ? "Adding..." : "Add"}
            </motion.button>
          ) : (
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleRemoveFromCart}
                disabled={isLoading}
                className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Minus className="h-3 w-3 text-black dark:text-white" />
              </motion.button>
              
              <span className="text-sm font-medium text-black dark:text-white min-w-[20px] text-center">
                {quantity}
              </span>
              
              <motion.button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Plus className="h-3 w-3 text-white dark:text-black" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
