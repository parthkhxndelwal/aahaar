"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

interface BasicDetailsStepProps {
  vendorData: any
  updateVendorData: (data: any) => void
  onNext: (data?: any) => void
  onBack: () => void
  loading: boolean
  courtId: string
  vendorId?: string
}

export default function BasicDetailsStep({
  vendorData,
  updateVendorData,
  onNext,
  onBack,
  loading,
  courtId,
  vendorId,
}: BasicDetailsStepProps) {
  const [formData, setFormData] = useState({
    stallName: vendorData?.stallName || "",
    vendorName: vendorData?.vendorName || "",
    contactEmail: vendorData?.contactEmail || "",
    contactPhone: vendorData?.contactPhone || "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValidating, setIsValidating] = useState(false)

  // Remove the problematic useEffect that was causing infinite re-renders
  // useEffect(() => {
  //   updateVendorData(formData)
  // }, [formData, updateVendorData])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(phone)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.stallName.trim()) {
      newErrors.stallName = "Stall name is required"
    } else if (formData.stallName.trim().length < 2) {
      newErrors.stallName = "Stall name must be at least 2 characters"
    }

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = "Vendor name is required"
    } else if (formData.vendorName.trim().length < 2) {
      newErrors.vendorName = "Vendor name must be at least 2 characters"
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = "Email is required"
    } else if (!validateEmail(formData.contactEmail)) {
      newErrors.contactEmail = "Please enter a valid email address"
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = "Phone number is required"
    } else if (!validatePhone(formData.contactPhone)) {
      newErrors.contactPhone = "Please enter a valid 10-digit Indian mobile number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkDuplicates = async () => {
    try {
      setIsValidating(true)
      
      // Check for duplicate email
      const emailResponse = await fetch(`/api/admin/vendors?courtId=${courtId}&email=${encodeURIComponent(formData.contactEmail)}`)
      const emailResult = await emailResponse.json()
      
      if (emailResult.success && emailResult.data.exists) {
        const existingVendor = emailResult.data.vendor
        if (!vendorId || existingVendor.id !== vendorId) {
          const newErrors = { ...errors }
          newErrors.contactEmail = "A vendor with this email already exists"
          setErrors(newErrors)
          return false
        }
      }
      
      // Check for duplicate phone
      const phoneResponse = await fetch(`/api/admin/vendors?courtId=${courtId}&phone=${encodeURIComponent(formData.contactPhone)}`)
      const phoneResult = await phoneResponse.json()
      
      if (phoneResult.success && phoneResult.data.exists) {
        const existingVendor = phoneResult.data.vendor
        if (!vendorId || existingVendor.id !== vendorId) {
          const newErrors = { ...errors }
          newErrors.contactPhone = "A vendor with this phone number already exists"
          setErrors(newErrors)
          return false
        }
      }
      
      // Check for duplicate stall name
      const stallResponse = await fetch(`/api/admin/vendors?courtId=${courtId}&stallName=${encodeURIComponent(formData.stallName)}`)
      const stallResult = await stallResponse.json()
      
      if (stallResult.success && stallResult.data.exists) {
        const existingVendor = stallResult.data.vendor
        if (!vendorId || existingVendor.id !== vendorId) {
          const newErrors = { ...errors }
          newErrors.stallName = "A stall with this name already exists in this court"
          setErrors(newErrors)
          return false
        }
      }

      return true
    } catch (error) {
      console.error("Validation error:", error)
      return true // Continue on validation error to avoid blocking
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // Skip duplicate check if editing existing vendor
    if (!vendorId) {
      const isValid = await checkDuplicates()
      if (!isValid) {
        return
      }
    }

    // Update vendor data before proceeding to next step
    updateVendorData(formData)
    onNext(formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please ensure all details are accurate as they will be used for account creation and payments.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="stallName">Stall Name *</Label>
          <Input
            id="stallName"
            placeholder="e.g., Maharaja's Kitchen"
            value={formData.stallName}
            onChange={(e) => handleInputChange("stallName", e.target.value)}
            className={errors.stallName ? "border-red-500" : ""}
          />
          {errors.stallName && (
            <p className="text-sm text-red-500">{errors.stallName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendorName">Vendor Full Name *</Label>
          <Input
            id="vendorName"
            placeholder="e.g., Raj Kumar Sharma"
            value={formData.vendorName}
            onChange={(e) => handleInputChange("vendorName", e.target.value)}
            className={errors.vendorName ? "border-red-500" : ""}
          />
          {errors.vendorName && (
            <p className="text-sm text-red-500">{errors.vendorName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail">Email Address *</Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="vendor@example.com"
            value={formData.contactEmail}
            onChange={(e) => handleInputChange("contactEmail", e.target.value)}
            className={errors.contactEmail ? "border-red-500" : ""}
          />
          {errors.contactEmail && (
            <p className="text-sm text-red-500">{errors.contactEmail}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPhone">Phone Number *</Label>
          <Input
            id="contactPhone"
            placeholder="9876543210"
            value={formData.contactPhone}
            onChange={(e) => handleInputChange("contactPhone", e.target.value)}
            className={errors.contactPhone ? "border-red-500" : ""}
            maxLength={10}
          />
          {errors.contactPhone && (
            <p className="text-sm text-red-500">{errors.contactPhone}</p>
          )}
        </div>
      </div>

      <Card className="bg-blue-50">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">What happens next?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• A vendor account will be created with these details</li>
            <li>• The vendor will receive login credentials via email</li>
            <li>• All information will be verified during the setup process</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || isValidating}
          className="gap-2"
        >
          {(loading || isValidating) && <Loader2 className="h-4 w-4 animate-spin" />}
          {isValidating ? "Validating..." : "Next Step"}
        </Button>
      </div>
    </div>
  )
}
