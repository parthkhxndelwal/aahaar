"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Clock, TrendingUp } from "lucide-react"
import { ProductCard } from "@/components/app/product-card"
import { useAppAuth } from "@/contexts/app-auth-context"

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

interface SearchHistory {
  query: string
  timestamp: number
}

interface AnimatedSearchProps {
  courtId: string
  onClose?: () => void
}

export function AnimatedSearch({ courtId, onClose }: AnimatedSearchProps) {
  const { user, token } = useAppAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [showHistory, setShowHistory] = useState(true)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Load search history from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem(`search-history-${courtId}`)
    if (saved) {
      try {
        const history = JSON.parse(saved)
        setSearchHistory(history.slice(0, 10)) // Keep only last 10 searches
      } catch (error) {
        console.error("Error parsing search history:", error)
      }
    }
  }, [courtId])

  // Save search to history
  const saveToHistory = (query: string) => {
    if (query.trim().length < 2) return
    
    const newHistory = [
      { query: query.trim(), timestamp: Date.now() },
      ...searchHistory.filter(h => h.query !== query.trim())
    ].slice(0, 10)
    
    setSearchHistory(newHistory)
    localStorage.setItem(`search-history-${courtId}`, JSON.stringify(newHistory))
  }

  // Clear search history
  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem(`search-history-${courtId}`)
  }

  // Search for menu items
  const searchMenuItems = async (query: string) => {
    if (!query.trim() || !user || !token) {
      setSearchResults([])
      setShowHistory(true)
      return
    }

    setIsLoading(true)
    setShowHistory(false)
    
    try {
      const response = await fetch(`/api/courts/${courtId}/menu-items/search?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.data || [])
        saveToHistory(query)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error("Error searching menu items:", error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Effect to search when debounced query changes
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchMenuItems(searchQuery)
    }, 300)

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 300) // Wait for animation to complete
    }
  }, [isExpanded])

  const handleExpand = () => {
    setIsExpanded(true)
  }

  const handleClose = () => {
    setIsExpanded(false)
    setSearchQuery("")
    setSearchResults([])
    setShowHistory(true)
    onClose?.()
  }

  const handleHistoryClick = (query: string) => {
    setSearchQuery(query)
    searchMenuItems(query)
  }

  const handleInputChange = (value: string) => {
    setSearchQuery(value)
    if (!value.trim()) {
      setShowHistory(true)
      setSearchResults([])
    }
  }

  // Compact search bar
  const CompactSearch = () => (
    <motion.div
      className="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-300"
      onClick={handleExpand}
      layoutId="search-bar"
      whileHover={{ 
        scale: 1.02,
        borderColor: "rgb(59, 130, 246)", // blue-500
        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
      }}
      whileTap={{ scale: 0.98 }}
      animate={{
        borderColor: ["rgb(229, 231, 235)", "rgb(99, 102, 241)", "rgb(229, 231, 235)"] // gray-200 to violet-500 to gray-200
      }}
      transition={{
        borderColor: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Search className="h-5 w-5 text-neutral-400" />
        </motion.div>
        <span className="text-neutral-500 dark:text-neutral-400 text-sm">
          Search for food items...
        </span>
        <motion.div
          className="absolute right-3 text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg border"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          Tap to search
        </motion.div>
      </motion.div>
  )

  // Expanded search interface
  const ExpandedSearch = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4">
        <motion.div 
          className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl"
          layoutId="search-bar"
          transition={{ 
            duration: 0.3, 
            ease: [0.25, 0.46, 0.45, 0.94],
            layout: { duration: 0.3 }
          }}
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search for food items..."
              className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <motion.button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
          </motion.button>
        </motion.div>
      </div>

      {/* Content */}
        <motion.div 
          className="flex-1 overflow-y-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <div className="p-4">
            <AnimatePresence mode="wait">
              {/* Search History */}
              {showHistory && searchHistory.length > 0 && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                      Recent Searches
                    </h3>
                    <button
                      onClick={clearHistory}
                      className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {searchHistory.map((item, index) => (
                      <motion.button
                        key={`${item.query}-${item.timestamp}`}
                        onClick={() => handleHistoryClick(item.query)}
                        className="flex items-center gap-3 w-full p-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Clock className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                        <span className="text-neutral-700 dark:text-neutral-300">
                          {item.query}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Popular Searches */}
              {showHistory && searchHistory.length === 0 && (
                <motion.div
                  key="popular"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    🔥 Popular Searches
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["pizza", "burger", "biryani", "coffee", "sandwich", "pasta", "salad", "ice cream"].map((term, index) => (
                      <motion.button
                        key={term}
                        onClick={() => handleHistoryClick(term)}
                        className="flex items-center gap-2 p-3 text-left bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 rounded-lg transition-all duration-200 border border-neutral-200 dark:border-neutral-700"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <TrendingUp className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <span className="text-neutral-700 dark:text-neutral-300 capitalize">
                          {term}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Loading State */}
              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-12"
                >
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-white mx-auto mb-4"></div>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Searching for "{searchQuery}"...
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Search Results */}
              {!isLoading && searchResults.length > 0 && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                      Found {searchResults.length} item{searchResults.length !== 1 ? 's' : ''}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {searchResults.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
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
                          vendorId={item.vendorId}
                          vendorName={item.vendor?.stallName || 'Unknown Vendor'}
                          className="h-full"
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* No Results */}
              {!isLoading && !showHistory && searchQuery && searchResults.length === 0 && (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-12"
                >
                  <div className="text-neutral-400 mb-4">
                    <Search className="h-16 w-16 mx-auto mb-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    No items found
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    We couldn't find any items matching "{searchQuery}". Try searching with different keywords.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )

  return (
    <motion.div layout className="relative">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <CompactSearch key="compact" />
        ) : (
          <motion.div
            key="expanded"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div 
              className="bg-black/20 backdrop-blur-sm w-full h-screen"
              onClick={handleClose}
            >
              <div 
                className="bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm w-full h-screen"
                onClick={(e) => e.stopPropagation()}
              >
                <ExpandedSearch />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}