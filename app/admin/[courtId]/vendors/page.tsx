"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

interface Vendor {
  id: string
  stallName: string
  vendorName: string
  contactEmail: string
  contactPhone: string
  status: string
  isOnline: boolean
  logoUrl?: string
  bannerUrl?: string
  rating?: number
  totalRatings?: number
}

export default function AdminVendorsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const { token } = useAuth()
  const { courtId } = use(params)

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch(`/api/courts/${courtId}/vendors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()

      if (result.success) {
        setVendors(result.data.vendors)
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.stallName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.vendorName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading vendors...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-100">Vendors</h1>
        <Button asChild>
          <Link href={`/admin/${courtId}/vendors/add`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
        <Input
          placeholder="Search vendors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => (
          <Link key={vendor.id} href={`/admin/${courtId}/vendors/${vendor.id}?mode=view`}>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Logo */}
                    <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden">
                      {vendor.logoUrl ? (
                        <img
                          src={vendor.logoUrl}
                          alt={`${vendor.stallName} logo`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement
                            const fallback = target.nextElementSibling as HTMLElement
                            target.style.display = 'none'
                            if (fallback) {
                              fallback.style.display = 'flex'
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm ${vendor.logoUrl ? 'hidden' : 'flex'}`}
                      >
                        {vendor.stallName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    {/* Vendor Info */}
                    <div>
                      <CardTitle className="text-lg">{vendor.stallName}</CardTitle>
                      <CardDescription>{vendor.vendorName}</CardDescription>
                    </div>
                  </div>
                  
                  {/* Status and Online Indicator */}
                  <div className="flex items-center space-x-2">
                    <Badge variant={vendor.status === "active" ? "default" : "secondary"}>{vendor.status}</Badge>
                    {vendor.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400">
                    <strong>Email:</strong> {vendor.contactEmail}
                  </p>
                  <p className="text-sm text-neutral-400">
                    <strong>Phone:</strong> {vendor.contactPhone}
                  </p>
                  <p className="text-sm text-neutral-400">
                    <strong>Rating:</strong> {
                      typeof vendor.rating === 'number' && !isNaN(vendor.rating) 
                        ? vendor.rating.toFixed(1) 
                        : '0.0'
                    } ({vendor.totalRatings || 0} reviews)
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-neutral-500 mb-4">No vendors found</p>
            <Button asChild>
              <Link href={`/admin/${courtId}/vendors/add`}>Add First Vendor</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
