"use client"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Minus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import Image from "next/image"

interface CartPageProps {
  params: Promise<{ courtId: string }>
}

export default function CartPage({ params }: CartPageProps) {
  const router = useRouter()
  const { cart, updateQuantity, removeFromCart, clearCart, isLoading } = useCart()
  
  const handleGoBack = () => {
    router.back()
  }

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(itemId)
    } else {
      await updateQuantity(itemId, newQuantity)
    }
  }

  const handleCheckout = async () => {
    const { courtId } = await params
    // Navigate to checkout page
    router.push(`/app/${courtId}/checkout`)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-4 py-4">
        <div className="flex items-center gap-4">
          <motion.button
            onClick={handleGoBack}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="h-5 w-5 text-black dark:text-white" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-black dark:text-white">Your Cart</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
      </div>

      {/* Cart Content */}
      <div className="px-4 py-6">
        {cart.items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 mx-auto mb-4 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-neutral-400"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m-2-4h8a2 2 0 012 2v2a2 2 0 01-2 2h-8a2 2 0 01-2-2V9a2 2 0 012-2z" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Your cart is empty
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Add some delicious items to get started
            </p>
            <motion.button
              onClick={handleGoBack}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Shopping
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {cart.items.map((item, index) => (
                <motion.div
                  key={item.menuItemId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-black dark:text-white mb-1 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        ₹{item.price} each
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.button
                            onClick={() => handleQuantityChange(item.menuItemId, item.quantity - 1)}
                            disabled={isLoading}
                            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {item.quantity === 1 ? (
                              <Trash2 className="h-4 w-4 text-red-500" />
                            ) : (
                              <Minus className="h-4 w-4 text-black dark:text-white" />
                            )}
                          </motion.button>
                          
                          <span className="text-lg font-semibold text-black dark:text-white min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          
                          <motion.button
                            onClick={() => handleQuantityChange(item.menuItemId, item.quantity + 1)}
                            disabled={isLoading}
                            className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Plus className="h-4 w-4 text-white dark:text-black" />
                          </motion.button>
                        </div>
                        
                        {/* Item Total */}
                        <div className="text-right">
                          <p className="text-lg font-bold text-black dark:text-white">
                            ₹{item.subtotal}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 mt-6"
            >
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">Order Summary</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
                  <span className="text-black dark:text-white">₹{cart.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Delivery Fee</span>
                  <span className="text-black dark:text-white">₹20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Taxes</span>
                  <span className="text-black dark:text-white">₹{Math.round(cart.total * 0.05)}</span>
                </div>
                <hr className="border-neutral-200 dark:border-neutral-800" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-black dark:text-white">Total</span>
                  <span className="text-black dark:text-white">
                    ₹{cart.total + 20 + Math.round(cart.total * 0.05)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Checkout Button - Fixed at bottom */}
      {cart.items.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-20 left-0 right-0 px-4 py-4 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800"
        >
          <motion.button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? "Processing..." : `Proceed to Checkout • ₹${cart.total + 20 + Math.round(cart.total * 0.05)}`}
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
