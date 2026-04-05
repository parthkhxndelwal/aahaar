"use client"

import React, { useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { VendorOnboardingForm } from "@/components/vendor/vendor-onboarding-form"
import { adminVendorApi } from "@/lib/api"

export default function AdminVendorOnboardPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const courtId = params.courtId as string

  if (!courtId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Invalid Request</h1>
          <p className="text-muted-foreground mb-6">Court ID is required to create a vendor.</p>
          <button
            onClick={() => router.back()}
            className="bg-foreground hover:bg-foreground/90 text-background px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const handleFormSubmit = async (formData: any) => {
    console.log("Page handleFormSubmit called with:", formData)
    // Keep inline, do not show spinner/progress page. Surface server errors back to form.
    try {
      console.log("Making API request to create vendor")
      // Use fetch directly since vendorApi expects different parameters
      const response = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, courtId }),
      })

      console.log("API response status:", response.status)
      const payload = await response.json()
      console.log("API response payload:", payload)

      if (!response.ok || !payload.success) {
        // Throw with server-provided message so form can show it inline
        throw new Error(payload.message || "Failed to create vendor")
      }

      const vendorId = payload?.data?.vendor?.id
      console.log("Vendor created successfully, redirecting...")
      router.push(`/admin/${courtId}/vendors?success=true${vendorId ? `&vendorId=${vendorId}` : ''}`)
    } catch (error) {
      console.error("Page handleFormSubmit error:", error)
      // Re-throw to let the form show inline error
      throw error
    }
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Vendor Onboarding</h1>
            <p className="text-muted-foreground">Create a new vendor account with complete setup</p>
          </div>

          <VendorOnboardingForm
            courtId={courtId}
            onSubmit={handleFormSubmit}
            onCancel={() => router.push(`/admin/${courtId}/vendors`)}
          />
        </div>
      </div>
    </div>
  )
}
