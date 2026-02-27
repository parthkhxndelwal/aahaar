"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface VendorUser {
  id: string
  email?: string
  phone?: string
  fullName: string
  role: "vendor"
  courtId: string
  court?: {
    courtId: string
    instituteName: string
  }
  vendorProfile?: {
    id: string
    stallName: string
    stallLocation?: string
    isOnline: boolean
  }
}

interface VendorAuthContextType {
  user: VendorUser | null
  token: string | null
  login: (token: string, user: VendorUser) => void
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const VendorAuthContext = createContext<VendorAuthContextType | undefined>(undefined)

export function VendorAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<VendorUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored auth data on mount with vendor-specific keys
    const storedToken = localStorage.getItem("vendor_auth_token")
    const storedUser = localStorage.getItem("vendor_auth_user")

    // Also check cookie as fallback
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }

    const cookieToken = getCookie('vendor-auth-token')

    console.log('🔍 [VendorAuth] Checking stored auth:', { 
      hasToken: !!storedToken, 
      hasUser: !!storedUser,
      hasCookie: !!cookieToken 
    })

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log('🔍 [VendorAuth] Parsed user:', { role: parsedUser.role, id: parsedUser.id })
        
        if (parsedUser.role === "vendor") {
          setToken(storedToken)
          setUser(parsedUser)
          console.log('✅ [VendorAuth] Auth restored from localStorage')
        } else {
          // Clear invalid role data
          console.log('❌ [VendorAuth] Invalid role, clearing data')
          localStorage.removeItem("vendor_auth_token")
          localStorage.removeItem("vendor_auth_user")
          document.cookie = 'vendor-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
        }
      } catch (error) {
        console.error("❌ [VendorAuth] Error parsing stored vendor user data:", error)
        localStorage.removeItem("vendor_auth_token")
        localStorage.removeItem("vendor_auth_user")
        document.cookie = 'vendor-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      }
    } else if (cookieToken && !storedToken) {
      // If we have a cookie but no localStorage, try to restore from cookie
      console.log("🍪 [VendorAuth] Found cookie token but no localStorage, may need to re-authenticate")
    } else {
      console.log('ℹ️ [VendorAuth] No stored auth data found')
    }

    setLoading(false)
    console.log('🔍 [VendorAuth] Initial auth check complete')
  }, [])

  const login = (newToken: string, newUser: VendorUser) => {
    if (newUser.role !== "vendor") {
      console.error("Invalid user role for vendor context")
      return
    }
    
    console.log('🔐 [VendorAuth] Logging in vendor:', { id: newUser.id, email: newUser.email })
    
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem("vendor_auth_token", newToken)
    localStorage.setItem("vendor_auth_user", JSON.stringify(newUser))
    
    // Also set cookie for server-side validation
    document.cookie = `vendor-auth-token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}` // 7 days
    
    console.log('✅ [VendorAuth] Vendor login complete')
  }

  const logout = () => {
    console.log('🚪 [VendorAuth] Logging out vendor')
    
    setToken(null)
    setUser(null)
    localStorage.removeItem("vendor_auth_token")
    localStorage.removeItem("vendor_auth_user")
    
    // Clear cookie
    document.cookie = 'vendor-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    
    router.push("/vendor/login")
  }

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!user && !!token,
  }

  return <VendorAuthContext.Provider value={value}>{children}</VendorAuthContext.Provider>
}

export function useVendorAuth() {
  const context = useContext(VendorAuthContext)
  if (context === undefined) {
    throw new Error("useVendorAuth must be used within a VendorAuthProvider")
  }
  return context
}
