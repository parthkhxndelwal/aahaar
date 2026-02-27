"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, CreditCard, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface PaymentGatewayProps {
  amount: number
  orderData: any
  courtId: string
  onPaymentComplete: (paymentResult: any) => void
  onCancel: () => void
}

export default function DummyPaymentGateway({ 
  amount, 
  orderData, 
  courtId, 
  onPaymentComplete, 
  onCancel 
}: PaymentGatewayProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const router = useRouter()

  const handlePayment = async () => {
    setIsProcessing(true)
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Simulate successful payment
    const paymentResult = {
      success: true,
      paymentId: `dummy_pay_${Date.now()}`,
      orderId: orderData.parentOrderId,
      amount: amount,
      status: "completed",
      method: "dummy_gateway"
    }
    
    setPaymentComplete(true)
    
    // Redirect to order success page after brief delay
    setTimeout(() => {
      router.push(`/app/${courtId}/orders/success?parentOrderId=${orderData.parentOrderId}&otp=${orderData.orderOtp}`)
    }, 1500)
  }

  const pageVariants = {
    initial: { opacity: 0, scale: 0.95 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 1.05 }
  }

  const pageTransition = {
    type: "tween" as const,
    ease: "anticipate" as const,
    duration: 0.5
  }

  if (paymentComplete) {
    return (
      <motion.div 
        className="h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4"
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
        transition={pageTransition}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Payment Successful!</h2>
          <p className="text-neutral-600 dark:text-neutral-400">Redirecting to order confirmation...</p>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col"
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
    >
      {/* Header */}
      <motion.div 
        className="bg-white dark:bg-neutral-950 shadow-sm border-b border-neutral-200 dark:border-neutral-800 px-4 py-4"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
          </motion.button>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Payment Gateway</h1>
        </div>
      </motion.div>

      {/* Payment Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="border border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Dummy Payment Gateway
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Summary */}
              <div className="space-y-3">
                <h3 className="font-medium text-neutral-900 dark:text-white">Order Summary</h3>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Order ID</span>
                    <span className="font-mono text-neutral-900 dark:text-white">{orderData.parentOrderId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Vendors</span>
                    <span className="text-neutral-900 dark:text-white">{orderData.summary.vendorsCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Items</span>
                    <span className="text-neutral-900 dark:text-white">{orderData.summary.itemsCount}</span>
                  </div>
                  <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-neutral-900 dark:text-white">Total Amount</span>
                      <span className="text-neutral-900 dark:text-white">₹{amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Note */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> This is a dummy payment gateway for demonstration purposes. 
                  Clicking "Pay Now" will simulate a successful payment.
                </p>
              </div>

              {/* Payment Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-medium"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay Now ₹{amount.toFixed(2)}
                    </>
                  )}
                </Button>
              </motion.div>

              <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
                Secured by Dummy Gateway | Test Environment
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
