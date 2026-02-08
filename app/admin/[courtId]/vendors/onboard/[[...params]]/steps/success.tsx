"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"

interface SuccessStepProps {
  vendorData: any
  courtId: string
  vendorId?: string
}

export default function SuccessStep({
  vendorData,
  courtId,
  vendorId,
}: SuccessStepProps) {
  const [countdown, setCountdown] = useState(3)
  const router = useRouter()

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })

    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push(`/admin/${courtId}/vendors`)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [courtId, router])

  const redirectNow = () => {
    router.push(`/admin/${courtId}/vendors`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8 text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75" />
        <div className="relative bg-green-500 rounded-full p-6">
          <CheckCircle className="h-16 w-16 text-white" />
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-green-600">
          Vendor Onboarding Complete! 🎉
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          <strong>{vendorData.stallName}</strong> has been successfully onboarded and is now active.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Vendor Name:</span>
              <span className="font-medium">{vendorData.vendorName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Stall Name:</span>
              <span className="font-medium">{vendorData.stallName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{vendorData.contactEmail}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Razorpay Account:</span>
              <span className="font-medium text-green-600">✓ Created</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Redirecting to Vendors tab in <strong>{countdown}</strong> second{countdown !== 1 ? 's' : ''}...
        </p>
        
        <Button onClick={redirectNow} className="gap-2">
          Go to Vendors Tab Now
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1 max-w-lg">
        <p>
          <strong>Next Steps:</strong>
        </p>
        <ul className="text-left space-y-1">
          <li>• The vendor will receive login credentials via email</li>
          <li>• They can now log in to manage their stall and menu</li>
          <li>• Razorpay will review and activate their payment account</li>
          <li>• You can manage this vendor from the Vendors tab</li>
        </ul>
      </div>
    </div>
  )
}
