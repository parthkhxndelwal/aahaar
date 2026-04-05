"use client"
import { use, useEffect, useState, useMemo } from "react"
import { ArrowLeft, Store, Loader2, Clock, MapPin, UtensilsCrossed, Star, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { appApi } from "@/lib/api"
import { ProductCard } from "@/components/app/product-card"

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
  averagePreparationTime?: number
  stallLocation?: string
}

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  mrp?: number
  imageUrl?: string
  category?: string
  isAvailable?: boolean
  status?: string
  hasStock?: boolean
  stockQuantity?: number
  stockUnit?: string
  vendor?: {
    id: string
    stallName: string
    cuisineType?: string
    isOnline?: boolean
    averagePreparationTime?: number
  }
}

export default function VendorPage({ 
  params 
}: { 
  params: Promise<{ courtId: string; vendorId: string }> 
}) {
  const { courtId, vendorId } = use(params)
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [menuLoading, setMenuLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Extract unique categories from menu items
  const categories = useMemo(() => {
    const categorySet = new Set<string>()
    menuItems.forEach(item => {
      if (item.category) {
        categorySet.add(item.category)
      }
    })
    return Array.from(categorySet).sort()
  }, [menuItems])

  // Filter items by selected category
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return menuItems
    return menuItems.filter(item => item.category === selectedCategory)
  }, [menuItems, selectedCategory])

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const data = await appApi.getVendorDetail(vendorId)
        setVendor(data.vendor as Vendor)
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

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setMenuLoading(true)
        const data = await appApi.getVendorMenu(courtId, vendorId)
        setMenuItems(data.menuItems || [])
      } catch (error) {
        console.error('Error fetching menu:', error)
      } finally {
        setMenuLoading(false)
      }
    }

    if (courtId && vendorId) {
      fetchMenu()
    }
  }, [courtId, vendorId])

  const handleBack = () => {
    router.push(`/app/${courtId}/vendors`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Loading vendor details...</p>
        </div>
      </div>
    )
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Store className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-foreground font-semibold text-lg mb-2">Vendor not found</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {error || "The vendor you're looking for doesn't exist."}
          </p>
          <button 
            onClick={handleBack}
            className="w-full px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Back to Vendors
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero Section with Banner */}
      <div className="relative">
        {/* Banner Image */}
        <div className="relative w-full h-48 sm:h-56 bg-muted">
          {vendor.bannerUrl || vendor.logoUrl ? (
            <Image
              src={vendor.bannerUrl || vendor.logoUrl || ''}
              alt={vendor.stallName}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <Store className="w-16 h-16 text-muted-foreground/50" />
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Status Badge */}
          <div className="absolute top-4 right-4 z-10">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm shadow-sm ${
              vendor.isOnline 
                ? 'bg-foreground/90 text-background' 
                : 'bg-background/80 text-muted-foreground'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                vendor.isOnline ? 'bg-background' : 'bg-muted-foreground'
              }`} />
              {vendor.isOnline ? 'Open Now' : 'Closed'}
            </div>
          </div>
        </div>

        {/* Vendor Info Card - Overlapping the banner */}
        <div className="relative px-4 sm:px-6 -mt-12">
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            {/* Header Row */}
            <div className="flex items-start gap-4 mb-4">
              {/* Logo */}
              <div className="relative w-16 h-16 rounded-xl bg-muted border-2 border-background shadow-sm overflow-hidden flex-shrink-0">
                {vendor.logoUrl ? (
                  <Image
                    src={vendor.logoUrl}
                    alt={vendor.stallName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-xl font-bold text-foreground">
                      {vendor.stallName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Name & Details */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-foreground leading-tight mb-1">
                  {vendor.stallName}
                </h1>
                <p className="text-sm text-muted-foreground mb-2">
                  by {vendor.vendorName}
                </p>
                
                {/* Quick Info Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {vendor.cuisineType && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                      <UtensilsCrossed className="w-3 h-3" />
                      {vendor.cuisineType}
                    </span>
                  )}
                  {vendor.averagePreparationTime && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {vendor.averagePreparationTime} min
                    </span>
                  )}
                  {vendor.rating && vendor.rating > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs text-foreground font-medium">
                      <Star className="w-3 h-3 fill-current" />
                      {typeof vendor.rating === 'number' ? vendor.rating.toFixed(1) : parseFloat(vendor.rating || 0).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {vendor.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {vendor.description}
              </p>
            )}

            {/* Location */}
            {vendor.stallLocation && (
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{vendor.stallLocation}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border mt-6">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === null
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All ({menuItems.length})
              </button>
              {categories.map((category) => {
                const count = menuItems.filter(item => item.category === category).length
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-foreground text-background shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {category} ({count})
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Menu Section */}
      <div className="px-4 sm:px-6 py-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {selectedCategory ? selectedCategory : 'Full Menu'}
            </h2>
            {!menuLoading && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} available
              </p>
            )}
          </div>
        </div>

        {/* Menu Grid */}
        {menuLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading menu...</p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground font-medium mb-2">No items available</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {selectedCategory 
                ? `There are no items in the "${selectedCategory}" category right now.`
                : 'This vendor has no menu items available at the moment.'}
            </p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="mt-4 text-sm text-foreground font-medium hover:underline"
              >
                View all items
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                name={item.name}
                description={item.description || ''}
                price={item.price}
                mrp={item.mrp}
                imageUrl={item.imageUrl}
                vendorId={vendor.id}
                vendorName={vendor.stallName}
                isVendorOnline={vendor.isOnline}
                hasStock={item.hasStock}
                stockQuantity={item.stockQuantity}
                stockUnit={item.stockUnit}
                status={
                  item.status === 'out_of_stock' ? 'out_of_stock' :
                  item.status === 'inactive' ? 'inactive' :
                  item.isAvailable === false ? 'out_of_stock' : 'active'
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
