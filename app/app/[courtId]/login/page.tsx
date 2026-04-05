"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Building2, Mail, Eye, EyeOff } from "lucide-react"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"

type AuthStep = 'email' | 'otp' | 'password' | 'onboarding'

export default function UserLogin() {
  const params = useParams()
  const router = useRouter()
  const { login, user, token } = useUnifiedAuth()
  const courtId = params.courtId as string

  // Get return URL from query parameters
  const [returnTo, setReturnTo] = useState<string>("")

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const returnUrl = urlParams.get('returnTo')
    if (returnUrl) {
      setReturnTo(returnUrl)
    }
  }, [])

  // Redirect already authenticated users
  useEffect(() => {
    console.log("🔄 Login page useEffect:", { user, token, courtId })
    if (user && token) {
      const redirectUrl = returnTo || `/app/${courtId}`
      console.log("🔄 Already authenticated, redirecting to:", redirectUrl)
      setTimeout(() => {
        router.replace(redirectUrl)
      }, 100)
    } else {
      console.log("🔄 Not authenticated, staying on login page")
    }
  }, [user, token, returnTo, courtId, router])

  // UI State
  const [currentStep, setCurrentStep] = useState<AuthStep>('email')
  const [loading, setLoading] = useState(false)
  const [courtLoading, setCourtLoading] = useState(true)
  const [error, setError] = useState("")
  const [courtError, setCourtError] = useState("")
  const [courtInfo, setCourtInfo] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  // Form Data
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailValidationTimeout, setEmailValidationTimeout] = useState<NodeJS.Timeout | null>(null)
  const [otp, setOtp] = useState("")
  const isSubmittingOTP = useRef(false) // Guard to prevent double OTP submission
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")

  // Validate court on mount
  const validateCourt = useCallback(async () => {
    try {
      setCourtLoading(true)
      const response = await fetch(`/api/courts/${courtId}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCourtInfo(data.data.court)
          setCourtError("")
        } else {
          setCourtError("Food court not found")
        }
      } else if (response.status === 404) {
        setCourtError("Food court not found")
      } else {
        setCourtError("Failed to load food court information")
      }
    } catch (error) {
      setCourtError("Failed to load food court information")
    } finally {
      setCourtLoading(false)
    }
  }, [courtId])

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      return "Email address is required"
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address"
    }
    return ""
  }

  // Handle email input change with debounced validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    
    // Clear any existing timeout
    if (emailValidationTimeout) {
      clearTimeout(emailValidationTimeout)
    }
    
    // Clear general error when user starts typing
    if (error) {
      setError("")
    }
    
    // Check if email is now valid and clear error immediately
    const validationError = validateEmail(value)
    if (!validationError) {
      setEmailError("")
    } else if (emailTouched) {
      // Only show validation error after user stops typing for 800ms
      const timeout = setTimeout(() => {
        setEmailError(validationError)
      }, 800)
      setEmailValidationTimeout(timeout)
    }
  }

  // Handle email input focus
  const handleEmailFocus = () => {
    setEmailTouched(true)
  }

  // Handle email input blur - validate immediately on blur
  const handleEmailBlur = () => {
    if (emailValidationTimeout) {
      clearTimeout(emailValidationTimeout)
    }
    const validationError = validateEmail(email)
    if (validationError && emailTouched) {
      setEmailError(validationError)
    }
  }

  useEffect(() => {
    if (courtId) {
      validateCourt()
    }
  }, [courtId, validateCourt])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailValidationTimeout) {
        clearTimeout(emailValidationTimeout)
      }
    }
  }, [emailValidationTimeout])

  const handleEmailSubmit = async (): Promise<boolean> => {
    // Validate email first
    const validationError = validateEmail(email)
    if (validationError) {
      setEmailError(validationError)
      setError(validationError)
      return false
    }

    setError("")
    setEmailError("")

    try {
      // First check if email exists in database
      const checkResponse = await fetch("/api/auth/check-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const checkData = await checkResponse.json()

      if (checkData.success) {
        const emailExists = checkData.data.email.exists
        const userType = checkData.data.email.userType

        // Store whether this is a new user or existing user
        setIsNewUser(!emailExists)

        // Now send OTP
        const otpResponse = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, courtId }),
        })

        const otpData = await otpResponse.json()

        if (otpData.success) {
          setCurrentStep('otp')
          setError("")
          // In development, show the OTP
          if (otpData.data?.otp) {
            setError(`Development OTP: ${otpData.data.otp}`)
          }
          return true
        } else {
          setError(otpData.message || "Failed to send OTP")
          return false
        }
      } else {
        setError(checkData.message || "Failed to check email availability")
        return false
      }
    } catch (error: any) {
      setError("Failed to process email")
      return false
    }
  }

  const handleOTPSubmit = async (): Promise<boolean> => {
    // Guard against double submission
    if (isSubmittingOTP.current) {
      console.log("🚫 OTP submission already in progress, ignoring...")
      return false
    }
    
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return false
    }

    setError("")
    isSubmittingOTP.current = true // Set guard

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, courtId, loginType: "otp" }),
      })

      const data = await response.json()
      console.log("🔍 OTP Response data:", data)

      if (data.success) {
        // Check if profile completion is required
        if (data.data.requiresProfileCompletion) {
          const isNewUser = data.data.isNewUser
          setIsNewUser(isNewUser)
          setNeedsOnboarding(true)
          setCurrentStep('onboarding')
          console.log("🔧 Profile completion required:", { 
            isNewUser, 
            hasPassword: data.data.user?.hasPassword,
            fullName: data.data.user?.fullName 
          })
          isSubmittingOTP.current = false // Reset guard for onboarding
        } else {
          // User has complete profile - login immediately
          console.log("✅ User with complete profile, logging in:", data.data.user)
          console.log("📝 Calling login with token:", data.data.token?.substring(0, 20) + "...")
          console.log("📝 User details:", { 
            id: data.data.user?.id, 
            email: data.data.user?.email, 
            fullName: data.data.user?.fullName,
            role: data.data.user?.role,
            courtId: data.data.user?.courtId
          })
          login(data.data.token, data.data.user)
          // Don't reset guard here - user is being redirected
        }
        return true
      } else {
        setError(data.message || "Invalid OTP")
        isSubmittingOTP.current = false // Reset guard on error
        return false
      }
    } catch (error: any) {
      setError("Login failed")
      isSubmittingOTP.current = false // Reset guard on error
      return false
    }
  }

  const handlePasswordSubmit = async (): Promise<boolean> => {
    if (!password) {
      setError("Please enter your password")
      return false
    }

    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, courtId, loginType: "password" }),
      })

      const data = await response.json()

      if (data.success) {
        // Check if user needs onboarding (no name set)
        if (!data.data.user.name) {
          setIsNewUser(false)
          setNeedsOnboarding(true)
          setCurrentStep('onboarding')
        } else {
          login(data.data.token, data.data.user)
        }
        return true
      } else {
        setError(data.message || "Invalid password")
        return false
      }
    } catch (error: any) {
      setError("Login failed")
      return false
    }
  }

  const handleOnboardingSubmit = async (): Promise<boolean> => {
    if (!name.trim()) {
      setError("Please enter your name")
      return false
    }

    // Password is always required for onboarding since API requires it
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    setError("")

    try {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          fullName: name.trim(), 
          password: password,
          courtId 
        }),
      })

      const data = await response.json()

      if (data.success) {
        login(data.data.token, data.data.user)
        return true
      } else {
        setError(data.message || "Failed to complete profile")
        return false
      }
    } catch (error: any) {
      setError("Failed to complete profile")
      return false
    }
  }

  const goBack = () => {
    if (currentStep === 'otp') {
      setCurrentStep('email')
      setOtp("")
      setError("")
    } else if (currentStep === 'password') {
      setCurrentStep('otp')
      setPassword("")
      setError("")
    } else if (currentStep === 'onboarding') {
      setCurrentStep('otp')
      setName("")
      setPassword("")
      setConfirmPassword("")
      setError("")
    } else {
      router.push(`/app/login`)
    }
  }

  const switchToPasswordLogin = () => {
    setCurrentStep('password')
    setError("")
  }

  const switchToOTPLogin = () => {
    setCurrentStep('otp')
    setPassword("")
    setError("")
  }

  // Show loading while validating court
  if (courtLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center p-4">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <span className="text-lg text-white">Loading food court...</span>
        </div>
      </div>
    )
  }

  // Show loading while checking authentication
  if (user && token) {
    return (
      <div className="h-full bg-background flex items-center justify-center p-4">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <span className="text-lg text-white">Already logged in, redirecting...</span>
        </div>
      </div>
    )
  }

  // Show error if court not found
  if (courtError) {
    return (
      <div className="h-full bg-background flex items-center justify-center p-4">
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
    <div className="h-full bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button variant="ghost" onClick={goBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 'email' ? 'Choose Different Court' : 'Back'}
          </Button>
          
          {/* Court Info Display */}
          {courtInfo && (
            <div className="p-4 bg-muted rounded-lg border mb-4">
              <div className="flex items-center gap-3">
                {courtInfo.logoUrl || courtInfo.imageUrl ? (
                  <img
                    src={courtInfo.logoUrl || courtInfo.imageUrl}
                    alt={courtInfo.instituteName || courtInfo.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{courtInfo.instituteName || courtInfo.name}</h3>
                  <p className="text-sm text-muted-foreground">{courtInfo.address || courtInfo.location || 'No location provided'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>
              {currentStep === 'email' && 'Welcome'}
              {currentStep === 'otp' && 'Verify your email'}
              {currentStep === 'password' && 'Enter your password'}
              {currentStep === 'onboarding' && (isNewUser ? 'Complete your profile' : 'Set up your account')}
            </CardTitle>
            <CardDescription>
              {currentStep === 'email' && 'Enter your email address to continue'}
              {currentStep === 'otp' && `We sent a code to ${email}`}
              {currentStep === 'password' && 'Welcome back! Please enter your password'}
              {currentStep === 'onboarding' && (isNewUser ? "We need a few more details to get you started" : "Please complete your account setup")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Email Step */}
            {currentStep === 'email' && (
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={handleEmailChange}
                      onFocus={handleEmailFocus}
                      onBlur={handleEmailBlur}
                      className={emailError ? "border-red-500 focus:border-red-500" : ""}
                      aria-invalid={emailError ? "true" : "false"}
                      aria-describedby={emailError ? "email-error" : undefined}
                    />
                    {emailError && (
                      <p id="email-error" className="text-sm text-red-500 mt-1">
                        {emailError}
                      </p>
                    )}
                  </div>
                  <AnimatedButton 
                    className="w-full" 
                    disabled={!!emailError}
                    onAsyncClick={handleEmailSubmit}
                  >
                    Continue
                  </AnimatedButton>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {}}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {}}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M23.5 12.1c0-1.1-.1-2.1-.2-3.1H12v5.9h6.4c-.3 1.5-1.1 2.8-2.4 3.7v3.1h3.9c2.3-2.1 3.6-5.2 3.6-9.6z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3.1c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.5v3.2C3.4 21.4 7.4 24 12 24z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.4 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V6.6H1.5C.5 8.6 0 10.2 0 12s.5 3.4 1.5 5.4l3.9-3.2z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 4.8c1.7 0 3.3.6 4.5 1.8L20.4 2C18.2.8 15.2 0 12 0 7.4 0 3.4 2.6 1.5 6.6l3.9 3.2C6.3 6.9 8.9 4.8 12 4.8z"
                      />
                    </svg>
                    Continue with Microsoft
                  </Button>
                </div>
              </div>
            )}

            {/* OTP Step */}
            {currentStep === 'otp' && (
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Verification Code</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                        onComplete={(val) => { 
                          setOtp(val)
                          // Auto-submit on complete
                          console.log("🔢 OTP complete, auto-submitting...")
                          handleOTPSubmit() 
                        }}
                        aria-label="Enter the 6-digit verification code"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  <AnimatedButton 
                    className="w-full"
                    onAsyncClick={handleOTPSubmit}
                    disabled={otp.length !== 6}
                  >
                    Verify Code
                  </AnimatedButton>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={switchToPasswordLogin}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Already a customer? Login with Password instead
                  </button>
                </div>
              </div>
            )}

            {/* Password Step */}
            {currentStep === 'password' && (
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <AnimatedButton 
                    className="w-full"
                    onAsyncClick={handlePasswordSubmit}
                  >
                    Login
                  </AnimatedButton>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={switchToOTPLogin}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Login with OTP instead
                  </button>
                </div>
              </div>
            )}

            {/* Onboarding Step */}
            {currentStep === 'onboarding' && (
              <div className="space-y-4">
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-100 p-2 text-xs rounded">
                    Debug: isNewUser={isNewUser.toString()}, needsOnboarding={needsOnboarding.toString()}
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">What do we call you?</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  {/* Always show password fields during onboarding since API requires them */}
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Create Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password (min. 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <AnimatedButton 
                    className="w-full"
                    onAsyncClick={handleOnboardingSubmit}
                  >
                    {isNewUser ? 'Create Account' : 'Complete Setup'}
                  </AnimatedButton>
                </div>
              </div>
            )}

            {error && (
              <Alert className="mt-4" variant={error.includes("Development OTP") ? "default" : "destructive"}>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}