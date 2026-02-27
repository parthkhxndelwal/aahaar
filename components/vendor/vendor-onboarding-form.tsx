"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

interface VendorOnboardingFormProps {
  courtId: string
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

interface FormData {
  // Basic Information
  stallName: string
  vendorName: string
  contactEmail: string
  contactPhone: string
  stallLocation: string
  cuisineType: string
  description: string

  // Business Information
  businessType: string
  panNumber: string
  gstin: string

  // Bank Details
  bankAccountNumber: string
  bankIfscCode: string
  bankAccountHolderName: string
  bankName: string

  // Stakeholder Information (for non-individual businesses)
  stakeholderName: string
  stakeholderPan: string

  // Operational Settings
  operatingHours: any
  maxOrdersPerHour: number
  averagePreparationTime: number
  
  // Status Setting
  status: "active" | "inactive"
  setAsActive: boolean

  // NEW: Razorpay-required
  businessCategory: string
  businessSubcategory: string
  addressStreet1: string
  addressStreet2: string
  addressCity: string
  addressState: string
  addressPostalCode: string
  addressCountry: string
  acceptTnC: boolean
  acceptSettlementTerms: boolean
  confirmAccuracy: boolean
}

const validatePan = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  if (!panRegex.test(pan)) return false
  
  // Check 4th character for company type validation
  const fourthChar = pan.charAt(3)
  const validFourthChars = ['C', 'H', 'F', 'A', 'T', 'B', 'J', 'G', 'L']
  return validFourthChars.includes(fourthChar)
}

const validateGstin = (gstin: string): boolean => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstinRegex.test(gstin)
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone: string): boolean => {
  // allow with or without country code; backend prefixes +91 if missing
  const cleaned = phone.replace(/[\s\-]/g, '')
  return /^(\+\d{1,3})?\d{10}$/.test(cleaned)
}

// NEW: IFSC & PIN validation helpers
const validateIFSC = (ifsc: string): boolean => /^[A-Z]{4}0[0-9A-Z]{6}$/.test(ifsc)
const validatePincode = (pin: string): boolean => /^[0-9]{6}$/.test(pin)

// Function to check if email, phone, PAN, or stall name already exists
const checkForDuplicates = async (
  courtId: string,
  field: 'contactEmail' | 'contactPhone' | 'stallName' | 'panNumber',
  value: string
): Promise<{ isDuplicate: boolean; message?: string }> => {
  if (!value.trim()) return { isDuplicate: false }
  
  try {
    const response = await fetch('/api/admin/vendors/check-duplicates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courtId,
        field,
        value: value.trim(),
      }),
    })
    
    if (!response.ok) {
      console.error('Duplicate check failed:', response.statusText)
      return { isDuplicate: false }
    }
    
    const result = await response.json()
    return {
      isDuplicate: result.isDuplicate || false,
      message: result.message
    }
  } catch (error) {
    console.error(`Error checking duplicate ${field}:`, error)
    return { isDuplicate: false }
  }
}

export function VendorOnboardingForm({ courtId, onSubmit, onCancel }: VendorOnboardingFormProps) {
  const [formData, setFormData] = useState<FormData>({
    stallName: "",
    vendorName: "",
    contactEmail: "",
    contactPhone: "",
    stallLocation: "",
    cuisineType: "",
    description: "",
    businessType: "individual",
    panNumber: "",
    gstin: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountHolderName: "",
    bankName: "",
    stakeholderName: "",
    stakeholderPan: "",
    operatingHours: {
      monday: { open: "09:00", close: "18:00", closed: false },
      tuesday: { open: "09:00", close: "18:00", closed: false },
      wednesday: { open: "09:00", close: "18:00", closed: false },
      thursday: { open: "09:00", close: "18:00", closed: false },
      friday: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "09:00", close: "18:00", closed: false },
      sunday: { open: "09:00", close: "18:00", closed: true },
    },
    maxOrdersPerHour: 10,
    averagePreparationTime: 15,
    status: "inactive",
    setAsActive: false,
    // NEW defaults
    businessCategory: "food_and_beverages",
    businessSubcategory: "restaurant",
    addressStreet1: "",
    addressStreet2: "",
    addressCity: "",
    addressState: "",
    addressPostalCode: "",
    addressCountry: "IN",
    acceptTnC: false,
    acceptSettlementTerms: false,
    confirmAccuracy: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({})

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
    if (serverError) setServerError(null)

    // Check for duplicates on certain fields with debouncing
    if (['contactEmail', 'contactPhone', 'stallName', 'panNumber'].includes(field) && value && value.trim()) {
      const timeoutId = setTimeout(async () => {
        setIsValidating(prev => ({ ...prev, [field]: true }))
        
        try {
          let fieldToCheck: 'contactEmail' | 'contactPhone' | 'stallName' | 'panNumber'
          let valueToCheck = value.trim()
          
          switch (field) {
            case 'contactEmail':
              fieldToCheck = 'contactEmail'
              break
            case 'contactPhone':
              fieldToCheck = 'contactPhone'
              break
            case 'stallName':
              fieldToCheck = 'stallName'
              break
            case 'panNumber':
              fieldToCheck = 'panNumber'
              break
            default:
              return
          }
          
          const result = await checkForDuplicates(courtId, fieldToCheck, valueToCheck)
          
          if (result.isDuplicate) {
            setErrors(prev => ({ 
              ...prev, 
              [field]: result.message || `This ${fieldToCheck} is already in use by another vendor` 
            }))
          }
        } catch (error) {
          console.error('Validation error:', error)
        } finally {
          setIsValidating(prev => ({ ...prev, [field]: false }))
        }
      }, 500) // 500ms debounce
      
      // Store timeout ID to clear it if user types again
      return () => clearTimeout(timeoutId)
    }

    // NEW: IFSC auto-lookup
    if (field === 'bankIfscCode') {
      const code = (value || '').toUpperCase()
      if (code.length === 11 && validateIFSC(code)) {
        ;(async () => {
          try {
            const res = await fetch(`/api/admin/vendors/validate-ifsc/${code}`)
            const json = await res.json()
            if (json.success) {
              setFormData(prev => ({ ...prev, bankName: json.data?.BANK || prev.bankName }))
            }
          } catch (e) {
            // ignore lookup failure, user can fill manually
          }
        })()
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Check if any duplicate validation is still in progress
    const isStillValidating = Object.values(isValidating).some(Boolean)
    if (isStillValidating) {
      newErrors.general = "Please wait for validation to complete"
    }

    // Check for existing duplicate errors
    const duplicateFields = ['contactEmail', 'contactPhone', 'stallName', 'panNumber']
    duplicateFields.forEach(field => {
      if (errors[field] && errors[field].includes('already in use')) {
        newErrors[field] = errors[field]
      }
    })

    // Basic validation
    if (!formData.stallName.trim()) newErrors.stallName = "Stall name is required"
    if (!formData.vendorName.trim()) newErrors.vendorName = "Vendor name is required"
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = "Email is required"
    } else if (!validateEmail(formData.contactEmail)) {
      newErrors.contactEmail = "Invalid email format"
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = "Phone number is required"
    } else if (!validatePhone(formData.contactPhone)) {
      newErrors.contactPhone = "Phone number must be 10-15 digits"
    }

    // Business type validation
    if (!formData.businessType) newErrors.businessType = "Business type is required"

    // PAN validation
    if (!formData.panNumber.trim()) {
      newErrors.panNumber = "PAN number is required"
    } else if (!validatePan(formData.panNumber)) {
      newErrors.panNumber = "Invalid PAN format. Expected format: AAAAA9999A with valid 4th character"
    }

    // GSTIN validation (optional)
    if (formData.gstin.trim() && !validateGstin(formData.gstin)) {
      newErrors.gstin = "Invalid GSTIN format"
    }

    // Stakeholder validation for non-individual businesses
    if (formData.businessType !== "individual" && formData.businessType !== "proprietorship") {
      if (!formData.stakeholderName.trim()) {
        newErrors.stakeholderName = "Stakeholder name is required for this business type"
      }
      if (!formData.stakeholderPan.trim()) {
        newErrors.stakeholderPan = "Stakeholder PAN is required for this business type"
      } else if (!validatePan(formData.stakeholderPan)) {
        newErrors.stakeholderPan = "Invalid stakeholder PAN format"
      } else if (formData.stakeholderPan === formData.panNumber) {
        newErrors.stakeholderPan = "Stakeholder PAN cannot be the same as vendor PAN"
      }
    }

    // Bank details validation
    if (!formData.bankAccountNumber.trim()) newErrors.bankAccountNumber = "Bank account number is required"
    if (!formData.bankIfscCode.trim()) newErrors.bankIfscCode = "IFSC code is required"
    if (!formData.bankAccountHolderName.trim()) newErrors.bankAccountHolderName = "Account holder name is required"
    if (!formData.bankName.trim()) newErrors.bankName = "Bank name is required"

    // Removed: businessCategory/businessSubcategory validation (no longer asked in the form)
    // if (!formData.businessCategory) newErrors.businessCategory = "Business category is required"
    // if (!formData.businessSubcategory) newErrors.businessSubcategory = "Business subcategory is required"

    // Address validations
    if (!formData.addressStreet1.trim()) newErrors.addressStreet1 = "Street address is required"
    if (!formData.addressCity.trim()) newErrors.addressCity = "City is required"
    if (!formData.addressState.trim()) newErrors.addressState = "State is required"
    if (!formData.addressPostalCode.trim()) {
      newErrors.addressPostalCode = "PIN code is required"
    } else if (!validatePincode(formData.addressPostalCode)) {
      newErrors.addressPostalCode = "PIN code must be 6 digits"
    }

    // IFSC validation
    if (!formData.bankIfscCode.trim()) {
      newErrors.bankIfscCode = "IFSC code is required"
    } else if (!validateIFSC(formData.bankIfscCode.toUpperCase())) {
      newErrors.bankIfscCode = "Invalid IFSC format"
    }

    // Terms and confirmations
    if (!formData.acceptTnC) newErrors.acceptTnC = "You must accept the terms and conditions"
    if (!formData.acceptSettlementTerms) newErrors.acceptSettlementTerms = "You must accept the settlement terms"
    if (!formData.confirmAccuracy) newErrors.confirmAccuracy = "Please confirm information accuracy"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setServerError(null)
    try {
      await onSubmit({
        ...formData,
        status: formData.setAsActive ? "active" : "inactive",
        metadata: { 
          businessType: formData.businessType,
          ...(formData.businessType !== "individual" && formData.businessType !== "proprietorship" && {
            stakeholder: {
              name: formData.stakeholderName,
              pan: formData.stakeholderPan
            }
          })
        },
        // Explicit mapping for new backend fields
        businessCategory: "food",
        businessSubcategory: "restaurant",
        addressStreet1: formData.addressStreet1,
        addressStreet2: formData.addressStreet2,
        addressCity: formData.addressCity,
        addressState: formData.addressState,
        addressPostalCode: formData.addressPostalCode,
        addressCountry: formData.addressCountry,
        acceptTnC: formData.acceptTnC,
        acceptSettlementTerms: formData.acceptSettlementTerms,
        confirmAccuracy: formData.confirmAccuracy,
      })
    } catch (error: any) {
      // Bubble up error text to inline display
      const message = error?.message || 'An error occurred during onboarding'
      setServerError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const cuisineOptions = [
    "North Indian", "South Indian", "Chinese", "Italian", "Fast Food", 
    "Snacks", "Beverages", "Desserts", "Multi-cuisine", "Other"
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm p-3 rounded">
          {serverError}
        </div>
      )}
      {/* Basic Information */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stallName" className="text-white">Stall Name *</Label>
              <div className="relative">
                <Input
                  id="stallName"
                  value={formData.stallName}
                  onChange={(e) => handleInputChange("stallName", e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white pr-10"
                  placeholder="Enter stall name"
                />
                {isValidating.stallName && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {errors.stallName && <p className="text-red-400 text-sm mt-1">{errors.stallName}</p>}
            </div>

            <div>
              <Label htmlFor="vendorName" className="text-white">Vendor Name *</Label>
              <Input
                id="vendorName"
                value={formData.vendorName}
                onChange={(e) => handleInputChange("vendorName", e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="Enter vendor name"
              />
              {errors.vendorName && <p className="text-red-400 text-sm mt-1">{errors.vendorName}</p>}
            </div>

            <div>
              <Label htmlFor="contactEmail" className="text-white">Contact Email *</Label>
              <div className="relative">
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white pr-10"
                  placeholder="Enter email address"
                />
                {isValidating.contactEmail && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {errors.contactEmail && <p className="text-red-400 text-sm mt-1">{errors.contactEmail}</p>}
            </div>

            <div>
              <Label htmlFor="contactPhone" className="text-white">Contact Phone *</Label>
              <div className="relative">
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white pr-10"
                  placeholder="Enter phone number"
                />
                {isValidating.contactPhone && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {errors.contactPhone && <p className="text-red-400 text-sm mt-1">{errors.contactPhone}</p>}
            </div>

            <div>
              <Label htmlFor="stallLocation" className="text-white">Stall Location</Label>
              <Input
                id="stallLocation"
                value={formData.stallLocation}
                onChange={(e) => handleInputChange("stallLocation", e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="Enter stall location"
              />
            </div>

            <div>
              <Label htmlFor="cuisineType" className="text-white">Cuisine Type</Label>
              <Select value={formData.cuisineType} onValueChange={(value) => handleInputChange("cuisineType", value)}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue placeholder="Select cuisine type" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  {cuisineOptions.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine.toLowerCase()} className="text-white hover:bg-neutral-700">
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="bg-neutral-800 border-neutral-700 text-white"
              placeholder="Enter vendor description"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing business type + PAN/GSTIN UI here */}
          <div>
            <Label htmlFor="businessType" className="text-white">Business Type *</Label>
            <Select value={formData.businessType} onValueChange={(value) => handleInputChange("businessType", value)}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                <SelectItem value="individual" className="text-white hover:bg-neutral-700">Individual</SelectItem>
                <SelectItem value="proprietorship" className="text-white hover:bg-neutral-700">Proprietorship</SelectItem>
                <SelectItem value="partnership" className="text-white hover:bg-neutral-700">Partnership</SelectItem>
                <SelectItem value="company" className="text-white hover:bg-neutral-700">Company</SelectItem>
              </SelectContent>
            </Select>
            {errors.businessType && <p className="text-red-400 text-sm mt-1">{errors.businessType}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="panNumber" className="text-white">PAN Number *</Label>
              <div className="relative">
                <Input
                  id="panNumber"
                  value={formData.panNumber}
                  onChange={(e) => handleInputChange("panNumber", e.target.value.toUpperCase())}
                  className="bg-neutral-800 border-neutral-700 text-white pr-10"
                  placeholder="AAAAA9999A"
                  maxLength={10}
                />
                {isValidating.panNumber && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <p className="text-neutral-400 text-xs mt-1">
                Format: 5 letters, 4 digits, 1 letter (4th character must be C, H, F, A, T, B, J, G, or L)
              </p>
              {errors.panNumber && <p className="text-red-400 text-sm mt-1">{errors.panNumber}</p>}
            </div>

            <div>
              <Label htmlFor="gstin" className="text-white">GSTIN (Optional)</Label>
              <Input
                id="gstin"
                value={formData.gstin}
                onChange={(e) => handleInputChange("gstin", e.target.value.toUpperCase())}
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="Enter GSTIN"
                maxLength={15}
              />
              {errors.gstin && <p className="text-red-400 text-sm mt-1">{errors.gstin}</p>}
            </div>
          </div>

          {/* Stakeholder Information for non-individual businesses */}
          {formData.businessType !== "individual" && formData.businessType !== "proprietorship" && (
            <>
              <Separator className="bg-neutral-700" />
              <div className="space-y-4">
                <h4 className="text-white font-medium">Stakeholder Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stakeholderName" className="text-white">Stakeholder Name *</Label>
                    <Input
                      id="stakeholderName"
                      value={formData.stakeholderName}
                      onChange={(e) => handleInputChange("stakeholderName", e.target.value)}
                      className="bg-neutral-800 border-neutral-700 text-white"
                      placeholder="Enter stakeholder name"
                    />
                    {errors.stakeholderName && <p className="text-red-400 text-sm mt-1">{errors.stakeholderName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="stakeholderPan" className="text-white">Stakeholder PAN *</Label>
                    <Input
                      id="stakeholderPan"
                      value={formData.stakeholderPan}
                      onChange={(e) => handleInputChange("stakeholderPan", e.target.value.toUpperCase())}
                      className="bg-neutral-800 border-neutral-700 text-white"
                      placeholder="AAAAA9999A"
                      maxLength={10}
                    />
                    <p className="text-neutral-400 text-xs mt-1">Must be different from vendor PAN</p>
                    {errors.stakeholderPan && <p className="text-red-400 text-sm mt-1">{errors.stakeholderPan}</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Business Address */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Business Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="addressStreet1" className="text-white">Street Address Line 1 *</Label>
              <Input id="addressStreet1" value={formData.addressStreet1} onChange={(e) => handleInputChange("addressStreet1", e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" />
              {errors.addressStreet1 && <p className="text-red-400 text-sm mt-1">{errors.addressStreet1}</p>}
            </div>
            <div>
              <Label htmlFor="addressStreet2" className="text-white">Street Address Line 2</Label>
              <Input id="addressStreet2" value={formData.addressStreet2} onChange={(e) => handleInputChange("addressStreet2", e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" />
            </div>
            <div>
              <Label htmlFor="addressCity" className="text-white">City *</Label>
              <Input id="addressCity" value={formData.addressCity} onChange={(e) => handleInputChange("addressCity", e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" />
              {errors.addressCity && <p className="text-red-400 text-sm mt-1">{errors.addressCity}</p>}
            </div>
            <div>
              <Label htmlFor="addressState" className="text-white">State *</Label>
              <Input id="addressState" value={formData.addressState} onChange={(e) => handleInputChange("addressState", e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" placeholder="e.g., DELHI" />
              {errors.addressState && <p className="text-red-400 text-sm mt-1">{errors.addressState}</p>}
            </div>
            <div>
              <Label htmlFor="addressPostalCode" className="text-white">PIN Code *</Label>
              <Input id="addressPostalCode" value={formData.addressPostalCode} onChange={(e) => handleInputChange("addressPostalCode", e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" />
              {errors.addressPostalCode && <p className="text-red-400 text-sm mt-1">{errors.addressPostalCode}</p>}
            </div>
            <div>
              <Label htmlFor="addressCountry" className="text-white">Country</Label>
              <Input id="addressCountry" value={formData.addressCountry} disabled className="bg-neutral-800 border-neutral-700 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankAccountNumber" className="text-white">Account Number *</Label>
              <Input
                id="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={(e) => handleInputChange("bankAccountNumber", e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="Enter account number"
              />
              {errors.bankAccountNumber && <p className="text-red-400 text-sm mt-1">{errors.bankAccountNumber}</p>}
            </div>

            <div>
              <Label htmlFor="bankIfscCode" className="text-white">IFSC Code *</Label>
              <Input
                id="bankIfscCode"
                value={formData.bankIfscCode}
                onChange={(e) => handleInputChange("bankIfscCode", e.target.value.toUpperCase())}
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="Enter IFSC code"
              />
              {errors.bankIfscCode && <p className="text-red-400 text-sm mt-1">{errors.bankIfscCode}</p>}
            </div>

            <div>
              <Label htmlFor="bankAccountHolderName" className="text-white">Account Holder Name *</Label>
              <Input
                id="bankAccountHolderName"
                value={formData.bankAccountHolderName}
                onChange={(e) => handleInputChange("bankAccountHolderName", e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="Enter account holder name"
              />
              {errors.bankAccountHolderName && <p className="text-red-400 text-sm mt-1">{errors.bankAccountHolderName}</p>}
            </div>

            <div>
              <Label htmlFor="bankName" className="text-white">Bank Name *</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
                placeholder="Enter bank name"
              />
              {errors.bankName && <p className="text-red-400 text-sm mt-1">{errors.bankName}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Settings */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Operational Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxOrdersPerHour" className="text-white">Max Orders per Hour</Label>
              <Input
                id="maxOrdersPerHour"
                type="number"
                min="1"
                max="100"
                value={formData.maxOrdersPerHour}
                onChange={(e) => handleInputChange("maxOrdersPerHour", parseInt(e.target.value))}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="averagePreparationTime" className="text-white">Average Preparation Time (minutes)</Label>
              <Input
                id="averagePreparationTime"
                type="number"
                min="1"
                max="120"
                value={formData.averagePreparationTime}
                onChange={(e) => handleInputChange("averagePreparationTime", parseInt(e.target.value))}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
          </div>

          {/* Vendor Status Setting */}
          <Separator className="bg-neutral-700" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="setAsActive" className="text-white font-medium">
                  Set Vendor as Active
                </Label>
                <p className="text-sm text-neutral-400">
                  Enable this to make the vendor active immediately upon creation. 
                  Active vendors can receive orders and appear in customer listings.
                </p>
              </div>
              <Switch
                id="setAsActive"
                checked={formData.setAsActive}
                onCheckedChange={(checked) => {
                  handleInputChange("setAsActive", checked)
                  handleInputChange("status", checked ? "active" : "inactive")
                }}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
            {formData.setAsActive && (
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                <p className="text-blue-200 text-sm">
                  ✓ This vendor will be set as <strong>Active</strong> and will be able to receive orders immediately after creation.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* NEW: Terms and Conditions */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Terms and Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <input id="acceptTnC" type="checkbox" checked={formData.acceptTnC} onChange={(e) => handleInputChange("acceptTnC", e.target.checked)} className="mt-1" />
            <Label htmlFor="acceptTnC" className="text-white">I accept the terms and conditions for vendor registration and payment processing *</Label>
          </div>
          {errors.acceptTnC && <p className="text-red-400 text-sm">{errors.acceptTnC}</p>}
          <div className="flex items-start gap-3">
            <input id="acceptSettlementTerms" type="checkbox" checked={formData.acceptSettlementTerms} onChange={(e) => handleInputChange("acceptSettlementTerms", e.target.checked)} className="mt-1" />
            <Label htmlFor="acceptSettlementTerms" className="text-white">I agree to the settlement terms and fee structure *</Label>
          </div>
          {errors.acceptSettlementTerms && <p className="text-red-400 text-sm">{errors.acceptSettlementTerms}</p>}
          <div className="flex items-start gap-3">
            <input id="confirmAccuracy" type="checkbox" checked={formData.confirmAccuracy} onChange={(e) => handleInputChange("confirmAccuracy", e.target.checked)} className="mt-1" />
            <Label htmlFor="confirmAccuracy" className="text-white">I confirm that all information provided is accurate and up-to-date *</Label>
          </div>
          {errors.confirmAccuracy && <p className="text-red-400 text-sm">{errors.confirmAccuracy}</p>}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-white border-neutral-600 hover:bg-neutral-800"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? "Creating Vendor..." : "Create Vendor"}
        </Button>
      </div>
    </form>
  )
}
