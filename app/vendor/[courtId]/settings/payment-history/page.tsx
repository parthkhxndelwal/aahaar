"use client"

import { use } from "react"
import { ArrowLeft, CreditCard, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { useRouter } from "next/navigation"

export default function PaymentHistory({ params }: { params: Promise<{ courtId: string }> }) {
  const { user } = useUnifiedAuth()
  const { courtId } = use(params)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <CreditCard className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Payment History</h1>
                <p className="text-muted-foreground">
                  View your payment history and financial reports
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Content */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="h-8 w-8 text-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Payment History & Reports</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              This page is currently under development. Soon you'll be able to view your payment history, settlements, earnings reports, and download financial statements.
            </p>
            
            <div className="mt-6 p-4 bg-muted rounded-xl">
              <h3 className="font-medium mb-2">Coming Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  <span>Payment History</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  <span>Settlement Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  <span>Earnings Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  <span>Download Statements</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
