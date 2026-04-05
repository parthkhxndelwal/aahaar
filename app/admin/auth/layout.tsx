"use client"

import { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Spinner } from "@/components/ui/spinner"

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(console.log)
    }
  }, [])

  useEffect(() => {
    if (isClient && status === "authenticated" && session?.user) {
      const role = session.user.role
      if (role === "admin") {
        router.push("/admin")
      } else if (role === "vendor") {
        router.push("/vendor")
      } else {
        const courtId = (session.user as any).courtId
        router.push(courtId ? `/app/${courtId}` : "/app")
      }
    }
  }, [isClient, status, session, router])

  if (status === "authenticated" && isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {children}
      </div>
    </div>
  )
}
