"use client"
import { use, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { Loader2 } from "lucide-react"

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useUnifiedAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRazorpayAndInitiate = async () => {
      try {
        // Get stored payment data
        const pendingPaymentData = sessionStorage.getItem('pendingPayment')
        
        if (!pendingPaymentData) {
          alert('Payment session expired. Please try again.')
          router.push(`/app/${courtId}/cart`)
          return
        }

        const paymentData = JSON.parse(pendingPaymentData)

        // Load Razorpay script
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        
        script.onload = () => {
          // Initialize Razorpay with redirect URLs
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
            amount: paymentData.amount,
            currency: 'INR',
            name: 'Aahaar',
            description: 'Food Order Payment',
            order_id: paymentData.razorpayOrderId,
            callback_url: `${window.location.origin}/app/${courtId}/payment/callback`,
            redirect: true, // Enable redirect mode
            modal: {
              escape: false,
              ondismiss: function() {
                // Handle payment cancellation
                alert('Payment cancelled')
                router.push(`/app/${courtId}/cart`)
              }
            },
            theme: {
              color: '#3399cc'
            }
          }

          const razorpay = new window.Razorpay(options)
          razorpay.open()
          setLoading(false)
        }

        script.onerror = () => {
          alert('Failed to load payment gateway. Please try again.')
          router.push(`/app/${courtId}/cart`)
        }

        document.body.appendChild(script)

      } catch (error) {
        console.error('Payment initialization error:', error)
        alert('Failed to initialize payment. Please try again.')
        router.push(`/app/${courtId}/cart`)
      }
    }

    loadRazorpayAndInitiate()
  }, [courtId, router, token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
        <h1 className="text-xl font-semibold mb-2">Loading Payment Gateway...</h1>
        <p className="text-gray-600">Please wait while we redirect you to payment</p>
      </div>
    </div>
  )
}
