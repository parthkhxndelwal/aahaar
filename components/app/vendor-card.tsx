"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Star, Clock, Store, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface VendorCardProps {
  id: string
  stallName: string
  vendorName: string
  logoUrl?: string
  bannerUrl?: string
  cuisineType?: string
  description?: string
  rating?: number
  isOnline?: boolean
  courtId: string
  totalItems?: number
  totalCategories?: number
  averagePreparationTime?: number
}

export function VendorCard({
  id,
  stallName,
  vendorName,
  logoUrl,
  bannerUrl,
  cuisineType,
  description,
  rating,
  isOnline = true,
  courtId,
  totalItems = 0,
  totalCategories = 0,
  averagePreparationTime
}: VendorCardProps) {
  const router = useRouter()

  const handleVendorClick = () => {
    router.push(`/app/${courtId}/vendors/${id}`)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleVendorClick}
      className="rounded-2xl border border-border overflow-hidden cursor-pointer bg-card shadow-sm"
    >
      {/* Banner/Logo Section */}
      <div className="relative h-24 bg-muted">
        {bannerUrl || logoUrl ? (
          <Image
            src={bannerUrl || logoUrl || ''}
            alt={stallName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <Store className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isOnline 
              ? 'bg-foreground text-background' 
              : 'bg-background/80 text-muted-foreground backdrop-blur-sm'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isOnline ? 'bg-background' : 'bg-muted-foreground'
            }`} />
            {isOnline ? 'Open' : 'Closed'}
          </div>
        </div>

        {/* Logo Overlay - Bottom Left */}
        <div className="absolute -bottom-5 left-3">
          <div className="w-12 h-12 rounded-xl bg-card border-2 border-card shadow-md overflow-hidden">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={stallName}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-lg font-bold text-foreground">
                  {stallName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="pt-7 pb-4 px-3">
        {/* Name & Vendor */}
        <div className="mb-2">
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1">
            {stallName}
          </h3>
          <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">
            by {vendorName}
          </p>
        </div>

        {/* Cuisine Type Badge */}
        {cuisineType && (
          <div className="mb-2">
            <span className="inline-block px-2 py-0.5 bg-muted rounded-md text-[10px] text-muted-foreground font-medium">
              {cuisineType}
            </span>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {totalItems > 0 && (
            <span>{totalItems} items</span>
          )}
          {rating && rating > 0 && (
            <span className="flex items-center gap-0.5 text-foreground font-medium">
              <Star className="w-3 h-3 fill-current" />
              {typeof rating === 'number' ? rating.toFixed(1) : parseFloat(rating).toFixed(1)}
            </span>
          )}
          {averagePreparationTime && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {averagePreparationTime}m
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
