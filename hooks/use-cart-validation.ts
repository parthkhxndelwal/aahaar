import { useState, useEffect } from "react"
import { useAppAuth } from "@/contexts/app-auth-context"

interface ValidationIssue {
  type: "vendor_offline" | "item_unavailable" | "out_of_stock" | "item_inactive" | "no_stock" | "insufficient_stock"
  message: string
}

interface ValidationResult {
  cartItemId: string
  menuItemId: string
  itemName: string
  vendorName: string
  quantity: number
  isValid: boolean
  issues: ValidationIssue[]
}

interface ValidationSummary {
  totalItems: number
  validItems: number
  invalidItems: number
  offlineVendors: string[]
  unavailableItems: string[]
  stockIssues: Array<{
    name: string
    requested: number
    available: number
  }>
}

interface CartValidationResponse {
  success: boolean
  valid: boolean
  message: string
  validationResults: ValidationResult[]
  summary: ValidationSummary
}

export function useCartValidation(courtId: string) {
  const { user, token } = useAppAuth()
  const [validationData, setValidationData] = useState<CartValidationResponse | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidated, setLastValidated] = useState<Date | null>(null)

  const validateCart = async () => {
    if (!user || !token) return null

    setIsValidating(true)
    try {
      const response = await fetch(`/api/app/${courtId}/cart/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        setValidationData(data)
        setLastValidated(new Date())
        return data
      } else {
        console.error("Cart validation failed:", data.message)
        return null
      }
    } catch (error) {
      console.error("Cart validation error:", error)
      return null
    } finally {
      setIsValidating(false)
    }
  }

  const getItemValidation = (menuItemId: string) => {
    if (!validationData) return null
    return validationData.validationResults.find(result => result.menuItemId === menuItemId)
  }

  const isItemValid = (menuItemId: string) => {
    const validation = getItemValidation(menuItemId)
    return validation ? validation.isValid : true // Default to valid if no validation data
  }

  const getItemIssues = (menuItemId: string) => {
    const validation = getItemValidation(menuItemId)
    return validation ? validation.issues : []
  }

  // Auto-validate when hook is first used (but not too frequently)
  useEffect(() => {
    const shouldValidate = !lastValidated || 
      (Date.now() - lastValidated.getTime() > 30000) // 30 seconds

    if (user && token && shouldValidate) {
      validateCart()
    }
  }, [user, token, courtId])

  return {
    validationData,
    isValidating,
    lastValidated,
    validateCart,
    getItemValidation,
    isItemValid,
    getItemIssues,
    isCartValid: validationData?.valid ?? true,
    hasInvalidItems: validationData && !validationData.valid
  }
}