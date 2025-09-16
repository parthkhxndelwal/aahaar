"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, ArrowRight, QrCode, Loader2, CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"

const carouselImages = [
  {
    src: "/carousel/app/image1.jpeg",
    title: "Fresh Pizza",
    subtitle: "Delivered Fast with Just One Click!",
    description: "Your Ultimate App for Every Craving Any Pizza, Anytime."
  },
  {
    src: "/carousel/app/image2.jpg", 
    title: "Seamless Ordering",
    subtitle: "Browse, Select, and Order in Seconds",
    description: "Experience the fastest food ordering system designed for modern food courts."
  },
  {
    src: "/carousel/app/image3.jpg",
    title: "Quick & Easy",
    subtitle: "From Menu to Your Table",
    description: "Skip the queues and get your favorite meals delivered directly to your table."
  }
]

export default function AuthPage() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [validating, setValidating] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState("")

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
  }

  const handleGetStarted = () => {
    setShowQRScanner(true)
    setError("")
    setScanResult(null)
  }

  const validateCourtId = async (courtId: string) => {
    setValidating(true)
    setError("")
    
    try {
      const response = await fetch(`/api/courts/${courtId}`)
      const data = await response.json()
      
      if (data.success && data.court) {
        // Court exists, redirect to court-specific auth
        router.push(`/app/${courtId}/auth`)
      } else {
        setError("Court ID not found. Please scan a valid QR code.")
      }
    } catch (error) {
      setError("Failed to validate court ID. Please try again.")
    } finally {
      setValidating(false)
    }
  }

  const simulateQRScan = () => {
    setScanning(true)
    setError("")
    
    // Simulate scanning process
    setTimeout(() => {
      // For demo purposes, let's use a mock court ID
      // In real implementation, this would come from QR scanner
      const mockCourtId = "demo-court"
      setScanResult(mockCourtId)
      setScanning(false)
      validateCourtId(mockCourtId)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Carousel */}
        <div className="w-full max-w-sm mx-auto mb-8">
          <div className="relative">
            {/* Image Container */}
            <div className="relative w-full h-96 rounded-3xl overflow-hidden bg-black/20 backdrop-blur-sm">
              <Image
                src={carouselImages[currentSlide].src}
                alt={carouselImages[currentSlide].title}
                fill
                className="object-cover"
                priority
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                <h2 className="text-2xl font-bold mb-2">
                  {carouselImages[currentSlide].title}
                </h2>
                <h3 className="text-lg font-semibold mb-2 text-orange-400">
                  {carouselImages[currentSlide].subtitle}
                </h3>
                <p className="text-sm text-gray-300">
                  {carouselImages[currentSlide].description}
                </p>
              </div>
            </div>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
              onClick={prevSlide}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
              onClick={nextSlide}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-orange-500 w-6' : 'bg-gray-600'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Get Started Button */}
        <Button
          onClick={handleGetStarted}
          className="w-full max-w-sm bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 rounded-full text-lg"
        >
          Get Started
        </Button>
      </div>

      {/* QR Scanner Modal */}
      <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan QR Code
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-center">
              Please position your camera so that the QR code is inside the guide box
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* QR Scanner Area */}
            <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
              {/* Scanner Frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-48 h-48">
                  {/* Corner borders */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg"></div>
                  
                  {/* Scanning Animation */}
                  {scanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 border-2 border-orange-500 rounded-lg animate-pulse">
                        <div className="w-full h-0.5 bg-orange-500 animate-pulse"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Success/Error States */}
                  {scanResult && !validating && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle className="h-16 w-16 text-green-500" />
                    </div>
                  )}
                  
                  {error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <XCircle className="h-16 w-16 text-red-500" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Status Text */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                {scanning && (
                  <p className="text-white text-sm">Scanning for QR code...</p>
                )}
                {validating && (
                  <p className="text-orange-400 text-sm flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validating court...
                  </p>
                )}
                {scanResult && !validating && !error && (
                  <p className="text-green-400 text-sm">QR code detected!</p>
                )}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="bg-red-900/20 border-red-800">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowQRScanner(false)}
                className="flex-1 border-gray-600 text-white bg-transparent hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={simulateQRScan}
                disabled={scanning || validating}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {scanning || validating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {scanning ? "Scanning..." : "Validating..."}
                  </>
                ) : (
                  "Scan QR Code"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
