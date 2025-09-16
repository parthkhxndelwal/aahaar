"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ChefHat, ArrowLeft } from "lucide-react"
import { useVendorAuth } from "@/contexts/vendor-auth-context"

export default function VendorLogin() {
  const router = useRouter()
  const { login, isAuthenticated, loading: authLoading, user } = useVendorAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      console.log("🔄 [VendorLogin] Vendor already authenticated, redirecting to dashboard")
      router.push(`/vendor/${user.courtId}`)
    }
  }, [isAuthenticated, authLoading, user, router])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Checking authentication...</span>
        </div>
      </div>
    )
  }

  // Don't render login form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("🚀 Attempting login with:", { email, hasPassword: !!password })
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }).then(res => res.json())

      console.log("📥 Login response:", response)

      if (response.success) {
        const userData = response.data.user
        if (userData.role !== "vendor") {
          setError("Access denied. Vendor account required.")
          return
        }

        login(response.data.token, userData)
        router.push(`/vendor/${userData.courtId}`)
      } else {
        setError(response.message || "Invalid credentials")
      }
    } catch (error: any) {
      console.error("❌ Login error:", error)
      // Better error handling for different types of errors
      if (error.message) {
        setError(error.message)
      } else if (typeof error === 'string') {
        setError(error)
      } else {
        setError("Login failed. Please check your credentials and try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const goHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button variant="ghost" onClick={goHome} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <ChefHat className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle>Vendor Login</CardTitle>
            <CardDescription>Sign in to manage your stall and orders</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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

            {error && (
              <Alert className="mt-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Don't have access? Contact your food court admin.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
