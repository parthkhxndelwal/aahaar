"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { ArrowLeft, QrCode, CheckCircle, XCircle, AlertTriangle, RefreshCw, Keyboard } from "lucide-react"
import QRScanner from "@/components/ui/qr-scanner"
import Image from "next/image"
import { courtApi } from "@/lib/api"

type ValidationState = 'idle' | 'validating' | 'success' | 'error'

interface ValidationCache {
  [courtId: string]: {
    result: boolean
    timestamp: number
    promise?: Promise<boolean>
  }
}

export default function CourtQRScanPage() {
  const router = useRouter()
  const mountedRef = useRef(true)
  const validationCacheRef = useRef<ValidationCache>({})
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const [scanningEnabled, setScanningEnabled] = useState(false) // Start with false to ensure proper initialization
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState<string>("")
  const [scannerKey, setScannerKey] = useState(0)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualCourtId, setManualCourtId] = useState("")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [pendingMode, setPendingMode] = useState<boolean | null>(null)

  // Initialize scanning after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mountedRef.current && validationState === 'idle') {
        setScanningEnabled(true)
      }
    }, 200) // Small delay to ensure proper initialization
    
    return () => clearTimeout(timer)
  }, [])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setScanningEnabled(false)
  }, [])

  // Handle component unmount and navigation
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      cleanup()
    }
  }, [cleanup])

  // Handle browser tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setScanningEnabled(false)
      } else if (mountedRef.current && validationState === 'idle' && !error) {
        setScanningEnabled(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [validationState, error])

  // Handle browser navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanup()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [cleanup])

  // Validate court ID with caching and deduplication
  const validateCourtId = useCallback(async (courtId: string): Promise<boolean> => {
    const now = Date.now()
    const cached = validationCacheRef.current[courtId]
    
    // Return cached result if it's less than 5 minutes old
    if (cached && (now - cached.timestamp) < 5 * 60 * 1000) {
      return cached.result
    }
    
    // Return existing promise if validation is in progress
    if (cached?.promise) {
      return cached.promise
    }

    // Create new validation promise
    const validationPromise = new Promise<boolean>(async (resolve) => {
      try {
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        
        abortControllerRef.current = new AbortController()
        
        const data = await courtApi.getById(courtId)
        const isValid = !!(data?.court)
        
        // Cache the result
        validationCacheRef.current[courtId] = {
          result: isValid,
          timestamp: now,
        }
        
        resolve(isValid)
      } catch (error: any) {
        if (error.name === 'AbortError') {
          resolve(false)
        } else {
          console.error('Court validation error:', error)
          resolve(false)
        }
      } finally {
        // Clear the promise from cache
        if (validationCacheRef.current[courtId]) {
          delete validationCacheRef.current[courtId].promise
        }
        abortControllerRef.current = null
      }
    })

    // Store promise in cache to prevent duplicate requests
    validationCacheRef.current[courtId] = {
      result: false,
      timestamp: now,
      promise: validationPromise
    }

    return validationPromise
  }, [])

  // Extract court ID from QR code
  const extractCourtIdFromQR = useCallback((qrText: string): string | null => {
    try {
      let courtId: string | null = null
      
      // Handle URL format: domain.com/court?courtID=ABC123
      const urlMatch = qrText.match(/courtID=([^&\s]+)/)
      if (urlMatch) {
        courtId = urlMatch[1].trim()
      }
      
      // Handle JSON format: {"courtID": "ABC123"}
      if (!courtId) {
        try {
          const parsed = JSON.parse(qrText)
          if (parsed.courtID) {
            courtId = parsed.courtID.trim()
          }
        } catch (e) {
          // Not JSON, continue
        }
      }
      
      // Handle plain text (if it looks like a court ID)
      if (!courtId) {
        const trimmed = qrText.trim()
        if (trimmed && !trimmed.includes(' ') && !trimmed.startsWith('http') && trimmed.length >= 3) {
          courtId = trimmed
        }
      }
      
      // Sanitize the court ID: convert to lowercase and remove invalid characters
      if (courtId) {
        courtId = courtId.toLowerCase().replace(/[^a-z0-9-]/g, '')
        return courtId.length >= 3 ? courtId : null
      }
      
      return null
    } catch (error) {
      return null
    }
  }, [])

  // Handle successful QR scan
  const handleQRScan = useCallback(async (qrText: string) => {
    if (!mountedRef.current) return
    
    // Immediately disable scanning
    setScanningEnabled(false)
    
    const courtId = extractCourtIdFromQR(qrText)
    
    if (!courtId) {
      setError("Invalid QR code format. Please scan a valid court QR code.")
      setValidationState('error')
      
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setError("")
          setValidationState('idle')
          setScanningEnabled(true)
        }
      }, 4000)
      return
    }
    
    setScanResult(courtId)
    setValidationState('validating')
    setError("")
    
    try {
      const isValid = await validateCourtId(courtId)
      
      if (!mountedRef.current) return
      
      if (isValid) {
        setValidationState('success')
        
        // Brief success display before navigation
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            cleanup()
            router.push(`/app/${courtId}/auth`)
          }
        }, 1200)
      } else {
        setValidationState('error')
        setError(`Court "${courtId}" not found. Please scan a valid QR code.`)
        setScanResult(null)
        
        // Auto retry after error
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setError("")
            setValidationState('idle')
            setScanningEnabled(true)
          }
        }, 4000)
      }
    } catch (error) {
      if (mountedRef.current) {
        setValidationState('error')
        setError("Network error. Please check your connection and try again.")
        setScanResult(null)
        
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setError("")
            setValidationState('idle')
            setScanningEnabled(true)
          }
        }, 4000)
      }
    }
  }, [extractCourtIdFromQR, validateCourtId, router, cleanup])

  // Handle scanner errors
  const handleScanError = useCallback((errorMessage: string) => {
    if (!mountedRef.current) return
    
    setScanningEnabled(false)
    setValidationState('error')
    setError(errorMessage)
    setScanResult(null)
    
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setError("")
        setValidationState('idle')
        setScannerKey(prev => prev + 1) // Force scanner remount
        setScanningEnabled(true)
      }
    }, 3000)
  }, [])

  // Manual retry
  const handleRetry = useCallback(() => {
    cleanup()
    setError("")
    setScanResult(null)
    setValidationState('idle')
    setScannerKey(prev => prev + 1) // Force scanner remount
    setScanningEnabled(true)
  }, [cleanup])

  // Navigate back
  const handleBack = useCallback(() => {
    cleanup()
    router.push("/app/auth")
  }, [router, cleanup])

  // Handle manual court ID submission
  const handleManualSubmit = useCallback(async () => {
    const courtId = manualCourtId.trim()
    
    if (!courtId) {
      setError("Please enter a court ID")
      return
    }

    if (courtId.length < 3) {
      setError("Court ID must be at least 3 characters long")
      return
    }

    setScanResult(courtId)
    setValidationState('validating')
    setError("")
    setShowManualInput(false)

    try {
      const isValid = await validateCourtId(courtId)
      
      if (!mountedRef.current) return
      
      if (isValid) {
        setValidationState('success')
        
        // Brief success display before navigation
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            cleanup()
            router.push(`/app/${courtId}/auth`)
          }
        }, 1200)
      } else {
        setValidationState('error')
        setError(`Court "${courtId}" not found. Please check the court ID and try again.`)
        setScanResult(null)
        setShowManualInput(true) // Show manual input again
        
        // Auto retry after error
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setError("")
            setValidationState('idle')
          }
        }, 4000)
      }
    } catch (error) {
      if (mountedRef.current) {
        setValidationState('error')
        setError("Network error. Please check your connection and try again.")
        setScanResult(null)
        setShowManualInput(true) // Show manual input again
        
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setError("")
            setValidationState('idle')
          }
        }, 4000)
      }
    }
  }, [manualCourtId, validateCourtId, router, cleanup])

  // Toggle manual input mode
  const toggleManualInput = useCallback(() => {
    if (isTransitioning) return // Prevent multiple clicks during transition
    
    const newMode = !showManualInput
    setPendingMode(newMode)
    setIsTransitioning(true)
    setError("")
    setManualCourtId("")
    
    // Wait for fade out to complete, then switch content
    setTimeout(() => {
      setShowManualInput(newMode)
      
      if (newMode) {
        // Switching to manual input - disable scanner
        setScanningEnabled(false)
      } else {
        // Switching back to scanner - enable it
        if (validationState === 'idle') {
          setScanningEnabled(true)
        }
      }
      
      // Wait a bit more for content to render, then fade in
      setTimeout(() => {
        setIsTransitioning(false)
        setPendingMode(null)
      }, 50) // Small delay to ensure DOM update
    }, 300) // Full fade out duration
  }, [showManualInput, validationState, isTransitioning])

  // Get status display info
  const getStatusInfo = () => {
    switch (validationState) {
      case 'validating':
        return {
          icon: <Image src="/Spinner_white_275x275.svg" alt="Loading" width={20} height={20} />,
          text: "Validating court ID...",
          className: "text-muted-foreground"
        }
      case 'success':
        return {
          icon: <CheckCircle className="h-5 w-5 text-primary" />,
          text: `Success! Court ID: ${scanResult}`,
          className: "text-primary"
        }
      case 'error':
        return {
          icon: <XCircle className="h-5 w-5 text-destructive" />,
          text: null,
          className: "text-destructive"
        }
      default:
        return null
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between border-b border-border bg-card">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        {error && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </header>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 max-w-2xl mx-auto w-full transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full mb-3 sm:mb-4 border-2 border-primary/20">
            {showManualInput ? (
              <Keyboard className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            ) : (
              <QrCode className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-foreground">
            {showManualInput ? "Enter Court ID" : "Scan QR Code"}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md mx-auto">
            {showManualInput
              ? "Type the court ID from your table or receipt"
              : "Point your camera at the QR code on your table to get started"
            }
          </p>
        </div>

        {/* QR Scanner Container */}
        <div className="w-full max-w-sm mb-6">
          {showManualInput ? (
            /* Manual Input Form */
            <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-card rounded-lg border border-border shadow-sm">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="courtId" className="text-sm font-medium text-foreground">
                    Court ID
                  </label>
                  <Input
                    id="courtId"
                    placeholder="e.g., food-court-a1"
                    value={manualCourtId}
                    onChange={(e) => {
                      // Convert to lowercase and only allow lowercase letters, numbers, and hyphens
                      const sanitizedValue = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '')
                      setManualCourtId(sanitizedValue)
                    }}
                    className="bg-background text-lg font-mono tracking-wider"
                    disabled={validationState === 'validating'}
                    autoComplete="off"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !validationState && manualCourtId.trim()) {
                        handleManualSubmit()
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Find this on your table placard, receipt, or menu
                  </p>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleManualSubmit}
                    disabled={validationState === 'validating' || !manualCourtId.trim() || manualCourtId.trim().length < 3}
                    className="flex-1 font-semibold h-11 sm:h-12"
                  >
                    {validationState === 'validating' ? (
                      <>
                        <Image src="/Spinner_white_275x275.svg" alt="Loading" width={16} height={16} className="mr-2" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Continue
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={toggleManualInput}
                    variant="outline"
                    disabled={validationState === 'validating'}
                    className="px-4 h-11 sm:h-12"
                    title="Switch to QR Scanner"
                  >
                    <QrCode className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Help Section */}
              <div className="border-t border-border pt-4">
                <details className="group">
                  <summary className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <AlertTriangle className="h-4 w-4 group-open:rotate-180 transition-transform" />
                    <span>Need help finding your Court ID?</span>
                  </summary>
                  <div className="mt-3 space-y-2 text-xs text-muted-foreground pl-2 border-l-2 border-border">
                    <p>• Check the table placard or tent card</p>
                    <p>• Look on your receipt or order slip</p>
                    <p>• Ask a staff member for assistance</p>
                    <p>• Usually format: COURT-NAME-123</p>
                  </div>
                </details>
              </div>
            </div>
          ) : (
            /* QR Scanner */
            <div className="relative">
              {/* Scanner Component */}
              <QRScanner
                key={scannerKey}
                onScan={handleQRScan}
                onError={handleScanError}
                isScanning={scanningEnabled && validationState === 'idle'}
                disabled={validationState !== 'idle'}
              />
              
              {/* Success Overlay */}
              {validationState === 'success' && (
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm rounded-lg flex items-center justify-center border-2 border-primary">
                  <div className="bg-primary rounded-full p-4 shadow-lg">
                    <CheckCircle className="h-12 w-12 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              {/* Validation Overlay */}
              {validationState === 'validating' && (
                <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm rounded-lg flex items-center justify-center border-2 border-border">
                  <div className="bg-card rounded-full p-4 shadow-lg">
                    <Image src="/Spinner_white_275x275.svg" alt="Loading" width={48} height={48} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Display */}
        {statusInfo && (
          <div className={`flex items-center gap-3 mb-6 ${statusInfo.className}`}>
            {statusInfo.icon}
            {statusInfo.text && (
              <span className="font-medium text-sm sm:text-base">{statusInfo.text}</span>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 w-full max-w-sm border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive font-medium text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3">
          {error && validationState === 'error' && (
            <Button
              onClick={handleRetry}
              className="w-full font-semibold h-11 sm:h-12"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {validationState === 'idle' && !scanningEnabled && !error && !showManualInput && (
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full font-semibold h-11 sm:h-12"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR Code
            </Button>
          )}
          
          {/* Toggle between QR scanner and manual input */}
          {validationState === 'idle' && !error && (
            <Button
              onClick={toggleManualInput}
              variant="outline"
              disabled={isTransitioning}
              className="w-full font-semibold h-11 sm:h-12"
            >
              {showManualInput ? (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan QR Code Instead
                </>
              ) : (
                <>
                  <Keyboard className="h-4 w-4 mr-2" />
                  Enter Court ID Manually
                </>
              )}
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center mt-6 sm:mt-8 space-y-2">
          <p className="text-muted-foreground text-xs sm:text-sm">
            {showManualInput
              ? "Enter the court ID from your table or receipt"
              : "Make sure the QR code is clearly visible and well-lit"
            }
          </p>
          {validationState === 'idle' && scanningEnabled && !showManualInput && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Camera active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}