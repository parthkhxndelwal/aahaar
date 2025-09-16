"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FloatingInput } from "@/components/ui/floating-input"
import { FloatingSelect } from "@/components/ui/floating-select"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

export default function AdminAuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [registerError, setRegisterError] = useState("")
  const [registerSuccess, setRegisterSuccess] = useState("")
  const [showLoginError, setShowLoginError] = useState(false)
  const [showRegisterError, setShowRegisterError] = useState(false)
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })
  const [loginValidationErrors, setLoginValidationErrors] = useState({
    email: ""
  })
  const { toast } = useToast()
  const { login, user, token, isAuthenticated } = useAdminAuth()
  const router = useRouter()

  // Check if user is already logged in and redirect appropriately
  useEffect(() => {
    if (isAuthenticated && user && token) {
      // User is logged in, check if they have courts
      const checkCourtsAndRedirect = async () => {
        try {
          const courtsResponse = await fetch("/api/admin/courts", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          })

          if (courtsResponse.ok) {
            const courtsData = await courtsResponse.json()
            
            if (courtsData.success && courtsData.data.length > 0) {
              // Has courts, redirect to dashboard
              router.push(`/admin/${courtsData.data[0].courtId}`)
            } else {
              // No courts, redirect to onboarding
              router.push("/admin/onboarding")
            }
          } else {
            // Error fetching courts, redirect to onboarding to be safe
            router.push("/admin/onboarding")
          }
        } catch (error) {
          console.error("Error checking courts:", error)
          // On error, redirect to onboarding
          router.push("/admin/onboarding")
        }
      }

      checkCourtsAndRedirect()
    }
  }, [isAuthenticated, user, token, router])

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return "Email is required"
    if (!emailRegex.test(email)) return "Please enter a valid email address"
    return ""
  }

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[+]?[\d\s-()]{10,}$/
    if (!phone) return "Phone number is required"
    if (!phoneRegex.test(phone)) return "Please enter a valid phone number"
    return ""
  }

  // Check email availability
  const checkEmailAvailability = async (email: string) => {
    if (!email || validateEmail(email)) return
    
    try {
      const response = await fetch("/api/auth/check-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.email && !data.data.email.available) {
          setValidationErrors(prev => ({ ...prev, email: data.data.email.message }))
        } else {
          setValidationErrors(prev => ({ ...prev, email: "" }))
        }
      }
    } catch (error) {
      console.error("Error checking email availability:", error)
    }
  }

  // Check phone availability
  const checkPhoneAvailability = async (phone: string) => {
    if (!phone || validatePhone(phone)) return
    
    try {
      const response = await fetch("/api/auth/check-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.phone && !data.data.phone.available) {
          setValidationErrors(prev => ({ ...prev, phone: data.data.phone.message }))
        } else {
          setValidationErrors(prev => ({ ...prev, phone: "" }))
        }
      }
    } catch (error) {
      console.error("Error checking phone availability:", error)
    }
  }

  const validatePassword = (password: string) => {
    if (!password) return "Password is required"
    if (password.length < 8) return "Password must be at least 8 characters long"
    if (!/(?=.*[a-z])/.test(password)) return "Password must contain at least one lowercase letter"
    if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter"
    if (!/(?=.*\d)/.test(password)) return "Password must contain at least one number"
    return ""
  }

  const validateCourtId = (courtId: string) => {
    const courtIdRegex = /^[a-z0-9-]+$/
    if (!courtId) return "Court ID is required"
    if (courtId.length < 3) return "Court ID must be at least 3 characters long"
    if (!courtIdRegex.test(courtId)) return "Court ID can only contain lowercase letters, numbers, and hyphens"
    return ""
  }

  const validateField = (field: string, value: string) => {
    let error = ""
    switch (field) {
      case "fullName":
        error = !value ? "Full name is required" : value.length < 2 ? "Name must be at least 2 characters long" : ""
        break
      case "email":
        error = validateEmail(value)
        // If format is valid, check availability
        if (!error && value) {
          setTimeout(() => checkEmailAvailability(value), 500) // Debounced availability check
        }
        break
      case "phone":
        error = validatePhone(value)
        // If format is valid, check availability
        if (!error && value) {
          setTimeout(() => checkPhoneAvailability(value), 500) // Debounced availability check
        }
        break
      case "password":
        error = validatePassword(value)
        break
      case "confirmPassword":
        error = !value ? "Please confirm your password" : value !== registerData.password ? "Passwords do not match" : ""
        break
    }
    
    setValidationErrors(prev => ({ ...prev, [field]: error }))
    return error === ""
  }

  const validateLoginField = (field: string, value: string) => {
    let error = ""
    switch (field) {
      case "email":
        error = validateEmail(value)
        break
    }
    
    setLoginValidationErrors(prev => ({ ...prev, [field]: error }))
    return error === ""
  }

  const handleLoginDataChange = (field: string, value: string) => {
    setLoginData((prev) => ({ ...prev, [field]: value }))
    // Real-time validation
    setTimeout(() => validateLoginField(field, value), 300) // Debounce validation
  }

  // Two-stage error handling functions
  const showLoginErrorWithAnimation = (message: string) => {
    // If there's already an error, hide it first
    if (loginError) {
      hideLoginErrorWithAnimation()
      setTimeout(() => {
        setLoginError(message)
        setTimeout(() => {
          setShowLoginError(true)
        }, 150)
      }, 600) // Wait for hide animation to complete
    } else {
      setLoginError(message)
      setTimeout(() => {
        setShowLoginError(true)
      }, 150)
    }
  }

  const hideLoginErrorWithAnimation = () => {
    setShowLoginError(false) // First hide content
    setTimeout(() => {
      setLoginError("") // Then collapse space
    }, 300)
  }

  const showRegisterErrorWithAnimation = (message: string) => {
    // If there's already an error, hide it first
    if (registerError) {
      hideRegisterErrorWithAnimation()
      setTimeout(() => {
        setRegisterError(message)
        setTimeout(() => {
          setShowRegisterError(true)
        }, 150)
      }, 600) // Wait for hide animation to complete
    } else {
      setRegisterError(message)
      setTimeout(() => {
        setShowRegisterError(true)
      }, 150)
    }
  }

  const hideRegisterErrorWithAnimation = () => {
    setShowRegisterError(false) // First hide content
    setTimeout(() => {
      setRegisterError("") // Then collapse space
    }, 300)
  }

  const showRegisterSuccessWithAnimation = (message: string) => {
    // If there's already a success message, hide it first
    if (registerSuccess) {
      hideRegisterSuccessWithAnimation()
      setTimeout(() => {
        setRegisterSuccess(message)
        setTimeout(() => {
          setShowRegisterSuccess(true)
        }, 150)
      }, 600) // Wait for hide animation to complete
    } else {
      setRegisterSuccess(message)
      setTimeout(() => {
        setShowRegisterSuccess(true)
      }, 150)
    }
  }

  const hideRegisterSuccessWithAnimation = () => {
    setShowRegisterSuccess(false) // First hide content
    setTimeout(() => {
      setRegisterSuccess("") // Then collapse space
    }, 300)
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate login fields
    const emailValid = validateLoginField("email", loginData.email)
    
    if (!emailValid || !loginData.password) {
      showLoginErrorWithAnimation("Please enter valid email and password")
      return false
    }

    setLoading(true)
    try {
      console.log("🔐 Attempting login with:", { email: loginData.email })
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      console.log("📡 Login response status:", response.status)
      
      const data = await response.json()
      console.log("📦 Login response data:", data)
      
      if (data.success) {
        console.log("✅ Login successful, processing...")
        const { token, user } = data.data
        console.log("🎫 Token received:", !!token)
        console.log("👤 User received:", user)
        
        login(token, user)
        
        console.log("👤 User logged in via context")
        
        // Check if admin has courts
        const courtsResponse = await fetch("/api/admin/courts", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })

        console.log("🏢 Courts response status:", courtsResponse.status)

        if (courtsResponse.ok) {
          const courtsData = await courtsResponse.json()
          console.log("🏢 Courts data:", courtsData)
          
          if (courtsData.success && courtsData.data.length > 0) {
            // Redirect to the first court's dashboard
            console.log("➡️ Redirecting to court dashboard:", courtsData.data[0].courtId)
            router.push(`/admin/${courtsData.data[0].courtId}`)
          } else {
            // No courts, redirect to onboarding
            console.log("➡️ Redirecting to onboarding")
            router.push("/admin/onboarding")
          }
        } else {
          // Fallback to general dashboard
          console.log("➡️ Redirecting to general dashboard")
          router.push("/admin/dashboard")
        }
        
        toast({
          title: "Success",
          description: "Logged in successfully!",
        })
        
        return true
      } else {
        console.log("❌ Login failed:", data)
        showLoginErrorWithAnimation(data.message || "Invalid credentials. Please check your email and password.")
        return false
      }
    } catch (error: any) {
      console.error("🚨 Login error:", error)
      showLoginErrorWithAnimation("An error occurred during login. Please try again.")
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleLoginClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    return await handleLoginSubmit(e as any)
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🔄 Registration form submitted")

    // Validate all fields
    const fields = ['fullName', 'email', 'phone', 'password', 'confirmPassword']
    let hasErrors = false
    
    console.log("📋 Validating fields:", registerData)
    
    fields.forEach(field => {
      const isValid = validateField(field, registerData[field as keyof typeof registerData])
      console.log(`✅ Field ${field}: ${isValid ? 'valid' : 'invalid'}`)
      if (!isValid) hasErrors = true
    })

    // Additional password match check
    if (registerData.password !== registerData.confirmPassword) {
      console.log("❌ Passwords don't match:", { password: registerData.password, confirm: registerData.confirmPassword })
      setValidationErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }))
      hasErrors = true
    }

    // Check for existing validation errors
    const currentErrors = Object.values(validationErrors).filter(error => error)
    console.log("🚨 Current validation errors:", currentErrors)
    if (currentErrors.length > 0) {
      hasErrors = true
    }

    if (hasErrors) {
      console.log("❌ Validation failed, showing error message")
      showRegisterErrorWithAnimation("Please resolve all validation errors")
      return false
    }

    console.log("✅ Validation passed, proceeding with registration")
    setLoading(true)

    setLoading(true)
    try {
      console.log("🚀 Attempting registration with:", { 
        fullName: registerData.fullName, 
        email: registerData.email, 
        phone: registerData.phone 
      })

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      })

      console.log("📡 Registration response status:", response.status)

      const data = await response.json()
      console.log("📦 Registration response data:", data)

      if (!response.ok) {
        showRegisterErrorWithAnimation(data.message || "Registration failed")
        return false
      }

      if (data.success) {
        console.log("✅ Registration successful, showing success message...")

        // Clear the registration form
        setRegisterData({
          fullName: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        })

        // Clear any validation errors
        setValidationErrors({
          fullName: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: ""
        })

        // Show success message
        showRegisterSuccessWithAnimation("Account created successfully! Please login to continue.")

        // Switch to login mode after a short delay
        setTimeout(() => {
          setIsLogin(true)
        }, 2000)

        return true
      } else {
        showRegisterErrorWithAnimation(data.message || "Registration failed")
        return false
      }
    } catch (error: any) {
      console.error("🚨 Registration error:", error)
      showRegisterErrorWithAnimation("An error occurred during registration. Please try again.")
      return false
    } finally {
      setLoading(false)
    }
  }



  const switchMode = () => {
    setIsLogin(!isLogin)
    hideLoginErrorWithAnimation() // Clear login errors with animation
    hideRegisterErrorWithAnimation() // Clear register errors with animation
    hideRegisterSuccessWithAnimation() // Clear register success with animation
    setValidationErrors({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: ""
    })
    setLoginValidationErrors({
      email: ""
    })
  }

  const handleRegisterDataChange = (field: string, value: string) => {
    setRegisterData((prev) => ({ ...prev, [field]: value }))
    
    // Real-time validation
    const isValid = validateField(field, value)
    
    // Special handling for confirmPassword - also validate when password changes
    if (field === "password" && registerData.confirmPassword) {
      const confirmValid = validateField("confirmPassword", registerData.confirmPassword)
      if (!confirmValid) {
        // Re-validate confirmPassword when password changes
        setTimeout(() => validateField("confirmPassword", registerData.confirmPassword), 100)
      }
    }
    
    // Special handling for confirmPassword - also validate when it changes
    if (field === "confirmPassword" && registerData.password) {
      // The validation will happen in validateField
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <header className="w-full bg-transparent">
        <div className="px-4 sm:px-6">
          <div className="flex justify-center items-center h-16">
            {/* Logo */}
            <img
              src="/icons/icon-144x144.png"
              alt="Aahaar"
              className="h-10 w-10"
            />
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {isLogin ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
              scale: { type: "spring", stiffness: 300, damping: 25 }
            }}
          >
            <motion.div
              transition={{ duration: 0.1, ease: "easeOut" }}
              className="max-w-md mx-auto"
            >
              <Card className="w-full overflow-hidden rounded-3xl bg-neutral-950/90">
                <CardHeader>
                  <CardTitle><span className="text-white">Admin Login</span></CardTitle>
                  <CardDescription>Access your food court management dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                <form onSubmit={handleLoginSubmit} className="space-y-6" noValidate>
                  <FloatingInput
                    id="email"
                    type="email"
                    label="Email"
                    value={loginData.email}
                    onChange={(e) => handleLoginDataChange("email", e.target.value)}
                    error={loginValidationErrors.email}
                  />

                  <FloatingInput
                    id="password"
                    type="password"
                    label="Password"
                    value={loginData.password}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                  />

                  <AnimatePresence mode="wait">
                    {loginError && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, scale: 0.95 }}
                        animate={{ height: "auto", opacity: 1, scale: 1 }}
                        exit={{ height: 0, opacity: 0, scale: 0.95 }}
                        transition={{ 
                          duration: 0.4,
                          ease: [0.4, 0.0, 0.2, 1],
                          height: { duration: 0.4 },
                          opacity: { duration: 0.3 },
                          scale: { duration: 0.3 }
                        }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md relative">
                          <div className="pr-8">
                            {loginError}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              hideLoginErrorWithAnimation()
                            }}
                            className="absolute top-2 right-2 p-1 hover:bg-red-500/20 rounded-full transition-colors"
                            aria-label="Dismiss error"
                          >
                            <X size={16} className="text-red-400" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatedButton type="submit" className="w-full" onAsyncClick={handleLoginClick}>
                    Sign In
                  </AnimatedButton>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-400">
                    Don't have an account?{" "}
                    <button 
                      onClick={switchMode}
                      className="text-blue-400 hover:underline transition-colors cursor-pointer"
                    >
                      Create one
                    </button>
                  </p>
                </div>
              </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="register"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
              scale: { type: "spring", stiffness: 300, damping: 25 }
            }}
          >
            <motion.div
              transition={{ duration: 0.1, ease: "easeOut" }}
            >
              <Card className="w-full overflow-hidden rounded-3xl bg-neutral-950/90">
                <CardHeader>
                  <CardTitle><span className="text-white">Create Admin Account</span></CardTitle>
                  <CardDescription>Set up your food court management system</CardDescription>
                </CardHeader>
                <CardContent>
                <form onSubmit={handleRegisterSubmit} className="space-y-6" noValidate>
                  {/* Row 1: Full Name and Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatingInput
                      id="fullName"
                      type="text"
                      label="Full Name"
                      value={registerData.fullName}
                      onChange={(e) => handleRegisterDataChange("fullName", e.target.value)}
                      error={validationErrors.fullName}
                    />

                    <FloatingInput
                      id="email"
                      type="email"
                      label="Email Address"
                      value={registerData.email}
                      onChange={(e) => handleRegisterDataChange("email", e.target.value)}
                      error={validationErrors.email}
                    />
                  </div>

                  {/* Row 2: Phone */}
                  <FloatingInput
                    id="phone"
                    type="tel"
                    label="Phone Number"
                    value={registerData.phone}
                    onChange={(e) => handleRegisterDataChange("phone", e.target.value)}
                    error={validationErrors.phone}
                  />

                  {/* Row 3: Password and Confirm Password */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatingInput
                      id="password"
                      type="password"
                      label="Password"
                      value={registerData.password}
                      onChange={(e) => handleRegisterDataChange("password", e.target.value)}
                      error={validationErrors.password}
                    />

                    <FloatingInput
                      id="confirmPassword"
                      type="password"
                      label="Confirm Password"
                      value={registerData.confirmPassword}
                      onChange={(e) => handleRegisterDataChange("confirmPassword", e.target.value)}
                      error={validationErrors.confirmPassword}
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {registerError && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, scale: 0.95 }}
                        animate={{ height: "auto", opacity: 1, scale: 1 }}
                        exit={{ height: 0, opacity: 0, scale: 0.95 }}
                        transition={{ 
                          duration: 0.4,
                          ease: [0.4, 0.0, 0.2, 1],
                          height: { duration: 0.4 },
                          opacity: { duration: 0.3 },
                          scale: { duration: 0.3 }
                        }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md relative">
                          <div className="pr-8">
                            {registerError}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              hideRegisterErrorWithAnimation()
                            }}
                            className="absolute top-2 right-2 p-1 hover:bg-red-500/20 rounded-full transition-colors"
                            aria-label="Dismiss error"
                          >
                            <X size={16} className="text-red-400" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {registerSuccess && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, scale: 0.95 }}
                        animate={{ height: "auto", opacity: 1, scale: 1 }}
                        exit={{ height: 0, opacity: 0, scale: 0.95 }}
                        transition={{ 
                          duration: 0.4,
                          ease: [0.4, 0.0, 0.2, 1],
                          height: { duration: 0.4 },
                          opacity: { duration: 0.3 },
                          scale: { duration: 0.3 }
                        }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-md relative">
                          <div className="pr-8">
                            {registerSuccess}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              hideRegisterSuccessWithAnimation()
                            }}
                            className="absolute top-2 right-2 p-1 hover:bg-green-500/20 rounded-full transition-colors"
                            aria-label="Dismiss success message"
                          >
                            <X size={16} className="text-green-400" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatedButton type="submit" className="w-full">
                    Create Account
                  </AnimatedButton>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-400">
                    Already have an account?{" "}
                    <button 
                      onClick={switchMode}
                      className="text-blue-400 hover:underline transition-colors cursor-pointer"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}