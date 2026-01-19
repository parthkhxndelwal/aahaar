"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useRouter } from "next/navigation"
import { Shield, Store, User } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  const router = useRouter()
  const [showCourtDialog, setShowCourtDialog] = useState(false)
  const [courtId, setCourtId] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCourtAccess = async () => {
    if (!courtId.trim()) {
      return
    }

    setLoading(true)
    try {
      // Optional: Validate court ID exists
      const response = await fetch(`/api/courts/${courtId}`)
      const data = await response.json()

      if (data.success) {
        router.push(`/app/${courtId}/login`)
      } else {
        // Still redirect even if court doesn't exist, let the login page handle it
        router.push(`/app/${courtId}/login`)
      }
    } catch (error) {
      // Redirect anyway, let the login page handle the error
      router.push(`/app/${courtId}/login`)
    } finally {
      setLoading(false)
      setShowCourtDialog(false)
      setCourtId("")
    }
  }

  const handleCardClick = (href: string) => {
    if (href === "/app") {
      setShowCourtDialog(true)
    } else {
      router.push(href)
    }
  }

  const loginOptions = [
    {
      title: "Admin Portal",
      description: "Manage food courts, vendors, and analytics",
      icon: Shield,
      href: "/admin/login",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      buttonColor: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
    },
    {
      title: "Vendor Portal",
      description: "Manage your menu, orders, and earnings",
      icon: Store,
      href: "/vendor/login",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
      buttonColor: "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700",
    },
    {
      title: "Customer Access",
      description: "Browse menus and place orders",
      icon: User,
      href: "/app",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      buttonColor: "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image src="/logo.png" alt="Aahaar" width={48} height={48} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Aahaar</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Food Court Management Platform
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-16 max-w-2xl mx-auto">
          Choose your portal to access the complete food court management solution
        </p>

        {/* Login Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {loginOptions.map((option) => (
            <Card 
              key={option.title} 
              className={`${option.bgColor} border-0 shadow-lg hover:shadow-xl dark:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}
              onClick={() => handleCardClick(option.href)}
            >
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 p-4 rounded-full bg-white dark:bg-gray-800 shadow-md">
                  <option.icon className={`h-12 w-12 ${option.iconColor}`} />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {option.title}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 text-lg">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  className={`w-full ${option.buttonColor} text-white font-semibold py-3 text-lg`}
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCardClick(option.href)
                  }}
                >
                  Access Portal
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">&copy; 2024 Aahaar. All rights reserved.</p>
      </footer>

      {/* Court ID Dialog */}
      <Dialog open={showCourtDialog} onOpenChange={setShowCourtDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Court ID</DialogTitle>
            <DialogDescription>
              Please enter your food court ID to access the customer portal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="courtId">Court ID</Label>
              <Input
                id="courtId"
                placeholder="e.g., vbs-ghamroj"
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCourtAccess()}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCourtDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCourtAccess} 
                disabled={loading || !courtId.trim()}
                className="flex-1"
              >
                {loading ? "Accessing..." : "Continue"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
