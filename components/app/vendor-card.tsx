"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Star, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import ColorThief from "colorthief"

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
  totalCategories = 0
}: VendorCardProps) {
  const router = useRouter()
  const [gradientStyle, setGradientStyle] = useState<React.CSSProperties>({
    background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.6), rgba(88, 28, 135, 0.4), rgba(127, 29, 29, 0.5))'
  })

  const extractColors = async (imageUrl: string) => {
    try {
      const colorThief = new ColorThief()
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          const palette = colorThief.getPalette(img, 3)
          if (palette && palette.length >= 2) {
            const [color1, color2, color3] = palette
            
            console.log('Extracted colors:', { color1, color2, color3 })
            
            const rgba1 = `rgba(${color1[0]}, ${color1[1]}, ${color1[2]}, 0.7)`
            const rgba2 = `rgba(${color2[0]}, ${color2[1]}, ${color2[2]}, 0.6)`
            const rgba3 = color3 ? `rgba(${color3[0]}, ${color3[1]}, ${color3[2]}, 0.5)` : rgba2
            
            const newGradient = `linear-gradient(135deg, ${rgba1}, ${rgba3}, ${rgba2})`
            
            setGradientStyle({
              background: newGradient
            })
          }
        } catch (error) {
          console.log('Color extraction failed:', error)
        }
      }
      
      img.onerror = (error) => {
        console.log('Image load failed:', error)
      }
      
      img.src = imageUrl
    } catch (error) {
      console.log('ColorThief initialization failed:', error)
    }
  }

  useEffect(() => {
    if (logoUrl) {
      console.log('Extracting colors from:', logoUrl)
      extractColors(logoUrl)
    }
  }, [logoUrl])

  const handleVendorClick = () => {
    router.push(`/app/${courtId}/vendors/${id}`)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleVendorClick}
      className="rounded-lg border border-neutral-800 overflow-hidden cursor-pointer h-auto flex flex-col relative"
    >
      {/* Background Layer 1: Pitch Black */}
      <div className="absolute inset-0 bg-black"></div>
      
      {/* Background Layer 2: Dynamic Gradient Overlay */}
      <div className="absolute inset-0 opacity-30" style={gradientStyle}></div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Circular Logo at the top */}
        <div className="flex justify-center p-6 pb-4">
          <div className="w-18 h-18 rounded-full border-3 border-black bg-neutral-600 overflow-hidden relative">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${stallName} logo`}
                width={72}
                height={72}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-500 to-neutral-600">
                <div className="text-2xl font-bold text-white">
                  {stallName.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            
            {/* Operating Status Badge on logo */}
            <div className="absolute -top-1 -right-1">
              <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                isOnline 
                  ? 'bg-green-500/90 text-green-100' 
                  : 'bg-red-500/90 text-red-100'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? 'bg-green-200' : 'bg-red-200'
                }`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4 pt-0 flex flex-col justify-between">
          <div className="space-y-2 text-center">
            <div>
              <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
                {stallName}
              </h3>
              <p className="text-neutral-400 text-xs mt-1">
                by {vendorName}
              </p>
            </div>

            {(totalItems > 0 || totalCategories > 0) && (
              <div className="flex justify-center">
                <div className="text-center">
                  <p className="text-neutral-300 text-xs">
                    <span className="font-semibold text-white">{totalItems.toString().padStart(2, '0')}</span> Items across
                  </p>
                  <p className="text-neutral-300 text-xs">
                    <span className="font-semibold text-white">{totalCategories.toString().padStart(2, '0')}</span> types of cuisine
                  </p>
                </div>
              </div>
            )}

            {description && (
              <p className="text-neutral-400 text-xs line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Rating Section */}
          {rating && rating > 0 && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-yellow-400 text-xs font-medium">
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
