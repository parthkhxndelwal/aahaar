"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Eye, EyeOff, Shield, CheckCircle, X } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface PasswordCreationStepProps {
  vendorData: any
  updateVendorData: (data: any) => void
  onNext: (data: any) => void
  onBack: () => void
  loading: boolean
  courtId: string
  vendorId?: string
}

interface PasswordValidation {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

export default function PasswordCreationStep({
  vendorData,
  updateVendorData,
  onNext,
  onBack,
  loading,
  courtId,
  vendorId,
}: PasswordCreationStepProps) {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  })

  useEffect(() => {
    validatePassword(formData.password)
  }, [formData.password])

  const validatePassword = (password: string) => {
    const validation: PasswordValidation = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }
    setPasswordValidation(validation)
  }

  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(Boolean)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (!isPasswordValid()) {
      newErrors.password = "Password does not meet all requirements"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // Create user account with password
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: vendorData.contactEmail,
          password: formData.password,
          fullName: vendorData.vendorName,
          phone: vendorData.contactPhone,
          role: 'vendor',
          courtId: courtId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update vendor data with user ID
        updateVendorData({
          userId: result.data.user.id,
          metadata: {
            ...vendorData.metadata,
            userAccountCreated: true,
          }
        })
        onNext({ ...formData, userId: result.data.user.id })
      } else {
        setErrors({ general: result.message })
      }
    } catch (error) {
      console.error("User creation error:", error)
      setErrors({ general: "Failed to create user account. Please try again." })
    }
  }

  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {isValid ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-red-500" />
      )}
      <span className={isValid ? "text-green-600" : "text-red-600"}>
        {text}
      </span>
    </div>
  )

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Create a secure password for the vendor's account. They will use this to log in and manage their stall.
        </AlertDescription>
      </Alert>

      {errors.general && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              value={vendorData.contactEmail}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              This email will be used as the login username
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter a secure password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={errors.password ? "border-red-500 pr-10" : "pr-10"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ValidationItem 
            isValid={passwordValidation.minLength} 
            text="At least 8 characters long" 
          />
          <ValidationItem 
            isValid={passwordValidation.hasUppercase} 
            text="Contains at least one uppercase letter (A-Z)" 
          />
          <ValidationItem 
            isValid={passwordValidation.hasLowercase} 
            text="Contains at least one lowercase letter (a-z)" 
          />
          <ValidationItem 
            isValid={passwordValidation.hasNumber} 
            text="Contains at least one number (0-9)" 
          />
          <ValidationItem 
            isValid={passwordValidation.hasSpecialChar} 
            text="Contains at least one special character (!@#$%^&*)" 
          />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !isPasswordValid() || formData.password !== formData.confirmPassword}
          className="gap-2"
        >
          {loading && <Spinner size={16} variant="white" />}
          Create Account
        </Button>
      </div>
    </div>
  )
}
