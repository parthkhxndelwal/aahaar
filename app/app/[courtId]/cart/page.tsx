"use client"
import { use, useEffect, useState } from "react"
import { useCart } from "@/contexts/cart-context"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, Trash2, ArrowRight, MapPin, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { useAppAuth } from "@/contexts/app-auth-context"
import Image from "next/image"
import { useRouter } from "next/navigation"
import DummyPaymentGateway from "@/components/app/dummy-payment-gateway"

export default function CartPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const { cart, updateQuantity, removeFromCart, isLoading, hasActiveOrder, activeOrderError, checkActiveOrders } = useCart()
  const { user, token } = useAppAuth()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showPaymentGateway, setShowPaymentGateway] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const router = useRouter()

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  }

  const pageTransition = {
    type: "tween" as const,
    ease: "anticipate" as const,
    duration: 0.4
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user || !token) {
      // Use Next.js router with return URL parameter
      router.push(`/app/${courtId}/login?returnTo=${encodeURIComponent(`/app/${courtId}/cart`)}`)
    }
  }, [user, token, courtId, router])

  // Check for active orders when cart page loads
  useEffect(() => {
    if (user && token) {
      checkActiveOrders()
    }
  }, [user, token, checkActiveOrders])

  // Calculate charges
  const itemTotal = cart.total
  const gst = itemTotal * 0.18 // 18% GST
  const serviceCharge = itemTotal * 0.05 // 5% Service Charge
  const platformCharge = 5 // ₹5 Platform Charge
  const totalAmount = itemTotal + gst + serviceCharge + platformCharge

  // Get unique vendor names from cart items
  const uniqueVendorNames = [...new Set(cart.items.map(item => item.vendorName).filter(Boolean))]
  const vendorText = uniqueVendorNames.length > 0 
    ? `Picking up at ${uniqueVendorNames.join(', ')}`
    : 'No vendors selected'

  const handleQuantityChange = async (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(menuItemId)
    } else {
      await updateQuantity(menuItemId, newQuantity)
    }
  }

  const handleRemoveItem = async (menuItemId: string) => {
    await removeFromCart(menuItemId)
  }

  const handleBackNavigation = () => {
    router.push(`/app/${courtId}`)
  }

  const handleCheckout = async () => {
    if (!user || !token) return

    // Check for active orders before proceeding
    if (hasActiveOrder) {
      alert(activeOrderError || "You have an active order. Please wait for it to complete before placing a new order.")
      return
    }

    setCheckoutLoading(true)
    try {
      const response = await fetch(`/api/app/${courtId}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod: "online",
          specialInstructions: "",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setOrderData(data.data)
          setShowPaymentGateway(true)
        } else {
          console.error("Checkout failed:", data.message)
          alert(data.message || "Checkout failed. Please try again.")
        }
      } else {
        const errorData = await response.json()
        console.error("Checkout request failed:", response.status, errorData.message)
        alert(errorData.message || "Checkout failed. Please try again.")
        
        // If it's an active order error, refresh the active order check
        if (response.status === 400 && errorData.message?.includes("active order")) {
          await checkActiveOrders()
        }
      }
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handlePaymentComplete = (paymentResult: any) => {
    // Payment completed, will be redirected by the payment gateway
    setShowPaymentGateway(false)
  }

  const handlePaymentCancel = () => {
    setShowPaymentGateway(false)
  }

  if (showPaymentGateway && orderData) {
    return (
      <DummyPaymentGateway
        amount={orderData.totalAmount}
        orderData={orderData}
        courtId={courtId}
        onPaymentComplete={handlePaymentComplete}
        onCancel={handlePaymentCancel}
      />
    )
  }

  if (cart.items.length === 0) {
    return (
      <motion.div 
        className="h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4 w-full max-w-full overflow-hidden"
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
        transition={pageTransition}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center w-full max-w-sm"
        >
          <motion.div 
            className="w-24 h-24 mx-auto mb-4 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="text-4xl">🛒</span>
          </motion.div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Your cart is empty</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-sm">Add some delicious items to get started!</p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={handleBackNavigation}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col w-full max-w-full overflow-hidden"
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
    >
      {/* Header */}
      <motion.div 
        className="bg-white dark:bg-neutral-950 shadow-sm sticky top-0 z-10 w-full border-b border-neutral-200 dark:border-neutral-900 rounded-2xl"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="px-4 py-4 w-full flex items-center gap-3 overflow-hidden">
          <motion.button
            onClick={handleBackNavigation}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white truncate">Your Cart</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">{cart.items.length} items</p>
          </div>
        </div>
      </motion.div>

      {/* Cart Items */}
      <motion.div 
        className="flex-1 px-4 py-4 space-y-4 w-full overflow-y-auto overflow-x-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="popLayout">
          {cart.items.map((item, index) => (
            <motion.div
              key={item.menuItemId}
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
              <div className="flex gap-3 w-full min-w-0">
                {/* Item Image */}
                <motion.div 
                  className="relative w-16 h-16 flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Image
                    src={item.imageUrl || "/placeholder.jpg"}
                    alt={item.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </motion.div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2 min-w-0">
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
                        onClick={() => handleRemoveItem(item.menuItemId)}
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
                          onClick={() => handleQuantityChange(item.menuItemId, item.quantity - 1)}
                          disabled={isLoading}
                          className="h-7 w-7 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </motion.div>
                      <motion.span 
                        className="mx-1 min-w-[20px] text-center font-medium text-sm text-neutral-900 dark:text-white"
                        key={item.quantity}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        {item.quantity}
                      </motion.span>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.menuItemId, item.quantity + 1)}
                          disabled={isLoading}
                          className="h-7 w-7 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    </motion.div>

                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-semibold text-neutral-900 dark:text-white text-sm">₹{Number(item.subtotal || 0).toFixed(2)}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">₹{Number(item.price || 0).toFixed(2)} each</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* To-Pay Button */}
      <motion.div 
        className="px-4 py-4 bg-white dark:bg-neutral-950 w-full"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white dark:bg-neutral-900 dark:text-white rounded-lg py-4 px-4 flex items-center justify-between font-medium hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              <span className="font-medium">To Pay</span>
              <div className="w-auto flex flex-row gap-2 font-bold">
                ₹{Number(totalAmount || 0).toFixed(2)}
                <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.div>
              </div>
            </motion.button>
          </DrawerTrigger>
          <DrawerContent className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
            <DrawerHeader>
              <DrawerTitle className="text-neutral-900 dark:text-white">Bill Summary</DrawerTitle>
            </DrawerHeader>
            <motion.div 
              className="px-4 pb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="space-y-3">
                <motion.div 
                  className="flex justify-between"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="text-neutral-600 dark:text-neutral-400">Item Total</span>
                  <span className="font-medium text-neutral-900 dark:text-white">₹{Number(itemTotal || 0).toFixed(2)}</span>
                </motion.div>
                <motion.div 
                  className="flex justify-between"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <span className="text-neutral-600 dark:text-neutral-400">GST (18%)</span>
                  <span className="font-medium text-neutral-900 dark:text-white">₹{Number(gst || 0).toFixed(2)}</span>
                </motion.div>
                <motion.div 
                  className="flex justify-between"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-neutral-600 dark:text-neutral-400">Service Charge (5%)</span>
                  <span className="font-medium text-neutral-900 dark:text-white">₹{serviceCharge.toFixed(2)}</span>
                </motion.div>
                <motion.div 
                  className="flex justify-between"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <span className="text-neutral-600 dark:text-neutral-400">Platform Charge</span>
                  <span className="font-medium text-neutral-900 dark:text-white">₹{platformCharge.toFixed(2)}</span>
                </motion.div>
                <motion.div 
                  className="border-t border-neutral-200 dark:border-neutral-700 pt-3"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-neutral-900 dark:text-white">Total Amount</span>
                    <span className="text-neutral-900 dark:text-white">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </DrawerContent>
        </Drawer>
      </motion.div>

      {/* Pickup Location and Checkout */}
      <motion.div 
        className="bg-white dark:bg-neutral-950 border mb-3 border-neutral-200 dark:border-neutral-800 px-4 py-4 w-full"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div 
          className="flex items-center justify-between mb-4 w-full min-w-0"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <MapPin className="h-4 w-4 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
            </motion.div>
            <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate">{vendorText}</span>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="outline" 
              size="sm"
              className="ml-2 flex-shrink-0 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              onClick={() => {
                // Placeholder for "See Where" functionality
                console.log("See where clicked - not implemented yet")
              }}
            >
              See Where
            </Button>
          </motion.div>
        </motion.div>
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: hasActiveOrder ? 1 : 1.02 }}
          whileTap={{ scale: hasActiveOrder ? 1 : 0.98 }}
        >
          {hasActiveOrder ? (
            <div className="w-full space-y-3">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                  ⚠️ Active Order Found
                </div>
                <div className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                  {activeOrderError}
                </div>
              </div>
              <Button
                className="w-full bg-gray-400 cursor-not-allowed text-white font-medium py-3"
                disabled={true}
              >
                Checkout Disabled - Active Order
              </Button>
            </div>
          ) : (
            <Button
              className="w-full bg-neutral-600 hover:bg-neutral-700 dark:bg-neutral-100 dark:hover:bg-neutral-50 text-white dark:text-black font-medium py-3 transition-colors"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? "Processing..." : "Proceed to Checkout"}
            </Button>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
