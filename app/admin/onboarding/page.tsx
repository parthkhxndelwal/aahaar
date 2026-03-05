"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FloatingInput } from "@/components/ui/floating-input"
import { FloatingSelect } from "@/components/ui/floating-select"
import { useToast } from "@/hooks/use-toast"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { useRouter } from "next/navigation"
import { X, Building2 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
export default function AdminOnboardingPage() {
  const [courtData, setCourtData] = useState({
    courtId: "",
    instituteName: "",
    instituteType: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    description: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showError, setShowError] = useState(false)
  const [hasExistingCourts, setHasExistingCourts] = useState(false)
  const [checkingCourts, setCheckingCourts] = useState(true)
  const [allowFormAccess, setAllowFormAccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState({
    courtId: "",
    instituteName: "",
    instituteType: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  })
  const { toast } = useToast()
  const { user, token } = useAdminAuth()
  const router = useRouter()

  // Check if user has existing courts on component mount
  useEffect(() => {
    const checkExistingCourts = async () => {
      if (!token) {
        router.push("/admin/auth")
        return
      }

      // Check for debug mode
      const urlParams = new URLSearchParams(window.location.search)
      const isDebug = urlParams.get('debug') === 'true'
      const isAddingCourt = urlParams.get('add') === 'true'

      if (isDebug) {
        console.log("DEBUG MODE: Skipping redirects")
        setHasExistingCourts(true)
        setAllowFormAccess(true)
        setCheckingCourts(false)
        return
      }

      try {
        const response = await fetch("/api/admin/courts", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log("Courts data in onboarding:", data)
          if (data.success && data.data.length > 0) {
            // User has existing courts - check if they came from "add court" button
            
            if (isAddingCourt) {
              // User came from "Add Court" button, allow them to create another court
              console.log("User came from Add Court button, showing form")
              setHasExistingCourts(true)
              setAllowFormAccess(true)
            } else {
              // User accessed onboarding directly, redirect to their dashboard
              console.log("User has existing courts and accessed directly, redirecting to dashboard")
              router.push(`/admin/${data.data[0].courtId}`)
              return
            }
          } else {
            // No courts - first time setup
            console.log("User has no courts, showing form")
            setHasExistingCourts(false)
            setAllowFormAccess(true)
          }
        } else {
          console.log("Failed to fetch courts, showing form")
          setHasExistingCourts(false)
          setAllowFormAccess(true)
        }
      } catch (error) {
        console.error("Error checking courts:", error)
        setHasExistingCourts(false)
        setAllowFormAccess(true)
      } finally {
        setCheckingCourts(false)
      }
    }

    checkExistingCourts()
  }, [token, router])

  // Show loading while checking courts
  if (checkingCourts || !allowFormAccess) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <Spinner className="w-8 h-8 mx-auto mb-4" variant="white" />
                <p className="text-white/80">Calibrating...</p>
            </div>
        </div>
    )
  }

  // Validation functions
  const validateCourtId = (courtId: string) => {
    if (!courtId) return "Court ID is required"
    if (courtId.length < 3) return "Court ID must be at least 3 characters long"
    if (!/^[a-zA-Z0-9_-]+$/.test(courtId)) return "Court ID can only contain letters, numbers, hyphens and underscores"
    return ""
  }

  const validateInstituteName = (name: string) => {
    if (!name) return "Institute name is required"
    if (name.length < 2) return "Institute name must be at least 2 characters long"
    return ""
  }

  const validateInstituteType = (type: string) => {
    if (!type) return "Institute type is required"
    return ""
  }

  const validateAddress = (address: string) => {
    if (!address) return "Address is required"
    if (address.length < 10) return "Please provide a complete address"
    return ""
  }

  const validateCity = (city: string) => {
    if (!city) return "City is required"
    if (city.length < 2) return "City name must be at least 2 characters long"
    return ""
  }

  const validateState = (state: string) => {
    if (!state) return "State is required"
    return ""
  }

  const validatePincode = (pincode: string) => {
    if (!pincode) return "Pincode is required"
    if (!/^\d{6}$/.test(pincode)) return "Pincode must be exactly 6 digits"
    return ""
  }

  const validateField = (field: string, value: string) => {
    let error = ""
    switch (field) {
      case "courtId":
        error = validateCourtId(value)
        break
      case "instituteName":
        error = validateInstituteName(value)
        break
      case "instituteType":
        error = validateInstituteType(value)
        break
      case "address":
        error = validateAddress(value)
        break
      case "city":
        error = validateCity(value)
        break
      case "state":
        error = validateState(value)
        break
      case "pincode":
        error = validatePincode(value)
        break
    }
    
    setValidationErrors(prev => ({ ...prev, [field]: error }))
    return error === ""
  }

  const handleDataChange = (field: string, value: string) => {
    setCourtData((prev) => ({ ...prev, [field]: value }))
    // Real-time validation
    if (validationErrors[field as keyof typeof validationErrors]) {
      validateField(field, value)
    }
  }

  const showErrorWithAnimation = (message: string) => {
    setError(message)
    setShowError(true)
    setTimeout(() => {
      setShowError(false) // Start fade out
    }, 4000)
    setTimeout(() => {
      setError("") // Then collapse space
    }, 4300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("handleSubmit called with court data:", courtData)

    // Validate all fields
    const fields = ['courtId', 'instituteName', 'instituteType', 'address', 'city', 'state', 'pincode']
    let hasErrors = false
    
    fields.forEach(field => {
      const isValid = validateField(field, courtData[field as keyof typeof courtData])
      if (!isValid) hasErrors = true
    })

    console.log("Validation errors:", validationErrors)
    console.log("Has errors:", hasErrors)

    if (hasErrors) {
      console.log("Form has errors, showing error message")
      showErrorWithAnimation("Please resolve the errors below")
      return false
    }

    setLoading(true)
    try {
      if (!token) {
        router.push("/admin/auth")
        return false
      }

      const response = await fetch("/api/admin/courts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(courtData),
      })

      console.log("Court creation response status:", response.status)
      console.log("Court creation response:", response)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Court creation error:", errorData)
        showErrorWithAnimation(errorData.message || "Failed to create court")
        return false
      }

      const data = await response.json()
      console.log("Court creation success:", data)

      toast({
        title: "Success",
        description: `Court "${courtData.instituteName}" created successfully!`,
      })

      // Redirect to the new court's dashboard
      router.push(`/admin/${data.data.courtId}`)
      return true
    } catch (error: any) {
      showErrorWithAnimation("An error occurred while creating the court. Please try again.")
      return false
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/admin-auth-bg.mp4" type="video/mp4" />
      </video>
      
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-2xl z-5"></div>
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      
      {/* Content container */}
      <div className="z-20 relative w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full overflow-hidden rounded-3xl bg-neutral-950/90">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-6 w-6 text-blue-400" />
                <CardTitle className="text-white">Create Your First Court</CardTitle>
              </div>
              <CardDescription>Set up your food court to start managing orders and vendors</CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {showError && error && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, scale: 0.95 }}
                    animate={{ height: "auto", opacity: 1, scale: 1 }}
                    exit={{ height: 0, opacity: 0, scale: 0.95 }}
                    transition={{ 
                      duration: 0.4,
                      ease: [0.4, 0.0, 0.2, 1],
                      height: { duration: 0.4 },
                      opacity: { duration: 0.3 },
                      scale: { duration: 0.3 }
                    }}
                    className="overflow-hidden mb-6"
                  >
                    <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md relative">
                      <div className="pr-8">
                        {error}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowError(false)
                          setTimeout(() => setError(""), 300)
                        }}
                        className="absolute top-2 right-2 p-1 hover:bg-red-500/20 rounded-full transition-colors"
                        aria-label="Dismiss error"
                      >
                        <X size={16} className="text-red-400" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form className="space-y-6" noValidate>
                <div className="space-y-4">
                    <FloatingInput
                      id="courtId"
                      label="Court ID"
                      type="text"
                      value={courtData.courtId}
                      onChange={(e) => handleDataChange("courtId", e.target.value)}
                      onBlur={() => validateField("courtId", courtData.courtId)}
                      error={validationErrors.courtId}
                      required
                    />                  <FloatingInput
                    id="instituteName"
                    label="Institute Name"
                    type="text"
                    value={courtData.instituteName}
                    onChange={(e) => handleDataChange("instituteName", e.target.value)}
                    onBlur={() => validateField("instituteName", courtData.instituteName)}
                    error={validationErrors.instituteName}
                    required
                  />

                  <FloatingSelect
                    label="Institute Type"
                    value={courtData.instituteType}
                    onValueChange={(value) => handleDataChange("instituteType", value)}
                    error={validationErrors.instituteType}
                    options={[
                      { value: "university", label: "University" },
                      { value: "college", label: "College" },
                      { value: "school", label: "School" },
                      { value: "corporate", label: "Corporate" },
                      { value: "office", label: "Office" },
                      { value: "hospital", label: "Hospital" },
                      { value: "other", label: "Other" }
                    ]}
                  />

                  <FloatingInput
                    id="address"
                    label="Address"
                    type="text"
                    value={courtData.address}
                    onChange={(e) => handleDataChange("address", e.target.value)}
                    onBlur={() => validateField("address", courtData.address)}
                    error={validationErrors.address}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FloatingInput
                      id="city"
                      label="City"
                      type="text"
                      value={courtData.city}
                      onChange={(e) => handleDataChange("city", e.target.value)}
                      onBlur={() => validateField("city", courtData.city)}
                      error={validationErrors.city}
                      required
                    />

                    <FloatingInput
                      id="pincode"
                      label="Pincode"
                      type="text"
                      value={courtData.pincode}
                      onChange={(e) => handleDataChange("pincode", e.target.value)}
                      onBlur={() => validateField("pincode", courtData.pincode)}
                      error={validationErrors.pincode}
                      required
                      maxLength={6}
                    />
                  </div>

                  <FloatingSelect
                    label="State"
                    value={courtData.state}
                    onValueChange={(value) => handleDataChange("state", value)}
                    error={validationErrors.state}
                    options={[
                      { value: "andhra-pradesh", label: "Andhra Pradesh" },
                      { value: "arunachal-pradesh", label: "Arunachal Pradesh" },
                      { value: "assam", label: "Assam" },
                      { value: "bihar", label: "Bihar" },
                      { value: "chhattisgarh", label: "Chhattisgarh" },
                      { value: "goa", label: "Goa" },
                      { value: "gujarat", label: "Gujarat" },
                      { value: "haryana", label: "Haryana" },
                      { value: "himachal-pradesh", label: "Himachal Pradesh" },
                      { value: "jharkhand", label: "Jharkhand" },
                      { value: "karnataka", label: "Karnataka" },
                      { value: "kerala", label: "Kerala" },
                      { value: "madhya-pradesh", label: "Madhya Pradesh" },
                      { value: "maharashtra", label: "Maharashtra" },
                      { value: "manipur", label: "Manipur" },
                      { value: "meghalaya", label: "Meghalaya" },
                      { value: "mizoram", label: "Mizoram" },
                      { value: "nagaland", label: "Nagaland" },
                      { value: "odisha", label: "Odisha" },
                      { value: "punjab", label: "Punjab" },
                      { value: "rajasthan", label: "Rajasthan" },
                      { value: "sikkim", label: "Sikkim" },
                      { value: "tamil-nadu", label: "Tamil Nadu" },
                      { value: "telangana", label: "Telangana" },
                      { value: "tripura", label: "Tripura" },
                      { value: "uttar-pradesh", label: "Uttar Pradesh" },
                      { value: "uttarakhand", label: "Uttarakhand" },
                      { value: "west-bengal", label: "West Bengal" },
                      { value: "delhi", label: "Delhi" },
                      { value: "puducherry", label: "Puducherry" },
                      { value: "jammu-kashmir", label: "Jammu & Kashmir" },
                      { value: "ladakh", label: "Ladakh" }
                    ]}
                  />

                  <FloatingInput
                    id="description"
                    label="Description (Optional)"
                    type="text"
                    value={courtData.description}
                    onChange={(e) => handleDataChange("description", e.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={async (e) => {
                    e.preventDefault()
                    console.log("Create Court button clicked")
                    console.log("Court data:", courtData)
                    try {
                      const result = await handleSubmit(e as any)
                      console.log("Submit result:", result)
                    } catch (error) {
                      console.error("Submit error:", error)
                    }
                  }}
                >
                  Create Court
                </Button>
              </form>

              {hasExistingCourts && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-400">
                    Already managing courts?{" "}
                    <button
                      onClick={() => {
                        // Fetch courts and redirect to the first available court
                        fetch("/api/admin/courts", {
                          headers: { "Authorization": `Bearer ${token}` }
                        })
                        .then(res => res.json())
                        .then(data => {
                          if (data.success && data.data.length > 0) {
                            router.push(`/admin/${data.data[0].courtId}`)
                          } else {
                            router.push("/admin/auth")
                          }
                        })
                        .catch(() => router.push("/admin/auth"))
                      }}
                      className="text-blue-400 hover:underline transition-colors cursor-pointer"
                    >
                      Return to Dashboard
                    </button>
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
