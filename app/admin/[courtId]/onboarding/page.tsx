"use client"

import { useState, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function AdminOnboardingPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { token } = useAuth()

  const [courtData, setCourtData] = useState({
    instituteName: "",
    instituteType: "college",
    logoUrl: "",
    address: "",
    contactPhone: "",
    operatingHours: {
      monday: { open: "09:00", close: "18:00", closed: false },
      tuesday: { open: "09:00", close: "18:00", closed: false },
      wednesday: { open: "09:00", close: "18:00", closed: false },
      thursday: { open: "09:00", close: "18:00", closed: false },
      friday: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "09:00", close: "18:00", closed: false },
      sunday: { open: "09:00", close: "18:00", closed: true },
    },
  })

  const [settingsData, setSettingsData] = useState({
    allowOnlinePayments: true,
    allowCOD: true,
    maxOrdersPerUser: 5,
    orderBufferTime: 5,
    minimumOrderAmount: 0,
    maximumOrderAmount: 5000,
    platformFeePercentage: 2.5,
    requireEmailVerification: false,
    requirePhoneVerification: false,
  })

  const steps = [
    { id: 1, name: "Court Setup", description: "Basic information about your food court" },
    { id: 2, name: "Operating Hours", description: "Set your food court operating schedule" },
    { id: 3, name: "Settings", description: "Configure ordering and payment settings" },
    { id: 4, name: "Complete", description: "Finish setup and start managing" },
  ]

  const handleStepSubmit = async (step: number) => {
    setLoading(true)
    try {
      let stepData
      let stepName

      switch (step) {
        case 1:
          stepData = {
            instituteName: courtData.instituteName,
            instituteType: courtData.instituteType,
            logoUrl: courtData.logoUrl,
            address: courtData.address,
            contactPhone: courtData.contactPhone,
          }
          stepName = "court_setup"
          break
        case 2:
          stepData = { operatingHours: courtData.operatingHours }
          stepName = "court_setup"
          break
        case 3:
          stepData = settingsData
          stepName = "settings_config"
          break
        case 4:
          stepName = "complete"
          stepData = {}
          break
      }

      const response = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ step: stepName, data: stepData }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.message)

      if (step === 4) {
        toast({
          title: "Setup Complete!",
          description: "Your food court is now ready to use.",
        })
        router.push(`/admin/${courtId}`)
      } else {
        setCurrentStep(step + 1)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="instituteName">Institute Name</Label>
              <Input
                id="instituteName"
                value={courtData.instituteName}
                onChange={(e) => setCourtData((prev) => ({ ...prev, instituteName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="instituteType">Institute Type</Label>
              <Select
                value={courtData.instituteType}
                onValueChange={(value) => setCourtData((prev) => ({ ...prev, instituteType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={courtData.address}
                onChange={(e) => setCourtData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={courtData.contactPhone}
                onChange={(e) => setCourtData((prev) => ({ ...prev, contactPhone: e.target.value }))}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Operating Hours</h3>
            {Object.entries(courtData.operatingHours).map(([day, hours]) => (
              <div key={day} className="flex items-center space-x-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800">
                <div className="w-24 capitalize font-medium text-neutral-900 dark:text-neutral-100">{day}</div>
                <Switch
                  checked={!hours.closed}
                  onCheckedChange={(checked) =>
                    setCourtData((prev) => ({
                      ...prev,
                      operatingHours: {
                        ...prev.operatingHours,
                        [day]: { ...hours, closed: !checked },
                      },
                    }))
                  }
                />
                {!hours.closed && (
                  <>
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) =>
                        setCourtData((prev) => ({
                          ...prev,
                          operatingHours: {
                            ...prev.operatingHours,
                            [day]: { ...hours, open: e.target.value },
                          },
                        }))
                      }
                      className="w-32"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) =>
                        setCourtData((prev) => ({
                          ...prev,
                          operatingHours: {
                            ...prev.operatingHours,
                            [day]: { ...hours, close: e.target.value },
                          },
                        }))
                      }
                      className="w-32"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Payment Settings</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="allowOnlinePayments">Allow Online Payments</Label>
                <Switch
                  id="allowOnlinePayments"
                  checked={settingsData.allowOnlinePayments}
                  onCheckedChange={(checked) => setSettingsData((prev) => ({ ...prev, allowOnlinePayments: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allowCOD">Allow Cash on Delivery</Label>
                <Switch
                  id="allowCOD"
                  checked={settingsData.allowCOD}
                  onCheckedChange={(checked) => setSettingsData((prev) => ({ ...prev, allowCOD: checked }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Order Limits</h3>
              <div>
                <Label htmlFor="maxOrdersPerUser">Max Orders Per User</Label>
                <Input
                  id="maxOrdersPerUser"
                  type="number"
                  value={settingsData.maxOrdersPerUser}
                  onChange={(e) => setSettingsData((prev) => ({ ...prev, maxOrdersPerUser: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="minimumOrderAmount">Minimum Order Amount (₹)</Label>
                <Input
                  id="minimumOrderAmount"
                  type="number"
                  value={settingsData.minimumOrderAmount}
                  onChange={(e) => setSettingsData((prev) => ({ ...prev, minimumOrderAmount: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Setup Complete!</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Your food court is now configured and ready to use. You can start adding vendors and managing orders.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Food Court Setup</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Let's get your food court configured and ready to use.</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep > step.id
                      ? "bg-green-500 text-white"
                      : currentStep === step.id
                        ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900"
                        : "bg-neutral-300 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-24 h-1 mx-2 ${currentStep > step.id ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-600"}`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="mb-2" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.description}
          </p>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1]?.name}</CardTitle>
            <CardDescription>{steps[currentStep - 1]?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              <Button onClick={() => handleStepSubmit(currentStep)} disabled={loading}>
                {loading ? "Saving..." : currentStep === 4 ? "Complete Setup" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
