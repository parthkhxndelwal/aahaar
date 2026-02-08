"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"

// Import step components
import BasicDetailsStep from "./steps/basic-details"
import PasswordCreationStep from "./steps/password-creation"
import StallSetupStep from "./steps/stall-setup"
import OperatingHoursStep from "./steps/operating-hours"
import BankDetailsStep from "./steps/bank-details"
import LegalComplianceStep from "./steps/legal-compliance"
import AccountCreationStep from "./steps/account-creation"
import FinalConfigurationStep from "./steps/final-configuration"
import SuccessStep from "./steps/success"

interface VendorOnboardingData {
  id?: string
  // Basic Details
  stallName: string
  vendorName: string
  contactEmail: string
  contactPhone: string
  stallLocation: string
  cuisineType: string
  description: string
  
  // Stall Setup
  logoUrl: string
  bannerUrl?: string
  
  // Operating Hours
  operatingHours: {
    [key: string]: {
      open: string
      close: string
      closed: boolean
    }
  }
  
  // Bank Details
  bankAccountNumber: string
  bankIfscCode: string
  bankAccountHolderName: string
  bankName: string
  
  // Legal Compliance
  panNumber: string
  gstin: string
  businessType: string
  panDocFileId?: string
  
  // Configuration
  maxOrdersPerHour: number
  averagePreparationTime: number
}

const STEPS = [
  { key: "basic", title: "Basic Details", component: BasicDetailsStep },
  { key: "password", title: "Password Creation", component: PasswordCreationStep },
  { key: "stall", title: "Stall Setup", component: StallSetupStep },
  { key: "hours", title: "Operating Hours", component: OperatingHoursStep },
  { key: "bank", title: "Bank Details", component: BankDetailsStep },
  { key: "legal", title: "Legal Compliance", component: LegalComplianceStep },
  { key: "account", title: "Account Creation", component: AccountCreationStep },
  { key: "config", title: "Final Configuration", component: FinalConfigurationStep },
  { key: "success", title: "Success", component: SuccessStep },
]

export default function VendorOnboardingPage() {
  const params = useParams()
  const router = useRouter()
  
  const courtId = params.courtId as string
  const stepParam = params.params?.[0] || "basic"
  const vendorId = params.params?.[1] || null
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [vendorData, setVendorData] = useState<VendorOnboardingData>({
    stallName: "",
    vendorName: "",
    contactEmail: "",
    contactPhone: "",
    stallLocation: "",
    cuisineType: "",
    description: "",
    logoUrl: "",
    operatingHours: {
      monday: { open: "09:00", close: "18:00", closed: false },
      tuesday: { open: "09:00", close: "18:00", closed: false },
      wednesday: { open: "09:00", close: "18:00", closed: false },
      thursday: { open: "09:00", close: "18:00", closed: false },
      friday: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "09:00", close: "18:00", closed: false },
      sunday: { open: "09:00", close: "18:00", closed: true },
    },
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountHolderName: "",
    bankName: "",
    panNumber: "",
    gstin: "",
    businessType: "partnership",
    maxOrdersPerHour: 10,
    averagePreparationTime: 15,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Find current step index based on URL param
  useEffect(() => {
    const stepIndex = STEPS.findIndex(step => step.key === stepParam)
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex)
    }
  }, [stepParam])

  // Load existing vendor data if editing
  useEffect(() => {
    if (vendorId) {
      loadVendorData()
    }
  }, [vendorId])

  const loadVendorData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/vendors/${vendorId}`)
      const result = await response.json()
      
      if (result.success) {
        setVendorData({
          id: result.data.vendor.id,
          stallName: result.data.vendor.stallName || "",
          vendorName: result.data.vendor.vendorName || "",
          contactEmail: result.data.vendor.contactEmail || "",
          contactPhone: result.data.vendor.contactPhone || "",
          stallLocation: result.data.vendor.stallLocation || "",
          cuisineType: result.data.vendor.cuisineType || "",
          description: result.data.vendor.description || "",
          logoUrl: result.data.vendor.logoUrl || "",
          bannerUrl: result.data.vendor.bannerUrl || "",
          operatingHours: result.data.vendor.operatingHours || vendorData.operatingHours,
          bankAccountNumber: result.data.vendor.bankAccountNumber || "",
          bankIfscCode: result.data.vendor.bankIfscCode || "",
          bankAccountHolderName: result.data.vendor.bankAccountHolderName || "",
          bankName: result.data.vendor.bankName || "",
          panNumber: result.data.vendor.panNumber || "",
          gstin: result.data.vendor.gstin || "",
          businessType: result.data.vendor.metadata?.businessType || "partnership",
          panDocFileId: result.data.vendor.metadata?.panDocFileId || "",
          maxOrdersPerHour: result.data.vendor.maxOrdersPerHour || 10,
          averagePreparationTime: result.data.vendor.averagePreparationTime || 15,
        })
      }
    } catch (error) {
      console.error("Failed to load vendor data:", error)
      setError("Failed to load vendor data")
    } finally {
      setLoading(false)
    }
  }

  const updateVendorData = useCallback((updates: Partial<VendorOnboardingData>) => {
    setVendorData(prev => ({ ...prev, ...updates }))
  }, [])

  const goToStep = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= STEPS.length) return
    
    const step = STEPS[stepIndex]
    const url = vendorData.id 
      ? `/admin/${courtId}/vendors/onboard/${step.key}/${vendorData.id}`
      : `/admin/${courtId}/vendors/onboard/${step.key}`
    
    router.push(url)
  }

  const saveVendorData = async (stepData: any) => {
    try {
      setLoading(true)
      
      // Sanitize stepData to remove any circular references or non-serializable data
      const sanitizeData = (obj: any): any => {
        if (obj === null || typeof obj !== 'object') {
          return obj
        }
        
        if (obj instanceof HTMLElement || obj instanceof Event) {
          return undefined // Remove DOM elements and events
        }
        
        if (Array.isArray(obj)) {
          return obj.map(sanitizeData).filter(item => item !== undefined)
        }
        
        const sanitized: any = {}
        for (const [key, value] of Object.entries(obj)) {
          try {
            const sanitizedValue = sanitizeData(value)
            if (sanitizedValue !== undefined) {
              sanitized[key] = sanitizedValue
            }
          } catch (error) {
            // Skip properties that can't be serialized
            console.warn(`Skipping non-serializable property: ${key}`)
          }
        }
        return sanitized
      }
      
      const cleanStepData = sanitizeData(stepData)
      console.log('Saving step data:', cleanStepData)
      console.log('Step data keys:', Object.keys(cleanStepData || {}))
      if (cleanStepData?.status) {
        console.log('⚠️ WARNING: Step data contains status field:', cleanStepData.status)
      }
      
      if (vendorData.id) {
        // Update existing vendor
        const response = await fetch(`/api/admin/vendors/${vendorData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...cleanStepData,
            courtId,
          }),
        })
        
        const result = await response.json()
        if (!result.success) {
          setError(result.message || "Failed to update vendor")
          return false
        }
        
        return true
      } else {
        // Create new vendor
        const response = await fetch(`/api/admin/vendors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...cleanStepData,
            courtId,
          }),
        })
        
        const result = await response.json()
        if (result.success) {
          // Update local data with created vendor
          setVendorData(prev => ({ ...prev, id: result.data.vendor.id }))
          return true
        } else {
          setError(result.message || "Failed to create vendor")
          return false
        }
      }
    } catch (error) {
      console.error("Save vendor data error:", error)
      setError("Failed to save vendor data")
      return false
    } finally {
      setLoading(false)
    }
  }

  const goToNextStep = async (stepData?: any) => {
    if (stepData) {
      const saved = await saveVendorData(stepData)
      if (!saved) return
    }
    goToStep(currentStepIndex + 1)
  }

  const goToPrevStep = () => {
    goToStep(currentStepIndex - 1)
  }

  const currentStep = STEPS[currentStepIndex]
  const CurrentStepComponent = currentStep.component
  const progressPercentage = ((currentStepIndex + 1) / STEPS.length) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vendor data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/admin/${courtId}/vendors`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vendors
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {vendorId ? "Edit Vendor" : "Vendor Onboarding"}
          </h1>
          <p className="text-muted-foreground">
            Complete all steps to register a new vendor
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Step {currentStepIndex + 1} of {STEPS.length}: {currentStep.title}
            </CardTitle>
            <Badge variant="outline">
              {Math.round(progressPercentage)}% Complete
            </Badge>
          </div>
          <Progress value={progressPercentage} className="mt-2" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STEPS.map((step, index) => (
              <Badge
                key={step.key}
                variant={index === currentStepIndex ? "default" : index < currentStepIndex ? "secondary" : "outline"}
                className={`cursor-pointer ${
                  index < currentStepIndex ? "bg-green-100 text-green-800" : ""
                }`}
                onClick={() => goToStep(index)}
              >
                {index < currentStepIndex && <CheckCircle className="h-3 w-3 mr-1" />}
                {step.title}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Step Component */}
      <CurrentStepComponent
        vendorData={vendorData}
        updateVendorData={updateVendorData}
        courtId={courtId}
        vendorId={vendorId || undefined}
        onNext={goToNextStep}
        onBack={goToPrevStep}
        loading={loading}
      />

      {/* Navigation */}
      {currentStepIndex < STEPS.length - 1 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={goToPrevStep}
            disabled={currentStepIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={goToNextStep}
            disabled={currentStepIndex === STEPS.length - 1}
            className="gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
