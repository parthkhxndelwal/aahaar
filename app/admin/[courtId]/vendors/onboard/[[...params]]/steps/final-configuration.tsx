"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Loader2, CheckCircle, Settings, Clock, ShoppingBag } from "lucide-react"

interface FinalConfigurationStepProps {
  vendorData: any
  updateVendorData: (data: any) => void
  onNext: (data: any) => void
  onBack: () => void
  loading: boolean
  courtId: string
  vendorId?: string
}

export default function FinalConfigurationStep({
  vendorData,
  updateVendorData,
  onNext,
  onBack,
  loading,
  courtId,
  vendorId,
}: FinalConfigurationStepProps) {
  const [formData, setFormData] = useState({
    maxOrdersPerHour: vendorData?.maxOrdersPerHour || 10,
    averagePreparationTime: vendorData?.averagePreparationTime || 15,
    status: "active", // Mark as active after onboarding
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Remove the problematic useEffect that was causing infinite re-renders
  // useEffect(() => {
  //   updateVendorData(formData)
  // }, [formData, updateVendorData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.maxOrdersPerHour || formData.maxOrdersPerHour < 1) {
      newErrors.maxOrdersPerHour = "Max orders per hour must be at least 1"
    } else if (formData.maxOrdersPerHour > 100) {
      newErrors.maxOrdersPerHour = "Max orders per hour cannot exceed 100"
    }

    if (!formData.averagePreparationTime || formData.averagePreparationTime < 1) {
      newErrors.averagePreparationTime = "Average preparation time must be at least 1 minute"
    } else if (formData.averagePreparationTime > 120) {
      newErrors.averagePreparationTime = "Average preparation time cannot exceed 120 minutes"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // Mark vendor as fully onboarded
    const finalData = {
      ...formData,
      status: "active",
      metadata: {
        ...vendorData.metadata,
        onboardingCompleted: true,
        onboardingStep: "completed"
      }
    }

    // Update vendor data before proceeding to next step
    updateVendorData(finalData)
    onNext(finalData)
  }

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <Settings className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Final Step!</strong> Configure your operational settings to complete the vendor onboarding.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Order Management Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="maxOrdersPerHour">Maximum Orders Per Hour *</Label>
            <Input
              id="maxOrdersPerHour"
              type="number"
              min="1"
              max="100"
              value={formData.maxOrdersPerHour}
              onChange={(e) => handleInputChange("maxOrdersPerHour", parseInt(e.target.value) || 0)}
              className={errors.maxOrdersPerHour ? "border-red-500" : ""}
            />
            {errors.maxOrdersPerHour && (
              <p className="text-sm text-red-500">{errors.maxOrdersPerHour}</p>
            )}
            <p className="text-sm text-muted-foreground">
              This helps manage your workload and ensures quality service. You can change this later.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="averagePreparationTime">Average Preparation Time (minutes) *</Label>
            <Input
              id="averagePreparationTime"
              type="number"
              min="1"
              max="120"
              value={formData.averagePreparationTime}
              onChange={(e) => handleInputChange("averagePreparationTime", parseInt(e.target.value) || 0)}
              className={errors.averagePreparationTime ? "border-red-500" : ""}
            />
            {errors.averagePreparationTime && (
              <p className="text-sm text-red-500">{errors.averagePreparationTime}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Average time to prepare one order. This will be shown to customers.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operational Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Stall Name</Label>
                <p className="font-medium">{vendorData.stallName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Vendor Name</Label>
                <p className="font-medium">{vendorData.vendorName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Location</Label>
                <p className="font-medium">{vendorData.stallLocation}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Cuisine Type</Label>
                <p className="font-medium">{vendorData.cuisineType}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{vendorData.contactEmail}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{vendorData.contactPhone}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Bank Account</Label>
                <p className="font-medium">****{vendorData.bankAccountNumber?.slice(-4)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Razorpay Account</Label>
                <p className="font-medium text-green-600">✓ Created</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Ready to Go!</strong> Once you submit this form, the vendor will be marked as active 
          and ready to receive orders. The vendor can log in and start managing their stall.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Complete Onboarding
        </Button>
      </div>
    </div>
  )
}
