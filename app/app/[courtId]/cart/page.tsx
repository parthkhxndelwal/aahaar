"use client"
import { use, useEffect, useState, useMemo } from "react"
import { useCart } from "@/contexts/cart-context"
import { ArrowRight, MapPin, ArrowLeft, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
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
  const { cart, isLoading, hasActiveOrder, activeOrderError, checkActiveOrders, clearCart } = useCart()
  const { user, token } = useUnifiedAuth()
  const { isCartValid, hasInvalidItems, validateCart, getItemIssues, isItemValid } = useCartValidation(courtId)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showPaymentGateway, setShowPaymentGateway] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set())
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [transformedOrder, setTransformedOrder] = useState<any>(null)
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user || !token) {
      // Use Next.js router with return URL parameter
      router.push(`/app/${courtId}/login?returnTo=${encodeURIComponent(`/app/${courtId}/cart`)}`)
    }
  }, [user, token, courtId, router])

  // Show payment gateway when payment is successful
  useEffect(() => {
    if (paymentSuccess && orderData) {
      setShowPaymentGateway(true)
    }
  }, [paymentSuccess, orderData])

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

    // Transform cart items with fee calculation (initial creation)
    let transformedOrder = transformOrderWithFeeCalculation(cart.items)
    
    // Log all vendor details for vendors in the current cart
    const vendorIds = [...new Set(cart.items.map(item => item.vendorId))]
    if (vendorIds.length > 0) {
      try {
        const vendorResponse = await fetch(`/api/app/${courtId}/vendors?ids=${vendorIds.join(',')}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const vendorData = await vendorResponse.json()
        
        if (vendorData.success) {
          console.log('All vendor details for current cart:', JSON.stringify(vendorData.data.vendors, null, 2))
          
          // Update transformedOrder with razorpayAccountId from fetched vendor data
          vendorIds.forEach(vendorId => {
            const vendor = vendorData.data.vendors.find((v: any) => v.id === vendorId)
            if (vendor && transformedOrder.vendors[vendorId]) {
              transformedOrder.vendors[vendorId].accountId = vendor.razorpayAccountId || null
            }
          })
          console.log('Updated transformedOrder with razorpayAccountId:', transformedOrder)
        } else {
          console.log('Failed to fetch vendor details:', vendorData)
        }
      } catch (error) {
        console.error('Error fetching vendor details:', error)
      }
    }

    // Set the final transformed order (with or without vendor account IDs)
    setTransformedOrder(transformedOrder)
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

      const validationResponse_json = await validationResponse.json()
      
      if (!validationResponse.ok) {
        console.error("Cart validation failed:", validationResponse_json.message)
        alert(validationResponse_json.message || "Failed to validate cart items. Please try again.")
        return
      }

      // Extract the actual validation data from the response wrapper
      const validationData = validationResponse_json.data

      if (!validationData.valid) {
        console.error("Cart has invalid items:", validationData)
        
        // Create detailed error message
        let errorMessage = "Some items in your cart are no longer available:\n\n"
        
        if (validationData.summary?.offlineVendors?.length > 0) {
          errorMessage += `Offline Vendors: ${validationData.summary.offlineVendors.join(", ")}\n`
        }
        
        if (validationData.summary?.unavailableItems?.length > 0) {
          errorMessage += `Unavailable Items: ${validationData.summary.unavailableItems.join(", ")}\n`
        }
        
        if (validationData.summary?.stockIssues?.length > 0) {
          errorMessage += `Stock Issues:\n`
          validationData.summary.stockIssues.forEach((issue: any) => {
            errorMessage += `   - ${issue.name}: Only ${issue.available} available (you requested ${issue.requested})\n`
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

      // If server returned razorpay order info, redirect to payment page
      if (data.data?.razorpayOrderId) {
        // Store order data in sessionStorage for the callback page
        sessionStorage.setItem('pendingPayment', JSON.stringify({
          razorpayOrderId: data.data.razorpayOrderId,
          amount: data.data.razorpayOrderAmount,
          localOrderId: data.data?.orders?.[0]?.id || data.data?.parentOrderId,
          transformedOrder,
          orderData: data.data,
          courtId,
        }))
        
        // Redirect to our payment page which will handle Razorpay checkout
        router.push(`/app/${courtId}/payment?orderId=${data.data.razorpayOrderId}`)
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
  const openRazorpayCheckout = ({ razorpayOrderId, amount, localOrderId, transformedOrder: passedTransformedOrder, orderData: passedOrderData }: { razorpayOrderId: string, amount: number, localOrderId: string, transformedOrder?: any, orderData?: any }) => {
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

            // Fetch vendor details to get razorpayAccountId and create payout JSON
            console.log('Checking for payout data:', { transformedOrder: !!passedTransformedOrder, orderData: !!passedOrderData })
            if (passedTransformedOrder && passedOrderData) {
              console.log('🔍 [PAYMENT ROUTING] transformedOrder details:', JSON.stringify(passedTransformedOrder, null, 2))
              console.log('🔍 [PAYMENT ROUTING] orderData details:', JSON.stringify(passedOrderData, null, 2))
              console.log('transformedOrder:', passedTransformedOrder)
              console.log('orderData:', passedOrderData)
              const vendorIds = Object.keys(passedTransformedOrder.vendors)
              console.log('vendorIds:', vendorIds)
              const vendorResponse = await fetch(`/api/app/${courtId}/vendors?ids=${vendorIds.join(',')}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
              console.log('vendorResponse status:', vendorResponse.status)
              const vendorData = await vendorResponse.json()
              console.log('vendorData:', vendorData)

              if (vendorData.success) {
                console.log('All vendor details from database:', JSON.stringify(vendorData.data.vendors, null, 2))

                // Update transformedOrder with razorpayAccountId
                const updatedTransformedOrder = { ...passedTransformedOrder }
                vendorIds.forEach(vendorId => {
                  const vendor = vendorData.data.vendors.find((v: any) => v.id === vendorId)
                  if (vendor && updatedTransformedOrder.vendors[vendorId]) {
                    updatedTransformedOrder.vendors[vendorId].accountId = vendor.razorpayAccountId || null
                  }
                })
                setTransformedOrder(updatedTransformedOrder)

                // Create payout JSON
                const payoutData = vendorIds.map(vendorId => {
                  const vendor = vendorData.data.vendors.find((v: any) => v.id === vendorId)
                  const vendorPayout = updatedTransformedOrder.vendors[vendorId]
                  return {
                    vendorId,
                    razorpayAccountId: vendor?.razorpayAccountId || null,
                    amount: vendorPayout.finalPayout, // Already in paise
                  }
                })

                console.log('Updated transformedOrder with razorpayAccountId:', updatedTransformedOrder)
                console.log('Vendor Payout JSON:', JSON.stringify(payoutData, null, 2))

                // Create Razorpay transfers to split payment to vendors (only in production)
                console.log('🚀 [PAYMENT ROUTING] Starting vendor payment distribution process...')
                if (process.env.NODE_ENV === 'development' && payoutData.some(p => p.razorpayAccountId && p.razorpayAccountId.startsWith('acc_'))) {
                  console.log('💼 [PAYMENT ROUTING] Production environment detected - proceeding with Razorpay transfers')
                  try {
                    const transferData = payoutData
                      .filter(p => p.razorpayAccountId && p.razorpayAccountId.startsWith('acc_')) // Only include transfers with valid account IDs
                      .map(payout => ({
                        account: payout.razorpayAccountId,
                        amount: payout.amount,
                        currency: 'INR',
                        notes: {
                          vendorId: payout.vendorId,
                          orderId: localOrderId,
                        },
                        linked_account_notes: ['vendorId'],
                        on_hold: false,
                      }))

                    console.log('🔄 [PAYMENT ROUTING] Creating Razorpay transfers via Orders API...')
                    console.log('📊 [PAYMENT ROUTING] Transfer data structure:', JSON.stringify(transferData, null, 2))
                    console.log('💰 [PAYMENT ROUTING] Total transfer amount:', transferData.reduce((sum, t) => sum + t.amount, 0), 'paise')
                    console.log('🏪 [PAYMENT ROUTING] Number of vendor transfers:', transferData.length)

                    const transferPayload = {
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_order_id: response.razorpay_order_id,
                      transfers: transferData,
                    }
                    console.log('📤 [PAYMENT ROUTING] Payload being sent to transfers API:', JSON.stringify(transferPayload, null, 2))

                    const transfersResponse = await fetch('/api/razorpay/transfers', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(transferPayload),
                    })

                    const transfersResult = await transfersResponse.json()
                    console.log('✅ [PAYMENT ROUTING] Razorpay transfers API response:', transfersResult)

                    if (!transfersResponse.ok) {
                      console.error('❌ [PAYMENT ROUTING] Failed to create transfers:', transfersResult)
                    } else {
                      console.log('🎉 [PAYMENT ROUTING] Successfully routed payments to all vendors!')
                      console.log('📈 [PAYMENT ROUTING] Transfer summary:', {
                        totalAmount: transferData.reduce((sum, t) => sum + t.amount, 0),
                        vendorCount: transferData.length,
                        paymentId: response.razorpay_payment_id,
                        orderId: localOrderId
                      })
                    }
                  } catch (transferError) {
                    console.error('💥 [PAYMENT ROUTING] Error during transfer creation:', transferError)
                  }
                } else {
                  console.log('⚠️ [PAYMENT ROUTING] Skipping transfers - Environment:', process.env.NODE_ENV, '| Valid accounts found:', payoutData.filter(p => p.razorpayAccountId && p.razorpayAccountId.startsWith('acc_')).length)
                }
                console.log('🏁 [PAYMENT ROUTING] Vendor payment distribution process completed')
              } else {
                console.log('Vendor API call failed:', vendorData)
              }
            } else {
              console.log('transformedOrder or orderData not available - passedTransformedOrder:', !!passedTransformedOrder, 'passedOrderData:', !!passedOrderData)
            }

            // Clear the cart after successful payment
            await clearCart()
            // Set payment success state to show dummy gateway success page
            setPaymentSuccess(true)
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
        theme: { color: "#000000" },
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
        paymentAlreadyComplete={paymentSuccess}
      />
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="h-screen bg-background flex items-center justify-center px-4 w-full max-w-full overflow-hidden">
        <div className="text-center w-full max-w-sm">
          <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <span className="text-4xl">🛒</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6 text-sm">Add some delicious items to get started!</p>
          <Button onClick={handleBackNavigation} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col w-full max-w-full overflow-hidden">
      {/* Header */}
      <div
        className="bg-background shadow-sm sticky top-0 z-10 w-full border-b border-border rounded-2xl"
      >
        <div className="px-4 py-4 w-full flex items-center gap-3 overflow-hidden">
          <button
            onClick={handleBackNavigation}
            className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-foreground truncate">Your Cart</h1>
            <p className="text-sm text-muted-foreground truncate">{cart.items.length} items</p>
          </div>
        </div>
      </div>

      {/* Warning Banner for Invalid Items */}
      {hasInvalidItems && (
        <div className="mx-4 mt-4 p-3 bg-muted border border-border rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Cart validation issues detected</p>
              <p className="text-xs text-muted-foreground mt-1">Some items may not be available for checkout. Please review marked items below.</p>
            </div>
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div className="flex-1 px-4 py-4 space-y-4 w-full overflow-y-auto overflow-x-hidden">
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
      </div>

      {/* To-Pay Button */}
      <div className="px-4 py-4 bg-background w-full">
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <button
              className="w-full bg-background border border-border rounded-lg py-4 px-4 flex items-center justify-between font-medium hover:bg-muted transition-colors"
            >
              <span className="font-medium">To Pay</span>
              <div className="w-auto flex flex-row gap-2 font-bold">
                ₹{Number((toPayTotalRupees !== undefined ? toPayTotalRupees : totalAmount) || 0).toFixed(2)}
                <ArrowRight className="h-5 w-5" />
              </div>
            </button>
          </DrawerTrigger>
          <DrawerContent className="bg-background border-t border-border">
            <DrawerHeader>
              <DrawerTitle>Bill Summary</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item Total (Incl. GST)</span>
                  <span className="font-medium">{transformedOrderPreview ? transformedOrderPreview.feeBreakdown?.customerBill?.Base_Price || `₹${(transformedOrderPreview.baseAmount/100).toFixed(2)}` : `₹${Number(itemTotal || 0).toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Charge</span>
                  <span className="font-medium">{transformedOrderPreview ? `₹${(transformedOrderPreview.razorpayFee/100).toFixed(2)}` : `₹0.00`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform charges</span>
                  <span className="font-medium">{(() => {
                    if (!transformedOrderPreview) return `₹${platformCharge.toFixed(2)}`
                    const customerPlatform = (transformedOrderPreview.customerPayable - transformedOrderPreview.baseAmount) / 100
                    const platformRevenue = (transformedOrderPreview.platformRevenue || 0) / 100
                    return `₹${(customerPlatform + platformRevenue).toFixed(2)}`
                  })()}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Amount</span>
                    <span>₹{(toPayTotalRupees !== undefined ? toPayTotalRupees : totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Pickup Location and Checkout */}
      <div className="bg-background border mb-3 border-border px-4 py-4 w-full">
        <div className="flex items-center justify-between mb-4 w-full min-w-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground truncate">{vendorText}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="ml-2 flex-shrink-0"
            onClick={() => {
              console.log("See where clicked - not implemented yet")
            }}
          >
            See Where
          </Button>
        </div>
        
        <div>
          {hasActiveOrder ? (
            <div className="w-full space-y-3">
              <div className="bg-muted border border-border rounded-lg p-3">
                <div className="text-foreground text-sm font-medium">⚠️ Active Order Found</div>
                <div className="text-muted-foreground text-xs mt-1">{activeOrderError}</div>
              </div>
              <Button className="w-full" disabled={true}>
                Checkout Disabled - Active Order
              </Button>
            </div>
          ) : hasInvalidItems ? (
            <div className="w-full space-y-3">
              <div className="bg-muted border border-border rounded-lg p-3">
                <div className="text-foreground text-sm font-medium">⚠️ Cart Issues Detected</div>
                <div className="text-muted-foreground text-xs mt-1">
                  Some items are no longer available. Please remove invalid items to proceed.
                </div>
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => validateCart()}
                disabled={checkoutLoading}
              >
                Re-validate Cart
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? "Processing..." : "Proceed to Checkout"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
