import { useState, useEffect } from "react"
import { useUnifiedAuth } from "@/contexts/unified-auth-context"
import { cartApi, type CartValidationResponse } from "@/lib/api/services/cart"

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

export function useCartValidation(courtId: string) {
  const { user, token } = useUnifiedAuth()
  const [validationData, setValidationData] = useState<CartValidationResponse | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidated, setLastValidated] = useState<Date | null>(null)

  const validateCart = async () => {
    if (!user || !token) return null

    setIsValidating(true)
    try {
      const data = await cartApi.validateCart(courtId)
      
      setValidationData(data)
      setLastValidated(new Date())
      return data
    } catch (error) {
      console.error("Cart validation error:", error)
      return null
    } finally {
      setIsValidating(false)
    }
  }

  const getItemValidation = (menuItemId: string): ValidationResult | null => {
    if (!validationData) return null
    return validationData.validationResults.find(result => result.menuItemId === menuItemId) || null
  }

  const isItemValid = (menuItemId: string) => {
    const validation = getItemValidation(menuItemId)
    return validation ? validation.isValid : true // Default to valid if no validation data
  }

  const getItemIssues = (menuItemId: string): ValidationIssue[] => {
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
