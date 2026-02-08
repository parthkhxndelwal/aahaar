"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Plus, Search, Store, Users, Clock, Phone, Mail, MapPin, Star, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [onboardedFilter, setOnboardedFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  })

  useEffect(() => {
    fetchVendors()
  }, [courtId, currentPage, statusFilter, onboardedFilter])

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

      if (onboardedFilter && onboardedFilter !== "all") {
        params.append("onboarded", onboardedFilter)
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

  const onboardedVendors = filteredVendors.filter(vendor => vendor.metadata?.onboardingCompleted)
  const pendingVendors = filteredVendors.filter(vendor => !vendor.metadata?.onboardingCompleted)

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
                <span>Onboarding Step: {vendor.metadata?.onboardingStep || 1}</span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const step = vendor.metadata?.onboardingStep || "basic"
                  router.push(`/admin/${courtId}/vendors/onboard/${step}/${vendor.id}`)
                }}
              >
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
                  onClick={() => router.push(`/admin/${courtId}/vendors/${vendor.id}`)}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/${courtId}/vendors/${vendor.id}/edit`)}
                >
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
          onClick={() => router.push(`/admin/${courtId}/vendors/onboard/basic`)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Register New Vendor
        </Button>
      </div>

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
            <Select value={onboardedFilter} onValueChange={setOnboardedFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by onboarding" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                <SelectItem value="true">Fully Onboarded</SelectItem>
                <SelectItem value="false">Pending Onboarding</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            All Vendors ({filteredVendors.length})
          </TabsTrigger>
          <TabsTrigger value="onboarded" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Fully Onboarded ({onboardedVendors.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Onboarding ({pendingVendors.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
                    {searchTerm || (statusFilter !== "all") || (onboardedFilter !== "all")
                      ? "No vendors match your current filters."
                      : "Get started by registering your first vendor."}
                  </p>
                  <Button
                    onClick={() => router.push(`/admin/${courtId}/vendors/onboard/basic`)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="onboarded" className="space-y-4">
          {onboardedVendors.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No fully onboarded vendors</h3>
                  <p className="text-muted-foreground">
                    Vendors will appear here once they complete the full onboarding process.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {onboardedVendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingVendors.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending onboarding</h3>
                  <p className="text-muted-foreground">
                    All vendors have completed their onboarding process.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  These vendors have started but not completed their onboarding. 
                  Click "Continue Setup" to help them complete the process.
                </AlertDescription>
              </Alert>
              <div className="grid gap-4">
                {pendingVendors.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

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
