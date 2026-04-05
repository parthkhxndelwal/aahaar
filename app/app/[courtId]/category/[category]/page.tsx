"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Utensils } from "lucide-react"
import { ProductCard } from "@/components/app/product-card"

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
  isVegetarian?: boolean
  isVegan?: boolean
  spiceLevel?: string
  preparationTime?: number
  vendor?: {
    stallName: string
    cuisineType: string
    isOnline: boolean
  }
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ courtId: string; category: string }>
}) {
  const { courtId, category } = use(params)
  const router = useRouter()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryName, setCategoryName] = useState("")

  useEffect(() => {
    const fetchCategoryItems = async () => {
      try {
        const response = await fetch(`/api/app/${courtId}/categories/${category}`)
        const data = await response.json()
        if (data.success && data.data) {
          setItems(data.data.items || [])
          setCategoryName(data.data.category || decodeURIComponent(category).replace(/-/g, " "))
        }
      } catch (error) {
        console.error("Error fetching category items:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryItems()
  }, [courtId, category])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg capitalize">{categoryName || "Category"}</h1>
            {!loading && (
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Utensils className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold mb-1">No items found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              There are no items in this category right now
            </p>
            <Link
              href={`/app/${courtId}`}
              className="text-sm text-primary hover:underline"
            >
              Browse other categories
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <ProductCard
                key={item.id}
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
