"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email?: string
  phone?: string
  fullName: string
  role: "admin" | "vendor" | "user"
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

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem("auth_token")
    const storedUser = localStorage.getItem("auth_user")

    // Also check cookie as fallback
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }

    const cookieToken = getCookie('auth-token')

    console.log('🔍 [AuthContext] Checking auth state:', {
      hasStoredToken: !!storedToken,
      hasStoredUser: !!storedUser,
      hasCookieToken: !!cookieToken,
      tokensMatch: storedToken === cookieToken
    })

    if (storedToken && storedUser && cookieToken && storedToken === cookieToken) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log('✅ [AuthContext] Restored auth from storage')
        setToken(storedToken)
        setUser(parsedUser)
      } catch (error) {
        console.error("❌ [AuthContext] Error parsing stored user data:", error)
        // Clear corrupted data
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      }
    } else {
      // If tokens don't match or are missing, clear everything
      if (storedToken || storedUser || cookieToken) {
        console.log('🧹 [AuthContext] Clearing mismatched auth data')
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      }
    }

    setLoading(false)
  }, [])

  const login = (newToken: string, newUser: User) => {
    console.log('🔐 [AuthContext] Logging in user:', { userId: newUser.id, hasToken: !!newToken })
    
    // Set HTTP-only cookie first for immediate middleware protection
    document.cookie = `auth-token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
    
    // Then set localStorage and state
    localStorage.setItem("auth_token", newToken)
    localStorage.setItem("auth_user", JSON.stringify(newUser))
    
    setToken(newToken)
    setUser(newUser)
    
    console.log('✅ [AuthContext] Login complete, cookie and state set')
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    
    // Clear cookie
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    
    router.push("/")
  }

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!user && !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
