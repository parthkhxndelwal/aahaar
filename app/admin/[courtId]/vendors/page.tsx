"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Search, MoreVertical, Edit, Trash2 } from "lucide-react"
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
  const [deletingVendor, setDeletingVendor] = useState<string | null>(null)
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

  const handleDeleteVendor = async (vendorId: string) => {
    try {
      setDeletingVendor(vendorId)
      const response = await fetch(`/api/courts/${courtId}/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Vendor deleted permanently",
        })
        // Refresh the vendors list
        fetchVendors()
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      })
    } finally {
      setDeletingVendor(null)
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
          <Card key={vendor.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Link href={`/admin/${courtId}/vendors/${vendor.id}?mode=view`} className="flex items-center space-x-3 flex-1">
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
                </Link>
                
                {/* Status and Actions */}
                <div className="flex items-center space-x-2">
                  <Badge variant={vendor.status === "active" ? "default" : "secondary"}>{vendor.status}</Badge>
                  {vendor.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                  
                  {/* 3-dot menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Link 
                          href={`/admin/${courtId}/vendors/${vendor.id}?mode=edit`}
                          className="flex items-center w-full"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Vendor Permanently</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete "{vendor.stallName}"? This action cannot be undone and will remove all vendor data including orders and menu items.
                              <br /><br />
                              <strong>Note:</strong> If you want to temporarily disable the vendor instead, you can suspend them from the edit page.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteVendor(vendor.id)}
                              disabled={deletingVendor === vendor.id}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingVendor === vendor.id ? "Deleting..." : "Delete Permanently"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <Link href={`/admin/${courtId}/vendors/${vendor.id}?mode=view`}>
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
            </Link>
          </Card>
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
