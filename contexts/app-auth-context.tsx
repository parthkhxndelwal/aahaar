"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AppUser {
  id: string
  email?: string
  phone?: string
  fullName: string
  role: "user"
  courtId: string
  court?: {
    courtId: string
    instituteName: string
  }
}

interface AppAuthContextType {
  user: AppUser | null
  token: string | null
  login: (token: string, user: AppUser) => void
  logout: () => void
  refreshUser: () => Promise<void>
  loading: boolean
  isAuthenticated: boolean
}

const AppAuthContext = createContext<AppAuthContextType | undefined>(undefined)

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check for stored auth data on mount with app-specific keys
    const storedToken = localStorage.getItem("app_auth_token")
    const storedUser = localStorage.getItem("app_auth_user")

    // Also check cookie as fallback
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }

    const cookieToken = getCookie('app-auth-token')

    console.log('🔍 [AppAuth] Checking stored auth:', { 
      hasToken: !!storedToken, 
      hasUser: !!storedUser,
      hasCookie: !!cookieToken 
    })

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log('🔍 [AppAuth] Parsed user:', { role: parsedUser.role, id: parsedUser.id })
        
        if (parsedUser.role === "user") {
          setToken(storedToken)
          setUser(parsedUser)
          console.log('✅ [AppAuth] Auth restored from localStorage')
        } else {
          // Clear invalid role data
          console.log('❌ [AppAuth] Invalid role, clearing data')
          localStorage.removeItem("app_auth_token")
          localStorage.removeItem("app_auth_user")
          document.cookie = 'app-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
        }
      } catch (error) {
        console.error("❌ [AppAuth] Error parsing stored app user data:", error)
        localStorage.removeItem("app_auth_token")
        localStorage.removeItem("app_auth_user")
        document.cookie = 'app-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      }
    } else if (cookieToken && !storedToken) {
      // If we have a cookie but no localStorage, try to restore from cookie
      console.log("🍪 [AppAuth] Found cookie token but no localStorage, may need to re-authenticate")
    } else {
      console.log('ℹ️ [AppAuth] No stored auth data found')
    }

    setLoading(false)
    console.log('🔍 [AppAuth] Initial auth check complete')
  }, [mounted])

  const login = (newToken: string, newUser: AppUser) => {
    if (newUser.role !== "user") {
      console.error("❌ [AppAuth] Invalid user role for app context:", newUser.role)
      return
    }
    
    console.log('✅ [AppAuth] Logging in user:', { id: newUser.id, role: newUser.role })
    
    // Set HTTP-only cookie first for immediate middleware protection
    document.cookie = `app-auth-token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
    
    // Then set localStorage and state
    localStorage.setItem("app_auth_token", newToken)
    localStorage.setItem("app_auth_user", JSON.stringify(newUser))
    
    setToken(newToken)
    setUser(newUser)
    
    console.log('✅ [AppAuth] Login complete, cookie and state set')
  }

  const logout = () => {
    console.log('🚪 [AppAuth] Logging out user')
    
    // Clear cookie
    document.cookie = 'app-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    
    // Clear localStorage and state
    localStorage.removeItem("app_auth_token")
    localStorage.removeItem("app_auth_user")
    
    setToken(null)
    setUser(null)
    
    // Don't redirect to root, let the calling component handle navigation
  }

  const refreshUser = async () => {
    if (!token) {
      console.log('❌ [AppAuth] No token available for user refresh')
      return
    }

    try {
      console.log('🔄 [AppAuth] Refreshing user data from server')
      
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (data.success && data.data.user) {
        const serverUser = data.data.user
        const updatedUser: AppUser = {
          id: serverUser.id,
          email: serverUser.email,
          phone: serverUser.phone,
          fullName: serverUser.fullName,
          role: "user",
          courtId: user?.courtId || '',
          court: user?.court
        }

        console.log('✅ [AppAuth] User data refreshed:', { id: updatedUser.id, fullName: updatedUser.fullName })
        
        // Update localStorage and state
        localStorage.setItem("app_auth_user", JSON.stringify(updatedUser))
        setUser(updatedUser)
      } else {
        console.error('❌ [AppAuth] Failed to refresh user data:', data.message)
      }
    } catch (error) {
      console.error('❌ [AppAuth] Error refreshing user data:', error)
    }
  }

  const value = {
    user,
    token,
    login,
    logout,
    refreshUser,
    loading,
    isAuthenticated: !!user && !!token,
  }

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>
}

export function useAppAuth() {
  const context = useContext(AppAuthContext)
  if (context === undefined) {
    throw new Error("useAppAuth must be used within an AppAuthProvider")
  }
  return context
}
