"use client"
import { use, useEffect, useState } from "react"
import { VendorCard } from "@/components/app/vendor-card"
import { Loader2, Store, ArrowLeft, Search, X } from "lucide-react"
import { appApi } from "@/lib/api"
import { useRouter } from "next/navigation"

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
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const data = await appApi.getVendors(courtId)
        setVendors((data.vendors || []) as Vendor[])
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

  // Filter vendors based on search
  const filteredVendors = vendors.filter(vendor => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      vendor.stallName.toLowerCase().includes(query) ||
      vendor.vendorName.toLowerCase().includes(query) ||
      vendor.cuisineType?.toLowerCase().includes(query) ||
      vendor.description?.toLowerCase().includes(query)
    )
  })

  // Separate online and offline vendors
  const onlineVendors = filteredVendors.filter(v => v.isOnline)
  const offlineVendors = filteredVendors.filter(v => !v.isOnline)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Loading vendors...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Store className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-foreground font-semibold text-lg mb-2">Failed to load vendors</h3>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 sm:px-6 py-4">
          {/* Title Row */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push(`/app/${courtId}`)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">All Vendors</h1>
              <p className="text-sm text-muted-foreground">
                {vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'} available
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search vendors, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-muted border-0 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6">
        {filteredVendors.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Store className="w-8 h-8 text-muted-foreground" />
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-foreground font-medium mb-2">No results found</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
                  No vendors match "{searchQuery}". Try a different search term.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-sm text-foreground font-medium hover:underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <h3 className="text-foreground font-medium mb-2">No vendors available</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  There are currently no active vendors in this food court.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Online Vendors */}
            {onlineVendors.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-foreground" />
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Open Now
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    ({onlineVendors.length})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {onlineVendors.map((vendor) => (
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
              </section>
            )}

            {/* Offline Vendors */}
            {offlineVendors.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Currently Closed
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    ({offlineVendors.length})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 opacity-60">
                  {offlineVendors.map((vendor) => (
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
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
