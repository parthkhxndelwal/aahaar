"use client"
import { use, useEffect, useState } from "react"
import { useAppAuth } from "@/contexts/app-auth-context"
import { useRouter } from "next/navigation"
import { ProductCard } from "@/components/app/product-card"
import { Bell } from "lucide-react"
import { motion } from "framer-motion"

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
  }
}

export default function HomePage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const { user, token, loading: authLoading } = useAppAuth()
  const router = useRouter()
  const [hotItems, setHotItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    // Wait for auth context to finish loading
    if (authLoading) return
    
    if (!user || !token) {
      console.log('🚪 [HomePage] No auth, redirecting to login')
      router.replace(`/app/${courtId}/login`)
      return
    }
  }, [user, token, courtId, router, authLoading])

  // Show loading while checking authentication or fetching data
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Checking authentication...
          </p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated - don't render anything
  if (!user || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Redirecting to login...
          </p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!user || !token || authLoading) return
    
    console.log('✅ [HomePage] Auth confirmed, fetching hot items')
    const fetchHotItems = async () => {
      try {
        const response = await fetch(`/api/courts/${courtId}/hot-items`)
        const data = await response.json()
        
        if (data.success) {
          setHotItems(data.data)
        }
      } catch (error) {
        console.error("Error fetching hot items:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHotItems()
  }, [courtId, user, token, authLoading])

  return (
    <div className="space-y-6 pb-24">
      {/* Welcome Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Welcome back, {user?.fullName || "User"}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            What would you like to eat today?
          </p>
        </div>
        
        <motion.button
          className="relative p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="h-5 w-5 text-black dark:text-white" />
          {/* Notification dot */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-neutral-950"></div>
        </motion.button>
      </motion.div>

      {/* Hot Right Now Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative"
      >
        <h2 className="text-xl font-bold text-black dark:text-white mb-4">
          🔥 Hot right now
        </h2>
        
        {loading ? (
          <div className="flex gap-3 overflow-x-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-neutral-200 dark:bg-neutral-800 rounded-2xl h-48 min-w-[150px] flex-shrink-0 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="relative -mx-4">
            <div 
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2 px-4" 
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                touchAction: 'pan-x'
              }}
            >
              {hotItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  className={`min-w-[150px] max-w-[150px] flex-shrink-0 ${
                    index === 0 ? 'ml-4' : ''
                  } ${
                    index === hotItems.length - 1 ? 'mr-4' : ''
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.1 * index,
                    type: "spring",
                    stiffness: 300
                  }}
                >
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
                    status={item.status as 'active' | 'inactive' | 'out_of_stock'}
                    className="h-full"
                  />
                </motion.div>
              ))}
              {/* Add padding element at the end for better scroll experience */}
              <div className="min-w-[1px] flex-shrink-0"></div>
            </div>
            
            {/* Gradient fade effects for scroll indication - positioned to match the scrollable area exactly */}
            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-white dark:from-neutral-950 to-transparent pointer-events-none z-10"></div>
            <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white dark:from-neutral-950 to-transparent pointer-events-none z-10"></div>
          </div>
        )}
      </motion.div>

      {/* Additional sections can be added here */}
      <motion.div
        className="text-center py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          More features coming soon...
        </p>
      </motion.div>
    </div>
  )
}
