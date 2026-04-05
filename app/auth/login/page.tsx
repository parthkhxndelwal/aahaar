"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Eye, EyeOff, Building2, ChefHat, UserCircle } from "lucide-react"

type PortalType = "admin" | "vendor" | "customer"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const returnTo = searchParams.get("returnTo")

  const [selectedPortal, setSelectedPortal] = useState<PortalType | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = session.user.role
      if (role === "admin") {
        // Redirect to /admin which will check courts and redirect appropriately
        router.push(returnTo || "/admin")
      } else if (role === "vendor") {
        const courtId = session.user.courtId
        router.push(returnTo || (courtId ? `/vendor/${courtId}` : "/vendor"))
      } else {
        const courtId = session.user.courtId
        router.push(returnTo || (courtId ? `/app/${courtId}` : "/app"))
      }
    }
  }, [status, session, router, returnTo])

  const handlePortalSelect = (portal: PortalType) => {
    // For customers, redirect to QR scan page
    if (portal === "customer") {
      router.push("/app/auth/court-qrscan")
      return
    }
    
    setSelectedPortal(portal)
    setError("")
  }

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>): Promise<boolean> => {
    e.preventDefault()

    if (!email || !password) {
      setError("Please fill in all fields")
      return false
    }

    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials. Please check your email and password.")
        setLoading(false)
        return false
      }

      if (result?.ok) {
        // Session is set - force a full page reload to ensure cookies are sent
        // Redirect based on selected portal
        let redirectUrl = returnTo
        if (!redirectUrl) {
          if (selectedPortal === "admin") {
            redirectUrl = "/admin"
          } else if (selectedPortal === "vendor") {
            redirectUrl = "/auth/login" // Will redirect once session is detected
          } else {
            redirectUrl = "/app"
          }
        }
        window.location.href = redirectUrl
        return true
      }
    } catch (error: any) {
      setError("Login failed. Please try again.")
      setLoading(false)
      return false
    }

    return true
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Redirecting...</span>
        </div>
      </div>
    )
  }

  const portalIcons: Record<PortalType, typeof UserCircle> = {
    admin: Building2,
    vendor: ChefHat,
    customer: UserCircle,
  }

  const portalLabels: Record<PortalType, string> = {
    admin: "Admin",
    vendor: "Vendor",
    customer: "Customer",
  }

  const portalDescriptions: Record<PortalType, string> = {
    admin: "Manage food courts and vendors",
    vendor: "Manage your stall and orders",
    customer: "Scan QR code to order food",
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Choose your portal to continue</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedPortal ? (
              <div className="space-y-3">
                {(["admin", "vendor", "customer"] as PortalType[]).map((portal) => {
                  const Icon = portalIcons[portal]
                  return (
                    <Button
                      key={portal}
                      variant="outline"
                      className="w-full h-auto py-4 px-4 flex items-center gap-4 justify-start"
                      onClick={() => handlePortalSelect(portal)}
                    >
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{portalLabels[portal]} Portal</div>
                        <div className="text-sm text-muted-foreground">{portalDescriptions[portal]}</div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedPortal(null); setError("") }}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {portalLabels[selectedPortal]} Portal
                  </span>
                </div>

                <form className="space-y-4">
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
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !loading) {
                            e.preventDefault()
                            const syntheticEvent = {
                              preventDefault: () => {},
                              currentTarget: e.currentTarget as unknown as HTMLButtonElement,
                            } as React.MouseEvent<HTMLButtonElement>
                            handleLogin(syntheticEvent)
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                  <AnimatedButton id="login-button" onAsyncClick={handleLogin} className="w-full" disabled={loading}>
                    Sign In
                  </AnimatedButton>
                </form>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="mt-4 text-center text-sm text-muted-foreground">
                  {selectedPortal === "customer" ? (
                    <div className="space-y-2">
                      <p>New customer? Scan the QR code at any food stall to get started.</p>
                      <p className="text-xs">Or visit the food court and look for the Aahaar QR codes.</p>
                    </div>
                  ) : (
                    <p>
                      Don&apos;t have access? Contact your{" "}
                      {selectedPortal === "vendor" ? "food court admin" : "administrator"}.
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function UnifiedLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
