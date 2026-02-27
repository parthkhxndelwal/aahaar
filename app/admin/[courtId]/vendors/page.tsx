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
  const searchParams = useSearchParams()
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

  useEffect(() => {
    fetchVendors()
  }, [courtId, currentPage, statusFilter])

  // Show success message if vendor was just created
  useEffect(() => {
    if (successMessage && newVendorId) {
      // You can add a toast notification here if you have one
      console.log("Vendor created successfully:", newVendorId)
    }
  }, [successMessage, newVendorId])

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
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const VendorCard = ({ vendor }: { vendor: Vendor }) => {
    const viewButtonId = `view-${vendor.id}`
    const editButtonId = `edit-${vendor.id}`
    
    return (
      <Card className="hover:shadow-md transition-all duration-300 dark:bg-neutral-900 dark:border-neutral-800 hover:shadow-neutral-900/20">
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
                <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                  <Store className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg dark:text-white">{vendor.stallName}</CardTitle>
                <CardDescription className="dark:text-neutral-400">{vendor.vendorName}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(vendor.status)}>
                {vendor.status}
              </Badge>
              {vendor.isOnline && (
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
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
              <span className="truncate dark:text-neutral-300">{vendor.contactEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="dark:text-neutral-300">{vendor.contactPhone}</span>
            </div>
            {vendor.stallLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate dark:text-neutral-300">{vendor.stallLocation}</span>
              </div>
            )}
            {vendor.cuisineType && (
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span className="dark:text-neutral-300">{vendor.cuisineType}</span>
              </div>
            )}
          </div>

          {vendor.totalRatings > 0 && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm dark:text-neutral-300">
                {vendor.rating.toFixed(1)} ({vendor.totalRatings} reviews)
              </span>
            </div>
          )}

          <div className="flex items-center justify-end pt-2 border-t dark:border-neutral-700">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={buttonLoading === viewButtonId}
                onClick={() => {
                  setButtonLoading(viewButtonId)
                  router.push(`/admin/${courtId}/vendors/${vendor.id}`)
                }}
                className="gap-2 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {buttonLoading === viewButtonId ? (
                  <Spinner size={16} variant="dark" />
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
                className="gap-2 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
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
          <h1 className="text-3xl font-bold dark:text-neutral-200">Vendors</h1>
          <p className="text-muted-foreground dark:text-neutral-400">
            Manage vendors and their configuration
          </p>
        </div>
        <Button
          disabled={buttonLoading === 'create-vendor'}
          onClick={() => {
            setButtonLoading('create-vendor')
            router.push(`/admin/${courtId}/vendors/onboard`)
          }}
          className="gap-2 bg-neutral-100 hover:bg-neutral-700 text-black hover:text-white"
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
        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendors by name, email, or stall name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="dark:bg-neutral-800 dark:border-neutral-700">
                <SelectItem value="all" className="dark:text-white dark:hover:bg-neutral-700">All Statuses</SelectItem>
                <SelectItem value="active" className="dark:text-white dark:hover:bg-neutral-700">Active</SelectItem>
                <SelectItem value="inactive" className="dark:text-white dark:hover:bg-neutral-700">Inactive</SelectItem>
                <SelectItem value="maintenance" className="dark:text-white dark:hover:bg-neutral-700">Maintenance</SelectItem>
                <SelectItem value="suspended" className="dark:text-white dark:hover:bg-neutral-700">Suspended</SelectItem>
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
              <p className="text-muted-foreground dark:text-neutral-400">Loading vendors...</p>
            </div>
          </motion.div>
        ) : filteredVendors.length === 0 ? (
          <Card className="dark:bg-neutral-900 dark:border-neutral-800">
            <CardContent className="py-12">
              <div className="text-center">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 dark:text-white">No vendors found</h3>
                <p className="text-muted-foreground dark:text-neutral-400 mb-4">
                  {searchTerm || (statusFilter !== "all")
                    ? "No vendors match your current filters."
                    : "Get started by creating your first vendor."}
                </p>
                <Button
                  disabled={buttonLoading === 'create-first-vendor'}
                  onClick={() => {
                    setButtonLoading('create-first-vendor')
                    router.push(`/admin/${courtId}/vendors/onboard`)
                  }}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {buttonLoading === 'create-first-vendor' ? (
                    <Spinner size={16} variant="white" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create First Vendor
                </Button>
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
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground dark:text-neutral-400">
            Showing {filteredVendors.length} of {pagination.totalItems} vendors
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
