"use client"
import { use, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentCallbackPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useUnifiedAuth()
  
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing')
  const [message, setMessage] = useState('Verifying your payment...')
  const [orderData, setOrderData] = useState<any>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment details from URL params
        const razorpay_payment_id = searchParams.get('razorpay_payment_id')
        const razorpay_order_id = searchParams.get('razorpay_order_id')
        const razorpay_signature = searchParams.get('razorpay_signature')

        // Get stored order data from sessionStorage
        const pendingPaymentData = sessionStorage.getItem('pendingPayment')
        
        if (!pendingPaymentData) {
          setStatus('failed')
          setMessage('Payment session expired. Please try again.')
          return
        }

        const paymentData = JSON.parse(pendingPaymentData)
        
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
          setStatus('failed')
          setMessage('Payment verification failed. Missing payment details.')
          return
        }

        // Verify payment on server
        const verifyResponse = await fetch(`/api/razorpay/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            localOrderId: paymentData.localOrderId,
          }),
        })

        const verifyResult = await verifyResponse.json()

        if (!verifyResponse.ok || !verifyResult.success) {
          setStatus('failed')
          setMessage(verifyResult.message || 'Payment verification failed')
          return
        }

        // Payment verified successfully
        setStatus('success')
        setMessage('Payment successful! Your order has been placed.')
        setOrderData(paymentData.orderData)

        // Handle payout/transfer logic if needed
        if (paymentData.transformedOrder && paymentData.orderData) {
          const vendorIds = Object.keys(paymentData.transformedOrder.vendors)
          const vendorResponse = await fetch(`/api/app/${courtId}/vendors?ids=${vendorIds.join(',')}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          const vendorData = await vendorResponse.json()

          if (vendorData.success) {
            // Update transformedOrder with razorpayAccountId
            const updatedTransformedOrder = { ...paymentData.transformedOrder }
            vendorIds.forEach(vendorId => {
              const vendor = vendorData.data.vendors.find((v: any) => v.id === vendorId)
              if (vendor && updatedTransformedOrder.vendors[vendorId]) {
                updatedTransformedOrder.vendors[vendorId].accountId = vendor.razorpayAccountId || null
              }
            })

            // Create payout JSON
            const payoutPayload = {
              razorpayOrderId: razorpay_order_id,
              razorpayPaymentId: razorpay_payment_id,
              parentOrderId: paymentData.orderData.parentOrderId,
              transfers: updatedTransformedOrder
            }

            console.log('💰 Payment routing data:', JSON.stringify(payoutPayload, null, 2))
            
            // Optional: Send to payout API
            // await fetch('/api/razorpay/transfers', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(payoutPayload)
            // })
          }
        }

        // Clear session storage
        sessionStorage.removeItem('pendingPayment')

        // Redirect to orders page after 3 seconds
        setTimeout(() => {
          router.push(`/app/${courtId}/orders`)
        }, 3000)

      } catch (error) {
        console.error('Payment verification error:', error)
        setStatus('failed')
        setMessage('An error occurred while verifying payment')
      }
    }

    verifyPayment()
  }, [searchParams, courtId, token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold mb-2 text-green-600">Payment Successful!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            {orderData?.parentOrderId && (
              <div className="bg-gray-100 rounded p-4 mb-4">
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-mono font-bold">{orderData.parentOrderId}</p>
              </div>
            )}
            <p className="text-sm text-gray-500">Redirecting to your orders...</p>
            <Button 
              onClick={() => router.push(`/app/${courtId}/orders`)}
              className="mt-4"
            >
              View Orders
            </Button>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2 text-red-600">Payment Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push(`/app/${courtId}/cart`)}
                className="w-full"
              >
                Return to Cart
              </Button>
              <Button 
                onClick={() => router.push(`/app/${courtId}`)}
                variant="outline"
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
