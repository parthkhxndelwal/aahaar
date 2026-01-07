"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Settings, Clock, CreditCard, Users, Shield, Upload, Building, Mail, Phone } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface CourtSettings {
  // General Settings
  instituteName: string
  instituteType: string
  logoUrl?: string
  address: string
  contactPhone: string
  
  // Operating Hours
  operatingHours: {
    [key: string]: {
      isOpen: boolean
      startTime: string
      endTime: string
      breakStart?: string
      breakEnd?: string
    }
  }
  
  // Payment Settings
  enableOnlinePayments: boolean
  enableCOD: boolean
  razorpayKeyId?: string
  platformCommission: number
  
  // Order Settings
  maxOrdersPerStall: number
  orderBufferTime: number
  autoConfirmOrders: boolean
  allowAdvanceOrders: boolean
  
  // User Settings
  requireEmailVerification: boolean
  requirePhoneVerification: boolean
  allowedEmailDomains: string[]
  maxOrdersPerUser: number
  
  // Advanced Settings
  timezone?: string
  minimumOrderAmount?: number
  maximumOrderAmount?: number
  orderCancellationWindow?: number
}

export default function AdminSettingsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const [settings, setSettings] = useState<CourtSettings>({
    instituteName: "",
    instituteType: "college",
    address: "",
    contactPhone: "",
    operatingHours: {
      monday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      tuesday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      wednesday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      thursday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      friday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      saturday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      sunday: { isOpen: false, startTime: "09:00", endTime: "17:00" }
    },
    enableOnlinePayments: true,
    enableCOD: true,
    platformCommission: 5,
    maxOrdersPerStall: 10,
    orderBufferTime: 15,
    autoConfirmOrders: false,
    allowAdvanceOrders: true,
    requireEmailVerification: false,
    requirePhoneVerification: true,
    allowedEmailDomains: [],
    maxOrdersPerUser: 5,
    timezone: "Asia/Kolkata",
    minimumOrderAmount: 0,
    maximumOrderAmount: 5000,
    orderCancellationWindow: 5,
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showLogoPreview, setShowLogoPreview] = useState(false)
  const { toast } = useToast()
  const { token } = useAuth()
  const { courtId } = use(params)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courts/${courtId}/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      const result = await response.json()
      if (result.success && result.data.settings) {
        const fetchedSettings = result.data.settings
        setSettings(prevSettings => ({
          ...prevSettings,
          ...fetchedSettings,
          // Ensure numeric fields have valid values
          platformCommission: typeof fetchedSettings.platformCommission === 'number' 
            ? fetchedSettings.platformCommission 
            : prevSettings.platformCommission,
          maxOrdersPerStall: typeof fetchedSettings.maxOrdersPerStall === 'number' 
            ? fetchedSettings.maxOrdersPerStall 
            : prevSettings.maxOrdersPerStall,
          orderBufferTime: typeof fetchedSettings.orderBufferTime === 'number' 
            ? fetchedSettings.orderBufferTime 
            : prevSettings.orderBufferTime,
          maxOrdersPerUser: typeof fetchedSettings.maxOrdersPerUser === 'number' 
            ? fetchedSettings.maxOrdersPerUser 
            : prevSettings.maxOrdersPerUser,
          minimumOrderAmount: typeof fetchedSettings.minimumOrderAmount === 'number' 
            ? fetchedSettings.minimumOrderAmount 
            : prevSettings.minimumOrderAmount,
          maximumOrderAmount: typeof fetchedSettings.maximumOrderAmount === 'number' 
            ? fetchedSettings.maximumOrderAmount 
            : prevSettings.maximumOrderAmount,
          orderCancellationWindow: typeof fetchedSettings.orderCancellationWindow === 'number' 
            ? fetchedSettings.orderCancellationWindow 
            : prevSettings.orderCancellationWindow,
        }))
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/courts/${courtId}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      })
      
      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: "Settings saved successfully",
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateOperatingHours = (day: string, field: string, value: any) => {
    setSettings({
      ...settings,
      operatingHours: {
        ...settings.operatingHours,
        [day]: {
          ...settings.operatingHours[day],
          [field]: value
        }
      }
    })
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // File validation
    const maxSize = 2 * 1024 * 1024 // 2MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']

    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "File size must be less than 2MB",
        variant: "destructive",
      })
      return
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a valid image file (JPG, PNG, or GIF)",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "court-logos")

      const response = await fetch(`/api/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        setSettings({ ...settings, logoUrl: result.data.url })
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
      setUploading(false)
      // Clear the input
      event.target.value = ""
    }
  }

  const addEmailDomain = (domain: string) => {
    if (domain && !settings.allowedEmailDomains.includes(domain)) {
      setSettings({
        ...settings,
        allowedEmailDomains: [...settings.allowedEmailDomains, domain]
      })
    }
  }

  const removeEmailDomain = (domainToRemove: string) => {
    setSettings({
      ...settings,
      allowedEmailDomains: settings.allowedEmailDomains.filter(domain => domain !== domainToRemove)
    })
  }

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your food court settings and preferences</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Basic information about your food court</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instituteName">Institute Name</Label>
                  <Input
                    id="instituteName"
                    value={settings.instituteName}
                    onChange={(e) => setSettings({ ...settings, instituteName: e.target.value })}
                    placeholder="Enter institute name"
                  />
                </div>
                <div>
                  <Label htmlFor="instituteType">Institute Type</Label>
                  <Select value={settings.instituteType} onValueChange={(value) => setSettings({ ...settings, instituteType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="college">College</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">Institute Logo</Label>
                <p className="text-sm text-gray-500 mb-4">Upload your institute's logo. Recommended size: 200x200px</p>
                
                <div className="flex items-start gap-6">
                  {/* Current Logo Display */}
                  <div className="flex flex-col items-center space-y-3">
                    <div 
                      className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => settings.logoUrl && setShowLogoPreview(true)}
                    >
                      {settings.logoUrl ? (
                        <div className="relative group w-full h-full">
                          <img 
                            src={settings.logoUrl} 
                            alt="Institute Logo" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to view
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Building className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">No logo</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {settings.logoUrl ? "Current Logo" : "Upload a logo"}
                    </p>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploading}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <Button variant="outline" disabled={uploading} asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? "Uploading..." : settings.logoUrl ? "Update Logo" : "Upload Logo"}
                          </span>
                        </Button>
                      </Label>
                      
                      {settings.logoUrl && (
                        <Button 
                          variant="outline" 
                          onClick={() => setSettings({ ...settings, logoUrl: "" })}
                          disabled={uploading}
                        >
                          Remove Logo
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      <p>• Supported formats: JPG, PNG, GIF</p>
                      <p>• Maximum file size: 2MB</p>
                      <p>• Recommended: Square aspect ratio (1:1)</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operating Hours
              </CardTitle>
              <CardDescription>Set when your food court is open for orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-24">
                    <Label className="capitalize">{day}</Label>
                  </div>
                  <Switch
                    checked={settings.operatingHours[day].isOpen}
                    onCheckedChange={(value) => updateOperatingHours(day, "isOpen", value)}
                  />
                  {settings.operatingHours[day].isOpen && (
                    <>
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={settings.operatingHours[day].startTime}
                          onChange={(e) => updateOperatingHours(day, "startTime", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={settings.operatingHours[day].endTime}
                          onChange={(e) => updateOperatingHours(day, "endTime", e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>Configure payment methods and commission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <Label>Online Payments</Label>
                        <p className="text-sm text-gray-500">Accept payments via Razorpay</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.enableOnlinePayments}
                      onCheckedChange={(value) => setSettings({ ...settings, enableOnlinePayments: value })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center text-white text-xs">₹</div>
                      <div>
                        <Label>Cash on Delivery</Label>
                        <p className="text-sm text-gray-500">Allow cash payments at pickup</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.enableCOD}
                      onCheckedChange={(value) => setSettings({ ...settings, enableCOD: value })}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
                    <Input
                      id="razorpayKeyId"
                      value={settings.razorpayKeyId || ""}
                      onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
                      placeholder="rzp_test_xxxxxxxxxx"
                      disabled={!settings.enableOnlinePayments}
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter your Razorpay Key ID</p>
                  </div>
                  <div>
                    <Label htmlFor="platformCommission">Platform Commission (%)</Label>
                    <Input
                      id="platformCommission"
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={!settings.platformCommission && settings.platformCommission !== 0 ? "" : settings.platformCommission.toString()}
                      onChange={(e) => setSettings({ ...settings, platformCommission: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Commission charged per order</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>Configure order processing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="maxOrdersPerStall">Maximum Orders per Stall</Label>
                <Input
                  id="maxOrdersPerStall"
                  type="number"
                  min="1"
                  value={!settings.maxOrdersPerStall && settings.maxOrdersPerStall !== 0 ? "" : settings.maxOrdersPerStall.toString()}
                  onChange={(e) => setSettings({ ...settings, maxOrdersPerStall: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="orderBufferTime">Order Buffer Time (minutes)</Label>
                <Input
                  id="orderBufferTime"
                  type="number"
                  min="0"
                  value={!settings.orderBufferTime && settings.orderBufferTime !== 0 ? "" : settings.orderBufferTime.toString()}
                  onChange={(e) => setSettings({ ...settings, orderBufferTime: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-confirm Orders</Label>
                  <p className="text-sm text-gray-500">Automatically confirm orders without vendor approval</p>
                </div>
                <Switch
                  checked={settings.autoConfirmOrders}
                  onCheckedChange={(value) => setSettings({ ...settings, autoConfirmOrders: value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Access Control
              </CardTitle>
              <CardDescription>Configure user access and verification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5" />
                      <div>
                        <Label>Email Verification</Label>
                        <p className="text-sm text-gray-500">Require email verification before ordering</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.requireEmailVerification}
                      onCheckedChange={(value) => setSettings({ ...settings, requireEmailVerification: value })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5" />
                      <div>
                        <Label>Phone Verification</Label>
                        <p className="text-sm text-gray-500">Require phone verification before ordering</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.requirePhoneVerification}
                      onCheckedChange={(value) => setSettings({ ...settings, requirePhoneVerification: value })}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="maxOrdersPerUser">Max Orders per User (per day)</Label>
                    <Input
                      id="maxOrdersPerUser"
                      type="number"
                      min="1"
                      max="50"
                      value={!settings.maxOrdersPerUser && settings.maxOrdersPerUser !== 0 ? "" : settings.maxOrdersPerUser.toString()}
                      onChange={(e) => setSettings({ ...settings, maxOrdersPerUser: parseInt(e.target.value) || 1 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum orders a user can place per day</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Allowed Email Domains</Label>
                <p className="text-sm text-gray-500 mb-3">Restrict registration to specific email domains (optional)</p>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., college.edu, company.com"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addEmailDomain(e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement
                        if (input?.value) {
                          addEmailDomain(input.value)
                          input.value = ''
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {settings.allowedEmailDomains.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {settings.allowedEmailDomains.map((domain, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {domain}
                          <button
                            onClick={() => removeEmailDomain(domain)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>Advanced configuration options for your food court</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="minimumOrderAmount">Minimum Order Amount (₹)</Label>
                    <Input
                      id="minimumOrderAmount"
                      type="number"
                      min="0"
                      step="1"
                      value={!settings.minimumOrderAmount && settings.minimumOrderAmount !== 0 ? "" : settings.minimumOrderAmount.toString()}
                      onChange={(e) => setSettings({ ...settings, minimumOrderAmount: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum amount required to place an order</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="maximumOrderAmount">Maximum Order Amount (₹)</Label>
                    <Input
                      id="maximumOrderAmount"
                      type="number"
                      min="1"
                      step="1"
                      value={!settings.maximumOrderAmount && settings.maximumOrderAmount !== 0 ? "" : settings.maximumOrderAmount.toString()}
                      onChange={(e) => setSettings({ ...settings, maximumOrderAmount: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum amount allowed per order</p>
                  </div>
                  <div>
                    <Label htmlFor="orderCancellationWindow">Order Cancellation Window (minutes)</Label>
                    <Input
                      id="orderCancellationWindow"
                      type="number"
                      min="0"
                      value={!settings.orderCancellationWindow && settings.orderCancellationWindow !== 0 ? "" : settings.orderCancellationWindow.toString()}
                      onChange={(e) => setSettings({ ...settings, orderCancellationWindow: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Time allowed for customers to cancel orders</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Security Notice</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Changes to advanced settings may affect system behavior. Please test thoroughly before applying to production.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Logo Preview Modal */}
      {showLogoPreview && settings.logoUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowLogoPreview(false)}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Institute Logo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogoPreview(false)}
              >
                ✕
              </Button>
            </div>
            <div className="flex justify-center">
              <img 
                src={settings.logoUrl} 
                alt="Institute Logo Preview" 
                className="max-w-full max-h-64 object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
