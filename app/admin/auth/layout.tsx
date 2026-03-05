"use client"

import { useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { Spinner } from "@/components/ui/spinner"

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated } = useAdminAuth()

  // Ensure video continues playing smoothly
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(console.log)
    }
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (isAuthenticated && user) {
        console.log("👤 User already logged in, redirecting from auth layout...")
        
        try {
          // Get user's courts to redirect to appropriate dashboard
          const token = localStorage.getItem("admin_auth_token")
          if (token) {
            const courtsResponse = await fetch("/api/admin/courts", {
              headers: {
                "Authorization": `Bearer ${token}`
              }
            })

            if (courtsResponse.ok) {
              const courtsData = await courtsResponse.json()
              if (courtsData.success && courtsData.data.length > 0) {
                router.push(`/admin/${courtsData.data[0].courtId}`)
              } else {
                router.push("/admin/onboarding")
              }
            } else {
              router.push("/admin/dashboard")
            }
          }
        } catch (error) {
          console.error("Error checking courts:", error)
          router.push("/admin/dashboard")
        }
      }
    }

    checkAuthAndRedirect()
  }, [isAuthenticated, user, router])

  // Show loading screen if user is already authenticated
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" variant="white" />
          <p className="text-white/80">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Video - Persistent across route changes */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{
          willChange: 'auto',
        }}
      >
        <source src="/admin-auth-bg.mp4" type="video/mp4" />
      </video>
      
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-2xl z-5"></div>
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      
      {/* Content container */}
      <div className="z-20 relative w-full max-w-2xl">
        {children}
      </div>
    </div>
  )
}
