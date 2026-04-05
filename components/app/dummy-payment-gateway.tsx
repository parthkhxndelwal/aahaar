"use client"
import { useState, useEffect } from "react"
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
  paymentAlreadyComplete?: boolean
}

export default function DummyPaymentGateway({ 
  amount, 
  orderData, 
  courtId, 
  onPaymentComplete, 
  onCancel,
  paymentAlreadyComplete = false
}: PaymentGatewayProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(paymentAlreadyComplete)
  const router = useRouter()

  // Handle redirect when payment is already complete
  useEffect(() => {
    if (paymentAlreadyComplete) {
      setTimeout(() => {
        router.push(`/app/${courtId}/orders/success?parentOrderId=${orderData.parentOrderId}&otp=${orderData.orderOtp}`)
      }, 1500)
    }
  }, [paymentAlreadyComplete, courtId, orderData, router])

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

  if (paymentComplete) {
    return (
      <div className="h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground">Redirecting to order confirmation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-background shadow-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Payment Gateway</h1>
        </div>
      </div>

      {/* Payment Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Dummy Payment Gateway
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Summary */}
              <div className="space-y-3">
                <h3 className="font-medium">Order Summary</h3>
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order ID</span>
                    <span className="font-mono">{orderData.parentOrderId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vendors</span>
                    <span>{orderData.summary.vendorsCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items</span>
                    <span>{orderData.summary.itemsCount}</span>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount</span>
                      <span>₹{amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Note */}
              <div className="bg-muted border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> This is a dummy payment gateway for demonstration purposes. 
                  Clicking "Pay Now" will simulate a successful payment.
                </p>
              </div>

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full"
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

              <p className="text-xs text-center text-muted-foreground">
                Secured by Dummy Gateway | Test Environment
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
