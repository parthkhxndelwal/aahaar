"use client"
import { use, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ChangePasswordPage({ params }: { params: Promise<{ courtId: string }> }) {
  const { courtId } = use(params)
  const router = useRouter()

  useEffect(() => {
    // Redirect to account settings since password changes are not applicable for OTP-based authentication
    router.replace(`/app/${courtId}/settings/account`)
  }, [courtId, router])

  return null
}
