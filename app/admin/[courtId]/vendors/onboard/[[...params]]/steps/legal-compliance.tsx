"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle, FileText, Upload, X, CheckCircle, Info } from "lucide-react"
import Image from "next/image"

interface LegalComplianceStepProps {
  vendorData: any
  updateVendorData: (data: any) => void
  onNext: (data: any) => void
  onBack: () => void
  loading: boolean
  courtId: string
  vendorId?: string
}

const BUSINESS_TYPES = [
  {
    value: "individual",
    label: "Individual",
    description: "Single person business",
    gstRequired: false
  },
  {
    value: "proprietorship",
    label: "Proprietorship",
    description: "Single owner business entity",
    gstRequired: false
  },
  {
    value: "partnership",
    label: "Partnership Firm",
    description: "Business owned by 2+ partners",
    gstRequired: true
  },
  {
    value: "private_limited",
    label: "Private Limited Company",
    description: "Incorporated company with limited liability",
    gstRequired: true
  },
  {
    value: "llp",
    label: "Limited Liability Partnership (LLP)",
    description: "Partnership with limited liability",
    gstRequired: true
  },
  {
    value: "society",
    label: "Society / Trust / NGO",
    description: "Non-profit organization",
    gstRequired: true
  }
]

export default function LegalComplianceStep({
  vendorData,
  updateVendorData,
  onNext,
  onBack,
  loading,
  courtId,
  vendorId,
}: LegalComplianceStepProps) {
  const [formData, setFormData] = useState({
    businessType: vendorData?.metadata?.businessType || "",
    panNumber: vendorData?.panNumber || "",
    gstin: vendorData?.gstin || "",
    panDocumentUrl: vendorData?.metadata?.panDocumentUrl || "",
    panDocFileId: vendorData?.metadata?.panDocFileId || "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const panDocRef = useRef<HTMLInputElement>(null)

  const selectedBusinessType = BUSINESS_TYPES.find(bt => bt.value === formData.businessType)
  const isGstRequired = selectedBusinessType?.gstRequired || false

  // Remove the problematic useEffect that was causing infinite re-renders
  // useEffect(() => {
  //   updateVendorData({
  //     ...formData,
  //     metadata: {
  //       ...vendorData?.metadata,
  //       businessType: formData.businessType,
  //       panDocumentUrl: formData.panDocumentUrl,
  //       panDocFileId: formData.panDocFileId,
  //     }
  //   })
  // }, [formData, updateVendorData, vendorData?.metadata])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.businessType) {
      newErrors.businessType = "Business type is required"
    }

    if (!formData.panNumber.trim()) {
      newErrors.panNumber = "PAN number is required"
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.trim())) {
      newErrors.panNumber = "Invalid PAN format (e.g., ABCDE1234F)"
    }

    // PAN document validation removed as upload functionality is commented out

    if (isGstRequired && !formData.gstin.trim()) {
      newErrors.gstin = "GSTIN is required for this business type"
    } else if (formData.gstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin.trim())) {
      newErrors.gstin = "Invalid GSTIN format"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value

    // Format PAN and GSTIN to uppercase
    if (field === "panNumber" || field === "gstin") {
      processedValue = value.toUpperCase()
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleFileUpload = async (file: File) => {
    // Validate file
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setErrors(prev => ({ ...prev, panDocument: "Please upload an image or PDF file" }))
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors(prev => ({ ...prev, panDocument: "File size must be less than 5MB" }))
      return
    }

    setUploading(true)
    setErrors(prev => ({ ...prev, panDocument: "" }))

    try {
      // Upload document to our server
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'documents')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          panDocumentUrl: result.data.url,
          panDocFileId: result.data.publicId
        }))
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Upload error:", error)
      setErrors(prev => ({ 
        ...prev, 
        panDocument: "Failed to upload document. Please try again." 
      }))
    } finally {
      setUploading(false)
    }
  }

  const removePanDocument = () => {
    setFormData(prev => ({
      ...prev,
      panDocumentUrl: "",
      panDocFileId: ""
    }))
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // Update vendor data before proceeding to next step
    updateVendorData({
      ...formData,
      metadata: {
        ...vendorData?.metadata,
        businessType: formData.businessType,
        panDocumentUrl: formData.panDocumentUrl,
        panDocFileId: formData.panDocFileId,
      }
    })

    onNext(formData)
  }

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Provide legal and compliance information required for payment processing and tax compliance.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type *</Label>
            <Select 
              value={formData.businessType} 
              onValueChange={(value) => handleInputChange("businessType", value)}
            >
              <SelectTrigger className={errors.businessType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select your business type" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.businessType && (
              <p className="text-sm text-red-500">{errors.businessType}</p>
            )}
            {selectedBusinessType && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700">{selectedBusinessType.label}</p>
                  <p className="text-blue-600">{selectedBusinessType.description}</p>
                  <p className="text-blue-600 mt-1">
                    GSTIN: {isGstRequired ? "Required" : "Optional"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="panNumber">PAN Number *</Label>
            <Input
              id="panNumber"
              placeholder="e.g., ABCDE1234F"
              value={formData.panNumber}
              onChange={(e) => handleInputChange("panNumber", e.target.value)}
              className={errors.panNumber ? "border-red-500" : ""}
              maxLength={10}
            />
            {errors.panNumber && (
              <p className="text-sm text-red-500">{errors.panNumber}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter your PAN as mentioned on the PAN card
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstin">
              GSTIN {isGstRequired ? "*" : "(Optional)"}
            </Label>
            <Input
              id="gstin"
              placeholder="e.g., 18AABCU9603R1ZM"
              value={formData.gstin}
              onChange={(e) => handleInputChange("gstin", e.target.value)}
              className={errors.gstin ? "border-red-500" : ""}
              maxLength={15}
              disabled={!selectedBusinessType}
            />
            {errors.gstin && (
              <p className="text-sm text-red-500">{errors.gstin}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {isGstRequired 
                ? "GSTIN is mandatory for this business type"
                : "GSTIN is optional for individual/proprietorship businesses"
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Temporarily commented out PAN document upload functionality */}
      {/* 
      <Card>
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>PAN Document *</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
              {formData.panDocumentUrl ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {formData.panDocumentUrl.toLowerCase().includes('.pdf') ? (
                      <FileText className="h-8 w-8 text-red-500" />
                    ) : (
                      <Image
                        src={formData.panDocumentUrl}
                        alt="PAN document"
                        width={32}
                        height={32}
                        className="rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">PAN document uploaded</p>
                      <p className="text-sm text-muted-foreground">Click to change</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removePanDocument}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium mb-2">Upload PAN Card</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clear image or PDF of your PAN card (max 5MB)
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => panDocRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploading ? "Uploading..." : "Choose File"}
                  </Button>
                </div>
              )}
              <input
                ref={panDocRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
              />
            </div>
            {errors.panDocument && (
              <p className="text-sm text-red-500">{errors.panDocument}</p>
            )}
          </div>
        </CardContent>
      </Card>
      */}

      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Important:</strong> After submitting this step, we will create your Razorpay merchant account. 
          Please ensure all information is accurate as it cannot be easily changed later.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || uploading}
          className="gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Razorpay Account
        </Button>
      </div>
    </div>
  )
}
