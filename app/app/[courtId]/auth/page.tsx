"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Building2, MapPin } from "lucide-react"
import Image from "next/image"
import { courtApi, apiClient } from "@/lib/api"

interface Court {
  courtId: string
  instituteName: string
  address?: string
  logoUrl?: string
}

export default function CourtAuthPage() {
  const router = useRouter()
  const params = useParams()
  const courtId = params.courtId as string

  const [court, setCourt] = useState<Court | null>(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  
  // Form states
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [showOtpField, setShowOtpField] = useState(false)
  const [name, setName] = useState("")

  useEffect(() => {
    if (courtId) {
      fetchCourtDetails()
    }
  }, [courtId])

  const fetchCourtDetails = async () => {
    try {
      const data = await courtApi.getById(courtId)
      
      if (data?.court) {
        setCourt(data.court as any)
      } else {
        setError("Court not found")
      }
    } catch (error) {
      setError("Failed to load court details")
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return

    setAuthLoading(true)
    setError("")

    try {
      const data = await apiClient.post('/auth/send-otp', {
        phone,
        courtId,
        type: isLogin ? 'login' : 'signup',
        name: !isLogin ? name : undefined
      }, { skipAuth: true })

      if (data) {
        setShowOtpField(true)
      } else {
        setError('Failed to send OTP')
      }
    } catch (error: any) {
      setError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) return

    setAuthLoading(true)
    setError("")

    try {
      const data = await apiClient.post<{ success: boolean; token: string; user: any; message?: string }>('/auth/verify-otp', {
        phone,
        otp,
        courtId,
        type: isLogin ? 'login' : 'signup',
        name: !isLogin ? name : undefined
      }, { skipAuth: true })

      if (data.success) {
        // Store auth token and redirect
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push(`/app/${courtId}`)
      } else {
        setError(data.message || 'Invalid OTP')
      }
    } catch (error: any) {
      setError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const resetForm = () => {
    setPhone("")
    setOtp("")
    setName("")
    setShowOtpField(false)
    setError("")
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-background">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading court details...</p>
        </div>
      </div>
    )
  }

  if (error && !court) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-muted border-border text-foreground">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription className="text-muted-foreground">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/app/auth')}
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to QR Scanner
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/app/auth')}
          className="text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Scan Different QR
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-card border-border text-foreground">
          <CardHeader className="text-center space-y-4">
            {/* Court Logo */}
            {court?.logoUrl ? (
              <div className="mx-auto w-16 h-16 rounded-full overflow-hidden bg-muted">
                <Image
                  src={court.logoUrl}
                  alt={court.instituteName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="mx-auto w-16 h-16 rounded-full bg-foreground flex items-center justify-center">
                <Building2 className="h-8 w-8 text-foreground" />
              </div>
            )}

            <div>
              <CardTitle className="text-xl">{court?.instituteName}</CardTitle>
              {court?.address && (
                <CardDescription className="text-muted-foreground flex items-center justify-center gap-1 mt-2">
                  <MapPin className="h-3 w-3" />
                  {court.address}
                </CardDescription>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Auth Mode Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isLogin ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  !isLogin ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="bg-destructive/10 border-destructive">
                <AlertDescription className="text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Auth Form */}
            <form onSubmit={showOtpField ? handleVerifyOTP : handleSendOTP} className="space-y-4">
              {/* Name Field (Signup only) */}
              {!isLogin && !showOtpField && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              )}

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={showOtpField}
                  required
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                />
              </div>

              {/* OTP Field */}
              {showOtpField && (
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-center text-lg tracking-wider"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    OTP sent to {phone}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={authLoading || (!isLogin && !showOtpField && !name.trim()) || !phone.trim() || (showOtpField && !otp.trim())}
                className="w-full bg-foreground hover:bg-foreground/90 text-background disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {showOtpField ? 'Verifying...' : 'Sending OTP...'}
                  </>
                ) : showOtpField ? (
                  'Verify & Continue'
                ) : (
                  `Send OTP to ${isLogin ? 'Sign In' : 'Sign Up'}`
                )}
              </Button>

              {/* Reset/Change Phone */}
              {showOtpField && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetForm}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Change Phone Number
                </Button>
              )}
            </form>

            {/* Auth Mode Switch */}
            <div className="text-center">
              <button
                onClick={toggleAuthMode}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
