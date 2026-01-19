"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Upload, Store, User, CreditCard, MapPin, Clock, Clipboard } from "lucide-react"

interface VendorFormData {
  // Basic Information
  stallName: string
  vendorName: string
  email: string
  phone: string
  password: string
  
  // Stall Details
  stallLocation: string
  cuisineType: string
  description: string
  logoUrl?: string
  bannerUrl?: string
  
  // Operating Hours
  operatingHours: {
    [key: string]: {
      isOpen: boolean
      startTime: string
      endTime: string
    }
  }
  
  // Bank Details
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  bankName: string
  // Legal Information
  panNumber: string
  gstin?: string
  
  // Settings
  maxOrdersPerHour: number
  averagePreparationTime: number
  isActive: boolean
}

export default function AddVendorPage({ params }: { params: Promise<{ courtId: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const { token } = useAuth()
  const { courtId } = use(params)
  
  const [formData, setFormData] = useState<VendorFormData>({
    stallName: "",
    vendorName: "",
    email: "",
    phone: "",
    password: "",
    stallLocation: "",
    cuisineType: "",
    description: "",
    operatingHours: {
      monday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      tuesday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      wednesday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      thursday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      friday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      saturday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      sunday: { isOpen: false, startTime: "09:00", endTime: "17:00" }
    },
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    panNumber: "",
    gstin: "",
    maxOrdersPerHour: 10,
    averagePreparationTime: 15,
    isActive: true,
  })
  
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  // Validation functions
  const validatePAN = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    return panRegex.test(pan)
  }

  const validateGSTIN = (gstin: string): boolean => {
    if (!gstin) return true // GSTIN is optional
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstinRegex.test(gstin)
  }

  const updateOperatingHours = (day: string, field: string, value: any) => {
    setFormData({
      ...formData,
      operatingHours: {
        ...formData.operatingHours,
        [day]: {
          ...formData.operatingHours[day],
          [field]: value
        }
      }
    })
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingLogo(true)
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("upload_preset", "vendor_logos")

      const response = await fetch(`/api/upload`, {
        method: "POST",
        body: uploadFormData,
      })

      const result = await response.json()
      if (result.success) {
        setFormData({ ...formData, logoUrl: result.data.url })
        toast({
          title: "Success",
          description: "Logo uploaded successfully",
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleLogoFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read()
      const imageItem = clipboardItems.find(item => 
        item.types.some(type => type.startsWith('image/'))
      )
      
      if (!imageItem) {
        toast({
          title: "No image found",
          description: "Please copy an image to your clipboard first",
          variant: "destructive",
        })
        return
      }

      const imageBlob = await imageItem.getType(
        imageItem.types.find(type => type.startsWith('image/')) || 'image/png'
      )
      
      const file = new File([imageBlob], 'clipboard-image.png', { type: imageBlob.type })
      
      setUploadingLogo(true)
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("upload_preset", "vendor_logos")

      const response = await fetch(`/api/upload`, {
        method: "POST",
        body: uploadFormData,
      })

      const result = await response.json()
      if (result.success) {
        setFormData({ ...formData, logoUrl: result.data.url })
        toast({
          title: "Success",
          description: "Logo uploaded from clipboard successfully",
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo from clipboard",
        variant: "destructive",
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingBanner(true)
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("upload_preset", "vendor_logos")

      const response = await fetch(`/api/upload`, {
        method: "POST",
        body: uploadFormData,
      })

      const result = await response.json()
      if (result.success) {
        setFormData({ ...formData, bannerUrl: result.data.url })
        toast({
          title: "Success",
          description: "Banner uploaded successfully",
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload banner",
        variant: "destructive",
      })
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleBannerFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read()
      const imageItem = clipboardItems.find(item => 
        item.types.some(type => type.startsWith('image/'))
      )
      
      if (!imageItem) {
        toast({
          title: "No image found",
          description: "Please copy an image to your clipboard first",
          variant: "destructive",
        })
        return
      }

      const imageBlob = await imageItem.getType(
        imageItem.types.find(type => type.startsWith('image/')) || 'image/png'
      )
      
      const file = new File([imageBlob], 'clipboard-banner.png', { type: imageBlob.type })
      
      setUploadingBanner(true)
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("upload_preset", "vendor_logos")

      const response = await fetch(`/api/upload`, {
        method: "POST",
        body: uploadFormData,
      })

      const result = await response.json()
      if (result.success) {
        setFormData({ ...formData, bannerUrl: result.data.url })
        toast({
          title: "Success",
          description: "Banner uploaded from clipboard successfully",
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload banner from clipboard",
        variant: "destructive",
      })
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      console.log("📤 Submitting vendor data:", formData)
      console.log("📤 Logo URL:", formData.logoUrl)
      console.log("📤 Banner URL:", formData.bannerUrl)
      console.log("📤 isActive value:", formData.isActive)
      
      const response = await fetch(`/api/courts/${courtId}/vendors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: "Vendor added successfully",
        })
        router.push(`/admin/${courtId}/vendors`)
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add vendor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.stallName && formData.vendorName && formData.email && formData.phone && formData.password)
      case 2:
        return !!(formData.stallLocation && formData.cuisineType)
      case 3:
        return !!(
          formData.accountHolderName && 
          formData.accountNumber && 
          formData.ifscCode && 
          formData.bankName && 
          formData.panNumber && 
          validatePAN(formData.panNumber) &&
          validateGSTIN(formData.gstin || "")
        )
      default:
        return true
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Enter vendor contact and login details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stallName">Stall Name *</Label>
                  <Input
                    id="stallName"
                    value={formData.stallName}
                    onChange={(e) => setFormData({ ...formData, stallName: e.target.value })}
                    placeholder="e.g., Cafe Delight"
                  />
                </div>
                <div>
                  <Label htmlFor="vendorName">Vendor Name *</Label>
                  <Input
                    id="vendorName"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    placeholder="e.g., John Smith"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vendor@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter temporary password"
                />
                <p className="text-xs text-gray-500 mt-1">Vendor can change this after first login</p>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Stall Details
              </CardTitle>
              <CardDescription>Configure stall information and operating hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stallLocation">Stall Location *</Label>
                  <Input
                    id="stallLocation"
                    value={formData.stallLocation}
                    onChange={(e) => setFormData({ ...formData, stallLocation: e.target.value })}
                    placeholder="e.g., Ground Floor, Section A"
                  />
                </div>
                <div>
                  <Label htmlFor="cuisineType">Cuisine Type *</Label>
                  <Select value={formData.cuisineType} onValueChange={(value) => setFormData({ ...formData, cuisineType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cuisine type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indian">Indian</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="italian">Italian</SelectItem>
                      <SelectItem value="fast-food">Fast Food</SelectItem>
                      <SelectItem value="beverages">Beverages</SelectItem>
                      <SelectItem value="desserts">Desserts</SelectItem>
                      <SelectItem value="snacks">Snacks</SelectItem>
                      <SelectItem value="continental">Continental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the stall..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Stall Logo</Label>
                <div className="mt-2 flex items-center gap-4">
                  {formData.logoUrl && (
                    <div className="w-16 h-16 rounded-lg border overflow-hidden">
                      <img 
                        src={formData.logoUrl} 
                        alt="Stall Logo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <Button variant="outline" disabled={uploadingLogo} asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingLogo ? "Uploading..." : "Upload Logo"}
                          </span>
                        </Button>
                      </Label>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleLogoFromClipboard}
                      disabled={uploadingLogo}
                      type="button"
                    >
                      <Clipboard className="h-4 w-4 mr-2" />
                      {uploadingLogo ? "Uploading..." : "Paste from Clipboard"}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Upload a file or paste an image from your clipboard</p>
              </div>

              <div>
                <Label>Stall Banner</Label>
                <div className="mt-2 flex items-center gap-4">
                  {formData.bannerUrl && (
                    <div className="w-32 h-16 rounded-lg border overflow-hidden">
                      <img 
                        src={formData.bannerUrl} 
                        alt="Stall Banner" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        disabled={uploadingBanner}
                        className="hidden"
                        id="banner-upload"
                      />
                      <Label htmlFor="banner-upload" className="cursor-pointer">
                        <Button variant="outline" disabled={uploadingBanner} asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingBanner ? "Uploading..." : "Upload Banner"}
                          </span>
                        </Button>
                      </Label>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleBannerFromClipboard}
                      disabled={uploadingBanner}
                      type="button"
                    >
                      <Clipboard className="h-4 w-4 mr-2" />
                      {uploadingBanner ? "Uploading..." : "Paste from Clipboard"}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Upload a file or paste an image from your clipboard</p>
              </div>

              <Separator />

              <div>
                <Label className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4" />
                  Operating Hours
                </Label>
                <div className="space-y-3">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-24">
                        <Label className="capitalize">{day}</Label>
                      </div>
                      <Switch
                        checked={formData.operatingHours[day].isOpen}
                        onCheckedChange={(value) => updateOperatingHours(day, "isOpen", value)}
                      />
                      {formData.operatingHours[day].isOpen && (
                        <>
                          <div>
                            <Label className="text-xs">Start</Label>
                            <Input
                              type="time"
                              value={formData.operatingHours[day].startTime}
                              onChange={(e) => updateOperatingHours(day, "startTime", e.target.value)}
                              className="w-24"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">End</Label>
                            <Input
                              type="time"
                              value={formData.operatingHours[day].endTime}
                              onChange={(e) => updateOperatingHours(day, "endTime", e.target.value)}
                              className="w-24"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Details
              </CardTitle>
              <CardDescription>Enter bank account details for payouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                  <Input
                    id="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                    placeholder="As per bank records"
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="Enter account number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ifscCode">IFSC Code *</Label>
                  <Input
                    id="ifscCode"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g., HDFC0001234"
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g., HDFC Bank"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium mb-3 block">Legal Information</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="panNumber">PAN Number *</Label>
                    <Input
                      id="panNumber"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                      placeholder="e.g., AAAAA9999A"
                      maxLength={10}
                      className={formData.panNumber && !validatePAN(formData.panNumber) ? "border-red-500" : ""}
                    />
                    <p className="text-xs text-gray-500 mt-1">Required for Razorpay account creation</p>
                    {formData.panNumber && !validatePAN(formData.panNumber) && (
                      <p className="text-xs text-red-500 mt-1">Invalid PAN format. Should be: AAAAA9999A</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="gstin">GSTIN (Optional)</Label>
                    <Input
                      id="gstin"
                      value={formData.gstin || ""}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      placeholder="e.g., 18AABCU9603R1ZM"
                      maxLength={15}
                      className={formData.gstin && !validateGSTIN(formData.gstin) ? "border-red-500" : ""}
                    />
                    <p className="text-xs text-gray-500 mt-1">Goods and Services Tax Identification Number</p>
                    {formData.gstin && !validateGSTIN(formData.gstin) && (
                      <p className="text-xs text-red-500 mt-1">Invalid GSTIN format</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Final Settings
              </CardTitle>
              <CardDescription>Configure operational settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxOrdersPerHour">Max Orders per Hour</Label>
                  <Input
                    id="maxOrdersPerHour"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxOrdersPerHour}
                    onChange={(e) => setFormData({ ...formData, maxOrdersPerHour: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum orders the stall can handle per hour</p>
                </div>
                <div>
                  <Label htmlFor="averagePreparationTime">Average Prep Time (minutes)</Label>
                  <Input
                    id="averagePreparationTime"
                    type="number"
                    min="1"
                    max="120"
                    value={formData.averagePreparationTime}
                    onChange={(e) => setFormData({ ...formData, averagePreparationTime: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Average time to prepare orders</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Active Status</Label>
                  <p className="text-sm text-gray-500">Make this vendor active immediately</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(value) => setFormData({ ...formData, isActive: value })}
                />
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 text-white" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-100">Add New Vendor</h1>
          <p className="text-neutral-400">Add a new vendor to your food court</p>
        </div>
      </div>
      {/* Note div */}
      <div className="flex items-center gap-4 bg-neutral-900 rounded-xl p-4 text-white">
        Note: Upon creation, you won't be able to delete a Vendor's Account, as per RBI Guidelines.<span><a href="#" className=" hover:text-blue-500 transition-all duration-100">Learn more</a></span>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex w-full items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`w-full h-1 mx-2 ${
                  step < currentStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
        {[4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step}
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!validateStep(currentStep)}
          >
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading || !validateStep(currentStep)}>
            {loading ? "Adding Vendor..." : "Add Vendor"}
          </Button>
        )}
      </div>
    </div>
  )
}
