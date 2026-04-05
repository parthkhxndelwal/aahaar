"use client"
import { use, useEffect, useState } from "react"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ProductCard } from "@/components/app/product-card"
import { AnimatedSearch } from "@/components/app/animated-search"
import { courtApi } from "@/lib/api"
import { ChevronRight, Utensils } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  mrp?: number
  imageUrl?: string
  vendorId: string
  category: string
  hasStock?: boolean
  stockQuantity?: number
  stockUnit?: string
  status?: string
  vendor?: {
    stallName: string
    cuisineType: string
    isOnline: boolean
  }
}

interface Category {
  name: string
  slug: string
  itemCount: number
  imageUrl?: string
  color?: string
}

// Category icons/colors mapping
const categoryStyles: Record<string, { icon: string; bgColor: string }> = {
  "snacks": { icon: "🍿", bgColor: "bg-amber-100" },
  "beverages": { icon: "🥤", bgColor: "bg-blue-100" },
  "drinks": { icon: "🧃", bgColor: "bg-cyan-100" },
  "main course": { icon: "🍛", bgColor: "bg-orange-100" },
  "desserts": { icon: "🍰", bgColor: "bg-pink-100" },
  "breakfast": { icon: "🍳", bgColor: "bg-yellow-100" },
  "lunch": { icon: "🍱", bgColor: "bg-green-100" },
  "dinner": { icon: "🍽️", bgColor: "bg-purple-100" },
  "fast food": { icon: "🍔", bgColor: "bg-red-100" },
  "indian": { icon: "🍲", bgColor: "bg-orange-100" },
  "chinese": { icon: "🥡", bgColor: "bg-red-100" },
  "italian": { icon: "🍕", bgColor: "bg-green-100" },
  "south indian": { icon: "🥘", bgColor: "bg-amber-100" },
  "north indian": { icon: "🫓", bgColor: "bg-orange-100" },
  "street food": { icon: "🌮", bgColor: "bg-yellow-100" },
  "healthy": { icon: "🥗", bgColor: "bg-emerald-100" },
  "thali": { icon: "🍽️", bgColor: "bg-amber-100" },
  "biryani": { icon: "🍚", bgColor: "bg-yellow-100" },
  "pizza": { icon: "🍕", bgColor: "bg-red-100" },
  "burger": { icon: "🍔", bgColor: "bg-amber-100" },
  "sandwich": { icon: "🥪", bgColor: "bg-green-100" },
  "rolls": { icon: "🌯", bgColor: "bg-orange-100" },
  "momos": { icon: "🥟", bgColor: "bg-slate-100" },
  "chai": { icon: "☕", bgColor: "bg-amber-100" },
  "coffee": { icon: "☕", bgColor: "bg-brown-100" },
  "juice": { icon: "🧃", bgColor: "bg-orange-100" },
  "ice cream": { icon: "🍦", bgColor: "bg-pink-100" },
  "default": { icon: "🍴", bgColor: "bg-gray-100" },
}

function getCategoryStyle(categoryName: string) {
  const key = categoryName.toLowerCase()
  return categoryStyles[key] || categoryStyles["default"]
}

export default function HomePage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const { user, token, loading: authLoading } = useUnifiedAuth()
  const router = useRouter()
  const [hotItems, setHotItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authLoading) return
    if (!user || !token) {
      router.replace(`/app/${courtId}/login`)
    }
  }, [user, token, courtId, router, authLoading])

  // Fetch hot items when authenticated
  useEffect(() => {
    if (!user || !token || authLoading) return
    
    const fetchHotItems = async () => {
      try {
        const data = await courtApi.getHotItems(courtId)
        if (Array.isArray(data)) {
          setHotItems(data as unknown as MenuItem[])
        } else if (data && typeof data === 'object' && 'data' in data) {
          setHotItems((data as { data: unknown[] }).data as unknown as MenuItem[])
        }
      } catch (error) {
        console.error("Error fetching hot items:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHotItems()
  }, [courtId, user, token, authLoading])

  // Fetch categories when authenticated
  useEffect(() => {
    if (!user || !token || authLoading) return
    
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/app/${courtId}/categories`)
        const data = await response.json()
        if (data.success && data.data?.categories) {
          setCategories(data.data.categories)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [courtId, user, token, authLoading])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting
  if (!user || !token) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold">
          {user?.fullName ? `Hello, ${user.fullName.split(" ")[0]}!` : "Welcome!"}
        </h1>
        <p className="text-muted-foreground">What would you like to eat today?</p>
      </div>

      {/* Search */}
      <div className="px-4">
        <AnimatedSearch courtId={courtId} />
      </div>

      {/* Categories Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Categories</h2>
          {categories.length > 6 && (
            <Link 
              href={`/app/${courtId}/categories`}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        
        {categoriesLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-muted animate-pulse" />
                <div className="w-12 h-3 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Utensils className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No categories available</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {categories.slice(0, 6).map((category) => {
              const style = getCategoryStyle(category.name)
              return (
                <Link
                  key={category.slug}
                  href={`/app/${courtId}/category/${category.slug}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div 
                    className={`w-16 h-16 rounded-2xl ${category.imageUrl ? 'bg-muted' : style.bgColor} flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 shadow-sm border border-border/30`}
                  >
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.parentElement && (target.parentElement.innerHTML = `<span class="text-2xl">${style.icon}</span>`)
                        }}
                      />
                    ) : (
                      <span className="text-2xl">{style.icon}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-center truncate w-full">
                    {category.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground -mt-1">
                    {category.itemCount} items
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Hot Right Now Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Hot right now</h2>
        </div>
        
        {loading ? (
          <div className="flex gap-3 overflow-x-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted rounded-2xl h-48 min-w-[150px] flex-shrink-0 animate-pulse" />
            ))}
          </div>
        ) : hotItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Utensils className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No items available right now</p>
          </div>
        ) : (
          <div 
            className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mx-4 px-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {hotItems.map((item) => (
              <div key={item.id} className="min-w-[150px] max-w-[150px] flex-shrink-0">
                <ProductCard
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  mrp={item.mrp}
                  imageUrl={item.imageUrl}
                  hasStock={item.hasStock}
                  stockQuantity={item.stockQuantity}
                  stockUnit={item.stockUnit}
                  status={item.status as "active" | "inactive" | "out_of_stock"}
                  vendorId={item.vendorId}
                  vendorName={item.vendor?.stallName || "Unknown Vendor"}
                  isVendorOnline={item.vendor?.isOnline ?? true}
                  className="h-full"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/app/${courtId}/vendors`}
            className="p-4 rounded-2xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-semibold mb-1">Browse Vendors</h3>
            <p className="text-xs text-muted-foreground">Explore all food stalls</p>
          </Link>
          <Link
            href={`/app/${courtId}/orders`}
            className="p-4 rounded-2xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-semibold mb-1">Your Orders</h3>
            <p className="text-xs text-muted-foreground">Track order status</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
