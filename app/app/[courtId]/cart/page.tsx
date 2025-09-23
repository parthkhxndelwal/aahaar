"use client"
import { use, useEffect, useState, useMemo } from "react"
import { useCart } from "@/contexts/cart-context"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, Trash2, ArrowRight, MapPin, ArrowLeft, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { useAppAuth } from "@/contexts/app-auth-context"
import Image from "next/image"
import { useRouter } from "next/navigation"
import DummyPaymentGateway from "@/components/app/dummy-payment-gateway"
import { CartItem } from "@/components/app/cart-item"
import { useCartValidation } from "@/hooks/use-cart-validation"


// Type definitions
interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  vendorId: string;
  vendorName?: string;
  imageUrl?: string;
  customizations?: any;
}

interface VendorGroup {
  vendorId: string;
  vendorName: string;
  items: any[];
  totalAmount: number;
}

// Enhanced transformation function using your fee calculation
function transformOrderWithFeeCalculation(orderItems: CartItem[]) {
    // Group items by vendor first
    const vendorGroups: Record<string, VendorGroup> = {};
    
    orderItems.forEach((item: CartItem) => {
        if (!vendorGroups[item.vendorId]) {
            vendorGroups[item.vendorId] = {
                vendorId: item.vendorId,
                vendorName: item.vendorName || 'Unknown Vendor',
                items: [],
                totalAmount: 0
            };
        }
        
        const itemTotal = item.price * item.quantity;
        vendorGroups[item.vendorId].items.push({
            itemId: item.menuItemId,
            itemName: item.name,
            price: item.price * 100, // Convert to paise
            quantity: item.quantity,
            customizations: item.customizations,
            imageUrl: item.imageUrl
        });
        vendorGroups[item.vendorId].totalAmount += itemTotal;
    });

    // Calculate vendor amounts for fee calculation
    const totalAmount = orderItems.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
    const vendorAmounts = Object.values(vendorGroups).map((group: VendorGroup) => group.totalAmount);
    
    // Use your fee calculation logic
    const feeCalculation = calculateSplit(totalAmount, vendorAmounts);
    
    // Create vendors object with account IDs to be populated
    const vendors: Record<string, any> = {};
    Object.values(vendorGroups).forEach((group: VendorGroup) => {
        vendors[group.vendorId] = {
            name: group.vendorName,
            accountId: null, // To be populated from database
            originalAmount: group.totalAmount * 100, // Convert to paise
            deduction: (group.totalAmount * 0.03) * 100, // 3% deduction in paise
            finalPayout: (group.totalAmount * 0.97) * 100 // Final payout in paise
        };
    });

    // Transform all items for Route compatibility
    const transformedItems: any[] = [];
    Object.values(vendorGroups).forEach((group: VendorGroup) => {
        transformedItems.push(...group.items);
    });

    return {
        vendors,
        items: transformedItems,
        feeBreakdown: feeCalculation,
        baseAmount: totalAmount * 100, // in paise
        customerPayable: parseFloat(feeCalculation.totals.customerPays) * 100, // in paise
        platformRevenue: parseFloat(feeCalculation.totals.platformKeeps) * 100, // in paise
        razorpayFee: parseFloat(feeCalculation.totals.razorpayFee) * 100 // in paise
    };
}

// Your existing fee calculation function (unchanged)
const RAZORPAY_FEE_RATE = 0.02;
const GST_RATE = 0.18;
const PLATFORM_DEDUCTION_RATE = 0.06;

function calculateSplit(totalAmount: number, vendorAmounts: number[]) {
    const razorpayFee = totalAmount * RAZORPAY_FEE_RATE;
    const razorpayFeeWithGST = razorpayFee * (1 + GST_RATE);
    
    const totalDeduction = totalAmount * PLATFORM_DEDUCTION_RATE;
    const customerPay = totalAmount * (1 + PLATFORM_DEDUCTION_RATE / 2);
    
    const vendorPayouts = vendorAmounts.map((amount: number) => {
        const deduction = amount * (PLATFORM_DEDUCTION_RATE / 2);
        return {
            vendorAmount: amount,
            deduction,
            payout: amount - deduction
        };
    });
    
    const platformShare = totalDeduction - razorpayFeeWithGST;
    
    const customerBill = {
        baseAmount: totalAmount,
        platformCharge: totalAmount * (PLATFORM_DEDUCTION_RATE / 2),
        totalPayable: customerPay
    };
    
    const vendorBills = vendorPayouts.map((bill, i: number) => ({
        Vendor: `Vendor ${i + 1}`,
        Item_Value: `₹${bill.vendorAmount.toFixed(2)}`,
        Deduction: `₹${bill.deduction.toFixed(2)}`,
        Final_Payout: `₹${bill.payout.toFixed(2)}`
    }));
    
    return {
        totals: {
            totalAmount,
            customerPays: customerPay.toFixed(2),
            razorpayFee: razorpayFeeWithGST.toFixed(2),
            platformKeeps: platformShare.toFixed(2)
        },
        customerBill: {
            Base_Price: `₹${customerBill.baseAmount.toFixed(2)}`,
            Platform_Charge: `₹${customerBill.platformCharge.toFixed(2)}`,
            Total_Payable: `₹${customerBill.totalPayable.toFixed(2)}`
        },
    vendorBills: vendorPayouts.map((bill, i: number) => ({
      Vendor: `Vendor ${i + 1}`,
      Item_Value: `₹${bill.vendorAmount.toFixed(2)}`,
      Deduction: `₹${bill.deduction.toFixed(2)}`,
      Final_Payout: `₹${bill.payout.toFixed(2)}`
    }))
    };
}

export default function CartPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const { cart, isLoading, hasActiveOrder, activeOrderError, checkActiveOrders } = useCart()
  const { user, token } = useAppAuth()
  const { isCartValid, hasInvalidItems, validateCart, getItemIssues, isItemValid } = useCartValidation(courtId)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showPaymentGateway, setShowPaymentGateway] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set())
  const router = useRouter()

  // Memoized transformed order preview (used to show accurate to-pay amount)
  const transformedOrderPreview = useMemo(() => {
    try {
      return transformOrderWithFeeCalculation(cart.items || [])
    } catch (e) {
      console.error('Error computing transformed order preview', e)
      return null
    }
  }, [cart.items])

  // customerPayable in rupees when available; fallback to undefined so UI can choose totalAmount later
  const customerPayableRupees = transformedOrderPreview?.customerPayable ? transformedOrderPreview.customerPayable / 100 : undefined

  // Total to pay will be computed after totalAmount is known (see below)

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
  const serviceCharge = itemTotal * 0.05 // 5% Service Charge
  const platformCharge = 5 // ₹5 Platform Charge
  // GST is pre-included in menu item prices
  const totalAmount = itemTotal + serviceCharge + platformCharge

  // Total to pay = customerPayable + platform fee + razorpay charge (all stored in paise in preview)
  const toPayTotalRupees = transformedOrderPreview
    ? ((transformedOrderPreview.customerPayable || 0) + (transformedOrderPreview.platformRevenue || 0) + (transformedOrderPreview.razorpayFee || 0)) / 100
    : totalAmount

  // Get unique vendor names from cart items
  const uniqueVendorNames = [...new Set(cart.items.map(item => item.vendorName).filter(Boolean))]
  const vendorText = uniqueVendorNames.length > 0 
    ? `Picking up at ${uniqueVendorNames.join(', ')}`
    : 'No vendors selected'

  const handleRemoveItem = (menuItemId: string) => {
    // Add to removed items to hide from UI while backend sync happens
    setRemovedItems(prev => new Set([...prev, menuItemId]))
  }

  const handleBackNavigation = () => {
    router.push(`/app/${courtId}`)
  }

  const handleCheckout = async () => {
    if (!user || !token) return

    console.table(cart)

    // Transform cart items with fee calculation
    const transformedOrder = transformOrderWithFeeCalculation(cart.items)
    console.table(transformedOrder)

    // Check for active orders before proceeding
    if (hasActiveOrder) {
      alert(activeOrderError || "You have an active order. Please wait for it to complete before placing a new order.")
      return
    }

    setCheckoutLoading(true)
    try {
      // Validate cart items before proceeding with checkout
      console.log("🔍 Validating cart items...")
      const validationResponse = await fetch(`/api/app/${courtId}/cart/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const validationData = await validationResponse.json()
      
      if (!validationResponse.ok) {
        console.error("Cart validation failed:", validationData.message)
        alert(validationData.message || "Failed to validate cart items. Please try again.")
        return
      }

      if (!validationData.valid) {
        console.error("Cart has invalid items:", validationData)
        
        // Create detailed error message
        let errorMessage = "Some items in your cart are no longer available:\n\n"
        
        if (validationData.summary.offlineVendors.length > 0) {
          errorMessage += `🔴 Offline Vendors: ${validationData.summary.offlineVendors.join(", ")}\n`
        }
        
        if (validationData.summary.unavailableItems.length > 0) {
          errorMessage += `❌ Unavailable Items: ${validationData.summary.unavailableItems.join(", ")}\n`
        }
        
        if (validationData.summary.stockIssues.length > 0) {
          errorMessage += `📦 Stock Issues:\n`
          validationData.summary.stockIssues.forEach((issue: any) => {
            errorMessage += `   • ${issue.name}: Only ${issue.available} available (you requested ${issue.requested})\n`
          })
        }
        
        errorMessage += "\nPlease remove these items or wait for vendors to come back online."
        
        alert(errorMessage)
        return
      }

      console.log("✅ Cart validation passed, proceeding with checkout...")
      
      // Proceed with checkout if validation passes
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

      const data = await response.json()
      if (!response.ok) {
        console.error("Checkout request failed:", response.status, data.message)
        alert(data.message || "Checkout failed. Please try again.")
        if (response.status === 400 && data.message?.includes("active order")) {
          await checkActiveOrders()
        }
        return
      }

      if (!data.success) {
        console.error("Checkout failed:", data.message)
        alert(data.message || "Checkout failed. Please try again.")
        return
      }

      // Save order data locally
      setOrderData(data.data)

      // If server returned razorpay order info, open Razorpay Checkout
      if (data.data?.razorpayOrderId) {
        try {
          await loadRazorpayScript()
          await openRazorpayCheckout({
            razorpayOrderId: data.data.razorpayOrderId,
            amount: data.data.razorpayOrderAmount,
            localOrderId: data.data?.orders?.[0]?.id || data.data?.orders?.[0]?.orderNumber || data.data?.parentOrderId,
          })
          // On success, navigate to a success page or refresh orders
          router.push(`/app/${courtId}/orders`)
        } catch (err) {
          console.error("Payment failed or cancelled:", err)
          alert("Payment failed or cancelled")
        }
      } else {
        // Fallback to existing dummy gateway behavior
        setShowPaymentGateway(true)
      }

    } catch (error) {
      console.error("Checkout error:", error)
      alert("Checkout error. Please try again.")
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Load Razorpay SDK script
  const loadRazorpayScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === "undefined") return reject(new Error("window is undefined"))
      if (document.getElementById("razorpay-checkout-script")) return resolve()
      const script = document.createElement("script")
      script.id = "razorpay-checkout-script"
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK"))
      document.body.appendChild(script)
    })
  }

  // Open Razorpay Checkout
  const openRazorpayCheckout = ({ razorpayOrderId, amount, localOrderId }: { razorpayOrderId: string, amount: number, localOrderId: string }) => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === "undefined") return reject(new Error("window is undefined"))
      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || (window as any).__RAZORPAY_KEY_ID || "",
        amount,
        currency: "INR",
        name: "Aahaar",
        description: "Order Payment",
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            // Verify payment on server
            await fetch(`/api/razorpay/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                localOrderId,
              }),
            })
            resolve()
          } catch (err) {
            reject(err)
          }
        },
        prefill: {
          name: user?.fullName || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        notes: { localOrderId },
        theme: { color: "#22c55e" },
      }

      // Diagnostic log: preview the key used by client (first 8 chars) and NODE_ENV
      try {
        // eslint-disable-next-line no-console
        console.log('Razorpay Checkout - client keyPreview=', (options.key || '').toString().slice(0,8), 'NODE_ENV=', process.env.NODE_ENV)
      } catch (e) {}

      const rzp = new (window as any).Razorpay(options)
      rzp.on("payment.failed", function (resp: any) {
        reject(resp)
      })
      rzp.open()
    })
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

      {/* Warning Banner for Invalid Items */}
      {hasInvalidItems && (
        <motion.div
          className="mx-4 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Cart validation issues detected
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Some items may not be available for checkout. Please review marked items below.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cart Items */}
      <motion.div 
        className="flex-1 px-4 py-4 space-y-4 w-full overflow-y-auto overflow-x-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="popLayout">
          {cart.items.filter(item => !removedItems.has(item.menuItemId)).map((item, index) => (
            <CartItem
              key={item.menuItemId}
              item={item}
              index={index}
              onRemove={handleRemoveItem}
              isLoading={isLoading}
              isValid={isItemValid(item.menuItemId)}
              validationIssues={getItemIssues(item.menuItemId)}
            />
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
                ₹{Number((toPayTotalRupees !== undefined ? toPayTotalRupees : totalAmount) || 0).toFixed(2)}
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
                  <span className="text-neutral-600 dark:text-neutral-400">Item Total (Incl. GST)</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{transformedOrderPreview ? transformedOrderPreview.feeBreakdown?.customerBill?.Base_Price || `₹${(transformedOrderPreview.baseAmount/100).toFixed(2)}` : `₹${Number(itemTotal || 0).toFixed(2)}`}</span>
                </motion.div>
                <motion.div 
                  className="flex justify-between"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-neutral-600 dark:text-neutral-400">Service Charge</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{transformedOrderPreview ? `₹${(transformedOrderPreview.razorpayFee/100).toFixed(2)}` : `₹0.00`}</span>
                </motion.div>
                <motion.div 
                  className="flex justify-between"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <span className="text-neutral-600 dark:text-neutral-400">Platform charges</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{(() => {
                    if (!transformedOrderPreview) return `₹${platformCharge.toFixed(2)}`
                    const customerPlatform = (transformedOrderPreview.customerPayable - transformedOrderPreview.baseAmount) / 100
                    const platformRevenue = (transformedOrderPreview.platformRevenue || 0) / 100
                    return `₹${(customerPlatform + platformRevenue).toFixed(2)}`
                  })()}</span>
                </motion.div>
                <motion.div 
                  className="border-t border-neutral-200 dark:border-neutral-700 pt-3"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-neutral-900 dark:text-white">Total Amount</span>
                    <span className="text-neutral-900 dark:text-white">₹{(toPayTotalRupees !== undefined ? toPayTotalRupees : totalAmount).toFixed(2)}</span>
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
          ) : hasInvalidItems ? (
            <div className="w-full space-y-3">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="text-amber-800 dark:text-amber-200 text-sm font-medium">
                  ⚠️ Cart Issues Detected
                </div>
                <div className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                  Some items are no longer available. Please remove invalid items to proceed.
                </div>
              </div>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 transition-colors"
                onClick={() => validateCart()}
                disabled={checkoutLoading}
              >
                Re-validate Cart
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
