"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Store, Phone, Mail, MapPin, Star, CheckCircle, Edit, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { adminVendorApi, apiClient } from "@/lib/api"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"

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
  metadata?: {
    businessType?: string
    stakeholder?: {
      name: string
      pan: string
    }
    paymentStatus?: 'not_requested' | 'requested' | 'approved' | 'rejected'
    paymentRequestId?: string
    paymentRejectionReason?: string
    registeredAddress?: {
      addressStreet1?: string
      addressStreet2?: string
      addressCity?: string
      addressState?: string
      addressPostalCode?: string
      addressCountry?: string
    }
  }
  createdAt: string
  updatedAt: string
}

export default function VendorsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useUnifiedAuth()
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

  // Check for success message from onboarding
  const successMessage = searchParams.get("success")
  const newVendorId = searchParams.get("vendorId")

  // Set up API client token
  useEffect(() => {
    if (token) {
      apiClient.setTokenGetter(() => token)
    }
  }, [token])

  useEffect(() => {
    fetchVendors()
  }, [courtId, currentPage, statusFilter, token])

  // Show success message if vendor was just created
  useEffect(() => {
    if (successMessage && newVendorId) {
      // You can add a toast notification here if you have one
      console.log("Vendor created successfully:", newVendorId)
    }
  }, [successMessage, newVendorId])

  const fetchVendors = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      
      const result = await adminVendorApi.list({
        courtId,
        page: currentPage,
        limit: 10,
        status: statusFilter !== "all" ? statusFilter : undefined,
      })

      setVendors((result as any).vendors || [])
      setPagination((result as any).pagination || {
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
      })
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
        return "bg-muted text-foreground"
      case "inactive":
        return "bg-muted text-muted-foreground"
      case "maintenance":
        return "bg-muted text-muted-foreground"
      case "suspended":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const VendorCard = ({ vendor }: { vendor: Vendor }) => {
    const viewButtonId = `view-${vendor.id}`
    const editButtonId = `edit-${vendor.id}`
    
    return (
      <Card className="hover:shadow-md transition-all duration-300">
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
                <Badge variant="outline" className="bg-muted text-foreground">
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
                {typeof vendor.rating === 'number' ? vendor.rating.toFixed(1) : parseFloat(vendor.rating || 0).toFixed(1)} ({vendor.totalRatings} reviews)
              </span>
            </div>
          )}

          <div className="flex items-center justify-end pt-2 border-t">
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
                  <Spinner size={16} variant="light" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                View
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
                ) : (
                  <Edit className="h-4 w-4" />
                )}
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Success Alert */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="border-border bg-muted">
              <CheckCircle className="h-4 w-4 text-foreground" />
              <AlertDescription className="text-foreground">
                <strong>Success!</strong> Vendor has been created and configured successfully.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div>
          <h1 className="text-3xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">
            Manage vendors and their configuration
          </p>
        </div>
        <Button
          disabled={buttonLoading === 'create-vendor'}
          onClick={() => {
            setButtonLoading('create-vendor')
            router.push(`/admin/${courtId}/vendors/onboard`)
          }}
          className="gap-2 bg-foreground hover:bg-foreground/90 text-background"
        >
          {buttonLoading === 'create-vendor' ? (
            <Spinner size={16} variant="white" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Create New Vendor
        </Button>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
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
      </motion.div>

      {/* Vendors List */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {loading ? (
          <motion.div 
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <Spinner size={32} variant="white" className="mx-auto mb-4" />
              <p className="text-muted-foreground">Loading vendors...</p>
            </div>
          </motion.div>
        ) : filteredVendors.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || (statusFilter !== "all")
                    ? "No vendors match your current filters."
                    : "Get started by creating your first vendor."}
                </p>

                {!(searchTerm || (statusFilter !== "all")) && (
                  <Button
                    disabled={buttonLoading === 'create-first-vendor'}
                    onClick={() => {
                      setButtonLoading('create-first-vendor')
                      router.push(`/admin/${courtId}/vendors/onboard`)
                    }}
                    className="gap-2"
                >
                  {buttonLoading === 'create-first-vendor' ? (
                    <Spinner size={16} variant="white" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create First Vendor
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
            {filteredVendors.map((vendor, index) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              >
                <VendorCard vendor={vendor} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {!searchTerm && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {searchTerm ? filteredVendors.length : pagination.totalItems} of {pagination.totalItems} vendors
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
    </motion.div>
  )
}
