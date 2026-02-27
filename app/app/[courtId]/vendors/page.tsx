"use client"
import { use, useEffect, useState } from "react"
import { VendorCard } from "@/components/app/vendor-card"
import { Loader2, Store } from "lucide-react"

interface Vendor {
  id: string
  stallName: string
  vendorName: string
  logoUrl?: string
  bannerUrl?: string
  cuisineType?: string
  description?: string
  rating?: number
  isOnline?: boolean
  totalItems?: number
  totalCategories?: number
}

export default function VendorsPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/app/${courtId}/vendors`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch vendors')
        }
        
        setVendors(data.vendors || [])
      } catch (error) {
        console.error('Error fetching vendors:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch vendors')
      } finally {
        setLoading(false)
      }
    }

    if (courtId) {
      fetchVendors()
    }
  }, [courtId])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          <p className="text-neutral-400">Loading vendors...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <Store className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Failed to load vendors</h3>
          <p className="text-neutral-400 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Vendors</h1>
        <p className="text-neutral-400">
          {vendors.length > 0 
            ? `Browse ${vendors.length} food vendors in this court` 
            : "Browse food vendors in this court"
          }
        </p>
      </div>
      
      {vendors.length === 0 ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="text-center">
            <Store className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No vendors available</h3>
            <p className="text-neutral-400 text-sm">
              There are currently no active vendors in this court.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              id={vendor.id}
              stallName={vendor.stallName}
              vendorName={vendor.vendorName}
              logoUrl={vendor.logoUrl}
              bannerUrl={vendor.bannerUrl}
              cuisineType={vendor.cuisineType}
              description={vendor.description}
              rating={vendor.rating}
              isOnline={vendor.isOnline}
              totalItems={vendor.totalItems}
              totalCategories={vendor.totalCategories}
              courtId={courtId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
