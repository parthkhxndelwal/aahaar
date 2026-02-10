"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Plus, Search, Store, Users, Clock, Phone, Mail, MapPin, Star, CheckCircle, XCircle, ArrowRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import Image from "next/image"
import Link from "next/link"

interface Vendor {
  id: string
  stallName: string
  vendorName: string
  contactEmail: string
  contactPhone: string
  stallLocation?: string
  cuisineType?: string
  status: "active" | "inactive" | "maintenance" | "suspended"
  isOnline: boolean
  rating: number
  totalRatings: number
  logoUrl?: string
  razorpayAccountId?: string
  userId?: string
  operatingHours?: any
  bankAccountNumber?: string
  bankIfscCode?: string
  bankAccountHolderName?: string
  bankName?: string
  panNumber?: string
  gstin?: string
  maxOrdersPerHour?: number
  averagePreparationTime?: number
  onboardingStatus?: "not_started" | "in_progress" | "completed"
  onboardingStep?: string
  onboardingCompletedAt?: string
  onboardingStartedAt?: string
  metadata?: {
    onboardingCompleted?: boolean
    onboardingStep?: string
  }
  createdAt: string
  updatedAt: string
}

interface VendorsListResponse {
  vendors: Vendor[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function VendorsPage() {
  const params = useParams()
  const router = useRouter()
  const courtId = params.courtId as string

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [buttonLoading, setButtonLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  })

  // Find incomplete onboarding vendor
  const incompleteOnboardingVendor = vendors.find(vendor => {
    // Check direct properties first (new structure)
    if (vendor.onboardingStatus === 'in_progress' && vendor.onboardingStep) {
      console.log('Found incomplete onboarding vendor (direct props):', vendor.stallName, vendor.onboardingStep)
      return true
    }
    // Fallback to metadata (legacy structure)
    if (!vendor.metadata?.onboardingCompleted && vendor.metadata?.onboardingStep) {
      console.log('Found incomplete onboarding vendor (metadata):', vendor.stallName, vendor.metadata.onboardingStep)
      return true
    }
    // Also check if vendor was just created but no razorpay account yet (incomplete onboarding)
    if (!vendor.razorpayAccountId && vendor.stallName) {
      console.log('Found incomplete onboarding vendor (no razorpay):', vendor.stallName)
      return true
    }
    return false
  })

  // Function to get step information for display
  const getStepInfo = (stepKey: string): { number: number, title: string, total: number } => {
    const steps = [
      { key: "basic", number: 1, title: "Basic Details" },
      { key: "password", number: 2, title: "Password Creation" },
      { key: "stall", number: 3, title: "Stall Setup" },
      { key: "hours", number: 4, title: "Operating Hours" },
      { key: "bank", number: 5, title: "Bank Details" },
      { key: "legal", number: 6, title: "Legal Compliance" },
      { key: "account", number: 7, title: "Account Creation" },
      { key: "config", number: 8, title: "Final Configuration" },
      { key: "success", number: 9, title: "Complete" }
    ]
    
    const step = steps.find(s => s.key === stepKey) || steps[0]
    return { number: step.number, title: step.title, total: steps.length }
  }

  // Function to determine the next step based on vendor data
  const getNextIncompleteStep = (vendor: Vendor): string => {
    if (!vendor) return "basic"
    
    console.log('=== VENDOR PAGE STEP DETECTION ===')
    console.log(`Checking vendor: ${vendor.stallName}`)
    console.log('Vendor data:', {
      stallName: vendor.stallName,
      vendorName: vendor.vendorName,
      contactEmail: vendor.contactEmail,
      contactPhone: vendor.contactPhone,
      userId: vendor.userId,
      logoUrl: vendor.logoUrl,
      operatingHours: vendor.operatingHours,
      bankAccountNumber: vendor.bankAccountNumber,
      bankIfscCode: vendor.bankIfscCode,
      panNumber: vendor.panNumber,
      razorpayAccountId: vendor.razorpayAccountId,
      maxOrdersPerHour: vendor.maxOrdersPerHour,
      averagePreparationTime: vendor.averagePreparationTime,
      onboardingStep: vendor.onboardingStep,
      onboardingStatus: vendor.onboardingStatus
    })
    
    // Define the step order and their completion criteria
    const stepChecks = [
      { step: "basic", isComplete: !!(vendor.stallName && vendor.vendorName && vendor.contactEmail && vendor.contactPhone) },
      { step: "password", isComplete: !!vendor.userId }, // User account created
      { step: "stall", isComplete: !!vendor.logoUrl }, // Logo uploaded
      { step: "hours", isComplete: !!vendor.operatingHours }, // Operating hours set
      { step: "bank", isComplete: !!(vendor.bankAccountNumber && vendor.bankIfscCode) }, // Bank details
      { step: "legal", isComplete: !!vendor.panNumber }, // PAN number added
      { step: "account", isComplete: !!vendor.razorpayAccountId }, // Razorpay account created
      { step: "config", isComplete: !!(vendor.maxOrdersPerHour && vendor.averagePreparationTime) }, // Config set
      { step: "success", isComplete: vendor.onboardingStatus === 'completed' } // Fully completed
    ]
    
    console.log('Step completion status:')
    stepChecks.forEach(check => {
      console.log(`  ${check.step}: ${check.isComplete ? '✅ Complete' : '❌ Incomplete'}`)
    })
    
    // If vendor has onboardingStep field, prefer that over auto-detection for better UX
    if (vendor.onboardingStep && vendor.onboardingStep !== 'completed') {
      console.log(`Using onboardingStep field: ${vendor.onboardingStep}`)
      
      // Validate that the step indicated by onboardingStep is actually incomplete
      const stepIndex = stepChecks.findIndex(check => check.step === vendor.onboardingStep)
      if (stepIndex !== -1 && !stepChecks[stepIndex].isComplete) {
        console.log(`Confirmed: ${vendor.onboardingStep} is incomplete, using it`)
        console.log('=== END VENDOR PAGE STEP DETECTION ===')
        return vendor.onboardingStep
      } else {
        console.log(`Warning: onboardingStep ${vendor.onboardingStep} appears complete, falling back to auto-detection`)
      }
    }
    
    // Find the first incomplete step
    for (const check of stepChecks) {
      if (!check.isComplete) {
        console.log(`Next incomplete step for ${vendor.stallName}: ${check.step}`)
        console.log('=== END VENDOR PAGE STEP DETECTION ===')
        return check.step
      }
    }
    
    // If all steps are complete, go to success
    console.log('All steps complete, going to success')
    console.log('=== END VENDOR PAGE STEP DETECTION ===')
    return "success"
  }

  // Debug log
  console.log('All vendors:', vendors.map(v => ({
    name: v.stallName,
    onboardingStatus: v.onboardingStatus,
    onboardingStep: v.onboardingStep,
    razorpayAccountId: v.razorpayAccountId,
    metadata: v.metadata
  })))
  console.log('Incomplete onboarding vendor:', incompleteOnboardingVendor?.stallName || 'None found')

  useEffect(() => {
    fetchVendors()
  }, [courtId, currentPage, statusFilter])

  // Clear button loading state on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setButtonLoading(null)
    }
    
    // Reset loading state after a delay in case navigation fails
    if (buttonLoading) {
      const timer = setTimeout(() => {
        setButtonLoading(null)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [buttonLoading])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        courtId,
        page: currentPage.toString(),
        limit: "10",
      })

      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/admin/vendors?${params}`)
      const result = await response.json()

      if (result.success) {
        setVendors(result.data.vendors)
        setPagination(result.data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVendors = vendors.filter((vendor) =>
    vendor.stallName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const VendorCard = ({ vendor }: { vendor: Vendor }) => {
    const isPending = !vendor.metadata?.onboardingCompleted
    const continueButtonId = `continue-${vendor.id}`
    const viewButtonId = `view-${vendor.id}`
    const editButtonId = `edit-${vendor.id}`
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {vendor.logoUrl ? (
                <Image
                  src={vendor.logoUrl}
                  alt={vendor.stallName}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Store className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">{vendor.stallName}</CardTitle>
                <CardDescription>{vendor.vendorName}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(vendor.status)}>
                {vendor.status}
              </Badge>
              {vendor.isOnline && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Online
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{vendor.contactEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{vendor.contactPhone}</span>
            </div>
            {vendor.stallLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{vendor.stallLocation}</span>
              </div>
            )}
            {vendor.cuisineType && (
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span>{vendor.cuisineType}</span>
              </div>
            )}
          </div>

          {vendor.totalRatings > 0 && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm">
                {vendor.rating.toFixed(1)} ({vendor.totalRatings} reviews)
              </span>
            </div>
          )}

          {isPending ? (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <Clock className="h-4 w-4" />
                <span>
                  {(() => {
                    const nextStep = getNextIncompleteStep(vendor)
                    const stepInfo = getStepInfo(nextStep)
                    return `Step ${stepInfo.number}/${stepInfo.total} - ${stepInfo.title}`
                  })()}
                </span>
              </div>
              <Button
                size="sm"
                disabled={buttonLoading === continueButtonId}
                onClick={() => {
                  const nextStep = getNextIncompleteStep(vendor)
                  console.log(`Vendor card: Redirecting to next step ${nextStep} for vendor ${vendor.stallName}`)
                  setButtonLoading(continueButtonId)
                  router.push(`/admin/${courtId}/vendors/onboard/${nextStep}/${vendor.id}`)
                }}
                className="gap-2"
              >
                {buttonLoading === continueButtonId ? (
                  <Spinner size={16} variant="white" />
                ) : null}
                Continue Setup
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Fully Configured</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={buttonLoading === viewButtonId}
                  onClick={() => {
                    setButtonLoading(viewButtonId)
                    router.push(`/admin/${courtId}/vendors/${vendor.id}`)
                  }}
                  className="gap-2"
                >
                  {buttonLoading === viewButtonId ? (
                    <Spinner size={16} variant="dark" />
                  ) : null}
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={buttonLoading === editButtonId}
                  onClick={() => {
                    setButtonLoading(editButtonId)
                    router.push(`/admin/${courtId}/vendors/${vendor.id}/edit`)
                  }}
                  className="gap-2"
                >
                  {buttonLoading === editButtonId ? (
                    <Spinner size={16} variant="dark" />
                  ) : null}
                  Edit
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">
            Manage vendors and their onboarding status
          </p>
        </div>
        <Button
          disabled={buttonLoading === 'header-button'}
          onClick={() => {
            setButtonLoading('header-button')
            if (incompleteOnboardingVendor) {
              // Continue existing onboarding - go to next incomplete step
              const nextStep = getNextIncompleteStep(incompleteOnboardingVendor)
              console.log(`Redirecting to next incomplete step: ${nextStep}`)
              router.push(`/admin/${courtId}/vendors/onboard/${nextStep}/${incompleteOnboardingVendor.id}`)
            } else {
              // Start new onboarding
              router.push(`/admin/${courtId}/vendors/onboard/basic`)
            }
          }}
          className="gap-2"
        >
          {buttonLoading === 'header-button' ? (
            <Spinner size={16} variant="white" />
          ) : incompleteOnboardingVendor ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {incompleteOnboardingVendor 
            ? `Finish Setting up "${incompleteOnboardingVendor.stallName}"`
            : "Create New Vendor"
          }
        </Button>
      </div>

      {/* Incomplete Onboarding Alert */}
      {incompleteOnboardingVendor && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Incomplete Onboarding:</strong> You have an unfinished vendor setup for "{incompleteOnboardingVendor.stallName}". 
            Complete this onboarding before registering a new vendor. 
            <span className="font-medium ml-1">
              {(() => {
                const nextStep = getNextIncompleteStep(incompleteOnboardingVendor)
                const stepInfo = getStepInfo(nextStep)
                return `Next: Step ${stepInfo.number}/${stepInfo.total} - ${stepInfo.title}`
              })()}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendors by name, email, or stall name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Spinner size={32} variant="dark" className="mx-auto mb-4" />
              <p className="text-muted-foreground">Loading vendors...</p>
            </div>
          </div>
        ) : filteredVendors.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || (statusFilter !== "all")
                    ? "No vendors match your current filters."
                    : "Get started by registering your first vendor."}
                </p>
                <Button
                  disabled={buttonLoading === 'register-new'}
                  onClick={() => {
                    setButtonLoading('register-new')
                    router.push(`/admin/${courtId}/vendors/onboard/basic`)
                  }}
                  className="gap-2"
                >
                  {buttonLoading === 'register-new' ? (
                    <Spinner size={16} variant="white" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Register New Vendor
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredVendors.length} of {pagination.totalItems} vendors
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
