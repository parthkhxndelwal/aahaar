"use client"
import { use, useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
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
  vendor?: {
    stallName: string
    cuisineType: string
  }
}

export default function HomePage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const { user } = useAuth()
  const [hotItems, setHotItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [courtId])

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
      >
        <h2 className="text-xl font-bold text-black dark:text-white mb-4">
          🔥 Hot right now
        </h2>
        
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-neutral-200 dark:bg-neutral-800 rounded-2xl h-48 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {hotItems.map((item, index) => (
              <motion.div
                key={item.id}
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
                />
              </motion.div>
            ))}
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
