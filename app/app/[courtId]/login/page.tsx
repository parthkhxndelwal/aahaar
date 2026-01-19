"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Phone, Mail, ArrowLeft, Building2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"

export default function UserLogin() {
  const params = useParams()
  const router = useRouter()
  const { login } = useAuth()
  const courtId = params.courtId as string

  const [loading, setLoading] = useState(false)
  const [courtLoading, setCourtLoading] = useState(true)
  const [error, setError] = useState("")
  const [courtError, setCourtError] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [activeTab, setActiveTab] = useState("phone")
  const [courtInfo, setCourtInfo] = useState<any>(null)

  // Phone/OTP Login State
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")

  // Email Login State
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Validate court on mount
  useEffect(() => {
    if (courtId) {
      validateCourt()
    }
  }, [courtId])

  const validateCourt = async () => {
    try {
      setCourtLoading(true)
      console.log("🏢 Validating court:", courtId)
      
      const response = await fetch(`/api/courts/${courtId}`)
      
      console.log("📡 Court API response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("📥 Court API response data:", data)
        
        if (data.success) {
          setCourtInfo(data.data.court)
          setCourtError("")
          console.log("✅ Court info set:", data.data.court)
        } else {
          setCourtError("Food court not found")
          console.log("❌ Court not found in response")
        }
      } else if (response.status === 404) {
        setCourtError("Food court not found")
        console.log("❌ Court not found (404)")
      } else {
        setCourtError("Failed to load food court information")
        console.log("❌ Failed to load court info, status:", response.status)
      }
    } catch (error) {
      console.error("❌ Error validating court:", error)
      setCourtError("Failed to load food court information")
    } finally {
      setCourtLoading(false)
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("🚀 Sending OTP to:", phone, "for court:", courtId)
      
      const response = await api.sendOTP(phone, courtId)

      console.log("📥 Send OTP response:", response)

      if (response.success) {
        setOtpSent(true)
        setError("")
        // In development, show the OTP
        if (response.data?.otp) {
          setError(`Development OTP: ${response.data.otp}`)
        }
      } else {
        setError(response.message || "Failed to send OTP")
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("🚀 Verifying OTP for:", phone, "courtId:", courtId)
      
      const response = await api.loginWithOTP(phone, otp, courtId)

      console.log("📥 OTP Login response:", response)

      if (response.success) {
        login(response.data.token, response.data.user)
        router.push(`/app/${courtId}`)
      } else {
        setError(response.message || "Invalid OTP")
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("🚀 Email login for:", email, "courtId:", courtId)
      
      const response = await api.loginWithEmail(email, password, courtId)

      console.log("📥 Email Login response:", response)

      if (response.success) {
        login(response.data.token, response.data.user)
        router.push(`/app/${courtId}`)
      } else {
        setError(response.message || "Invalid credentials")
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    router.push(`/app/login`)
  }

  // Show loading while validating court
  if (courtLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <span className="text-lg text-white">Loading food court...</span>
        </div>
      </div>
    )
  }

  // Show error if court not found
  if (courtError) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-red-600">Food Court Not Found</CardTitle>
              <CardDescription>{courtError}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                The food court ID "{courtId}" could not be found or is no longer active.
              </p>
              <Button onClick={() => router.push('/app/login')} className="w-full">
                Choose Different Food Court
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button variant="ghost" onClick={goBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Choose Different Court
          </Button>
          
          {/* Court Info Display */}
          {courtInfo && (
            <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 mb-4">
              <div className="flex items-center gap-3">
                {courtInfo.logoUrl || courtInfo.imageUrl ? (
                  <img
                    src={courtInfo.logoUrl || courtInfo.imageUrl}
                    alt={courtInfo.instituteName || courtInfo.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-white">{courtInfo.instituteName || courtInfo.name}</h3>
                  <p className="text-sm text-neutral-400">{courtInfo.address || courtInfo.location || 'No location provided'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to place your order</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phone">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="phone" className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={10}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send OTP
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleOTPLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                      />
                      <p className="text-sm text-gray-600">OTP sent to {phone}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="button" variant="outline" onClick={() => setOtpSent(false)} className="flex-1">
                        Change Number
                      </Button>
                      <Button type="submit" className="flex-1" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify OTP
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert className="mt-4" variant={error.includes("Development OTP") ? "default" : "destructive"}>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>New user? You'll be automatically registered after OTP verification.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
