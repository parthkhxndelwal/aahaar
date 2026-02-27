"use client"
import { use, useEffect, useState } from "react"
import { ArrowLeft, Store, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

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
  contactPhone?: string
  contactEmail?: string
  status?: string
}

export default function VendorPage({ 
  params 
}: { 
  params: Promise<{ courtId: string; vendorId: string }> 
}) {
  const { courtId, vendorId } = use(params)
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/app/vendors/${vendorId}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch vendor details')
        }
        
        setVendor(data.vendor)
      } catch (error) {
        console.error('Error fetching vendor:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch vendor details')
      } finally {
        setLoading(false)
      }
    }

    if (vendorId) {
      fetchVendor()
    }
  }, [vendorId])

  const handleBack = () => {
    router.push(`/app/${courtId}/vendors`)
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          <p className="text-neutral-400">Loading vendor details...</p>
        </div>
      </div>
    )
  }

  if (error || !vendor) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <Store className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Vendor not found</h3>
          <p className="text-neutral-400 text-sm">
            {error || "The vendor you're looking for doesn't exist."}
          </p>
          <button 
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Back to Vendors
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{vendor.stallName}</h1>
          <p className="text-neutral-400">by {vendor.vendorName}</p>
        </div>
      </div>

      {/* Vendor Logo/Banner */}
      {vendor.logoUrl && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-neutral-800">
          <Image
            src={vendor.logoUrl}
            alt={`${vendor.stallName} logo`}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Vendor Details */}
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">About this stall</h2>
        
        <div className="space-y-4">
          {vendor.cuisineType && (
            <div>
              <h3 className="text-sm font-medium text-neutral-300 mb-1">Cuisine Type</h3>
              <span className="inline-block px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full text-sm">
                {vendor.cuisineType}
              </span>
            </div>
          )}

          {vendor.description && (
            <div>
              <h3 className="text-sm font-medium text-neutral-300 mb-1">Description</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                {vendor.description}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-neutral-300 mb-1">Status</h3>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              vendor.isOnline 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                vendor.isOnline ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              {vendor.isOnline ? 'Currently Open' : 'Currently Closed'}
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for future features */}
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Menu & Ordering</h2>
        <p className="text-neutral-400 text-sm">
          Menu items and ordering functionality will be available soon.
        </p>
      </div>
    </div>
  )
}
