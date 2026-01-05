"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Eye, Edit } from "lucide-react"
import Link from "next/link"

interface Vendor {
  id: string
  stallName: string
  vendorName: string
  contactEmail: string
  contactPhone: string
  status: string
  isOnline: boolean
  rating: number
  totalRatings: number
}

export default function AdminVendorsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const { courtId } = use(params)

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch(`/api/courts/${courtId}/vendors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
        <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
        <Button asChild>
          <Link href={`/admin/${courtId}/vendors/add`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
          <Card key={vendor.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{vendor.stallName}</CardTitle>
                  <CardDescription>{vendor.vendorName}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={vendor.status === "active" ? "default" : "secondary"}>{vendor.status}</Badge>
                  {vendor.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {vendor.contactEmail}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Phone:</strong> {vendor.contactPhone}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Rating:</strong> {vendor.rating.toFixed(1)} ({vendor.totalRatings} reviews)
                </p>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No vendors found</p>
            <Button asChild>
              <Link href={`/admin/${courtId}/vendors/add`}>Add First Vendor</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
