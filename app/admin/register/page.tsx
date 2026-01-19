"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"

export default function AdminRegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    courtId: "",
    instituteName: "",
    instituteType: "college",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await api.register(formData)

      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))

      toast({
        title: "Success",
        description: "Account created successfully! Welcome to Aahaar.",
      })

      router.push(`/admin/${formData.courtId}/onboarding`)
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md bg-neutral-900">
        <CardHeader>
          <CardTitle>Create Admin Account</CardTitle>
          <CardDescription>Set up your food court management system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter Name"
                required
                value={formData.fullName}
                className="bg-neutral-800 text-neutral-100"
                onChange={(e) => handleInputChange("fullName", e.target.value)}
              />
            </div>

            <div>
              <Input
                id="email"
                type="email"
                placeholder="Enter Email ID"
                required
                className="bg-neutral-800 text-neutral-100"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div>
              <Input
                id="phone"
                type="tel"
                className="bg-neutral-800 text-neutral-100"
                required
                placeholder="Enter Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>

            <div>
              <Input
                id="instituteName"
                type="text"
                required
                className="bg-neutral-800 text-neutral-100"
                value={formData.instituteName}
                placeholder="Institute Name"
                onChange={(e) => handleInputChange("instituteName", e.target.value)}
              />
            </div>

            <div>
              <Input
                id="courtId"
                type="text"
                className="bg-neutral-800 text-neutral-100"
                placeholder="Enter Court ID, e.g. vbs-ghamroj"
                
                required
                value={formData.courtId}
                onChange={(e) => handleInputChange("courtId", e.target.value.toLowerCase())}
              />
            </div>

            <div>
              <Select
                value={formData.instituteType}
                
                onValueChange={(value) => handleInputChange("instituteType", value)}
              >
                <SelectTrigger className="bg-neutral-800 text-neutral-100">
                  <SelectValue className="bg-neutral-800 text-neutral-100" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 text-neutral-100">
                  <SelectItem className="bg-neutral-800 text-neutral-100" value="school">School</SelectItem>
                  <SelectItem className="bg-neutral-800 text-neutral-100" value="college">College</SelectItem>
                  <SelectItem className="bg-neutral-800 text-neutral-100" value="office">Office</SelectItem>
                  <SelectItem className="bg-neutral-800 text-neutral-100" value="hospital">Hospital</SelectItem>
                  <SelectItem className="bg-neutral-800 text-neutral-100" value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input
                id="password"
                type="password"
                required
                placeholder="Enter Password"
                className="bg-neutral-800 text-neutral-100"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
            </div>

            <div>
              <Input
                id="confirmPassword"
                type="password"
                required
                className="bg-neutral-800 text-neutral-100"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Confirm Password"/>

            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/admin/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
