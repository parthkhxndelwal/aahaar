"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/library"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

interface QRScannerProps {
  onScan: (result: string) => void
  onError: (error: string) => void
  isScanning: boolean
  disabled?: boolean
}

export default function QRScanner({ onScan, onError, isScanning, disabled = false }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [scanSuccess, setScanSuccess] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Handle component mounting with delay for navigation
  useEffect(() => {
    // Add a small delay to ensure proper initialization after navigation
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isMounted && isScanning && !disabled && hasPermission !== false) {
        // Restart scanning when page becomes visible
        startScanning()
      } else if (document.hidden) {
        // Stop scanning when page becomes hidden
        stopScanning()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isMounted, isScanning, disabled, hasPermission])

  useEffect(() => {
    if (isMounted && isScanning && !disabled && videoRef.current) {
      // Check if camera API is available before asking for permission
      if (hasPermission === null) {
        // More lenient check - some browsers might have different implementations
        const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
        const navAny = navigator as any
        const hasLegacyGetUserMedia = !!(navAny.getUserMedia || 
          navAny.webkitGetUserMedia || 
          navAny.mozGetUserMedia || 
          navAny.msGetUserMedia)
        
        if (!hasMediaDevices && !hasLegacyGetUserMedia) {
          // Camera API not supported, immediately set to false and show error
          setHasPermission(false)
          onError("Camera is not supported on this device or browser. Please manually enter the court ID.")
          return
        }
        
        // Check if we already have camera permission using Permissions API
        checkExistingPermission()
        return
      }
      
      // If we have permission, start scanning
      if (hasPermission === true) {
        setIsLoading(true)
        setScanSuccess(false)
        startScanning()
      }
    } else if (!isScanning || disabled) {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isScanning, disabled, isMounted, hasPermission])

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      // Force cleanup when component unmounts
      if (readerRef.current) {
        readerRef.current.reset()
        readerRef.current = null
      }
      
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
    }
  }, [])

  const stopScanning = () => {
    setScanSuccess(false)
    setIsLoading(false)
    
    if (readerRef.current) {
      readerRef.current.reset()
      readerRef.current = null
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      // Reset video element event handlers
      videoRef.current.onloadedmetadata = null
    }
  }

  const checkExistingPermission = async () => {
    try {
      // First, try to check permission status using Permissions API
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        console.log('Camera permission status:', permission.state)
        
        if (permission.state === 'granted') {
          console.log('Camera permission already granted')
          setHasPermission(true)
          return
        } else if (permission.state === 'denied') {
          console.log('Camera permission denied')
          setHasPermission(false)
          onError("Camera access denied. Please enable camera permissions in your browser settings or manually enter the court ID.")
          return
        }
      }
      
      // If Permissions API is not available or state is 'prompt', try to access camera directly
      console.log('Attempting direct camera access to check permission...')
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        })
        
        // If we get here, permission is granted
        console.log('Camera access successful, permission granted')
        stream.getTracks().forEach(track => track.stop())
        setHasPermission(true)
      } catch (error) {
        console.log('Direct camera access failed, showing permission dialog')
        // If direct access fails, show permission dialog
        setShowPermissionDialog(true)
      }
    } catch (error) {
      console.log('Permission check failed, showing permission dialog:', error)
      // If permission check fails, show permission dialog
      setShowPermissionDialog(true)
    }
  }

  const requestCameraPermission = async () => {
    try {
      setShowPermissionDialog(false)
      setIsLoading(true)
      
      // More lenient check with better debugging
      console.log('Checking camera API availability...')
      console.log('navigator.mediaDevices:', !!navigator.mediaDevices)
      console.log('getUserMedia:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia))
      console.log('Protocol:', window.location.protocol)
      console.log('Origin:', window.location.origin)
      
      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices API not available')
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not available')
      }
      
      // Check if we're on HTTPS or localhost (required for camera access in most browsers)
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('localhost')
      
      console.log('Security check:', { protocol: window.location.protocol, hostname: window.location.hostname, isSecure })
      
      if (!isSecure) {
        // Don't throw error immediately, let the browser try and give better error message
        console.warn('Accessing over HTTP from non-localhost. Camera might not work.')
      }
      
      console.log('Requesting camera permission...')
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      console.log('Camera permission granted!')
      
      // Stop the stream immediately as we just needed to check permission
      stream.getTracks().forEach(track => track.stop())
      
      setHasPermission(true)
      setIsLoading(false)
    } catch (error) {
      console.error('Camera permission error:', error)
      setHasPermission(false)
      setIsLoading(false)
      setShowPermissionDialog(false)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('HTTPS') || error.message.includes('localhost')) {
          onError("Camera access requires HTTPS. Please access this page via HTTPS or use localhost.")
        } else if (error.message.includes('not available') || error.message.includes('not supported')) {
          onError("Camera is not supported on this device or browser. Please manually enter the court ID.")
        } else {
          console.log('Error details:', error.message, error.name)
          // Check if this might be a security/protocol issue
          const isHTTP = window.location.protocol === 'http:'
          const isNetworkAccess = !['localhost', '127.0.0.1'].includes(window.location.hostname)
          
          if (isHTTP && isNetworkAccess) {
            onError(`Camera access failed. This may be because you're accessing over HTTP from another device. Try: 1) Access via http://localhost:3000 on the same computer, or 2) Use HTTPS. Error: ${error.message}`)
          } else {
            onError(`Camera error: ${error.message}. Please manually enter the court ID.`)
          }
        }
      } else if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            onError("Camera access denied. Please allow camera permissions to scan QR codes.")
            break
          case 'NotFoundError':
            onError("No camera found on this device. Please manually enter the court ID.")
            break
          case 'NotSupportedError':
            onError("Camera is not supported on this device. Please manually enter the court ID.")
            break
          case 'NotReadableError':
            onError("Camera is being used by another application. Please close other apps and try again.")
            break
          case 'OverconstrainedError':
            onError("Camera constraints not supported. Please manually enter the court ID.")
            break
          default:
            onError(`Camera error (${error.name}): ${error.message}. Please manually enter the court ID.`)
        }
      } else {
        onError("Unable to access camera. Please manually enter the court ID.")
      }
    }
  }

  const cancelPermissionRequest = () => {
    setShowPermissionDialog(false)
    setHasPermission(false)
    onError("Camera access is required to scan QR codes.")
  }

  const startScanning = async () => {
    try {
      setIsLoading(true)
      
      // Check if component is still mounted and not disabled
      if (disabled || !isMounted || hasPermission !== true) {
        return
      }
      
      console.log('Starting QR scanning...')
      
      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported')
      }
      
      // Request camera stream (we already have permission)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      console.log('Camera stream obtained')
      
      // Check again if component is still mounted and not disabled after async operation
      if (disabled || !isMounted) {
        stream.getTracks().forEach(track => track.stop())
        return
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Wait for video to load with fallback timeout
        videoRef.current.onloadedmetadata = () => {
          if (!disabled && isMounted) {
            console.log('Video metadata loaded')
            setIsLoading(false)
          }
        }
        
        // Fallback timeout in case onloadedmetadata doesn't fire
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 1 && !disabled && isMounted) {
            console.log('Video ready (fallback)')
            setIsLoading(false)
          }
        }, 2000)
      }

      // Initialize QR reader only if still enabled and mounted
      if (!disabled && isMounted) {
        readerRef.current = new BrowserMultiFormatReader()
        
        console.log('Starting QR decode...')
        
        // Start scanning
        readerRef.current.decodeFromVideoDevice(null, videoRef.current!, (result, error) => {
          if (result && !disabled && isMounted) {
            console.log('QR code detected:', result.getText())
            // Immediately stop scanning when QR code is detected
            stopScanning()
            setScanSuccess(true)
            setTimeout(() => {
              if (!disabled && isMounted) {
                onScan(result.getText())
              }
            }, 500) // Small delay to show success animation
          }
          // Only log scanning errors, don't treat "NotFoundException" as a real error
          if (error && error.name !== 'NotFoundException') {
            console.warn('QR Scanner error:', error)
          }
        })
      }
    } catch (error) {
      console.error('Camera access error:', error)
      setHasPermission(false)
      setIsLoading(false)
      if (!disabled && isMounted) {
        // Provide more specific error messages
        if (error instanceof Error && error.message.includes('not supported')) {
          onError("Camera is not supported on this device or browser. Please manually enter the court ID.")
        } else {
          onError("Camera access failed. Please try again or manually enter the court ID.")
        }
      }
    }
  }

  // Show permission request dialog
  if (showPermissionDialog) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center aspect-square bg-card rounded-lg border-2 border-border shadow-lg"
      >
        <motion.div 
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="text-center text-foreground max-w-sm px-6"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl mb-6"
          >
            📷
          </motion.div>
          <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
            To scan QR codes, we need access to your camera. Your camera will only be used for scanning and no images are stored.
          </p>
          <p className="text-muted-foreground/70 text-xs mb-6">
            If you've already granted permission, try "Retry Detection" first.
          </p>
          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={requestCameraPermission}
              disabled={isLoading}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Image 
                    src="/Spinner_white_275x275.svg" 
                    alt="Loading..." 
                    width={20} 
                    height={20} 
                  />
                  Requesting Access...
                </>
              ) : (
                "Allow Camera Access"
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                console.log('Retrying permission detection...')
                setHasPermission(null)
                checkExistingPermission()
              }}
              disabled={isLoading}
              className="bg-secondary text-secondary-foreground px-6 py-2 text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              Retry Detection
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={cancelPermissionRequest}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground px-6 py-2 text-sm transition-colors disabled:opacity-50"
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  if (hasPermission === false) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center aspect-square bg-card rounded-lg border-2 border-border shadow-lg"
      >
        <motion.div 
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="text-center text-foreground max-w-sm px-6"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-5xl mb-4"
          >
            🚫
          </motion.div>
          <h3 className="text-lg font-semibold mb-2">Camera Access Denied</h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Camera access was denied. Please enable camera permissions in your browser settings or try again.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setHasPermission(null)
              setShowPermissionDialog(true)
            }}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </motion.button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative w-full aspect-square bg-black rounded-lg overflow-hidden shadow-lg border-2 border-border"
    >
      <motion.video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full object-cover"
      />
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-card/95 backdrop-blur-sm"
          >
            <div className="text-center">
              <Image 
                src="/Spinner_white_275x275.svg" 
                alt="Loading camera..." 
                width={48} 
                height={48} 
                className="mx-auto mb-3"
              />
              <p className="text-sm text-muted-foreground">Initializing camera...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Scanner Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Background pulse effect when scanning */}
        <AnimatePresence>
          {isScanning && !isLoading && !scanSuccess && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.1, 0.8],
                opacity: [0, 0.15, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut"
              }}
              className="absolute w-64 h-64 bg-primary/30 rounded-full blur-xl"
            />
          )}
        </AnimatePresence>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative w-40 h-40 sm:w-48 sm:h-48"
        >
          {/* Corner borders - now using primary color */}
          <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-l-4 sm:border-t-[6px] sm:border-l-[6px] border-primary rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-r-4 sm:border-t-[6px] sm:border-r-[6px] border-primary rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-l-4 sm:border-b-[6px] sm:border-l-[6px] border-primary rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-r-4 sm:border-b-[6px] sm:border-r-[6px] border-primary rounded-br-lg" />
          
          {/* Enhanced Scanning Animation */}
          <AnimatePresence>
            {isScanning && !isLoading && !scanSuccess && (
              <motion.div
                className="absolute inset-x-4 h-2"
                animate={{ 
                  y: [16, 145, 16] // Adjusted for responsive sizes
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }}
              >
                <div 
                  className="w-full h-full bg-primary rounded-full"
                  style={{
                    boxShadow: '0 0 12px hsl(var(--primary)), 0 0 24px hsl(var(--primary) / 0.4)'
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Animation */}
          <AnimatePresence>
            {scanSuccess && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center shadow-lg"
                >
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </motion.svg>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Instruction Text */}
      <AnimatePresence>
        {!scanSuccess && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ delay: 1 }}
            className="absolute bottom-3 sm:bottom-4 left-0 right-0 text-center px-4"
          >
            <motion.p 
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-white text-xs sm:text-sm bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 inline-block shadow-lg"
            >
              {isScanning ? "Position QR code within the frame" : "Initializing camera..."}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}