"use client"

import * as React from "react"
import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Upload, X, Image as ImageIcon, Clipboard } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from '@/components/ui/drawer'
import { ImageCropper } from './image-cropper'

interface ImageEditorDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSave: (imageUrl: string) => void
  title: string
  description: string
  aspect?: number
  circularCrop?: boolean
  uploadPreset: string
  currentImageUrl?: string
}

export function ImageEditorDrawer({
  isOpen,
  onClose,
  onSave,
  title,
  description,
  aspect,
  circularCrop = false,
  uploadPreset,
  currentImageUrl
}: ImageEditorDrawerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageSrc, setImageSrc] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isWaitingForPaste, setIsWaitingForPaste] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle paste from clipboard
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    if (!isOpen) return

    const items = event.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault()
        setIsWaitingForPaste(false)
        setError('')

        const blob = item.getAsFile()
        if (blob) {
          // Validate file size
          if (blob.size > 4 * 1024 * 1024) {
            setError('Pasted image is too large. Maximum size is 4MB.')
            return
          }

          // Convert blob to File object
          const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type })

          setSelectedFile(file)

          // Create object URL for preview
          const reader = new FileReader()
          reader.onload = () => {
            setImageSrc(reader.result as string)
          }
          reader.readAsDataURL(file)
        }
        break
      }
    }
  }, [isOpen])

  // Add paste event listener when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('paste', handlePaste)
      return () => {
        document.removeEventListener('paste', handlePaste)
      }
    }
  }, [isOpen, handlePaste])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (4MB limit)
    if (file.size > 4 * 1024 * 1024) {
      setError('File size must be less than 4MB')
      return
    }

    setSelectedFile(file)
    setError('')
    setIsWaitingForPaste(false)

    // Create object URL for preview
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    setIsWaitingForPaste(false)
    setError('')

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please drop a valid image file')
        return
      }

      // Validate file size (4MB limit)
      if (file.size > 4 * 1024 * 1024) {
        setError('File size must be less than 4MB')
        return
      }

      setSelectedFile(file)

      // Create object URL for preview
      const reader = new FileReader()
      reader.onload = () => {
        setImageSrc(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setIsUploading(true)
    setError('')

    try {
      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', croppedImageBlob, 'cropped-image.jpg')
      formData.append('upload_preset', uploadPreset)

      // Upload to the existing upload API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to upload image')
      }

      // Call the onSave callback with the uploaded image URL
      onSave(result.data.url)

      // Close the drawer
      handleClose()
    } catch (error: any) {
      setError(error.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setImageSrc('')
    setError('')
    setIsUploading(false)
    setIsWaitingForPaste(false)
    onClose()
  }

  const handleRemoveCurrentImage = () => {
    onSave('')
    handleClose()
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Current Image Preview */}
            {currentImageUrl && !selectedFile && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Image</Label>
                <div className="relative">
                  <img
                    src={currentImageUrl}
                    alt="Current"
                    className="w-full max-w-sm h-auto rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveCurrentImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* File Upload */}
            {!selectedFile && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Upload New Image
                </Label>

                {/* Upload Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File Upload */}
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-foreground/40 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Click to upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, JPEG
                    </p>
                  </div>

                  {/* Paste from Clipboard */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      isWaitingForPaste
                        ? 'border-border bg-muted'
                        : 'border-border hover:border-foreground/40'
                    }`}
                    onClick={() => {
                      setIsWaitingForPaste(!isWaitingForPaste)
                      setError('')
                    }}
                  >
                    <Clipboard className={`mx-auto h-8 w-8 ${
                      isWaitingForPaste
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`} />
                    <p className={`mt-2 text-sm ${
                      isWaitingForPaste
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}>
                      {isWaitingForPaste ? 'Ready to paste' : 'Paste from clipboard'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ctrl+V or Cmd+V
                    </p>
                  </div>
                </div>

                {/* Paste Instructions */}
                {isWaitingForPaste && (
                  <div className="bg-muted border rounded-lg p-3">
                    <p className="text-sm text-foreground">
                      📋 Ready to paste! Press <kbd className="px-1 py-0.5 bg-background border rounded text-xs">Ctrl+V</kbd> (or <kbd className="px-1 py-0.5 bg-background border rounded text-xs">Cmd+V</kbd> on Mac) to paste an image from your clipboard.
                    </p>
                  </div>
                )}

                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    isDragOver
                        ? 'border-border bg-muted'
                        : 'border-border hover:border-foreground/40'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <p className={`text-sm ${
                    isDragOver
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}>
                    {isDragOver ? 'Drop image here' : 'Or drag and drop an image here'}
                  </p>
                </div>

                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
              </div>
            )}

            {/* Image Cropper */}
            {selectedFile && imageSrc && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Crop Image</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      setImageSrc('')
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Change Image
                  </Button>
                </div>
                <ImageCropper
                  imageSrc={imageSrc}
                  onCropComplete={handleCropComplete}
                  aspect={aspect}
                  circularCrop={circularCrop}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {isUploading && (
              <div className="flex items-center justify-center p-4">
                <Spinner size={24} />
                <span className="ml-2 text-sm">Uploading...</span>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter>
          <div className="flex gap-2">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}