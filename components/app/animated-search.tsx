"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
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

const POPULAR_SEARCHES = ["pizza", "burger", "biryani", "coffee", "sandwich", "pasta", "salad", "ice cream", "dal", "roti", "naan", "paratha", "rice", "curry", "paneer", "chicken", "mutton", "fish", "samosa", "pakora", "chaat", "dosa", "idli", "vada", "chole", "rajma", "palak", "aloo gobi", "butter chicken", "tandoori", "kebab", "kulcha", "lassi", "chai"]

export function AnimatedSearch({ courtId, onClose }: AnimatedSearchProps) {
  const { user, token } = useAppAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [showHistory, setShowHistory] = useState(true)
  const [overlayChrome, setOverlayChrome] = useState(false)
  const [crossVisible, setCrossVisible] = useState(true)
  const [layoutDuration, setLayoutDuration] = useState(0.3)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Load search history
  useEffect(() => {
    const saved = localStorage.getItem(`search-history-${courtId}`)
    if (saved) {
      try {
        const history = JSON.parse(saved)
        setSearchHistory(history.slice(0, 10))
      } catch (error) {
        console.error("Error parsing search history:", error)
      }
    }
  }, [courtId])

  // Save search to history
  const saveToHistory = useCallback((query: string) => {
    if (query.trim().length < 2) return
    
    const newHistory = [
      { query: query.trim(), timestamp: Date.now() },
      ...searchHistory.filter(h => h.query !== query.trim())
    ].slice(0, 10)
    
    setSearchHistory(newHistory)
    localStorage.setItem(`search-history-${courtId}`, JSON.stringify(newHistory))
  }, [courtId, searchHistory])

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    localStorage.removeItem(`search-history-${courtId}`)
  }, [courtId])

  // Search for menu items
  const searchMenuItems = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 1 || !user || !token) {
      setSearchResults([])
      setShowHistory(true)
      setIsTyping(false)
      return
    }

    setIsLoading(true)
    setIsTyping(false)
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
  }, [courtId, user, token, saveToHistory])

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.trim().length > 0) {
      setIsTyping(true)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim().length >= 1) {
        searchMenuItems(query)
      } else if (query.trim().length === 0) {
        setSearchResults([])
        setShowHistory(true)
        setIsTyping(false)
      }
    }, 1000)
  }, [searchMenuItems])

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 400) // Wait for morph animation to complete
    }
  }, [isExpanded])

  // Clear only the search contents without closing the overlay
  const clearSearchOnly = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }
    setSearchQuery("")
    setSearchResults([])
    setShowHistory(true)
    setIsTyping(false)
  }, [])

  // Escape key: clear first (if anything to clear), else close overlay
  useEffect(() => {
    if (!isExpanded) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        const hasActiveQuery =
          searchQuery.trim().length > 0 || isTyping || isLoading || searchResults.length > 0
        if (hasActiveQuery) {
          clearSearchOnly()
        } else {
          setCrossVisible(false)
          setTimeout(() => {
            handleClose()
          }, 120)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isExpanded, searchQuery, isTyping, isLoading, searchResults.length, clearSearchOnly])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleExpand = () => {
    // Start expansion; overlay chrome (bg + content) will appear after layout transition completes
    setOverlayChrome(false)
    setCrossVisible(true)
    setLayoutDuration(0.3)
    setIsExpanded(true)
  }

  const handleClose = () => {
    // Use shorter duration when collapsing
    setLayoutDuration(0.3)
    // First remove overlay chrome (bg + content), then contract the searchbar back
    setOverlayChrome(false)
    // Contract on next frame to keep morph feeling connected after chrome disappears
    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      requestAnimationFrame(() => setIsExpanded(false))
    } else {
      setTimeout(() => setIsExpanded(false), 0)
    }
    // Reset state
    setSearchQuery("")
    setSearchResults([])
    setShowHistory(true)
    setIsTyping(false)
    onClose?.()
  }

  // Cross button: clear first if search is active; otherwise close with fade
  const handleCrossClick = () => {
    const hasActiveQuery =
      searchQuery.trim().length > 0 || isTyping || isLoading || searchResults.length > 0
    if (hasActiveQuery) {
      clearSearchOnly()
      return
    }
    setCrossVisible(false)
    setTimeout(() => {
      handleClose()
    }, 120)
  }

  const handleHistoryClick = (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }
    
    setSearchQuery(query)
    setIsTyping(false)
    searchMenuItems(query)
  }

  const handleInputChange = (value: string) => {
    setSearchQuery(value)
    debouncedSearch(value)
    
    if (!value.trim()) {
      setShowHistory(true)
      setSearchResults([])
      setIsTyping(false)
    } else {
      setShowHistory(false)
    }
  }

  return (
    <LayoutGroup>
      {/* Compact Search Bar (animated element) */}
      {!isExpanded ? (
        <motion.div
          layoutId="searchbar"
          className="relative flex items-center gap-3 bg-white dark:bg-neutral-900 rounded-2xl p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors w-full max-w-[680px] md:max-w-[720px] lg:max-w-[820px] xl:max-w-[960px] 2xl:max-w-[1120px] mx-auto"
          transition={{ duration: layoutDuration, ease: [0.3, 0, 0.3, 1] }}
          onClick={handleExpand}
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              readOnly
              value={""}
              placeholder="Search for food items..."
              className="w-full pl-10 pr-4 py-2.5 bg-transparent dark:bg-transparent rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
              style={{ pointerEvents: 'none' }}
            />
          </div>
          <div className="absolute right-3 text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg border">
            Tap to search
          </div>
        </motion.div>
      ) : (
        // Placeholder to preserve layout spacing when expanded
        <div className="h-11 w-full max-w-[680px] md:max-w-[720px] lg:max-w-[820px] xl:max-w-[960px] 2xl:max-w-[1120px] mx-auto" aria-hidden />
      )}

      {/* Fullscreen Overlay (no fade) */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Background overlay with color fade synced to morph (no blur) */}
            <motion.div
              className="fixed inset-0 z-40"
              onClick={handleClose}
              initial={{ backgroundColor: "rgba(0,0,0,0)", backdropFilter: "blur(0px)" }}
              animate={{ backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(4px)" }}
              exit={{ backgroundColor: "rgba(0,0,0,0)", backdropFilter: "blur(0px)" }}
              transition={{ duration: layoutDuration, ease: [0.3, 0, 0.3, 1] }}
            />

            {/* Content layer (static overlay), only the searchbar animates - transparent, no blur */}
            <div className="fixed inset-0 z-50 bg-transparent overflow-hidden" onClick={handleClose}>
              <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
                {/* Header searchbar (animated element) */}
                <div className="p-4">
                  <motion.div
                    layoutId="searchbar"
                    className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm w-full max-w-[680px] md:max-w-[720px] lg:max-w-[820px] xl:max-w-[960px] 2xl:max-w-[1120px] mx-auto"
                    transition={{ duration: layoutDuration, ease: [0.3, 0, 0.3, 1] }}
                    onLayoutAnimationComplete={() => {
                      // When opening completes, reveal overlay chrome
                      if (isExpanded && !overlayChrome) setOverlayChrome(true)
                    }}
                  >
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="Search for food items..."
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent dark:bg-transparent rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
                      />
                    </div>
                    <motion.button
                      onClick={handleCrossClick}
                      className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{ opacity: crossVisible ? 1 : 0 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                    >
                      <X className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                    </motion.button>
                  </motion.div>
                </div>

                {/* Content (no fade) - appears only after searchbar morph completes */}
                {overlayChrome && (
                  <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    <div className="w-full max-w-[680px] md:max-w-[720px] lg:max-w-[820px] xl:max-w-[960px] 2xl:max-w-[1120px] mx-auto">
                      {/* Popular Searches (always visible when history is shown) */}
                      {showHistory && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                            🔥 Popular Searches
                          </h3>
                          <div className="[text-align:justify]">
                            {POPULAR_SEARCHES.map((term) => (
                              <button
                                key={term}
                                onClick={() => handleHistoryClick(term)}
                                className="mx-1 inline-block rounded-full border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 px-5 py-1.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-900.30 hover:border-blue-300 transition-colors mb-2"
                              >
                                <span className="capitalize">{term}</span>
                              </button>
                            ))}
                            {/* Spacer to enable justification */}
                            <span className="inline-block w-full" aria-hidden />
                          </div>
                        </div>
                      )}

                      {/* Recent Searches (shown below popular when available) */}
                      {showHistory && searchHistory.length > 0 && (
                        <div className="space-y-4 mt-6">
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
                          <div className="[text-align:justify]">
                            {searchHistory.map((item) => (
                              <button
                                key={`${item.query}-${item.timestamp}`}
                                onClick={() => handleHistoryClick(item.query)}
                                className="mx-1 inline-flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-4 py-1.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-blue-900.30 hover:border-blue-300 transition-colors mb-2"
                              >
                                <Clock className="h-3 w-3 text-neutral-400" />
                                <span>{item.query}</span>
                              </button>
                            ))}
                            {/* Spacer to enable justification */}
                            <span className="inline-block w-full" aria-hidden />
                          </div>
                        </div>
                      )}

                      {/* Loading State */}
                      {isLoading && (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-white mx-auto mb-4"></div>
                            <p className="text-neutral-600 dark:text-neutral-400">
                              Searching for "{searchQuery}"...
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Search Results */}
                      {!isLoading && searchResults.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                              Found: {searchResults.length} item{searchResults.length !== 1 ? 's' : ''}
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {searchResults.map((item) => (
                              <div key={item.id} className="w-full">
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
                                  className="h-full w-full"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No Results */}
                      {!isLoading && !isTyping && !showHistory && searchQuery && searchResults.length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-neutral-400 mb-4">
                            <Search className="h-16 w-16 mx-auto mb-4" />
                          </div>
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                            No items found
                          </h3>
                          <p className="text-neutral-600 dark:text-neutral-400">
                            We couldn't find any items matching "{searchQuery}". Try searching with different keywords.
                          </p>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                )}
                </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </LayoutGroup>
  )
}