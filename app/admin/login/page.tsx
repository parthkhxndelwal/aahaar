"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    courtId: "",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Call the API login endpoint
      const response = await api.login(formData.email, formData.password, formData.courtId)
      
      if (response.success) {
        // Extract token and user data from response
        const { token, user } = response.data
        
        // Update auth context with token and user
        login(token, user)
        
        toast({
          title: "Success",
          description: "Logged in successfully!",
        })
        
        // Redirect to admin dashboard
        router.push(`/admin/${formData.courtId}`)
      } else {
        throw new Error(response.message || "Login failed")
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Access your food court management dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Demo credentials info */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-medium text-blue-800 mb-1">Demo Credentials:</p>
            <p className="text-xs text-blue-600">Court ID: democourt</p>
            <p className="text-xs text-blue-600">Email: admin@democourt.com</p>
            <p className="text-xs text-blue-600">Password: admin123</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="courtId">Court ID</Label>
              <Input
                id="courtId"
                type="text"
                required
                placeholder="democourt"
                value={formData.courtId}
                onChange={(e) => setFormData((prev) => ({ ...prev, courtId: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="admin@democourt.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="admin123"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/admin/register" className="text-blue-600 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
