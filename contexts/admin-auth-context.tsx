"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AdminUser {
  id: string
  email?: string
  phone?: string
  fullName: string
  role: "admin"
  courtId: string
  court?: {
    courtId: string
    instituteName: string
  }
}

interface AdminAuthContextType {
  user: AdminUser | null
  token: string | null
  login: (token: string, user: AdminUser) => void
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored auth data on mount with admin-specific keys
    const storedToken = localStorage.getItem("admin_auth_token")
    const storedUser = localStorage.getItem("admin_auth_user")

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser.role === "admin") {
          setToken(storedToken)
          setUser(parsedUser)
        } else {
          // Clear invalid role data
          localStorage.removeItem("admin_auth_token")
          localStorage.removeItem("admin_auth_user")
        }
      } catch (error) {
        console.error("Error parsing stored admin user data:", error)
        localStorage.removeItem("admin_auth_token")
        localStorage.removeItem("admin_auth_user")
      }
    }

    setLoading(false)
  }, [])

  const login = (newToken: string, newUser: AdminUser) => {
    if (newUser.role !== "admin") {
      console.error("Invalid user role for admin context")
      return
    }
    
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem("admin_auth_token", newToken)
    localStorage.setItem("admin_auth_user", JSON.stringify(newUser))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("admin_auth_token")
    localStorage.removeItem("admin_auth_user")
    router.push("/admin/login")
  }

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!user && !!token,
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }
  return context
}
