"use client"

import { useState, useEffect, useRef, useCallback, SyntheticEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer"
import { Loader2, Upload, X, AlertCircle, Image as ImageIcon, Crop as CropIcon, Trash2 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import Image from "next/image"
import ReactCrop, { 
  centerCrop, 
  makeAspectCrop, 
  Crop as CropType, 
  PixelCrop 
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface StallSetupStepProps {
  vendorData: any
  updateVendorData: (data: any) => void
  onNext: (data: any) => void
  onBack: () => void
  loading: boolean
  courtId: string
  vendorId?: string
}

interface CropDrawerProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onCrop: (croppedImageBlob: Blob) => void
  isLoading: boolean
  cropType: "logo" | "banner"
}

// Helper function to center the crop
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): CropType {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 80,
        height: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

function CropDrawer({ isOpen, onClose, imageUrl, onCrop, isLoading, cropType }: CropDrawerProps) {
  const aspect = cropType === "logo" ? 1 : 16/9 // Square for logo, 16:9 for banner
  const imgRef = useRef<HTMLImageElement | null>(null)
  
  const [crop, setCrop] = useState<CropType>()
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>("")

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspect))
    }
  }

  function onCropComplete(crop: PixelCrop) {
    if (imgRef.current && crop.width && crop.height) {
      const croppedImageUrl = getCroppedImg(imgRef.current, crop)
      setCroppedImageUrl(croppedImageUrl)
    }
  }

  function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): string {
    const canvas = document.createElement("canvas")
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = crop.width * scaleX
    canvas.height = crop.height * scaleY

    const ctx = canvas.getContext("2d")

    if (ctx) {
      ctx.imageSmoothingEnabled = false

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY,
      )
    }

    return canvas.toDataURL("image/jpeg", 0.9)
  }

  async function handleCrop() {
    try {
      if (!croppedImageUrl) return
      
      // Convert data URL to blob
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      
      onCrop(blob)
    } catch (error) {
      console.error("Crop error:", error)
      alert("Failed to crop image. Please try again.")
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent 
        className="bg-neutral-900 border-neutral-700 max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-white">
            Crop {cropType === "logo" ? "Logo" : "Banner"}
          </DrawerTitle>
          <DrawerDescription className="text-neutral-400">
            Adjust the cropping area to select your {cropType === "logo" ? "logo" : "banner"} image
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 flex-1 flex flex-col items-center">
          {/* React Image Crop */}
          <div className="w-full max-w-md mb-4 flex justify-center">
            <div 
              className="w-[60%] mx-auto"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => onCropComplete(c)}
                aspect={aspect}
                className="w-full"
              >
                {imageUrl && (
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Crop preview"
                    className="w-full h-auto max-h-[400px] object-contain"
                    onLoad={onImageLoad}
                    style={{ backgroundColor: '#262626' }}
                  />
                )}
              </ReactCrop>
            </div>
          </div>

          <p className="text-xs text-neutral-400 text-center mb-4">
            Drag the corners to adjust the crop area. The image will be cropped to {cropType === "logo" ? "a square" : "16:9 aspect ratio"}.
          </p>
        </div>

        <DrawerFooter>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-neutral-950 hover:bg-neutral-900 border border-none text-white hover:bg-transparent"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCrop}
              disabled={isLoading || !croppedImageUrl}
              className="flex-1 bg-neutral-200 hover:bg-blue-200"
            >
              {isLoading ? (
                <Spinner size={16} variant="white" className="mr-2" />
              ) : (
                <CropIcon className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Saving...' : 'Save Cropped Image'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default function StallSetupStep({
  vendorData,
  updateVendorData,
  onNext,
  onBack,
  loading,
  courtId,
  vendorId,
}: StallSetupStepProps) {
  const [formData, setFormData] = useState({
    stallLocation: vendorData?.stallLocation || "",
    cuisineType: vendorData?.cuisineType || "",
    description: vendorData?.description || "",
    logoUrl: vendorData?.logoUrl || "",
    bannerUrl: vendorData?.bannerUrl || "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [dragStates, setDragStates] = useState({
    logo: false,
    banner: false
  })
  
  // Cropper state
  const [cropDrawer, setCropDrawer] = useState({
    isOpen: false,
    imageUrl: '',
    isLoading: false,
    cropType: 'logo' as 'logo' | 'banner'
  })

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Remove the problematic useEffect that was causing infinite re-renders
  // useEffect(() => {
  //   updateVendorData(formData)
  // }, [formData, updateVendorData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.stallLocation.trim()) {
      newErrors.stallLocation = "Stall location is required"
    }

    if (!formData.cuisineType.trim()) {
      newErrors.cuisineType = "Cuisine type is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileSelect = (file: File, type: "logo" | "banner") => {
    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        [type]: "File size must be less than 2MB"
      }))
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        [type]: "Please select an image file"
      }))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCropDrawer({
        isOpen: true,
        imageUrl: reader.result as string,
        isLoading: false,
        cropType: type
      })
      
      // Clear any previous errors
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[type]
        return newErrors
      })
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      setCropDrawer(prev => ({ ...prev, isLoading: true }))

      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', croppedImageBlob, `${cropDrawer.cropType}.jpg`)
      formData.append('upload_preset', cropDrawer.cropType === "logo" ? "vendor_logos" : "vendor_banners")
      formData.append('transformation', cropDrawer.cropType === "logo" ? "logo" : "banner")

      // Upload to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // Update form data with new image URL
        const fieldName = cropDrawer.cropType === "logo" ? "logoUrl" : "bannerUrl"
        setFormData(prev => ({
          ...prev,
          [fieldName]: result.data.url,
        }))
        
        // Close crop drawer
        setCropDrawer({
          isOpen: false,
          imageUrl: '',
          isLoading: false,
          cropType: 'logo'
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Upload error:", error)
      setErrors((prev) => ({
        ...prev,
        [cropDrawer.cropType]: "Failed to upload image. Please try again."
      }))
    } finally {
      setCropDrawer(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleCropCancel = () => {
    setCropDrawer({
      isOpen: false,
      imageUrl: '',
      isLoading: false,
      cropType: 'logo'
    })
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // Update vendor data before proceeding to next step
    updateVendorData(formData)
    onNext(formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const removeImage = (type: "logo" | "banner") => {
    setFormData((prev) => ({
      ...prev,
      [type === "logo" ? "logoUrl" : "bannerUrl"]: "",
    }))
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, type: "logo" | "banner") => {
    e.preventDefault()
    setDragStates(prev => ({ ...prev, [type]: true }))
  }

  const handleDragLeave = (e: React.DragEvent, type: "logo" | "banner") => {
    e.preventDefault()
    setDragStates(prev => ({ ...prev, [type]: false }))
  }

  const handleDrop = (e: React.DragEvent, type: "logo" | "banner") => {
    e.preventDefault()
    setDragStates(prev => ({ ...prev, [type]: false }))
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0], type)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Set up your stall's basic information and branding. This will be visible to customers.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="stallLocation">Stall Location *</Label>
          <Input
            id="stallLocation"
            placeholder="e.g., Chanakya Block, Near Main Gate"
            value={formData.stallLocation}
            onChange={(e) => handleInputChange("stallLocation", e.target.value)}
            className={errors.stallLocation ? "border-red-500" : ""}
          />
          {errors.stallLocation && (
            <p className="text-sm text-red-500">{errors.stallLocation}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cuisineType">Cuisine Type *</Label>
          <Input
            id="cuisineType"
            placeholder="e.g., North Indian, South Indian, Chinese"
            value={formData.cuisineType}
            onChange={(e) => handleInputChange("cuisineType", e.target.value)}
            className={errors.cuisineType ? "border-red-500" : ""}
          />
          {errors.cuisineType && (
            <p className="text-sm text-red-500">{errors.cuisineType}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Short Description *</Label>
        <Textarea
          id="description"
          placeholder="Brief description of your stall and specialties..."
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className={errors.description ? "border-red-500" : ""}
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* Logo and Banner Upload */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo Upload */}
        <div className="space-y-4">
          <Label>Stall Logo</Label>
          <div 
            className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer h-48 flex flex-col justify-center ${
              dragStates.logo 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                : "border-muted-foreground/25"
            }`}
            onDragOver={(e) => handleDragOver(e, "logo")}
            onDragLeave={(e) => handleDragLeave(e, "logo")}
            onDrop={(e) => handleDrop(e, "logo")}
            onClick={() => logoInputRef.current?.click()}
          >
            {formData.logoUrl ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Image
                    key={formData.logoUrl}
                    src={formData.logoUrl}
                    alt="Logo preview"
                    width={64}
                    height={64}
                    className="rounded-lg object-cover w-16 h-16"
                  />
                  <div>
                    <p className="font-medium">Logo uploaded</p>
                    <p className="text-sm text-muted-foreground">
                      Click to change or drag & drop a new image
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage("logo")
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <ImageIcon className="h-16 w-16 text-muted-foreground flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium mb-2">
                    {dragStates.logo ? "Drop image here" : "Upload your stall logo"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag & drop an image here, or click to browse
                    <br />
                    Recommended: Square image, max 2MB
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choose File
                  </Button>
                </div>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file, "logo")
              }}
            />
          </div>
          {errors.logo && (
            <p className="text-sm text-red-500">{errors.logo}</p>
          )}
        </div>

        {/* Banner Upload */}
        <div className="space-y-4">
          <Label>Stall Banner</Label>
          <div 
            className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer h-48 flex flex-col justify-center ${
              dragStates.banner 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                : "border-muted-foreground/25"
            }`}
            onDragOver={(e) => handleDragOver(e, "banner")}
            onDragLeave={(e) => handleDragLeave(e, "banner")}
            onDrop={(e) => handleDrop(e, "banner")}
            onClick={() => bannerInputRef.current?.click()}
          >
            {formData.bannerUrl ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Image
                    key={formData.bannerUrl}
                    src={formData.bannerUrl}
                    alt="Banner preview"
                    width={96}
                    height={64}
                    className="rounded-lg object-cover h-16"
                    style={{ width: 'auto' }}
                  />
                  <div>
                    <p className="font-medium">Banner uploaded</p>
                    <p className="text-sm text-muted-foreground">
                      Click to change or drag & drop a new image
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage("banner")
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <ImageIcon className="h-16 w-16 text-muted-foreground flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium mb-2">
                    {dragStates.banner ? "Drop image here" : "Upload your stall banner"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag & drop an image here, or click to browse
                    <br />
                    Recommended: 16:9 aspect ratio, max 2MB
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => bannerInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choose File
                  </Button>
                </div>
              </div>
            )}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file, "banner")
              }}
            />
          </div>
          {errors.banner && (
            <p className="text-sm text-red-500">{errors.banner}</p>
          )}
        </div>
      </div>

      {/* Image Crop Drawer */}
      <CropDrawer
        isOpen={cropDrawer.isOpen}
        onClose={handleCropCancel}
        imageUrl={cropDrawer.imageUrl}
        onCrop={handleCropComplete}
        isLoading={cropDrawer.isLoading}
        cropType={cropDrawer.cropType}
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="gap-2"
        >
          {loading && <Spinner size={16} variant="white" />}
          Next Step
        </Button>
      </div>
    </div>
  )
}
