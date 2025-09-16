"use client"

import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedImageBlob: Blob) => void
  aspect?: number // width/height ratio, undefined for free crop
  circularCrop?: boolean
  minWidth?: number
  minHeight?: number
}

export function ImageCropper({
  imageSrc,
  onCropComplete,
  aspect,
  circularCrop = false,
  minWidth = 50,
  minHeight = 50
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget

    // Center the crop area
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect || 1,
        width,
        height
      ),
      width,
      height
    )

    setCrop(crop)
  }, [aspect])

  const getCroppedImg = useCallback(async (
    image: HTMLImageElement,
    crop: PixelCrop,
    scale: number,
    rotate: number
  ): Promise<Blob> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = crop.width
    canvas.height = crop.height

    ctx.save()

    // Move the crop origin to the canvas origin (0, 0)
    ctx.translate(-crop.x, -crop.y)

    // Scale and rotate
    ctx.scale(scale, scale)
    ctx.rotate((rotate * Math.PI) / 180)

    // Draw the image
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight
    )

    ctx.restore()

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty')
        }
        resolve(blob)
      }, 'image/jpeg', 0.95)
    })
  }, [])

  const handleCropComplete = useCallback(async () => {
    if (completedCrop && imgRef.current) {
      try {
        const croppedImageBlob = await getCroppedImg(
          imgRef.current,
          completedCrop,
          scale,
          rotate
        )
        onCropComplete(croppedImageBlob)
      } catch (error) {
        console.error('Error cropping image:', error)
      }
    }
  }, [completedCrop, scale, rotate, getCroppedImg, onCropComplete])

  const handleScaleChange = (value: number[]) => {
    setScale(value[0])
  }

  const handleRotateChange = (direction: 'left' | 'right') => {
    setRotate(prev => prev + (direction === 'left' ? -90 : 90))
  }

  const resetTransform = () => {
    setScale(1)
    setRotate(0)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspect}
          minWidth={minWidth}
          minHeight={minHeight}
          circularCrop={circularCrop}
        >
          <img
            ref={imgRef}
            alt="Crop preview"
            src={imageSrc}
            style={{
              transform: `scale(${scale}) rotate(${rotate}deg)`,
              maxHeight: '400px',
              maxWidth: '100%'
            }}
            onLoad={onImageLoad}
          />
        </ReactCrop>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Zoom</Label>
          <div className="flex items-center gap-2">
            <ZoomOut className="h-4 w-4" />
            <Slider
              value={[scale]}
              onValueChange={handleScaleChange}
              min={0.5}
              max={3}
              step={0.1}
              className="w-24"
            />
            <ZoomIn className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Rotate</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRotateChange('left')}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRotateChange('right')}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetTransform}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <Button
        onClick={handleCropComplete}
        disabled={!completedCrop}
        className="w-full"
      >
        Apply Crop
      </Button>
    </div>
  )
}