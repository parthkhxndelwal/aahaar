"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CreditCard, CheckCircle, Building2 } from "lucide-react"

interface BankDetailsStepProps {
  vendorData: any
  updateVendorData: (data: any) => void
  onNext: (data: any) => void
  onBack: () => void
  loading: boolean
  courtId: string
  vendorId?: string
}

interface BankInfo {
  BANK: string
  BRANCH: string
  CENTRE: string
  DISTRICT: string
  STATE: string
  ADDRESS: string
  CONTACT?: string
  CITY: string
  MICR?: string
  IFSC: string
}

export default function BankDetailsStep({
  vendorData,
  updateVendorData,
  onNext,
  onBack,
  loading,
  courtId,
  vendorId,
}: BankDetailsStepProps) {
  const [formData, setFormData] = useState({
    bankAccountHolderName: vendorData?.bankAccountHolderName || "",
    bankAccountNumber: vendorData?.bankAccountNumber || "",
    bankIfscCode: vendorData?.bankIfscCode || "",
    bankName: vendorData?.bankName || "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [validatingIfsc, setValidatingIfsc] = useState(false)
  const [ifscValid, setIfscValid] = useState<boolean | null>(null)

  // Remove the problematic useEffect that was causing infinite re-renders
  // useEffect(() => {
  //   updateVendorData(formData)
  // }, [formData, updateVendorData])

  const validateIfsc = async (ifsc: string) => {
    if (!ifsc || ifsc.length !== 11) {
      setIfscValid(false)
      setBankInfo(null)
      setFormData(prev => ({ ...prev, bankName: "" }))
      return
    }

    setValidatingIfsc(true)
    setErrors(prev => ({ ...prev, bankIfscCode: "" }))

    try {
      const response = await fetch(`/api/admin/vendors/validate-ifsc/${ifsc}`)
      const result = await response.json()

      if (result.success) {
        setIfscValid(true)
        setBankInfo(result.data)
        setFormData(prev => ({ 
          ...prev, 
          bankName: result.data.BANK 
        }))
      } else {
        setIfscValid(false)
        setBankInfo(null)
        setFormData(prev => ({ ...prev, bankName: "" }))
        setErrors(prev => ({ 
          ...prev, 
          bankIfscCode: "Invalid IFSC code" 
        }))
      }
    } catch (error) {
      console.error("IFSC validation error:", error)
      setIfscValid(false)
      setBankInfo(null)
      setFormData(prev => ({ ...prev, bankName: "" }))
      setErrors(prev => ({ 
        ...prev, 
        bankIfscCode: "Failed to validate IFSC code. Please try again." 
      }))
    } finally {
      setValidatingIfsc(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.bankAccountHolderName.trim()) {
      newErrors.bankAccountHolderName = "Account holder name is required"
    } else if (formData.bankAccountHolderName.trim().length < 2) {
      newErrors.bankAccountHolderName = "Account holder name must be at least 2 characters"
    }

    if (!formData.bankAccountNumber.trim()) {
      newErrors.bankAccountNumber = "Bank account number is required"
    } else if (!/^\d{9,18}$/.test(formData.bankAccountNumber.trim())) {
      newErrors.bankAccountNumber = "Bank account number must be 9-18 digits"
    }

    if (!formData.bankIfscCode.trim()) {
      newErrors.bankIfscCode = "IFSC code is required"
    } else if (formData.bankIfscCode.length !== 11) {
      newErrors.bankIfscCode = "IFSC code must be 11 characters"
    } else if (!ifscValid) {
      newErrors.bankIfscCode = "Please enter a valid IFSC code"
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = "Bank name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }

    // Validate IFSC when it changes
    if (field === "bankIfscCode") {
      const upperValue = value.toUpperCase()
      setFormData((prev) => ({ ...prev, [field]: upperValue }))
      
      if (upperValue.length === 11) {
        validateIfsc(upperValue)
      } else {
        setIfscValid(null)
        setBankInfo(null)
      }
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // Update vendor data before proceeding to next step
    updateVendorData(formData)
    onNext(formData)
  }

  return (
    <div className="space-y-6">
      <Alert>
        <CreditCard className="h-4 w-4" />
        <AlertDescription>
          Add your bank account details for receiving payments. All information is encrypted and secure.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bank Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankAccountHolderName">Account Holder Name *</Label>
            <Input
              id="bankAccountHolderName"
              placeholder="Full name as per bank account"
              value={formData.bankAccountHolderName}
              onChange={(e) => handleInputChange("bankAccountHolderName", e.target.value)}
              className={errors.bankAccountHolderName ? "border-red-500" : ""}
            />
            {errors.bankAccountHolderName && (
              <p className="text-sm text-red-500">{errors.bankAccountHolderName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankAccountNumber">Bank Account Number *</Label>
            <Input
              id="bankAccountNumber"
              placeholder="Enter your bank account number"
              value={formData.bankAccountNumber}
              onChange={(e) => handleInputChange("bankAccountNumber", e.target.value.replace(/\D/g, ''))}
              className={errors.bankAccountNumber ? "border-red-500" : ""}
              maxLength={18}
            />
            {errors.bankAccountNumber && (
              <p className="text-sm text-red-500">{errors.bankAccountNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankIfscCode">IFSC Code *</Label>
            <div className="relative">
              <Input
                id="bankIfscCode"
                placeholder="e.g., SBIN0001234"
                value={formData.bankIfscCode}
                onChange={(e) => handleInputChange("bankIfscCode", e.target.value)}
                className={errors.bankIfscCode ? "border-red-500" : ifscValid ? "border-green-500" : ""}
                maxLength={11}
              />
              {validatingIfsc && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                </div>
              )}
              {!validatingIfsc && ifscValid === true && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              )}
              {!validatingIfsc && ifscValid === false && formData.bankIfscCode.length === 11 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              )}
            </div>
            {errors.bankIfscCode && (
              <p className="text-sm text-red-500">{errors.bankIfscCode}</p>
            )}
            <p className="text-xs text-muted-foreground">
              IFSC code will be automatically validated
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              placeholder="Bank name (auto-filled from IFSC)"
              value={formData.bankName}
              disabled
              className="bg-muted"
            />
            {errors.bankName && (
              <p className="text-sm text-red-500">{errors.bankName}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {bankInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Bank Details Verified
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Bank Name</Label>
                <p className="font-medium">{bankInfo.BANK}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Branch</Label>
                <p className="font-medium">{bankInfo.BRANCH}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">City</Label>
                <p className="font-medium">{bankInfo.CITY}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">State</Label>
                <p className="font-medium">{bankInfo.STATE}</p>
              </div>
              {bankInfo.MICR && (
                <div>
                  <Label className="text-muted-foreground">MICR Code</Label>
                  <p className="font-medium">{bankInfo.MICR}</p>
                </div>
              )}
              {bankInfo.CONTACT && (
                <div>
                  <Label className="text-muted-foreground">Contact</Label>
                  <p className="font-medium">{bankInfo.CONTACT}</p>
                </div>
              )}
            </div>
            {bankInfo.ADDRESS && (
              <div>
                <Label className="text-muted-foreground">Address</Label>
                <p className="font-medium text-sm">{bankInfo.ADDRESS}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || validatingIfsc || !ifscValid}
          className="gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Next Step
        </Button>
      </div>
    </div>
  )
}
