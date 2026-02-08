"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Loader2, AlertCircle, Clock } from "lucide-react"

interface OperatingHoursStepProps {
  vendorData: any
  updateVendorData: (data: any) => void
  onNext: (data: any) => void
  onBack: () => void
  loading: boolean
  courtId: string
  vendorId?: string
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
]

interface DayHours {
  open: string
  close: string
  closed: boolean
}

interface OperatingHours {
  [key: string]: DayHours
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

const DEFAULT_HOURS: OperatingHours = {
  monday: { open: "09:00", close: "18:00", closed: false },
  tuesday: { open: "09:00", close: "18:00", closed: false },
  wednesday: { open: "09:00", close: "18:00", closed: false },
  thursday: { open: "09:00", close: "18:00", closed: false },
  friday: { open: "09:00", close: "18:00", closed: false },
  saturday: { open: "09:00", close: "18:00", closed: false },
  sunday: { open: "09:00", close: "18:00", closed: true },
}

export default function OperatingHoursStep({
  vendorData,
  updateVendorData,
  onNext,
  onBack,
  loading,
  courtId,
  vendorId,
}: OperatingHoursStepProps) {
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(
    vendorData?.operatingHours || DEFAULT_HOURS
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    updateVendorData({ operatingHours })
  }, [operatingHours, updateVendorData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Check if at least one day is open
    const hasOpenDay = Object.values(operatingHours).some((day: any) => !day.closed)
    if (!hasOpenDay) {
      newErrors.general = "At least one day must be open"
    }

    // Validate time format and logic for open days
    Object.entries(operatingHours).forEach(([day, hours]: [string, any]) => {
      if (!hours.closed) {
        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        
        if (!timeRegex.test(hours.open)) {
          newErrors[`${day}_open`] = "Invalid time format"
        }
        
        if (!timeRegex.test(hours.close)) {
          newErrors[`${day}_close`] = "Invalid time format"
        }

        // Check if opening time is before closing time
        if (timeRegex.test(hours.open) && timeRegex.test(hours.close)) {
          const openTime = new Date(`1970-01-01T${hours.open}:00`)
          const closeTime = new Date(`1970-01-01T${hours.close}:00`)
          
          if (openTime >= closeTime) {
            newErrors[`${day}_time`] = "Opening time must be before closing time"
          }
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleTimeChange = (day: string, field: "open" | "close", value: string) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))

    // Clear errors when user makes changes
    const errorKey = `${day}_${field}`
    if (errors[errorKey] || errors[`${day}_time`]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        delete newErrors[`${day}_time`]
        return newErrors
      })
    }
  }

  const handleClosedToggle = (day: string, closed: boolean) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        closed,
      },
    }))

    // Clear errors for this day when toggling
    if (errors[`${day}_open`] || errors[`${day}_close`] || errors[`${day}_time`]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[`${day}_open`]
        delete newErrors[`${day}_close`]
        delete newErrors[`${day}_time`]
        return newErrors
      })
    }

    // Clear general error if we're opening a day
    if (!closed && errors.general) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.general
        return newErrors
      })
    }
  }

  const copyToAllDays = (sourceDay: string) => {
    const sourceHours = operatingHours[sourceDay]
    const newOperatingHours = { ...operatingHours }
    
    Object.keys(newOperatingHours).forEach((day) => {
      if (day !== sourceDay) {
        newOperatingHours[day] = { ...sourceHours }
      }
    })
    
    setOperatingHours(newOperatingHours)
    setErrors({}) // Clear all errors
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    onNext({ operatingHours })
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Set your stall's operating hours. Customers will only be able to place orders during these times.
        </AlertDescription>
      </Alert>

      {errors.general && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Weekly Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS_OF_WEEK.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={!operatingHours[key].closed}
                    onCheckedChange={(checked) => handleClosedToggle(key, !checked)}
                  />
                  <Label className="font-medium w-20">{label}</Label>
                </div>
                
                {!operatingHours[key].closed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToAllDays(key)}
                    className="text-xs"
                  >
                    Copy to all
                  </Button>
                )}
              </div>

              {!operatingHours[key].closed ? (
                <div className="grid grid-cols-2 gap-4 pl-9">
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Opening Time</Label>
                    <Input
                      type="time"
                      value={operatingHours[key].open}
                      onChange={(e) => handleTimeChange(key, "open", e.target.value)}
                      className={errors[`${key}_open`] || errors[`${key}_time`] ? "border-red-500" : ""}
                    />
                    {errors[`${key}_open`] && (
                      <p className="text-xs text-red-500">{errors[`${key}_open`]}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Closing Time</Label>
                    <Input
                      type="time"
                      value={operatingHours[key].close}
                      onChange={(e) => handleTimeChange(key, "close", e.target.value)}
                      className={errors[`${key}_close`] || errors[`${key}_time`] ? "border-red-500" : ""}
                    />
                    {errors[`${key}_close`] && (
                      <p className="text-xs text-red-500">{errors[`${key}_close`]}</p>
                    )}
                  </div>
                  {errors[`${key}_time`] && (
                    <p className="text-xs text-red-500 col-span-2">{errors[`${key}_time`]}</p>
                  )}
                </div>
              ) : (
                <div className="pl-9">
                  <p className="text-sm text-muted-foreground">Closed</p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Next Step
        </Button>
      </div>
    </div>
  )
}
